import { KEY_PREFIX } from './env'
// 계정과 서버 동기화 (Supabase)
// - 로그인은 선택. 로그인하지 않으면 지금처럼 기기에만 저장한다.
// - 기기의 기록(localStorage)이 기준이고, 바뀔 때마다 잠시 뒤 서버에 올린다.
// - 다른 기기가 먼저 올렸으면 서버 기록을 받아 오거나(이 기기에 안 올린 변경이 없을 때) 두 기록을 합친다.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { SUPABASE_KEY, SUPABASE_URL, USER_EMAIL_DOMAIN } from './data/server'
import { mergeProgress } from './merge'
import { emptyProgress, isEmptyProgress, loadProgress, rankStats, saveProgress, teamOf, type Progress } from './store'

import { DEMO_URL } from './demoServer'

/** 미리보기 빌드(VITE_DEMO_SERVER=1)는 브라우저 안의 가짜 서버를 쓴다 */
export const demoMode = import.meta.env?.VITE_DEMO_SERVER === '1'
const API_URL = demoMode ? DEMO_URL : SUPABASE_URL
const API_KEY = demoMode ? 'sb_publishable_demo' : SUPABASE_KEY
export const cloudEnabled = Boolean(API_URL && API_KEY)
let enabled = cloudEnabled

const META_KEY = KEY_PREFIX + 'cloud-quest-account-v1'
const OTHER_BACKUP_KEY = KEY_PREFIX + 'cloud-quest-progress-other-account'
export const USERNAME_RE = /^[a-z0-9_]{4,16}$/

/** 이 기기 기록의 주인과 서버와의 관계 */
interface Meta {
  /** 이 기기 기록이 속한 계정. 한 번도 로그인하지 않았으면 없음 */
  userId?: string
  username?: string
  nickname?: string
  avatar?: string
  title?: string
  status?: string
  /** 마지막으로 서버와 맞춘 서버 기록 번호 */
  rev: number
  /** 서버에 아직 올리지 않은 변경이 있음 */
  dirty: boolean
  /** 다음 업로드는 서버 기록을 통째로 바꿈(초기화·복원) */
  force: boolean
  lastSync?: number
}

function loadMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? 'null')
    if (m && typeof m === 'object') return { rev: 0, dirty: false, force: false, ...m }
  } catch {
    /* noop */
  }
  return { rev: 0, dirty: false, force: false }
}
function saveMeta(m: Meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m))
  } catch {
    /* noop */
  }
  emit()
}

// ── 화면에 보여 줄 상태 ──
export interface CloudState {
  enabled: boolean
  signedIn: boolean
  userId?: string
  username?: string
  nickname?: string
  avatar?: string
  title?: string
  status?: string
  syncing: boolean
  pending: boolean
  lastSync?: number
  error?: string
}
let signedIn = false
let syncing = false
let lastError: string | undefined
let snapshot: CloudState = computeState()
const listeners = new Set<() => void>()
function computeState(): CloudState {
  const m = loadMeta()
  return {
    enabled,
    signedIn,
    userId: signedIn ? uid ?? m.userId : undefined,
    username: signedIn ? m.username : undefined,
    nickname: signedIn ? m.nickname : undefined,
    avatar: signedIn ? m.avatar : undefined,
    title: signedIn ? m.title : undefined,
    status: signedIn ? m.status : undefined,
    syncing,
    pending: m.dirty,
    lastSync: m.lastSync,
    error: lastError,
  }
}
function emit() {
  snapshot = computeState()
  listeners.forEach((f) => f())
}
export function useCloud() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f)
      return () => listeners.delete(f)
    },
    () => snapshot,
  )
}

// ── Supabase 연결 ──
let client: SupabaseClient | null = null
const boardRequests = new Set<AbortController>()
function cancelBoardRequests() {
  for (const request of boardRequests) request.abort()
  boardRequests.clear()
}
function sb() {
  if (!client)
    client = createClient(API_URL, API_KEY, {
      auth: { storageKey: KEY_PREFIX + 'cloud-quest-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  return client
}
const toEmail = (username: string) => `${username.trim().toLowerCase()}@${USER_EMAIL_DOMAIN}`

/** 서버에서 받아 온 기록을 앱 화면에 반영하는 함수(App이 등록) */
let applyToApp: (p: Progress) => void = () => {}
/** 계정이 바뀌어 진행 중인 프로젝트 등을 비워야 할 때(App이 등록) */
let onSwitched: () => void = () => {}
let uid: string | null = null

export function initCloud(opts: { apply: (p: Progress) => void; switched: () => void }) {
  applyToApp = opts.apply
  onSwitched = opts.switched
  if (!enabled) return
  sb().auth.onAuthStateChange((event, session) => {
    const was = signedIn
    if (uid !== (session?.user.id ?? null)) cancelBoardRequests()
    signedIn = !!session
    uid = session?.user.id ?? null
    if (event === 'SIGNED_OUT') lastError = undefined
    emit()
    if (!was && signedIn && event === 'INITIAL_SESSION') void syncNow()
  })
}

function apply(p: Progress) {
  saveProgress(p)
  applyToApp(p)
}

// ── 로컬 변경 알림 ──
let changeCounter = 0
let timer: number | undefined
/** 기록을 저장할 때마다 부른다. force는 초기화·복원처럼 서버 기록을 통째로 바꿀 때 */
export function noteLocalChange(force = false) {
  changeCounter++
  const m = loadMeta()
  if (!m.userId) return // 한 번도 로그인하지 않은 기기
  saveMeta({ ...m, dirty: true, force: m.force || force })
  scheduleSync(2500)
}
function scheduleSync(ms: number) {
  if (!enabled) return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => void syncNow(), ms)
}

// ── 동기화 ──
let running: Promise<void> | null = null
let again = false

interface Row {
  data: Progress
  rev: number
}
interface Backend {
  fetchRow(): Promise<Row | null>
  pushRow(p: Progress, base: number, force: boolean): Promise<number | null>
  loadProfile(): Promise<Profile | null>
}
const supabaseBackend: Backend = {
  fetchRow: () => fetchRowSb(),
  pushRow: (p, b, f) => pushRowSb(p, b, f),
  loadProfile: () => loadProfileSb(),
}
let backend = supabaseBackend
const fetchRow = () => backend.fetchRow()
const pushRow = (p: Progress, b: number, f: boolean) => backend.pushRow(p, b, f)
const loadProfile = () => backend.loadProfile()

async function fetchRowSb(): Promise<Row | null> {
  const { data, error } = await sb().from('progress').select('data, rev').eq('user_id', uid!).maybeSingle()
  if (error) throw error
  return (data as Row | null) ?? null
}
async function pushRowSb(p: Progress, base: number, force: boolean): Promise<number | null> {
  const { data, error } = await sb().rpc('save_progress', { p_data: p, p_base_rev: base, p_force: force, p_stats: rankStats(p) })
  if (error) throw error
  return (data as number | null) ?? null
}

export function syncNow(): Promise<void> {
  if (!enabled || !signedIn || !uid) return Promise.resolve()
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    syncing = true
    emit()
    try {
      await syncLoop()
      lastError = undefined
    } catch (e) {
      lastError = navigator.onLine === false ? '오프라인이에요. 연결되면 자동으로 반영돼요.' : errText(e)
    } finally {
      syncing = false
      running = null
      emit()
      if (again) {
        again = false
        scheduleSync(500)
      }
    }
  })()
  return running
}

async function syncLoop() {
  for (let attempt = 0; attempt < 4; attempt++) {
    const v0 = changeCounter
    const meta = loadMeta()
    if (meta.userId !== uid) return // 로그인 직후 처리(adopt) 전
    const local = loadProgress()
    const row = await fetchRow()

    let target: Progress
    let base: number
    const force = meta.force
    if (!row) {
      target = local
      base = 0
    } else if (force) {
      target = local
      base = row.rev
    } else if (row.rev === meta.rev) {
      if (!meta.dirty) {
        saveMeta({ ...meta, lastSync: Date.now() })
        return
      }
      target = local
      base = row.rev
    } else if (!meta.dirty) {
      // 다른 기기가 올린 기록을 받아 온다
      if (changeCounter !== v0) continue
      apply(row.data)
      saveMeta({ ...meta, rev: row.rev, lastSync: Date.now() })
      return
    } else {
      target = mergeProgress(local, row.data)
      base = row.rev
    }

    const rev = await pushRow(target, base, force)
    if (rev === null) continue // 그사이 다른 기기가 올림 → 다시

    if (changeCounter !== v0) {
      // 올리는 동안 이 기기에서 기록이 또 바뀜 → 합쳐 두고 한 번 더 올린다
      if (target !== local) apply(mergeProgress(loadProgress(), target))
      saveMeta({ ...loadMeta(), rev, force: false, dirty: true })
      continue
    }
    if (target !== local) apply(target)
    saveMeta({ ...loadMeta(), rev, dirty: false, force: false, lastSync: Date.now() })
    return
  }
}

// ── 로그인·가입·로그아웃 ──
interface Profile {
  username: string
  nickname: string
  avatar?: string
  title?: string
  status_msg?: string
}
async function loadProfileSb() {
  const { data } = await sb().from('profiles').select('username, nickname, avatar, title, status_msg').eq('id', uid!).maybeSingle()
  return data as Profile | null
}

/** 로그인한 계정을 이 기기 기록과 연결한다. 결과 안내 문구를 돌려준다 */
async function adopt(): Promise<string> {
  const prof = await loadProfile()
  const meta = loadMeta()
  const local = loadProgress()
  const row = await fetchRow()
  const who = { userId: uid!, username: prof?.username, nickname: prof?.nickname, avatar: prof?.avatar, title: prof?.title, status: prof?.status_msg }

  if (meta.userId === uid) {
    saveMeta({ ...meta, ...who })
    await syncNow()
    return '로그인했어요.'
  }

  if (meta.userId && meta.userId !== uid) {
    // 다른 계정의 기록이 이 기기에 있음 → 따로 보관하고 이 계정 기록으로 바꾼다
    try {
      localStorage.setItem(OTHER_BACKUP_KEY, JSON.stringify({ userId: meta.userId, username: meta.username, progress: local }))
    } catch {
      /* noop */
    }
    onSwitched()
    apply(row ? row.data : { ...emptyProgress(), dailyGoal: local.dailyGoal })
    saveMeta({ ...who, rev: row?.rev ?? 0, dirty: false, force: false, lastSync: Date.now() })
    return '계정을 바꿨어요. 이 계정의 기록을 불러왔어요.'
  }

  // 이 기기에서 처음 로그인
  if (!row) {
    saveMeta({ ...who, rev: 0, dirty: true, force: false })
    await syncNow()
    return isEmptyProgress(local) ? '로그인했어요.' : '이 기기의 기록을 계정에 연결했어요.'
  }
  if (isEmptyProgress(local)) {
    // 새 기기: 계정 기록을 쓰되 오늘 출석은 함께 남긴다
    const merged = mergeProgress({ ...local, dailyGoal: row.data.dailyGoal ?? local.dailyGoal, team: teamOf(row.data) }, row.data)
    const extra = (merged.attendance?.length ?? 0) > (row.data.attendance?.length ?? 0)
    apply(merged)
    saveMeta({ ...who, rev: row.rev, dirty: extra, force: false, lastSync: Date.now() })
    if (extra) await syncNow()
    return '계정의 기록을 불러왔어요.'
  }
  apply(mergeProgress(local, row.data))
  saveMeta({ ...who, rev: row.rev, dirty: true, force: false })
  await syncNow()
  return '이 기기의 기록과 계정의 기록을 합쳤어요.'
}

export async function signIn(username: string, password: string): Promise<string> {
  const { data, error } = await sb().auth.signInWithPassword({ email: toEmail(username), password })
  if (error || !data.session) throw new Error(/invalid/i.test(error?.message ?? '') ? '아이디 또는 비밀번호가 맞지 않아요.' : errText(error))
  signedIn = true
  uid = data.session.user.id
  emit()
  return adopt()
}

const SIGNUP_ERRORS: Record<string, string> = {
  invite: '초대 코드가 맞지 않아요.',
  invite_not_set: '초대 코드가 아직 설정되지 않았어요. 관리자에게 알려 주세요.',
  username: '아이디는 영문 소문자·숫자·밑줄(_)로 4~16자예요.',
  password: '비밀번호는 6자 이상이에요.',
  nickname: '닉네임은 1~12자예요.',
  taken: '이미 사용 중인 아이디예요.',
}

export async function signUp(input: { username: string; password: string; nickname: string; invite: string }): Promise<string> {
  const { error } = await sb().functions.invoke('signup', { body: input })
  if (error) {
    let code = ''
    try {
      code = ((await (error as { context?: Response }).context?.json()) as { error?: string })?.error ?? ''
    } catch {
      /* noop */
    }
    throw new Error(SIGNUP_ERRORS[code] ?? '가입하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
  }
  return signIn(input.username, input.password)
}

/** 로그아웃. 올리지 못한 기록이 있으면 false(화면에서 한 번 더 확인) */
export async function signOut(forceLeave = false): Promise<boolean> {
  if (loadMeta().dirty) await syncNow()
  if (loadMeta().dirty && !forceLeave) return false
  await sb().auth.signOut({ scope: 'local' })
  cancelBoardRequests()
  signedIn = false
  uid = null
  emit()
  return true
}

export async function changeNickname(nickname: string) {
  const m = loadMeta()
  await updateProfile({ nickname, avatar: m.avatar ?? 'i_laptop', title: m.title ?? '', status: m.status ?? '' })
}

/** 내 프로필(닉네임·프로필 이미지·대표 칭호·상태메시지) 저장 */
export async function updateProfile(input: { nickname: string; avatar: string; title: string; status: string }) {
  const nickname = input.nickname.trim()
  const status = input.status.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (nickname.length < 1 || [...nickname].length > 12) throw new Error('닉네임은 1~12자예요.')
  if ([...status].length > 40) throw new Error('상태메시지는 40자까지예요.')
  if (!/^[a-z0-9_]{1,24}$/.test(input.avatar) || !/^[a-z0-9_]{0,24}$/.test(input.title)) throw new Error('선택한 값이 올바르지 않아요.')
  const { error } = await sb().from('profiles').update({ nickname, avatar: input.avatar, title: input.title, status_msg: status }).eq('id', uid!)
  if (error) throw new Error(errText(error))
  saveMeta({ ...loadMeta(), nickname, avatar: input.avatar, title: input.title, status })
}

export interface RankRow {
  user_id: string
  nickname: string
  avatar: string
  title: string
  status_msg: string
  projects: number
  office: number
  teamwork: number
  is_me: boolean
}

/** 랭킹 목록(로그인한 참여자만). 올리지 못한 내 기록이 있으면 먼저 올린다 */
export async function fetchRanking(): Promise<RankRow[]> {
  if (!enabled || !signedIn) throw new Error('로그인이 필요해요.')
  if (loadMeta().dirty) await syncNow()
  const { data, error } = await sb().rpc('get_ranking')
  if (error) throw new Error(errText(error))
  return ((data ?? []) as RankRow[]).map((r) => ({ ...r, projects: Number(r.projects), office: Number(r.office), teamwork: Number(r.teamwork) }))
}

export async function changePassword(password: string) {
  if (password.length < 6) throw new Error('비밀번호는 6자 이상이에요.')
  const { error } = await sb().auth.updateUser({ password })
  if (error) throw new Error(errText(error))
}

/** 게시판 전용 RPC. 기존 로그인 세션을 재사용하며 비밀글은 기기에 따로 저장하지 않는다. */
export async function callBoardRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!/^board_(meta|list|get|create|comment|delete_post|delete_comment|status)$/.test(name)) throw new Error('지원하지 않는 요청이에요.')
  if (!enabled || !signedIn || !uid) throw new Error('로그인한 뒤 이용해 주세요.')
  if (demoMode) throw new Error('체험 모드에서는 게시판을 이용할 수 없어요. 실제 앱에서 로그인해 주세요.')
  const account = uid
  const request = new AbortController()
  boardRequests.add(request)
  try {
    const { data, error } = await sb().rpc(name, args).abortSignal(request.signal)
    if (uid !== account || !signedIn) throw new Error('계정이 변경되었어요. 다시 열어 주세요.')
    if (error) {
      if (error.code === 'PGRST202' || error.code === '42P01') throw new Error('게시판을 준비 중이에요. 잠시 후 다시 이용해 주세요.')
      if (error.code === '42501') throw new Error('글을 볼 수 없거나 이 작업을 할 권한이 없어요.')
      if (error.code === '22023' || error.code === '23514') throw new Error('입력 내용을 확인해 주세요. 제목 80자, 본문 3,000자, 댓글 1,500자까지 적을 수 있어요.')
      throw new Error('처리하지 못했어요. 연결을 확인하고 다시 시도해 주세요.')
    }
    return data as T
  } finally {
    boardRequests.delete(request)
  }
}

function errText(e: unknown) {
  const m = (e as { message?: string })?.message ?? ''
  if (/fetch|network|Failed to/i.test(m)) return '연결하지 못했어요. 인터넷 연결을 확인해 주세요.'
  return m ? `오류: ${m}` : '알 수 없는 오류가 났어요.'
}

/** 테스트 전용: 서버 대신 가짜 저장소를 쓰고, 로그인 상태를 직접 정한다 */
export const __test = {
  use(b: Backend, user: string | null) {
    if (uid !== user) cancelBoardRequests()
    backend = b
    enabled = true
    signedIn = !!user
    uid = user
  },
  adopt: () => adopt(),
  meta: () => loadMeta(),
}
