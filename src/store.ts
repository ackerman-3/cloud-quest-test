import { PROJECTS, LEVELS } from './data/projects'
import { KEY_PREFIX } from './env'
import { ATTEND_GOLD, FRIENDS, LEVEL_GOLD, PRACTICE_PEEK_RATE, PRACTICE_RATE, PROJECT_POINTS, REVIEW_RATE, STAR_BONUS, TALK_POINTS } from './data/rewards'
import { DEFAULT_PLACED, FURNITURE, MEMENTOS, RELATION_PROP_NEED, SLOTS } from './data/office'
import type { Design } from './types'
import { TITLES } from './data/ranking'

// ⚠️ 저장 키 이름과 형식을 바꾸면 기존 기록이 사라질 수 있습니다.
export const PROGRESS_KEY = KEY_PREFIX + 'cloud-quest-progress-v1'
export const SESSION_KEY = KEY_PREFIX + 'cloud-quest-session-v1'

export interface Completion {
  projectId: string
  date: string // YYYY-MM-DD (기기 현지 날짜)
  ts: number
  stars: number
  peeked: boolean // 정답·해설을 본 적 있음
  counted: boolean // 오늘 완료 수에 반영됐는지 (같은 날 같은 프로젝트는 1회만)
  review: boolean // 이전 날짜에 이미 완료한 프로젝트를 다시 한 것
}

export interface Progress {
  version: 1
  completions: Completion[]
  dailyGoal: number
  lastBackup?: number
  /** 출석한 날짜(YYYY-MM-DD). 하루 첫 접속마다 골드 지급 */
  attendance?: string[]
  /** 간식 나누기 기록(예전 '선물'). 골드 사용·팀워크 계산의 근거 */
  gifts?: GiftLog[]
  /** 사무실: 동료와 이야기한 기록(동료별 하루 첫 대화만 팀워크 반영) */
  talks?: TalkLog[]
  /** 사무실: 가구 구매 기록 */
  purchases?: PurchaseLog[]
  /** 사무실: 자리별 배치(자리 id → 가구·기념품 id, null은 비움). 없는 자리는 기본 배치 */
  placed?: Record<string, string | null>
  /** 끝까지 본 동료 에피소드 id(예전 '특별 에피소드' 기록을 그대로 이어서 씀) */
  seenEpisodes?: string[]
  /** 클리어한 프로젝트의 퀴즈·구성도만 다시 한 기록(완료 수·별·승급에는 반영 안 함) */
  practices?: Practice[]
}

export type PracticeKind = 'quiz' | 'design'

export interface Practice {
  projectId: string
  kind: PracticeKind
  date: string
  ts: number
  peeked: boolean
  counted: boolean // 같은 날 같은 프로젝트·같은 종류는 1회만 보상
}

export interface TalkLog {
  ts: number
  to: string
  date: string
}

export interface PurchaseLog {
  ts: number
  item: string
  cost: number
}

export interface GiftLog {
  ts: number
  to: string // 캐릭터 id
  item: string // 선물 id
  cost: number
  points: number
}

export interface Session {
  projectId: string
  step: number
  design: Design
  peeked: boolean
  simRuns: number
  savedAt: number
}

const empty = (): Progress => ({ version: 1, completions: [], dailyGoal: 2 })

export function today(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function safeGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
    return true
  } catch {
    return false
  }
}

export function loadProgress(): Progress {
  const raw = safeGet(PROGRESS_KEY)
  if (!raw) return empty()
  try {
    const p = JSON.parse(raw) as Progress
    if (p && p.version === 1 && Array.isArray(p.completions)) return { ...empty(), ...p }
  } catch {
    /* 손상된 데이터는 무시 */
  }
  return empty()
}

export function saveProgress(p: Progress) {
  return safeSet(PROGRESS_KEY, JSON.stringify(p))
}

export function loadSession(): Session | null {
  const raw = safeGet(SESSION_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    return PROJECTS.some((p) => p.id === s.projectId) ? s : null
  } catch {
    return null
  }
}
export function saveSession(s: Session | null) {
  if (s) safeSet(SESSION_KEY, JSON.stringify(s))
  else {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* noop */
    }
  }
}

/** 프로젝트 완료 기록. 같은 날 같은 프로젝트는 완료 수에 1회만 반영 */
export function recordCompletion(p: Progress, projectId: string, stars: number, peeked: boolean) {
  const d = today()
  const counted = !p.completions.some((c) => c.projectId === projectId && c.date === d && c.counted)
  const review = p.completions.some((c) => c.projectId === projectId && c.date < d)
  const c: Completion = { projectId, date: d, ts: Date.now(), stars, peeked, counted, review }
  return { next: { ...p, completions: [...p.completions, c] }, completion: c }
}

/** 이미 한 번이라도 끝까지 완료한 프로젝트인지 */
export function isCleared(p: Progress, projectId: string) {
  return p.completions.some((c) => c.projectId === projectId)
}

/** 퀴즈·구성도만 다시 하기 기록 */
export function recordPractice(p: Progress, projectId: string, kind: PracticeKind, peeked: boolean) {
  const d = today()
  const counted = !(p.practices ?? []).some((x) => x.projectId === projectId && x.kind === kind && x.date === d && x.counted)
  const pr: Practice = { projectId, kind, date: d, ts: Date.now(), peeked, counted }
  return { next: { ...p, practices: [...(p.practices ?? []), pr] }, practice: pr }
}

export function todayCount(p: Progress) {
  const d = today()
  return p.completions.filter((c) => c.date === d && c.counted).length
}

export function studyDays(p: Progress) {
  return new Set(p.completions.map((c) => c.date))
}

export function streak(p: Progress) {
  const days = studyDays(p)
  const d = new Date()
  // 오늘 아직 안 했으면 어제부터 센다
  if (!days.has(today(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(today(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function bestStars(p: Progress, projectId: string) {
  return p.completions.filter((c) => c.projectId === projectId).reduce((m, c) => Math.max(m, c.stars), 0)
}

export function doneProjects(p: Progress, level?: number) {
  const ids = new Set(p.completions.map((c) => c.projectId))
  return PROJECTS.filter((pr) => ids.has(pr.id) && (!level || pr.level === level))
}

/** 해금된 최고 등급 */
export function unlockedLevel(p: Progress): 1 | 2 | 3 {
  let lv: 1 | 2 | 3 = 1
  for (const L of LEVELS) {
    if (L.level === 1) continue
    if (doneProjects(p, L.level - 1).length >= L.need) lv = L.level
    else break
  }
  return lv
}

export function exportJson(p: Progress) {
  return JSON.stringify({ app: 'cloud-quest', exportedAt: new Date().toISOString(), progress: p }, null, 2)
}

export function importJson(text: string): Progress | null {
  try {
    const o = JSON.parse(text)
    const p = (o?.progress ?? o) as Progress
    if (p?.version === 1 && Array.isArray(p.completions)) return { ...empty(), ...p }
  } catch {
    /* noop */
  }
  return null
}

/** 완료 기록의 "완료 수 반영(counted)"·"복습(review)" 표시를 시간순으로 다시 계산한다 */
export function normalizeCompletions(list: Completion[]): Completion[] {
  const rest = [...list].sort((a, b) => a.ts - b.ts)
  const seenDay = new Set<string>()
  return rest.map((c) => {
    const key = `${c.projectId}|${c.date}`
    const counted = !seenDay.has(key)
    seenDay.add(key)
    const review = rest.some((x) => x.projectId === c.projectId && x.date < c.date)
    return { ...c, counted, review }
  })
}

/** 다시 하기 기록의 보상 반영(counted)을 다시 계산한다(같은 날 같은 프로젝트·같은 종류는 1회) */
export function normalizePractices(list: Practice[]): Practice[] {
  const seen = new Set<string>()
  return [...list]
    .sort((a, b) => a.ts - b.ts)
    .map((x) => {
      const key = `${x.projectId}|${x.kind}|${x.date}`
      const counted = !seen.has(key)
      seen.add(key)
      return { ...x, counted }
    })
}

/** 완료 기록 하나를 지우고, 남은 기록의 "완료 수 반영(counted)"·"복습(review)" 표시를 다시 계산한다 */
export function deleteCompletion(p: Progress, ts: number): Progress {
  return { ...p, completions: normalizeCompletions(p.completions.filter((c) => c.ts !== ts)) }
}

/** 플레이 기록이 없는 처음 상태인지(앱을 열면 생기는 출석·하루 목표 설정만 있는 경우 포함) */
export function isEmptyProgress(p: Progress) {
  return (
    p.completions.length === 0 &&
    !p.gifts?.length &&
    !p.talks?.length &&
    !p.purchases?.length &&
    !p.seenEpisodes?.length &&
    !p.practices?.length
  )
}

export const emptyProgress = empty

// ── 골드·출석·선물 ──
// 골드는 따로 저장하지 않고 기록(완료·출석·선물)에서 계산한다. 완료 기록을 지우면 그 보상도 함께 빠진다.

/** 완료 기록 하나로 받은 골드. 같은 날 반복은 0, 다른 날 복습은 기본 골드 절반 */
export function completionGold(c: Completion) {
  if (!c.counted) return 0
  const p = PROJECTS.find((x) => x.id === c.projectId)
  if (!p) return 0
  const base = LEVEL_GOLD[p.level]
  return Math.round(base * (c.review ? REVIEW_RATE : 1)) + STAR_BONUS * Math.max(0, c.stars - 1)
}

/** 다시 하기 보상: 기본 골드 × 종류별 비율(해설 보면 절반). 같은 날 반복은 0 */
export function practiceGold(x: Practice) {
  if (!x.counted) return 0
  const p = PROJECTS.find((y) => y.id === x.projectId)
  if (!p) return 0
  return Math.round(LEVEL_GOLD[p.level] * PRACTICE_RATE[x.kind] * (x.peeked ? PRACTICE_PEEK_RATE : 1))
}

export function goldEarned(p: Progress) {
  return (
    p.completions.reduce((s, c) => s + completionGold(c), 0) +
    (p.practices ?? []).reduce((s, x) => s + practiceGold(x), 0) +
    (p.attendance?.length ?? 0) * ATTEND_GOLD
  )
}

export function goldSpent(p: Progress) {
  return (p.gifts ?? []).reduce((s, g) => s + g.cost, 0) + (p.purchases ?? []).reduce((s, x) => s + x.cost, 0)
}

export function goldBalance(p: Progress) {
  return Math.max(0, goldEarned(p) - goldSpent(p))
}

/** 오늘 처음 접속했으면 출석 기록을 더한 새 Progress, 이미 출석했으면 null */
export function checkIn(p: Progress): Progress | null {
  const d = today()
  if (p.attendance?.includes(d)) return null
  return { ...p, attendance: [...(p.attendance ?? []), d] }
}

// ── 사무실: 팀워크 ──
// 팀워크 = 간식 나누기 점수 + 이야기하기(동료별 하루 1번) + 함께한 프로젝트 완료(완료 수에 반영된 1회마다)
// 예전 호감도(간식 점수)는 그대로 이어지고, 단계 구간(0·50·150·300)도 같다.

const projectCast = new Map<string, Set<string>>()
/** 프로젝트 대화·퀴즈에 등장하는 동료 */
export function projectFriends(projectId: string) {
  let s = projectCast.get(projectId)
  if (!s) {
    s = new Set()
    const pr = PROJECTS.find((x) => x.id === projectId)
    for (const st of pr?.steps ?? []) {
      const lines = (st as { lines?: { who: string }[] }).lines ?? []
      for (const l of lines) s.add(l.who)
      const q = (st as { quiz?: unknown }).quiz
      for (const item of Array.isArray(q) ? q : q ? [q] : []) {
        const who = (item as { who?: string; speaker?: string }).who ?? (item as { speaker?: string }).speaker
        if (who) s.add(who)
      }
      const scene = st as { who?: string }
      if (scene.who) s.add(scene.who)
    }
    projectCast.set(projectId, s)
  }
  return s
}

export function teamworkParts(p: Progress, charId: string) {
  const snack = (p.gifts ?? []).filter((g) => g.to === charId).reduce((s, g) => s + g.points, 0)
  const talkDays = new Set((p.talks ?? []).filter((t) => t.to === charId).map((t) => t.date)).size
  const projects = p.completions.filter((c) => c.counted && projectFriends(c.projectId).has(charId)).length
  return { snack, talk: talkDays * TALK_POINTS, project: projects * PROJECT_POINTS }
}

export function teamwork(p: Progress, charId: string) {
  const x = teamworkParts(p, charId)
  return x.snack + x.talk + x.project
}
/** 예전 이름 */
export const affinity = teamwork

export function talkedToday(p: Progress, charId: string) {
  const d = today()
  return (p.talks ?? []).some((t) => t.to === charId && t.date === d)
}
export function talkCount(p: Progress, charId: string) {
  return (p.talks ?? []).filter((t) => t.to === charId).length
}
/** 이야기하기 기록. 오늘 첫 대화면 팀워크가 오른다 */
export function logTalk(p: Progress, to: string) {
  const gained = talkedToday(p, to) ? 0 : TALK_POINTS
  return { next: { ...p, talks: [...(p.talks ?? []), { ts: Date.now(), to, date: today() }] }, gained }
}

// ── 사무실: 가구·기념품 ──
export function ownsItem(p: Progress, id: string) {
  const f = FURNITURE.find((x) => x.id === id)
  if (f) return f.price === 0 || (p.purchases ?? []).some((x) => x.item === id)
  return earnedMementos(p).has(id)
}

export function buyItem(p: Progress, id: string, cost: number): Progress {
  return { ...p, purchases: [...(p.purchases ?? []), { ts: Date.now(), item: id, cost }] }
}

export function placedMap(p: Progress): Record<string, string | null> {
  return { ...DEFAULT_PLACED, ...(p.placed ?? {}) }
}

/** 자리에 배치. 기념품을 다른 전시 자리에서 옮겨 오면 원래 자리는 비운다 */
export function placeItem(p: Progress, slot: string, item: string | null): Progress {
  const cur = placedMap(p)
  const next: Record<string, string | null> = { ...cur, [slot]: item }
  if (item)
    for (const s of SLOTS) if (s.id !== slot && s.kind === 'display' && next[s.id] === item) next[s.id] = null
  return { ...p, placed: next }
}

function longestStreak(p: Progress) {
  const days = [...studyDays(p)].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    if (prev) {
      const t = new Date(prev + 'T00:00:00')
      t.setDate(t.getDate() + 1)
      run = today(t) === d ? run + 1 : 1
    } else run = 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** 성과·관계로 받은 기념품 id */
export function earnedMementos(p: Progress) {
  const done = doneProjects(p).length
  const lv = unlockedLevel(p)
  const tw = Object.fromEntries(FRIENDS.map((f) => [f.id, teamwork(p, f.id)]))
  const ok: Record<string, boolean> = {
    m_first: p.completions.length > 0,
    m_star: p.completions.some((c) => c.stars >= 3),
    m_ten: done >= 10,
    m_streak: longestStreak(p) >= 7,
    m_junior: lv >= 2,
    m_senior: lv >= 3,
    m_all: done >= PROJECTS.length,
    r_lead: (tw.lead ?? 0) >= RELATION_PROP_NEED,
    r_senior: (tw.senior ?? 0) >= RELATION_PROP_NEED,
    r_peer: (tw.peer ?? 0) >= RELATION_PROP_NEED,
    team_photo: FRIENDS.every((f) => (tw[f.id] ?? 0) >= RELATION_PROP_NEED),
  }
  const seen = new Set(p.seenEpisodes ?? [])
  return new Set(MEMENTOS.filter((m) => (m.episode ? seen.has(m.episode) : ok[m.id])).map((m) => m.id))
}

export function giveGift(p: Progress, to: string, item: string, cost: number, points: number): Progress {
  return { ...p, gifts: [...(p.gifts ?? []), { ts: Date.now(), to, item, cost, points }] }
}

export function markEpisodeSeen(p: Progress, id: string): Progress {
  if (p.seenEpisodes?.includes(id)) return p
  return { ...p, seenEpisodes: [...(p.seenEpisodes ?? []), id] }
}

// ── 랭킹 ──
/** 랭킹 분야별 내 기록(서버가 저장할 때 다시 확인한다) */
export function rankStats(p: Progress) {
  const projects = p.completions.filter((c) => c.counted).length
  const bought = new Set((p.purchases ?? []).map((x) => x.item)).size
  const office = bought + earnedMementos(p).size
  const teamworkSum = FRIENDS.reduce((s, f) => s + teamwork(p, f.id), 0)
  return { projects, office, teamwork: teamworkSum }
}

/** 보유한 공통 칭호 id */
export function ownedTitles(p: Progress) {
  const m = earnedMementos(p)
  const bought = new Set((p.purchases ?? []).map((x) => x.item)).size
  const has: Record<string, boolean> = {
    rookie: true,
    first_project: m.has('m_first'),
    perfect: m.has('m_star'),
    ten: m.has('m_ten'),
    streak7: m.has('m_streak'),
    junior: m.has('m_junior'),
    senior: m.has('m_senior'),
    all_clear: m.has('m_all'),
    decorator: bought >= 3,
    team_player: m.has('team_photo'),
  }
  return new Set(TITLES.filter((t) => has[t.id]).map((t) => t.id))
}
