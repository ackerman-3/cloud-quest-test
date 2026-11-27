// 계정 동기화 점검: 가짜 서버와 두 기기(A·B)로 로그인·충돌·초기화·계정 전환을 시험한다.
// 실행: npx tsx scripts/test-sync.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
const stores: Record<string, Map<string, string>> = { A: new Map(), B: new Map() }
let cur = stores.A
;(globalThis as any).localStorage = {
  getItem: (k: string) => cur.get(k) ?? null,
  setItem: (k: string, v: string) => void cur.set(k, String(v)),
  removeItem: (k: string) => void cur.delete(k),
}
;(globalThis as any).window = { setTimeout: () => 0, clearTimeout: () => {} }

const { __test, noteLocalChange, syncNow } = await import('../src/cloud')
const S = await import('../src/store')
const { PROJECTS } = await import('../src/data/projects')

type Row = { data: any; rev: number }
const server = new Map<string, Row>()
let onPush: (() => void) | null = null
function backendFor(user: string) {
  return {
    async fetchRow() {
      const r = server.get(user)
      return r ? structuredClone(r) : null
    },
    async pushRow(p: any, base: number, force: boolean) {
      onPush?.()
      const r = server.get(user)
      if (!r) {
        server.set(user, { data: structuredClone(p), rev: 1 })
        return 1
      }
      if (!force && r.rev !== base) return null
      r.data = structuredClone(p)
      r.rev++
      return r.rev
    },
    async loadProfile() {
      return { username: user, nickname: user.toUpperCase() }
    },
  }
}
function device(name: 'A' | 'B', user: string | null) {
  cur = stores[name]
  __test.use(backendFor(user ?? ''), user)
}
const local = () => S.loadProgress()
const save = (p: any, replace = false) => {
  S.saveProgress(p)
  noteLocalChange(replace)
}
const complete = (id: string) => save(S.recordCompletion(local(), id, 3, false).next)
const ids = (p: any) => p.completions.map((c: any) => c.projectId).sort().join(',')

let fails = 0
function ok(cond: boolean, msg: string) {
  console.log(`${cond ? '✅' : '❌'} ${msg}`)
  if (!cond) fails++
}
const [P1, P2, P3, P4] = PROJECTS.map((p) => p.id)

// 1. A: 로그인 전부터 쌓은 기록 → 첫 로그인 시 서버에 올라감
device('A', null)
complete(P1)
complete(P2)
ok(!__test.meta().dirty, '로그인 전 기록은 업로드 대기로 표시하지 않음')
device('A', 'u1')
console.log('   A:', await __test.adopt())
ok(server.get('u1')?.rev === 1 && ids(server.get('u1')!.data) === ids(local()), '1. 첫 로그인: 기기 기록이 서버에 올라감')
ok(!__test.meta().dirty, '   업로드 후 대기 없음')

// 2. B: 빈 기기에서 같은 계정 로그인 → 서버 기록을 받아 옴
device('B', 'u1')
console.log('   B:', await __test.adopt())
ok(ids(local()) === ids(stores.A.has('x') ? {} : server.get('u1')!.data), '2. 새 기기 로그인: 서버 기록을 받아 옴')

// 3. B에서 완료 → 서버 rev2 → A가 받아 옴
complete(P3)
await syncNow()
ok(server.get('u1')!.rev === 2, '3. B의 새 기록이 서버에 올라감(rev 2)')
device('A', 'u1')
await syncNow()
ok(ids(local()).includes(P3) && __test.meta().rev === 2, '   A가 앱을 다시 열면 B의 기록을 받아 옴')

// 4. 두 기기가 따로 기록 → 나중에 올린 쪽이 합침
complete(P4) // A
device('B', 'u1')
save(S.checkIn({ ...local(), attendance: [] }) ?? local()) // B: 출석
const bTalk = S.logTalk(local(), 'lead').next
save(bTalk)
device('A', 'u1')
await syncNow()
device('B', 'u1')
await syncNow()
const merged = server.get('u1')!.data
ok(ids(merged).includes(P4) && (merged.talks ?? []).length === 1, '4. 충돌: A의 완료와 B의 대화가 모두 남음')
device('A', 'u1')
await syncNow()
ok(JSON.stringify(local()) === JSON.stringify(merged), '   A도 합친 기록을 받아 옴')

// 5. 같은 날 같은 프로젝트를 두 기기에서 완료 → 완료 수·골드는 1번만
const goldBefore = S.goldEarned(local())
const todayBefore = S.todayCount(local())
complete(P1) // A (오늘 이미 P1 완료 → counted false)
device('B', 'u1')
complete(P2) // B
device('A', 'u1')
await syncNow()
device('B', 'u1')
await syncNow()
const m5 = server.get('u1')!.data
ok(S.todayCount(m5) === todayBefore, `5. 같은 날 반복 완료는 합쳐도 완료 수 그대로(${S.todayCount(m5)})`)
ok(S.goldEarned(m5) === goldBefore, '   골드도 중복 지급 없음')

// 6. A에서 기록 초기화 → 서버가 통째로 바뀌고 B도 비워짐(합치면서 되살아나지 않음)
device('A', 'u1')
await syncNow()
save({ version: 1, completions: [], dailyGoal: 2 }, true)
await syncNow()
ok(server.get('u1')!.data.completions.length === 0, '6. 초기화: 서버 기록도 비워짐')
device('B', 'u1')
await syncNow()
ok(local().completions.length === 0, '   B도 비워진 기록을 받아 옴')

// 7. 업로드 중에 기록이 또 바뀜 → 다음 반복에서 함께 올라감
device('A', 'u1')
await syncNow()
complete(P1)
let fired = false
onPush = () => {
  if (fired) return
  fired = true
  complete(P2)
}
await syncNow()
onPush = null
ok(ids(server.get('u1')!.data) === [P1, P2].sort().join(',') && !__test.meta().dirty, '7. 올리는 도중 바뀐 기록도 이어서 올라감')

// 8. 로그아웃 상태에서 한 기록도 다시 로그인하면 올라감
device('A', null)
complete(P3)
ok(__test.meta().dirty, '8. 로그아웃 상태 기록은 업로드 대기로 표시')
device('A', 'u1')
console.log('   A:', await __test.adopt())
ok(ids(server.get('u1')!.data).includes(P3), '   다시 로그인하면 올라감')

// 9. 같은 기기에서 다른 계정 로그인 → 이 계정 기록으로 바뀌고 이전 기록은 따로 보관
device('A', 'u2')
console.log('   A:', await __test.adopt())
ok(local().completions.length === 0 && __test.meta().userId === 'u2', '9. 다른 계정 로그인: 이전 계정 기록이 섞이지 않음')
ok(!!stores.A.get('cloud-quest-progress-other-account'), '   이전 계정 기록은 기기에 따로 보관')
ok(ids(server.get('u1')!.data).includes(P3), '   이전 계정 서버 기록은 그대로')

// 10. 기존 기록이 있는 기기에서, 서버에도 기록이 있는 계정으로 처음 로그인 → 합침
stores.B = new Map()
device('B', null)
complete(P4)
device('B', 'u1')
console.log('   B:', await __test.adopt())
const m10 = server.get('u1')!.data
ok(ids(m10).includes(P4) && ids(m10).includes(P3), '10. 기록 있는 새 기기 로그인: 기기 기록과 계정 기록을 합침')

// 11. 새 기기의 기본 팀이 기존 서버 계정의 선택 팀을 덮어쓰면 안 됨
server.set('chosen-team', { data: { ...S.emptyProgress(), team: ['bahee', 'jiae', 'yeager'] }, rev: 1 })
stores.B = new Map()
device('B', 'chosen-team')
await __test.adopt()
ok(S.teamOf(local()).join(',') === 'bahee,jiae,yeager', '11. 새 기기 로그인도 서버의 선택 팀 유지')

// 12. team 필드가 없던 옛 서버 계정은 케이·변의주·니콜라스 유지
server.set('legacy-team', { data: { version: 1, completions: [], dailyGoal: 2 }, rev: 1 })
stores.B = new Map()
device('B', 'legacy-team')
await __test.adopt()
ok(S.teamOf(local()).join(',') === 'lead,senior,peer', '12. 옛 서버 계정의 기존 동료 유지')

console.log(fails ? `\n실패 ${fails}건` : '\n모두 통과')
process.exit(fails ? 1 : 0)
