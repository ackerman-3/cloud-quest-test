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
  { id: 'projects', name: '납품왕', rule: '완료한 프로젝트 수 기준', unit: '건', icon: 'i_clip' },
  { id: 'office', name: '사무실 금손', rule: '보유한 가구·기념품 수 기준', unit: '개', icon: 'icon_desk' },
  { id: 'teamwork', name: '탕비실 인싸', rule: '세 동료 팀워크 합계 기준', unit: '점', icon: 'r_lead' },
]

/** 집계 기간(지금은 전체 기간만 지원) */
export const PERIOD_LABEL = '전체 기간'

/** 프로필 이미지로 고를 수 있는 픽셀 아이콘(사람 얼굴 없이) */
export const AVATARS = ['i_laptop', 'i_cloud', 'i_server', 'i_stack', 'i_book', 'i_chart', 'i_search', 'i_lock', 'm_mug', 'm_star', 'm_medal', 'r_senior'] as const

/** 공통 칭호. 모든 분야에서 같은 칭호를 쓰고, 조건은 앱 기록에서 판단한다 */
export interface Title {
  id: string
  name: string
  how: string
}

export const TITLES: Title[] = [
  { id: 'rookie', name: '신입 아키텍트', how: '처음부터 보유' },
  { id: 'first_project', name: '첫 납품', how: '첫 프로젝트 완료' },
  { id: 'perfect', name: '완벽주의자', how: '프로젝트를 별 3개로 완료' },
  { id: 'ten', name: '의뢰 수집가', how: '서로 다른 프로젝트 10개 완료' },
  { id: 'streak7', name: '꾸준함의 아이콘', how: '7일 연속 학습' },
  { id: 'junior', name: '주니어 아키텍트', how: '주니어로 승급' },
  { id: 'senior', name: '시니어 아키텍트', how: '시니어로 승급' },
  { id: 'all_clear', name: '올 클리어', how: '모든 프로젝트 완료' },
  { id: 'decorator', name: '인테리어 감각', how: '가구 3개 구매' },
  { id: 'team_player', name: '팀의 신뢰', how: '세 동료 모두와 "믿음직한 동료"' },
]

export const titleName = (id?: string | null) => TITLES.find((t) => t.id === id)?.name ?? ''
