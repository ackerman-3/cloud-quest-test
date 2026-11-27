// 두 기기의 기록을 합친다. 기록은 대부분 "쌓이는 목록"이라 합집합으로 합치고,
// 같은 날 같은 프로젝트 중복 같은 집계 표시는 시간순으로 다시 계산한다.
import { normalizeCompletions, normalizePractices, type Progress } from './store'

function union<T>(a: T[] | undefined, b: T[] | undefined, key: (x: T) => string): T[] {
  const m = new Map<string, T>()
  for (const x of [...(a ?? []), ...(b ?? [])]) if (!m.has(key(x))) m.set(key(x), x)
  return [...m.values()]
}

/**
 * mine: 이 기기 기록, theirs: 서버(다른 기기) 기록.
 * 하루 목표·사무실 배치처럼 하나만 고를 수 있는 값은 이 기기 값을 쓴다.
 */
export function mergeProgress(mine: Progress, theirs: Progress): Progress {
  const completions = normalizeCompletions(union(mine.completions, theirs.completions, (c) => `${c.ts}|${c.projectId}`))
  const practices = normalizePractices(union(mine.practices, theirs.practices, (x) => `${x.ts}|${x.projectId}|${x.kind}`))
  const out: Progress = {
    ...theirs,
    ...mine,
    version: 1,
    completions,
    dailyGoal: mine.dailyGoal ?? theirs.dailyGoal,
    attendance: union(mine.attendance, theirs.attendance, (d) => d).sort(),
    gifts: union(mine.gifts, theirs.gifts, (g) => `${g.ts}|${g.to}|${g.item}`).sort((a, b) => a.ts - b.ts),
    talks: union(mine.talks, theirs.talks, (t) => `${t.ts}|${t.to}`).sort((a, b) => a.ts - b.ts),
    purchases: union(mine.purchases, theirs.purchases, (x) => `${x.ts}|${x.item}`).sort((a, b) => a.ts - b.ts),
    seenEpisodes: union(mine.seenEpisodes, theirs.seenEpisodes, (e) => e),
    practices,
    placed: { ...(theirs.placed ?? {}), ...(mine.placed ?? {}) },
  }
  const lb = Math.max(mine.lastBackup ?? 0, theirs.lastBackup ?? 0)
  if (lb) out.lastBackup = lb
  else delete out.lastBackup
  return out
}
