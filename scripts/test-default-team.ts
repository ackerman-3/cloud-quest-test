import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALTS, castProject, lineKey } from '../src/data/cast'
import { CHARS } from '../src/data/characters'
import { DEFAULT_FRIENDS } from '../src/data/friends-default'
import { ART } from '../src/data/officeArt'
import { MEMENTOS } from '../src/data/office'
import { PROJECTS } from '../src/data/projects'
import { FRIENDS, GIFTS } from '../src/data/rewards'
import { DEFAULT_CAST, DEFAULT_TEAM, LEGACY_TEAM } from '../src/data/team'
import { drawLook } from '../src/pixel'
import { castOf, emptyProgress, earnedMementos, importJson, loadProgress, markEpisodeSeen, placedMap, PROGRESS_KEY, setTeam, teamOf, validTeam, type Progress } from '../src/store'

const storage = new Map<string, string>()
Object.assign(globalThis, { localStorage: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
} })
assert.deepEqual(teamOf(loadProgress()), DEFAULT_TEAM, '신규 시작은 새 기본 팀')
assert.deepEqual(castOf(emptyProgress()), DEFAULT_CAST)
const legacy: Progress = { version: 1, completions: [], dailyGoal: 2 }
storage.set(PROGRESS_KEY, JSON.stringify(legacy))
assert.deepEqual(teamOf(loadProgress()), LEGACY_TEAM, 'team 없는 옛 기록 유지')
assert.deepEqual(teamOf(importJson(JSON.stringify({ progress: legacy }))!), LEGACY_TEAM, '옛 백업 복원 유지')
const selected = setTeam(legacy, ['bahee', 'jiae', 'yeager'])
storage.set(PROGRESS_KEY, JSON.stringify(selected))
assert.deepEqual(teamOf(loadProgress()), selected.team, '기존 선택 팀 유지')
assert.deepEqual(teamOf(importJson(JSON.stringify(selected))!), selected.team)
const reset = setTeam(selected, [...DEFAULT_TEAM])
assert.deepEqual(castOf(reset), DEFAULT_CAST, '기본 멤버로 변경')
const one = emptyProgress()
one.team![0] = 'bahee'
assert.deepEqual(emptyProgress().team, DEFAULT_TEAM, '초기 팀 배열은 공유하지 않음')
assert.ok(validTeam(DEFAULT_TEAM))
assert.ok(!validTeam(['boan', 'bahee', 'coding']), '같은 자리 중복 금지')
assert.equal(new Set(FRIENDS.map((f) => f.id)).size, FRIENDS.length)
assert.deepEqual(FRIENDS.slice(0, 3).map((f) => f.id), DEFAULT_TEAM)
console.log('OK 신규 시작·기존 기록·백업·팀 변경')

const before = JSON.stringify(PROJECTS)
let keys = 0
for (const [seat, id] of Object.entries(DEFAULT_CAST)) {
  const voice = ALTS.find((a) => a.id === id)!.voice
  const expected: Record<string, string> = {}
  for (const p of PROJECTS) p.steps.forEach((st, i) => {
    if (st.t === 'talk') st.lines.forEach((l, j) => { if (l.who === seat) expected[lineKey(p.id, i, j)] = l.text })
    if (st.t === 'quiz' && st.quiz.who === seat) expected[lineKey(p.id, i, 'q')] = st.quiz.prompt
  })
  assert.deepEqual(Object.keys(voice).sort(), Object.keys(expected).sort(), `${id} 전체 대사 키`)
  for (const [key, text] of Object.entries(expected)) {
    if (key.endsWith('/q')) assert.equal(voice[key], text, `${key} 퀴즈 원문 보존`)
    assert.deepEqual(voice[key].match(/\d[\d,.~/-]*/g), text.match(/\d[\d,.~/-]*/g), `${key} 수치 보존`)
  }
  keys += Object.keys(voice).length
}
for (const p of PROJECTS) {
  const result = castProject(p, DEFAULT_CAST)
  result.steps.forEach((st, i) => {
    const source = p.steps[i]
    if (st.t === 'talk') st.lines.forEach((l) => assert.ok(l.who === 'me' || l.who === 'narr' || CHARS[l.who], `화자 ${l.who}`))
    if (st.t === 'quiz' && source.t === 'quiz') {
      assert.deepEqual({ ...st.quiz, who: source.quiz.who }, source.quiz, '질문·보기·정답·해설 보존')
    }
  })
}
assert.equal(JSON.stringify(PROJECTS), before, '원본 프로젝트 불변')
const nameExample = castProject({ ...PROJECTS[0], id: 'test-particles', steps: [{ t: 'talk', scene: 'office', lines: [{ who: 'lead', text: '케이가 변의주를 부르고 니콜라스는 기다린다.' }] }] }, DEFAULT_CAST)
const first = nameExample.steps[0]
assert.ok(first.t === 'talk')
assert.equal(first.lines[0].text, '차보안이 한서버를 부르고 이코딩은 기다린다.')
console.log(`OK 프로젝트 ${PROJECTS.length}개 · 대사 ${keys}줄 · 퀴즈 원문·수치·이름 조사`)

for (const f of DEFAULT_FRIENDS) {
  assert.equal(f.greet.length, 4)
  assert.equal(f.talks.length, 4)
  assert.deepEqual(f.episodes, [], '기본 멤버는 에피소드 없음')
  for (const snack of [...f.likes, ...f.dislikes, ...Object.keys(f.special ?? {})]) assert.ok(GIFTS.some((g) => g.id === snack))
  const grid = drawLook(CHARS[f.id])
  assert.equal(grid.length, 38)
  assert.ok(grid.every((row) => row.length === 24))
  assert.ok(!MEMENTOS.some((m) => m.friend === f.id), '기본 멤버 에피소드 보상 없음')
  for (let i = 1; i <= 3; i++) {
    assert.ok(!ART[`ep_${f.id}${i}`], '제거한 보상 그림 없음')
    assert.ok(!earnedMementos(markEpisodeSeen(emptyProgress(), `${f.id}-${i}`)).has(`ep_${f.id}${i}`), '옛 완독 기록으로 보상 재생성 안 됨')
  }
}
assert.ok(FRIENDS.filter((f) => !DEFAULT_TEAM.includes(f.id)).every((f) => f.episodes.length === 3), '다른 동료 에피소드 유지')
assert.deepEqual(placedMap({ ...emptyProgress(), placed: { show1: 'ep_boan1', show2: 'ep_server3', show3: 'ep_coding2' } }), placedMap(emptyProgress()), '옛 기본 멤버 보상은 전시하지 않음')
const office = readFileSync(new URL('../src/components/Office.tsx', import.meta.url), 'utf8')
assert.ok(office.includes('onClick={() => onSave([...DEFAULT_TEAM])}'))
assert.ok(office.includes('기본 멤버로 변경'))
assert.ok(!office.includes('원년 멤버'))
assert.ok(!office.includes('default-badge'))
assert.ok(office.includes('fr.episodes.length > 0 &&'), '에피소드 0/0 미표시')
console.log('OK 기본 멤버 에피소드·보상·그림 없음 · 다른 동료 에피소드 유지 · 픽셀 규격 · 초기화 버튼')
