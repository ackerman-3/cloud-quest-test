// 랭킹 설정 — 분야 이름·집계 기준·칭호·프로필 이미지는 여기서만 바꾸면 된다.
// 분야별 기록은 서버(supabase/ranking.sql rank_stats)가 저장할 때마다 계산·확인한다.

export type CategoryId = 'projects' | 'office' | 'teamwork'

export interface Category {
  id: CategoryId
  name: string
  /** 탭 아래 한 줄 설명(산정 기준) */
  rule: string
  unit: string
  icon: string // officeArt 픽셀 아이콘 이름
}

export const CATEGORIES: Category[] = [
  { id: 'projects', name: '설계왕', rule: '완료한 프로젝트 수 기준', unit: '건', icon: 'i_clip' },
  { id: 'office', name: '사무실 금손', rule: '보유한 가구·기념품 수 기준', unit: '개', icon: 'icon_desk' },
  { id: 'teamwork', name: '탕비실 인싸', rule: '세 동료 팀워크 합계 기준', unit: '점', icon: 'r_lead' },
]

/** 집계 기간(지금은 전체 기간만 지원) */
export const PERIOD_LABEL = '전체 기간'

/** 프로필 사진으로 고를 수 있는 동물(data/animalArt.ts) */
export { ANIMAL_IDS as AVATARS } from './animalArt'

/** 분야별 랭킹 화면 제목 */
export const QUESTIONS: Record<CategoryId, string> = {
  projects: '누가 가장 많이 설계했을까?',
  office: '누구 사무실이 가장 멋질까?',
  teamwork: '누가 동료들과 가장 가까울까?',
}

/** 공통 칭호. 모든 분야에서 같은 칭호를 쓰고, 조건은 앱 기록에서 판단한다 */
export interface Title {
  id: string
  name: string
  how: string
}

export const TITLES: Title[] = [
  { id: 'rookie', name: '신입 아키텍트', how: '처음부터 보유' },
  { id: 'first_project', name: '첫 설계', how: '첫 프로젝트 완료' },
  { id: 'perfect', name: '완벽주의자', how: '프로젝트를 별 3개로 완료' },
  { id: 'ten', name: '의뢰 수집가', how: '서로 다른 프로젝트 10개 완료' },
  { id: 'streak7', name: '꾸준함의 아이콘', how: '7일 연속 학습' },
  { id: 'junior', name: '주니어 아키텍트', how: '주니어로 승급' },
  { id: 'senior', name: '시니어 아키텍트', how: '시니어로 승급' },
  { id: 'all_clear', name: '올 클리어', how: '모든 프로젝트 완료' },
  { id: 'decorator', name: '인테리어 감각', how: '가구 3개 구매' },
  { id: 'team_player', name: '팀의 신뢰', how: '케이·변의주·니콜라스 모두와 "믿음직한 동료"' },
  { id: 'att3', name: '작심삼일 돌파', how: '3일 연속 출석' },
  { id: 'att7', name: '일주일 개근', how: '7일 연속 출석' },
  { id: 'att14', name: '2주 개근러', how: '14일 연속 출석' },
  { id: 'att30', name: '한 달 개근왕', how: '30일 연속 출석' },
]

export const titleName = (id?: string | null) => TITLES.find((t) => t.id === id)?.name ?? ''
