import type { Line, Project, Quiz, Step } from '../types'
import { CHARS } from './characters'
import { VOICE_BAHEE } from './voice-bahee'
import { VOICE_JIAE } from './voice-jiae'
import { VOICE_YEAGER } from './voice-yeager'
import { VOICE_BOAN } from './voice-boan'
import { VOICE_SERVER } from './voice-server'
import { VOICE_CODING } from './voice-coding'

/**
 * 팀 자리: 팀장·선배·동기. 기존 인물의 저장 id는 유지하고 기본 멤버도 별도 id로 등록한다.
 * 사무실 팀(3명)에 교체 인물을 넣으면 프로젝트 대화·퀴즈에서도 그 사람이 대신 말한다(store.ts castOf).
 * 대사 내용은 같고, voice에 그 사람 말투로 다시 쓴 대사가 있으면 그걸 쓴다.
 */
export const SEATS = [
  { id: 'lead', label: '팀장' },
  { id: 'senior', label: '선배' },
  { id: 'peer', label: '동기' },
] as const
export type SeatId = (typeof SEATS)[number]['id']
export type Cast = Record<SeatId, string>

export interface Alt {
  id: string // CHARS·FRIENDS의 id
  seat: SeatId
  /**
   * 프로젝트 대사를 이 사람 말투로 다시 쓴 것. 키는 lineKey() 형식
   * (대화: "<프로젝트id>/<단계>/<줄>", 퀴즈 질문: "<프로젝트id>/<단계>/q").
   * 없는 줄은 원래 대사를 그대로 쓴다.
   */
  voice: Record<string, string>
}

/** 교체 인물 목록(자리마다 계속 늘릴 수 있음). 외형은 characters.ts, 동료 정보·에피소드는 friends2.ts */
export const ALTS: Alt[] = [
  { id: 'boan', seat: 'lead', voice: VOICE_BOAN },
  { id: 'server', seat: 'senior', voice: VOICE_SERVER },
  { id: 'coding', seat: 'peer', voice: VOICE_CODING },
  { id: 'bahee', seat: 'lead', voice: VOICE_BAHEE },
  { id: 'jiae', seat: 'senior', voice: VOICE_JIAE },
  { id: 'yeager', seat: 'peer', voice: VOICE_YEAGER },
]

export const ORIGINAL_CAST: Cast = { lead: 'lead', senior: 'senior', peer: 'peer' }
export const seatOf = (charId: string): SeatId | null =>
  SEATS.some((s) => s.id === charId) ? (charId as SeatId) : (ALTS.find((a) => a.id === charId)?.seat ?? null)

export const lineKey = (projectId: string, step: number, line: number | 'q') => `${projectId}/${step}/${line}`

// 다른 멤버 이름이 대사에 나오면 지금 그 자리에 앉은 사람 이름으로
const ORIGINAL_NAMES: [SeatId, RegExp][] = [
  ['lead', /(?<![로리])케이(?![션블크스])/g],
  ['senior', /변의주/g],
  ['peer', /니콜라스/g],
]
function renameMates(text: string, cast: Cast) {
  let t = text
  for (const [seat, re] of ORIGINAL_NAMES) {
    if (cast[seat] === seat) continue
    const name = CHARS[cast[seat]].name
    const end = name.charCodeAt(name.length - 1) - 0xac00
    const jong = end >= 0 && end <= 11171 ? end % 28 : 0
    const withParticle = new RegExp(`${re.source}(으로|로|이랑|랑|은|는|이|가|을|를|과|와)(?=[\\s,.!?…]|$)`, 'g')
    t = t.replace(withParticle, (_match, particle: string) => {
      const pair = [['은', '는'], ['이', '가'], ['을', '를'], ['과', '와'], ['이랑', '랑']].find((p) => p.includes(particle))
      return name + (pair ? pair[jong ? 0 : 1] : jong && jong !== 8 ? '으로' : '로')
    })
    t = t.replace(re, name)
  }
  return t
}

const voiceOf = (id: string) => ALTS.find((a) => a.id === id)?.voice

function castLine(l: Line, key: string, cast: Cast): Line {
  const seat = SEATS.find((s) => s.id === l.who)?.id
  const who = seat ? cast[seat] : l.who
  const text = (who !== l.who ? voiceOf(who)?.[key] : undefined) ?? l.text
  return { who, text: renameMates(text, cast) }
}
function castQuiz(q: Quiz, key: string, cast: Cast): Quiz {
  const { who, text } = castLine({ who: q.who, text: q.prompt }, key, cast)
  return { ...q, who, prompt: text }
}

/** 지금 팀 구성으로 프로젝트 대화·퀴즈의 화자와 말투를 바꾼 사본 */
export function castProject(p: Project, cast: Cast): Project {
  if (SEATS.every((s) => cast[s.id] === s.id)) return p
  const steps: Step[] = p.steps.map((st, i) => {
    if (st.t === 'talk') return { ...st, lines: st.lines.map((l, j) => castLine(l, lineKey(p.id, i, j), cast)) }
    if (st.t === 'quiz') return { ...st, quiz: castQuiz(st.quiz, lineKey(p.id, i, 'q'), cast) }
    return st
  })
  return { ...p, steps }
}
