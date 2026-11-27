import { FRIENDS } from './rewards'
import { CHARS } from './characters'

// 사무실 탭: 장면 배치(동료·가구 자리), 가구 상점 품목, 성과 기념품
// 장면은 아이소메트릭 방(scripts/office-room.py가 그린 room.png)이고, 위치는 방 바닥 좌표(x: 오른쪽 벽 방향, y: 왼쪽 벽 방향, z: 높이)다.
// 가구 그림은 같은 스크립트가 만든 src/assets/office/*.png, 기념품 그림은 officeArt.ts(scripts/office-art.py)를 쓴다.

/** 동료 위치(바닥 좌표, 발 위치) */
/** 동료 자리 3개(팀 구성 순서대로 앉음: 원년 멤버는 lead·senior·peer 순) */
export const DESK_SEATS: { x: number; y: number; flip?: boolean }[] = [
  { x: 24, y: 52, flip: true },
  { x: 57, y: 36 },
  { x: 49, y: 57 },
]
export const deskmates = (team: string[]) => team.map((id, i) => ({ id, ...DESK_SEATS[i] }))

/** 항상 있는 가구(구매·교체 대상 아님) */
export const FIXTURES: { art: string; x: number; y: number; z?: number }[] = [{ art: 'desk_fixed', x: 8, y: 38 }]

export type SlotKind = 'furniture' | 'display'

export interface Slot {
  id: string
  name: string
  kind: SlotKind
  /** 바닥 좌표(z는 책상·선반 위 높이) */
  x: number
  y: number
  z?: number
  /** 비워 둘 수 있는 자리 */
  optional?: boolean
  /** 바닥에 깔리는 물건(가장 먼저 그림) */
  floor?: boolean
}

export const SLOTS: Slot[] = [
  { id: 'rug', name: '바닥 러그', kind: 'furniture', x: 34, y: 46, optional: true, floor: true },
  { id: 'shelf', name: '전시 선반', kind: 'furniture', x: 48, y: 5 },
  { id: 'plant', name: '창가 화분', kind: 'furniture', x: 5, y: 70 },
  { id: 'coffee', name: '커피 코너', kind: 'furniture', x: 22, y: 10 },
  { id: 'desk', name: '책상 조명', kind: 'furniture', x: 3, y: 27, z: 15 },
  { id: 'corner', name: '안쪽 코너', kind: 'furniture', x: 6, y: 11, optional: true },
  // 선반 윗면의 기념품 자리(선반 높이 20). 장면에서는 선반을 눌러 고른다
  { id: 'show1', name: '선반 왼쪽', kind: 'display', x: 40, y: 5, z: 20, optional: true },
  { id: 'show2', name: '선반 가운데', kind: 'display', x: 48, y: 5, z: 20, optional: true },
  { id: 'show3', name: '선반 오른쪽', kind: 'display', x: 56, y: 5, z: 20, optional: true },
]

export interface Furniture {
  id: string
  slot: string
  name: string
  price: number // 0 = 기본 제공
  art: string
  desc: string
}

export const FURNITURE: Furniture[] = [
  { id: 'plant_basic', slot: 'plant', name: '기본 화분', price: 0, art: 'plant_basic', desc: '입사 때부터 있던 작은 화분' },
  { id: 'monstera', slot: 'plant', name: '몬스테라', price: 150, art: 'monstera', desc: '라탄 바구니에 담긴 큰 잎 식물' },
  { id: 'olive', slot: 'plant', name: '올리브 나무', price: 250, art: 'olive', desc: '은빛 잎이 차분한 실내 나무' },
  { id: 'palm', slot: 'plant', name: '아레카야자', price: 320, art: 'palm', desc: '창가를 시원하게 채우는 야자' },

  { id: 'lamp_basic', slot: 'desk', name: '기본 스탠드', price: 0, art: 'lamp_basic', desc: '책상마다 있는 흰색 스탠드' },
  { id: 'lamp_brass', slot: 'desk', name: '황동 스탠드', price: 120, art: 'lamp_brass', desc: '야근할 때 눈이 편한 따뜻한 불빛' },
  { id: 'lamp_mint', slot: 'desk', name: '민트 무드등', price: 180, art: 'lamp_mint', desc: '은은하게 빛나는 둥근 무드등' },

  { id: 'coffee_basic', slot: 'coffee', name: '정수기', price: 0, art: 'coffee_basic', desc: '원목 수납장 위의 기본 정수기' },
  { id: 'coffee_capsule', slot: 'coffee', name: '캡슐 커피 머신', price: 200, art: 'coffee_capsule', desc: '버튼 하나로 내리는 커피' },
  { id: 'coffee_tea', slot: 'coffee', name: '티 바', price: 300, art: 'coffee_tea', desc: '찻주전자와 쿠키 접시' },
  { id: 'coffee_espresso', slot: 'coffee', name: '에스프레소 머신', price: 400, art: 'coffee_espresso', desc: '그라인더까지 갖춘 커피 코너' },

  { id: 'rug_navy', slot: 'rug', name: '네이비 러그', price: 150, art: 'rug_navy', desc: '차분한 남색 원형 러그' },
  { id: 'rug_mint', slot: 'rug', name: '민트 줄무늬 러그', price: 200, art: 'rug_mint', desc: '산뜻한 민트 줄무늬' },
  { id: 'rug_check', slot: 'rug', name: '블루 체크 러그', price: 250, art: 'rug_check', desc: '하늘색 체크무늬' },

  { id: 'shelf_basic', slot: 'shelf', name: '기본 수납장', price: 0, art: 'shelf_basic', desc: '기념품을 올려 두는 흰 수납장' },
  { id: 'shelf_wood', slot: 'shelf', name: '원목 책장', price: 300, art: 'shelf_wood', desc: '기술 서적이 꽂힌 낮은 책장' },
  { id: 'shelf_glass', slot: 'shelf', name: '유리 진열장', price: 500, art: 'shelf_glass', desc: '남색 틀의 유리 진열장' },

  { id: 'whiteboard', slot: 'corner', name: '이동식 화이트보드', price: 200, art: 'whiteboard', desc: '구성도를 바로 그려 보는 보드' },
  { id: 'beanbag', slot: 'corner', name: '빈백 소파', price: 300, art: 'beanbag', desc: '잠깐 쉬어 가는 민트 빈백' },
  { id: 'arcade', slot: 'corner', name: '미니 아케이드', price: 800, art: 'arcade', desc: '점심시간 한 판의 즐거움' },
]

export const furniture = (id: string) => FURNITURE.find((f) => f.id === id)

/** 처음 배치 상태 */
export const DEFAULT_PLACED: Record<string, string | null> = {
  rug: null,
  shelf: 'shelf_basic',
  plant: 'plant_basic',
  coffee: 'coffee_basic',
  desk: 'lamp_basic',
  corner: null,
  show1: null,
  show2: null,
  show3: null,
}

export interface Memento {
  id: string
  name: string
  art: string
  /** 받는 조건(화면 표시) */
  how: string
  /** 동료 관계 보상이면 그 동료 id */
  friend?: string
  /** 동료 에피소드 보상이면 그 에피소드 id */
  episode?: string
}

// 받는 조건 판정은 store.ts의 earnedMementos()
export const MEMENTOS: Memento[] = [
  { id: 'm_first', name: '첫 프로젝트 머그', art: 'm_mug', how: '첫 프로젝트 완료' },
  { id: 'm_star', name: '별 세 개 명패', art: 'm_star', how: '프로젝트를 별 3개로 완료' },
  { id: 'm_ten', name: '프로젝트 10건 메달', art: 'm_medal', how: '서로 다른 프로젝트 10개 완료' },
  { id: 'm_streak', name: '7일 연속 달력', art: 'm_cal', how: '7일 연속 학습' },
  { id: 'm_junior', name: '주니어 승급 트로피', art: 'm_silver', how: '주니어 아키텍트로 승급' },
  { id: 'm_senior', name: '시니어 승급 트로피', art: 'm_gold', how: '시니어 아키텍트로 승급' },
  { id: 'm_all', name: '올 클리어 황금 구름', art: 'm_cloud', how: '모든 프로젝트 완료' },
  { id: 'r_lead', name: '케이의 핸드드립 세트', art: 'r_lead', how: '케이와 "믿음직한 동료" 달성', friend: 'lead' },
  { id: 'r_senior', name: '다육이 "오로라"의 새끼 화분', art: 'r_senior', how: '변의주와 "믿음직한 동료" 달성', friend: 'senior' },
  { id: 'r_peer', name: '멀티 AZ 덤벨 세트', art: 'r_peer', how: '니콜라스와 "믿음직한 동료" 달성', friend: 'peer' },
  { id: 'team_photo', name: '팀 사진 액자', art: 'team_photo', how: '케이·변의주·니콜라스 모두와 "믿음직한 동료" 달성' },
]

// 동료 에피소드 보상(끝까지 본 에피소드마다 하나). 받는 조건 판정은 store.ts earnedMementos()
for (const f of FRIENDS)
  for (const e of f.episodes)
    MEMENTOS.push({ id: e.reward.id, name: e.reward.name, art: e.reward.art, how: `${CHARS[f.id].name} 에피소드 「${e.title}」 완료`, friend: f.id, episode: e.id })

export const memento = (id: string) => MEMENTOS.find((m) => m.id === id)

/** 관계 보상에 쓰는 팀워크 단계(믿음직한 동료) */
export const RELATION_PROP_NEED = 150
