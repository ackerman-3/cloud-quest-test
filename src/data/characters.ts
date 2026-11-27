import type { Look } from '../pixel'

export interface CharCfg extends Look {
  name: string
  role: string
}

const S = { a: '#f7d7bd', b: '#efc19d', c: '#d6a07a', d: '#b07a55' }

export const CHARS: Record<string, CharCfg> = {
  boan: { name: '차보안', role: '클라우드사업팀 팀장', skin: '#f5d8c3', hair: '#392d2c', hairStyle: 'bob', eye: '#655653', top: '#f4eee3', jacket: '#384c65', bottom: '#333b48', shoes: '#292a31', small: true, watch: '#a89774' },
  server: { name: '한서버', role: '클라우드 아키텍트(선배)', skin: S.b, hair: '#302c2a', hairStyle: 'swept', eye: '#665b52', top: '#d6e7f1', jacket: '#8b9396', bottom: '#404b59', shoes: '#4d4139', shirt: true, small: true, glasses: '#6f777c', softGlasses: true },
  coding: { name: '이코딩', role: '입사 동기', skin: '#f7ddca', hair: '#80563e', hairStyle: 'pony', eye: '#75604e', top: '#a9c6ac', bottom: '#46505a', shoes: '#eee8dc', small: true, badge: '#ddd3ae' },
  lead: { name: '케이', role: '클라우드사업팀 팀장', skin: '#f8e0d0', hair: '#2a2326', hairStyle: 'shag', eye: '#55505a', top: '#b9d8f2', bottom: '#30343f', shoes: '#1d1d22', sharp: true, roundFace: true, small: true, shirt: true },
  senior: { name: '변의주', role: '클라우드 아키텍트(선배)', skin: S.b, hair: '#5b3a28', hairStyle: 'side', eye: '#24232a', top: '#cfe0f2', jacket: '#7d8794', bottom: '#3c4352', shoes: '#4a3428', sharp: true, roundFace: true, small: true },
  peer: { name: '니콜라스', role: '입사 동기', skin: '#fbe5d8', hair: '#f0a3bd', hairStyle: 'shag', eye: '#5b4e52', top: '#ececee', jacket: '#1f2026', bottom: '#26272d', shoes: '#18181c', earring: true, chain: true, print: true, sharp: true, roundFace: true, small: true },
  // 팀장 자리 교체 인물
  bahee: { name: '리바희', role: '클라우드사업팀 팀장', skin: '#f8e8de', hair: '#17151a', hairStyle: 'curtain', eye: '#4a3028', top: '#8796ab', shirt: true, rolled: true, watch: '#141416', mug: '#26272c', bottom: '#2b2e36', shoes: '#1c1c20', sharp: true, roundFace: true, small: true },
  // 선배 자리 교체 인물
  jiae: { name: '한지애', role: '연구개발 리더(선배)', skin: '#f4d8c2', hair: '#5a2e22', hairStyle: 'lowpony', eye: '#b06a22', top: '#f3ead8', jacket: '#1f5c5a', bottom: '#3a3f4a', shoes: '#4a3428', glasses: '#7d8248', softGlasses: true, smirk: true, small: true },
  // 동기 자리 교체 인물
  yeager: { name: '이예거', role: '입사 동기', skin: '#f2d2b8', hair: '#4a2c20', hairStyle: 'messy', eye: '#1f7f7a', top: '#f3ede0', jacket: '#c0603e', rolled: true, watch: '#141416', bottom: '#3a3c42', shoes: '#26262a', sharp: true, roundFace: true, small: true },
  flower: { name: '김봄', role: '플로라 꽃방 대표', skin: S.a, hair: '#b0552e', hairStyle: 'long', eye: '#7a5b3a', top: '#f6eedf', jacket: '#7aa56d', bottom: '#5b5e66', shoes: '#6a4a35', blush: true },
  publisher: { name: '남궁준', role: '한빛나래출판 마케팅팀장', skin: S.b, hair: '#9a9ca2', hairStyle: 'side', eye: '#4c5566', top: '#f2efe6', jacket: '#7b5a3e', tie: '#a63c3c', bottom: '#3f3a35', shoes: '#2d2522', glasses: '#6b4a2a' },
  fashion: { name: '윤다은', role: '무드웨어 CTO', skin: S.a, hair: '#1f1d26', hairStyle: 'short-f', eye: '#3e3a4a', top: '#2c2c35', jacket: '#d9d4cc', bottom: '#2c2c35', shoes: '#f0f0f0', earring: true },
  settle: { name: '정민호', role: '대성물산 전산팀 과장', skin: S.c, hair: '#222222', hairStyle: 'buzz', eye: '#3b3b3b', top: '#eef2f6', tie: '#2f4f7f', bottom: '#2f3748', shoes: '#1c1c1c', badge: '#c43b3b' },
  ticket: { name: '서유나', role: '스테이지원 개발팀장', skin: S.a, hair: '#9a6a46', hairStyle: 'bob', eye: '#3d2f2a', top: '#f7f7f9', jacket: '#2a3142', bottom: '#2a3142', skirt: true, legs: '#e9cbb7', shoes: '#141418', earring: true, lips: '#c4687a', badge: '#2a3142' },
  city: { name: '최정우', role: '해솔시청 정보화담당관실 주무관', skin: S.b, hair: '#24232b', hairStyle: 'twoblock', eye: '#3d4652', top: '#ffffff', jacket: '#3f5470', tie: '#26364f', bottom: '#2c3440', shoes: '#1d1d1d', badge: '#2a7d4f', sharp: true },
  survey: { name: '배지후', role: '폼잇 공동창업자', skin: S.a, hair: '#e3b862', hairStyle: 'swept', eye: '#4f87b8', top: '#f2f2f2', jacket: '#2f6e5f', hoodie: true, bottom: '#5b6470', shoes: '#e4e4e4', sharp: true },
  design: { name: '한소율', role: '스튜디오 오르 실장', skin: S.a, hair: '#3a2a22', hairStyle: 'braid', eye: '#5c4636', top: '#d9c4a6', bottom: '#3b3b3b', skirt: true, legs: '#2b2b2f', shoes: '#2b2b2b', earring: true, lips: '#c4687a', blush: true, small: true },
  commerce: { name: '임태준', role: '바로마켓 플랫폼실장', skin: S.d, hair: '#1b1b1b', hairStyle: 'curly', eye: '#3a2a20', top: '#dfe9f3', jacket: '#2e3c54', bottom: '#2e3c54', shoes: '#151515', beard: true },
  bank: { name: '노은서', role: '새빛저축은행 정보보호팀장', skin: S.a, hair: '#26242e', hairStyle: 'long', eye: '#3f4656', top: '#f7f7f7', jacket: '#34343e', bottom: '#34343e', skirt: true, legs: '#3a3a44', shoes: '#191919' },
  edu: { name: '문재현', role: '런업에듀 인프라 리드', skin: S.b, hair: '#3a2620', hairStyle: 'swept', eye: '#5a3e2e', top: '#f4f1ea', jacket: '#b8643a', bottom: '#2f3540', shoes: '#3c2b20', sharp: true },
}

// 추가 프로젝트 고객: 기존 외형을 재사용하고 이름·역할만 다르게
const reuse = (from: string, name: string, role: string): CharCfg => ({ ...CHARS[from], name, role })
Object.assign(CHARS, {
  cafe: reuse('flower', '정하린', '카페 하린 사장'),
  photo: reuse('survey', '송태오', '스냅로그 개발자'),
  gym: reuse('settle', '권도형', '핏앤런 운영팀장'),
  shop2: reuse('ticket', '김나연', '데일리박스 백엔드 리드'),
  game: reuse('edu', '류현승', '픽셀아레나 데이터 엔지니어'),
  media: { name: '오지수', role: '웹진 플랫 편집 플랫폼 담당', skin: S.a, hair: '#7a4a32', hairStyle: 'pony', eye: '#4a3a30', top: '#ffffff', jacket: '#9db7d8', bottom: '#4a5468', skirt: true, legs: '#e9cbb7', shoes: '#2b2b2b', glasses: '#a07a5a', lips: '#c4687a', blush: true, small: true },
  app: reuse('fashion', '양서윤', '헬시핏 앱 PM'),
  insure: reuse('publisher', '박종석', '한결손해보험 IT기획 부장'),
  group: reuse('city', '서진혁', '그린에너지그룹 클라우드 CoE 리드'),
  delivery: reuse('commerce', '장민재', '빠른식탁 플랫폼 CTO'),
})


// SAA 확장 프로젝트 고객 (기존 외형에 머리색·옷색을 바꿔 구분)
const look = (from: string, name: string, role: string, o: Partial<CharCfg>): CharCfg => ({ ...CHARS[from], ...o, name, role })
Object.assign(CHARS, {
  estate: look('settle', '황보석', '집값노트 서비스개발팀장', { hair: '#4a3b30', top: '#f3efe4', tie: '#6b8e4e', badge: '#6b8e4e' }),
  scooter: look('survey', '윤채원', '씽씽킥 데이터 플랫폼 리드', { hair: '#2e2a33', jacket: '#2f9e8f', top: '#ffffff' }),
  codelab: look('edu', '강도윤', '코드랩 CTO', { hair: '#6d4c3d', jacket: '#3b4a6b', top: '#e9eef5' }),
  clinic: look('bank', '서미경', '온누리내과 원무·전산 실장', { hair: '#5a3a2e', jacket: '#ffffff', top: '#cfe6ef', bottom: '#5a6b7b', legs: '#e9cbb7' }),
  studio: look('design', '이루다', '무빙컷 스튜디오 기술감독', { hair: '#b2563a', top: '#2f2f38', bottom: '#2f2f38' }),
  glowup: look('fashion', '최아린', '글로우업 글로벌 플랫폼 리드', { hair: '#8a5a44', jacket: '#f4c6d0', top: '#ffffff', bottom: '#4a4a55' }),
  battle: look('commerce', '도건우', '배틀로드 서버 디렉터', { hair: '#3b2f6b', jacket: '#1f1f2a', top: '#d63c4e', bottom: '#1f1f2a' }),
  paybridge: look('city', '한지훈', '페이브릿지 보안 아키텍트', { hair: '#1f2a33', jacket: '#24413a', tie: '#c9a646', badge: '#c9a646' }),
  precision: look('publisher', '조병철', '대한정밀 정보시스템 부장', { hair: '#cfcfd4', jacket: '#4b5563', tie: '#1f4f8f' }),
  coupon: look('ticket', '민예린', '쿠폰다모아 백엔드 팀장', { hair: '#d08a3c', jacket: '#7a3cc4', bottom: '#2a2a35' }),
})
Object.assign(CHARS, {
  bakery: look('flower', '오유진', '밀가루공방 사장', { hair: '#3b2a24', jacket: '#e8c58f', top: '#fff8ec' }),
  wedding: look('design', '백하은', '스튜디오 화이트데이 실장', { hair: '#d9b07a', top: '#f3e9f1', bottom: '#6b5a70' }),
  mall: look('survey', '정태민', '모아몰 개발팀장', { hair: '#2a2a2a', jacket: '#3c6fb4', top: '#f2f2f2' }),
  academy: look('city', '문서현', '한빛어학원 전산 담당', { hair: '#5a3b2c', jacket: '#7a4b8f', tie: '#c9a646' }),
  logistics: look('settle', '나준혁', '한결물류 IT 팀장', { hair: '#3a3a3a', top: '#e9f0e6', tie: '#3a7d44', badge: '#3a7d44' }),
})

export const ME = { name: '나', role: '신입 아키텍트' }

// 사무실 동료(교체 가능 멤버, 2026-11-27): 남 2(오준서·강태풍) · 여 3(한여름·도하나·최고은)
Object.assign(CHARS, {
})
