// 코드로 그리는 픽셀 캐릭터 (24 x 38 격자, 큰 머리 비율)
export type Hair =
  | 'messy' // 부스스한 짧은 머리
  | 'side' // 옆가르마
  | 'curtain' // 가운데 가르마, 눈썹까지 내려오는 둥근 앞머리
  | 'lowpony' // 낮게 묶은 곱슬머리 + 잔머리
  | 'slick' // 넘긴 머리
  | 'buzz' // 짧게 민 머리
  | 'curly' // 곱슬
  | 'bob' // 단발
  | 'long' // 긴 생머리
  | 'pony' // 포니테일
  | 'bun' // 올림머리
  | 'short-f' // 숏컷(여)
  | 'perm' // 짧은 파마
  | 'swept' // 한쪽으로 쓸어 넘긴 앞머리(남)
  | 'twoblock' // 투블럭(옆은 짧고 윗머리 볼륨)
  | 'braid' // 한쪽으로 땋아 어깨 앞으로 내린 머리
  | 'shag' // 눈썹을 덮는 앞머리, 옆은 턱까지, 뒷머리가 목을 덮는 울프컷

export interface Look {
  skin: string
  hair: string
  hairStyle: Hair
  eye: string
  top: string // 안쪽 상의
  jacket?: string // 겉옷(열린 재킷·가디건 등)
  hoodie?: boolean // 겉옷이 후드
  tie?: string
  bottom: string
  skirt?: boolean
  legs?: string // 치마일 때 다리(스타킹) 색
  shoes: string
  glasses?: string // 안경테 색
  beard?: boolean
  badge?: string // 목걸이 사원증 줄 색
  earring?: boolean
  headset?: boolean
  blush?: boolean
  sharp?: boolean // 갸름한 턱선과 날렵한 눈매
  roundFace?: boolean // 눈매는 유지하고 볼·턱은 기본 얼굴형 사용
  small?: boolean // 작은 얼굴(모델 비율)
  shirt?: boolean // 깃 있는 셔츠(겉옷 없을 때)
  chain?: boolean // 은색 목걸이
  print?: boolean // 그래픽 티셔츠 프린트
  lips?: string // 입술 색
  rolled?: boolean // 소매를 걷어 올린 셔츠
  watch?: string // 왼손목 시계 색
  mug?: string // 오른손에 든 머그컵 색
  tired?: boolean // 옅은 다크서클
  brow?: boolean // 한쪽 눈썹을 살짝 올린 표정
  narrow?: boolean // 가늘고 긴 눈
  smirk?: boolean // 한쪽 입꼬리가 올라간 미소
  softGlasses?: boolean // 얇은 반투명 둥근 사각 안경테
}

export const W = 24
export const H = 38

const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
/** amt>0 밝게, amt<0 어둡게(약간 붉은 기를 섞어 따뜻한 그림자) */
export function tone(c: string, amt: number) {
  const [r, g, b] = hex(c)
  if (amt >= 0) return toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt * 0.9)
  const k = 1 + amt
  return toHex(r * k + 10 * -amt, g * k * 0.96, b * k * 1.02 + 8 * -amt)
}

type Grid = (string | null)[][]
type Part = 'hair' | 'skin' | 'cloth' | 'shoe' | 'face' | 'acc'

export function drawLook(c: Look, blink = false, talk = false): Grid {
  const g: Grid = Array.from({ length: H }, () => Array(W).fill(null))
  const p: (Part | null)[][] = Array.from({ length: H }, () => Array(W).fill(null))
  const set = (x: number, y: number, col: string, part: Part) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    g[y][x] = col
    p[y][x] = part
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, col: string, part: Part) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, col, part)
  }
  const del = (x: number, y: number) => {
    if (g[y]?.[x] !== undefined) {
      g[y][x] = null
      p[y][x] = null
    }
  }
  // 3단 명암으로 채우기: 왼쪽 밝게, 오른쪽 어둡게
  const shaded = (x0: number, y0: number, x1: number, y1: number, base: string, part: Part, lightTo = x0, darkFrom = x1) => {
    const L = tone(base, 0.18)
    const D = tone(base, -0.28)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) set(x, y, x <= lightTo ? L : x >= darkFrom ? D : base, part)
  }

  const [hr, hg, hb] = hex(c.hair)
  // 검은 머리는 회색 대신 푸른빛 하이라이트
  const hairL = hr + hg + hb < 150 ? toHex(hr + 34, hg + 42, hb + 70) : tone(c.hair, 0.25)
  const hairD = tone(c.hair, -0.3)
  const skinD = tone(c.skin, -0.16)
  const longHair = c.hairStyle === 'long'
  const fs = c.small ? 1 : 0
  const FL = 6 + fs
  const FR = 17 - fs
  const FB = 15 - fs

  // ── 뒤로 늘어진 머리 ──
  if (longHair) {
    shaded(4, 8, 19, 23, c.hair, 'hair', 4, 18)
  }
  if (c.hairStyle === 'pony') {
    shaded(17, 7, 20, 10, c.hair, 'hair', 17, 20)
    shaded(18, 11, 21, 17, c.hair, 'hair', 18, 21)
    set(20, 18, hairD, 'hair')
  }
  if (c.hairStyle === 'lowpony') {
    // 목 뒤로 낮게 묶어 한쪽 어깨 앞으로 넘어온 곱슬 꼬리
    shaded(17, 12, 19, 14, c.hair, 'hair', 17, 19)
    shaded(18, 15, 20, 19, c.hair, 'hair', 18, 20)
    set(19, 20, hairD, 'hair')
    for (const [x, y] of [
      [20, 15],
      [18, 17],
      [20, 18],
    ])
      set(x, y, hairL, 'hair')
  }
  if (c.hairStyle === 'bun') {
    shaded(9, 0, 14, 2, c.hair, 'hair', 9, 14)
    del(9, 0)
    del(14, 0)
  }
  if (c.hairStyle === 'bob') shaded(4, 7, 19, 16, c.hair, 'hair', 4, 18)
  if (c.hairStyle === 'shag') {
    // 목을 덮는 뒷머리
    shaded(FL + 1, 12, FR - 1, 17, c.hair, 'hair', FL + 1, FR - 2)
  }

  // ── 다리·신발 ──
  if (c.skirt) {
    shaded(6, 27, 17, 31, c.bottom, 'cloth', 7, 15)
    del(6, 31)
    del(17, 31)
    const legs = c.legs ?? c.skin
    rect(7, 32, 9, 34, legs, 'skin')
    rect(14, 32, 16, 34, tone(legs, -0.12), 'skin')
    rect(7, 35, 10, 36, c.shoes, 'shoe')
    rect(13, 35, 16, 36, tone(c.shoes, -0.2), 'shoe')
  } else {
    shaded(7, 27, 16, 34, c.bottom, 'cloth', 8, 14)
    for (let y = 30; y <= 34; y++) {
      del(11, y)
      del(12, y)
    }
    rect(6, 35, 10, 36, c.shoes, 'shoe')
    rect(13, 35, 17, 36, tone(c.shoes, -0.2), 'shoe')
    set(6, 35, tone(c.shoes, 0.25), 'shoe')
  }

  // ── 몸통 ──
  const outer = c.jacket ?? c.top
  shaded(6, 17, 17, 27, outer, 'cloth', 7, 15)
  del(6, 17)
  del(17, 17)
  if (c.jacket) {
    // 안쪽 상의(열린 겉옷 사이)
    shaded(9, 17, 14, 26, c.top, 'cloth', 9, 14)
    // 라펠·여밈 그림자
    for (let y = 17; y <= 26; y++) {
      set(8, y, tone(c.jacket, -0.32), 'cloth')
      set(15, y, tone(c.jacket, -0.38), 'cloth')
    }
    set(9, 17, tone(c.jacket, 0.1), 'cloth')
    set(14, 17, tone(c.jacket, -0.1), 'cloth')
    if (c.hoodie) {
      // 후드 끈과 뒤쪽 후드
      rect(8, 16, 15, 16, tone(c.jacket, -0.15), 'cloth')
      set(10, 19, '#e8e8e8', 'acc')
      set(10, 20, '#e8e8e8', 'acc')
      set(13, 19, '#e8e8e8', 'acc')
      set(13, 20, '#e8e8e8', 'acc')
    }
  } else {
    if (c.shirt) {
      // 셔츠 깃과 단추선
      const hi = tone(c.top, 0.45)
      set(9, 17, hi, 'cloth')
      set(10, 17, hi, 'cloth')
      set(10, 18, hi, 'cloth')
      set(14, 17, tone(c.top, 0.2), 'cloth')
      set(13, 17, tone(c.top, 0.2), 'cloth')
      set(13, 18, tone(c.top, 0.2), 'cloth')
      set(11, 17, tone(c.top, -0.35), 'cloth')
      set(12, 17, tone(c.top, -0.35), 'cloth')
      for (let y = 19; y <= 26; y++) set(12, y, tone(c.top, -0.15), 'cloth')
      for (const y of [20, 23]) set(12, y, '#ffffff', 'acc')
    } else rect(10, 17, 13, 17, tone(c.top, -0.3), 'cloth')
  }
  if (c.print) {
    rect(10, 20, 13, 24, '#3a3a40', 'acc')
    rect(11, 21, 12, 22, '#bdbdc4', 'acc')
    set(10, 24, '#5a5a62', 'acc')
    set(13, 20, '#5a5a62', 'acc')
  }
  if (c.chain) {
    for (const [x, y] of [
      [9, 17],
      [10, 18],
      [11, 19],
      [12, 19],
      [13, 18],
      [14, 17],
    ])
      set(x, y, '#d3d6dd', 'acc')
  }
  if (c.tie) {
    rect(11, 18, 12, 24, c.tie, 'acc')
    set(12, 18, tone(c.tie, -0.25), 'acc')
    set(11, 25, tone(c.tie, -0.2), 'acc')
  }
  if (c.badge) {
    for (let y = 17; y <= 21; y++) {
      set(9 + Math.floor((y - 17) / 2), y, c.badge, 'acc')
      set(14 - Math.floor((y - 17) / 2), y, c.badge, 'acc')
    }
    rect(10, 22, 13, 24, '#f4f6f8', 'acc')
    rect(11, 23, 12, 23, '#5b8fd6', 'acc')
  }
  // 허리선
  if (!c.skirt) rect(7, 27, 16, 27, tone(c.bottom, -0.35), 'cloth')

  // ── 팔·손 ──
  shaded(4, 18, 5, 26, outer, 'cloth', 4, 5)
  shaded(18, 18, 19, 26, outer, 'cloth', 18, 19)
  del(4, 18)
  del(19, 18)
  for (let y = 19; y <= 26; y++) {
    set(6, y, tone(outer, -0.3), 'cloth')
    set(17, y, tone(outer, -0.45), 'cloth')
  }
  rect(4, 27, 5, 28, c.skin, 'skin')
  rect(18, 27, 19, 28, skinD, 'skin')
  set(4, 28, skinD, 'skin')
  if (c.rolled) {
    // 걷어 올린 소매: 접힌 단 + 드러난 팔뚝
    rect(4, 23, 5, 23, tone(outer, 0.25), 'cloth')
    rect(18, 23, 19, 23, tone(outer, 0.1), 'cloth')
    rect(4, 24, 5, 26, c.skin, 'skin')
    rect(18, 24, 19, 26, skinD, 'skin')
    set(5, 24, skinD, 'skin')
  }
  if (c.watch) {
    rect(4, 26, 5, 26, c.watch, 'acc')
    set(5, 26, tone(c.watch, 0.4), 'acc')
  }
  if (c.mug) {
    // 오른손에 든 작은 머그
    rect(19, 25, 21, 28, c.mug, 'acc')
    rect(19, 25, 21, 25, tone(c.mug, 0.55), 'acc')
    for (let y = 26; y <= 28; y++) set(19, y, tone(c.mug, 0.25), 'acc')
    set(22, 26, tone(c.mug, 0.2), 'acc')
    set(22, 27, tone(c.mug, 0.2), 'acc')
  }

  // ── 목 ──
  rect(10, 15, 13, 16, skinD, 'skin')

  // ── 얼굴 ──
  rect(FL, 4, FR, FB, c.skin, 'skin')
  for (const [x, y] of [
    [FL, 4],
    [FR, 4],
    [FL, FB],
    [FR, FB],
    [FL + 1, FB],
    [FR - 1, FB],
  ])
    del(x, y)
  rect(FR - 1, 9, FR, FB - 1, skinD, 'skin')
  set(FR - 2, FB - 1, skinD, 'skin')
  // 귀
  set(FL - 1, 10, c.skin, 'skin')
  set(FL - 1, 11, skinD, 'skin')
  set(FR + 1, 10, skinD, 'skin')
  set(FR + 1, 11, skinD, 'skin')
  if (c.earring) {
    const ec = c.chain ? '#d3d6dd' : '#f2d16b'
    set(FL - 1, 13, ec, 'acc')
    set(FR + 1, 13, tone(ec, -0.15), 'acc')
  }

  // 가운데 가르마 앞머리(눈썹을 덮으므로 이목구비를 그린 뒤 한 번 더 그린다)
  const curtainBangs = () => {
    // 2:8 가르마: 왼쪽은 짧게, 오른쪽으로 대부분 사선으로 넘어가 오른쪽 눈썹을 덮음
    rect(FL, 7, 8, 7, c.hair, 'hair')
    set(FL, 8, hairD, 'hair')
    rect(11, 7, FR, 7, c.hair, 'hair')
    rect(12, 8, FR, 8, c.hair, 'hair')
    rect(14, 9, FR, 9, c.hair, 'hair')
    set(11, 8, hairD, 'hair')
    set(13, 9, hairD, 'hair')
    set(FR, 10, hairD, 'hair')
  }


  // ── 앞머리·윗머리 ──
  const cap = () => {
    shaded(6 + fs, 1, 17 - fs, 4, c.hair, 'hair', 7 + fs, 16 - fs)
    shaded(5 + fs, 3, 18 - fs, 6, c.hair, 'hair', 6 + fs, 17 - fs)
    del(6 + fs, 1)
    del(17 - fs, 1)
  }
  switch (c.hairStyle) {
    case 'messy':
      cap()
      for (const x of [6, 9, 12, 15]) set(x, 0, c.hair, 'hair')
      set(4, 4, c.hair, 'hair')
      set(19, 5, c.hair, 'hair')
      rect(6, 7, 9, 7, c.hair, 'hair')
      rect(12, 7, 17, 7, c.hair, 'hair')
      set(7, 8, c.hair, 'hair')
      set(13, 8, c.hair, 'hair')
      set(16, 8, c.hair, 'hair')
      rect(5, 7, 5, 10, hairD, 'hair')
      rect(18, 7, 18, 9, hairD, 'hair')
      break
    case 'side':
      cap()
      rect(FL, 7, 11, 7, c.hair, 'hair')
      rect(FL, 8, 8, 8, c.hair, 'hair')
      rect(FR - 1, 7, FR, 8, hairD, 'hair')
      rect(FL - 1, 7, FL - 1, 9, hairD, 'hair')
      rect(FR + 1, 7, FR + 1, 9, hairD, 'hair')
      break
    case 'slick':
      shaded(6, 1, 17, 5, c.hair, 'hair', 8, 15)
      shaded(5, 3, 18, 6, c.hair, 'hair', 6, 17)
      del(6, 1)
      del(17, 1)
      rect(5, 7, 5, 9, hairD, 'hair')
      rect(18, 7, 18, 9, hairD, 'hair')
      break
    case 'buzz':
      shaded(6, 2, 17, 5, c.hair, 'hair', 7, 16)
      del(6, 2)
      del(17, 2)
      rect(5, 4, 5, 8, hairD, 'hair')
      rect(18, 4, 18, 8, hairD, 'hair')
      break
    case 'curly':
      cap()
      for (let x = 5; x <= 18; x += 2) {
        set(x, 0, c.hair, 'hair')
        set(x + 1, 7, c.hair, 'hair')
      }
      rect(4, 3, 4, 9, c.hair, 'hair')
      rect(19, 3, 19, 9, hairD, 'hair')
      rect(5, 7, 5, 10, hairD, 'hair')
      rect(18, 7, 18, 10, hairD, 'hair')
      break
    case 'short-f':
      cap()
      rect(6, 7, 12, 7, c.hair, 'hair')
      rect(6, 8, 9, 8, c.hair, 'hair')
      rect(4, 5, 5, 12, c.hair, 'hair')
      rect(18, 5, 19, 12, hairD, 'hair')
      break
    case 'perm':
      cap()
      for (let x = 4; x <= 19; x += 2) set(x, 1, c.hair, 'hair')
      rect(3, 4, 5, 13, c.hair, 'hair')
      rect(18, 4, 20, 13, hairD, 'hair')
      rect(6, 7, 17, 7, c.hair, 'hair')
      for (let y = 5; y <= 13; y += 2) {
        set(3, y, hairL, 'hair')
        set(20, y, tone(c.hair, -0.45), 'hair')
      }
      break
    case 'swept':
      cap()
      for (const x of [7, 10, 13]) set(x, 0, c.hair, 'hair')
      // 이마를 사선으로 덮는 앞머리
      rect(FL, 7, 13, 7, c.hair, 'hair')
      rect(10, 8, 12, 8, c.hair, 'hair')
      set(11, 9, hairD, 'hair')
      rect(FR - 1, 7, FR, 8, hairD, 'hair')
      rect(FL - 1, 7, FL - 1, 10, hairD, 'hair')
      rect(FR + 1, 7, FR + 1, 10, hairD, 'hair')
      set(FL - 2, 5, c.hair, 'hair')
      set(FR + 2, 4, hairD, 'hair')
      break
    case 'braid':
      cap()
      // 한쪽으로 넘긴 앞머리
      rect(FL, 7, 12, 7, c.hair, 'hair')
      rect(FL, 8, 9, 8, c.hair, 'hair')
      rect(FL - 1, 5, FL - 1, 10, c.hair, 'hair')
      rect(FR, 7, FR + 1, 12, hairD, 'hair')
      // 어깨 앞으로 내려온 땋은 머리(블라우스 쪽으로 곡선)
      for (let y = 12; y <= 25; y++) {
        const x = y <= 14 ? FR - 1 : y <= 17 ? FR - 2 : FR - 3
        const k = (y - 12) % 3
        set(x, y, k === 0 ? hairL : c.hair, 'hair')
        set(x + 1, y, k === 1 ? hairL : k === 2 ? c.hair : hairD, 'hair')
      }
      rect(FR - 3, 26, FR - 2, 26, '#c9c2d6', 'acc')
      set(FR - 3, 27, c.hair, 'hair')
      set(FR - 2, 27, hairD, 'hair')
      break
    case 'shag':
      cap()
      set(FL - 1, 4, c.hair, 'hair')
      set(FR + 1, 4, hairD, 'hair')
      // 눈썹까지 내려오는 앞머리(사이로 이마가 살짝 보임)
      rect(FL, 7, FR, 8, c.hair, 'hair')
      set(10, 8, c.skin, 'skin')
      set(13, 8, tone(c.skin, -0.06), 'skin')
      set(11, 9, c.hair, 'hair')
      set(12, 9, hairD, 'hair')
      // 왼쪽 옆머리는 볼을 살짝 덮음
      rect(FL - 1, 6, FL - 1, 12, c.hair, 'hair')
      rect(FL, 6, FL, 9, c.hair, 'hair')
      // 오른쪽은 귀 뒤로 넘김
      rect(FR, 6, FR, 8, hairD, 'hair')
      rect(FR + 1, 6, FR + 1, 9, hairD, 'hair')
      set(FR + 1, 12, hairD, 'hair')
      break
    case 'curtain':
      cap()
      // 둥근 윗머리 + 왼쪽으로 치우친 가르마(2:8)
      for (let y = 2; y <= 5; y++) set(9, y, hairD, 'hair')
      set(9, 6, hairD, 'hair')
      set(8, 6, hairD, 'hair')
      set(10, 6, c.hair, 'hair')
      curtainBangs()
      // 귀를 살짝 덮는 옆머리
      rect(FL - 1, 6, FL - 1, 11, hairD, 'hair')
      rect(FR + 1, 6, FR + 1, 11, hairD, 'hair')
      break
    case 'lowpony':
      cap()
      // 곱슬한 윗머리 결
      set(9, 0, c.hair, 'hair')
      set(14, 0, hairD, 'hair')
      set(4 + fs, 4, c.hair, 'hair')
      set(19 - fs, 4, hairD, 'hair')
      // 옆으로 넘긴 앞머리(이마가 보임)
      rect(FL, 7, 9, 7, c.hair, 'hair')
      rect(15, 7, FR, 7, c.hair, 'hair')
      set(FL, 8, c.hair, 'hair')
      set(FR, 8, hairD, 'hair')
      // 관자놀이·볼 옆으로 빠진 잔머리
      rect(FL - 1, 6, FL - 1, 9, c.hair, 'hair')
      set(FL - 1, 11, c.hair, 'hair')
      set(FL - 2, 12, hairL, 'hair')
      rect(FR + 1, 6, FR + 1, 9, hairD, 'hair')
      set(FR + 1, 11, hairD, 'hair')
      set(FR + 2, 12, hairD, 'hair')
      break
    case 'twoblock':
      shaded(6, 0, 17, 4, c.hair, 'hair', 8, 15)
      shaded(5, 2, 18, 5, c.hair, 'hair', 6, 17)
      del(6, 0)
      del(17, 0)
      rect(6, 6, 9, 6, c.hair, 'hair')
      rect(13, 6, 17, 6, c.hair, 'hair')
      set(14, 7, c.hair, 'hair')
      rect(5, 6, 5, 9, tone(c.hair, -0.5), 'hair')
      rect(18, 6, 18, 9, tone(c.hair, -0.5), 'hair')
      break
    case 'bob':
    case 'long':
    case 'pony':
    case 'bun':
      cap()
      rect(6, 7, 11, 7, c.hair, 'hair')
      rect(14, 7, 17, 7, c.hair, 'hair')
      set(6, 8, c.hair, 'hair')
      set(17, 8, c.hair, 'hair')
      rect(4, 5, 5, c.hairStyle === 'bob' ? 15 : c.hairStyle === 'long' ? 22 : 11, c.hair, 'hair')
      rect(18, 5, 19, c.hairStyle === 'bob' ? 15 : c.hairStyle === 'long' ? 22 : 11, hairD, 'hair')
      break
  }
  // 머리 결(어두운 가닥)
  for (const [x, y] of [
    [15, 3],
    [16, 4],
    [16, 5],
    [10, 5],
    [11, 6],
  ])
    if (p[y]?.[x] === 'hair' && c.hairStyle !== 'buzz') g[y][x] = hairD
  // 머리 하이라이트(왼쪽 위 곡선)
  for (const [x, y] of [
    [8, 2],
    [9, 2],
    [10, 1],
    [7, 3],
    [8, 3],
    [13, 2],
  ])
    if (p[y]?.[x] === 'hair') g[y][x] = hairL

  // ── 이목구비 ──
  const lash = tone(c.hair, -0.45)
  if (blink) {
    rect(8, 11, 9, 11, lash, 'face')
    rect(14, 11, 15, 11, lash, 'face')
  } else {
    rect(8, 10, 9, 11, c.eye, 'face')
    rect(14, 10, 15, 11, c.eye, 'face')
    set(8, 10, '#ffffff', 'face')
    set(14, 10, '#ffffff', 'face')
    set(9, 11, tone(c.eye, -0.45), 'face')
    set(15, 11, tone(c.eye, -0.45), 'face')
  }
  // 눈썹
  rect(8, 8, 9, 8, lash, 'face')
  rect(14, 8, 15, 8, lash, 'face')
  if (c.glasses && c.softGlasses) {
    // 얇은 반투명 테: 모서리를 비운 둥근 사각, 렌즈는 살짝 비침
    const f = c.glasses
    const lens = (x: number, y: number) => {
      if (p[y]?.[x] === 'skin') set(x, y, tone(c.skin, 0.12), 'skin')
    }
    for (const x0 of [7, 13]) {
      rect(x0 + 1, 9, x0 + 2, 9, f, 'acc')
      set(x0, 10, f, 'acc')
      set(x0 + 3, 10, f, 'acc')
      set(x0, 11, tone(f, 0.3), 'acc')
      set(x0 + 3, 11, tone(f, 0.3), 'acc')
      rect(x0 + 1, 12, x0 + 2, 12, tone(f, 0.45), 'acc')
      lens(x0 + 1, 11)
      lens(x0 + 2, 11)
    }
    rect(11, 10, 12, 10, f, 'acc')
  } else if (c.glasses) {
    const f = c.glasses
    for (const x0 of [7, 13]) {
      rect(x0, 9, x0 + 3, 9, f, 'acc')
      set(x0, 10, f, 'acc')
      set(x0 + 3, 10, f, 'acc')
      set(x0, 11, tone(f, 0.35), 'acc')
      set(x0 + 3, 11, tone(f, 0.35), 'acc')
    }
    rect(11, 9, 12, 9, f, 'acc')
  }
  if (c.sharp) {
    if (!c.roundFace) {
      // 갸름한 턱
      for (const [x, y] of [
        [FL, FB - 1],
        [FR, FB - 1],
        [FL, FB - 2],
        [FR, FB - 2],
        [FL + 1, FB - 1],
        [FR - 1, FB - 1],
      ])
        del(x, y)
      set(FL + 2, FB, skinD, 'skin')
      set(FR - 2, FB, skinD, 'skin')
    }
    // 날렵한 눈매: 위 속눈썹 선을 길게, 눈썹을 올림
    if (!blink) {
      rect(7, 9, 9, 9, lash, 'face')
      rect(14, 9, 16, 9, lash, 'face')
    }
    rect(7, 8, 9, 8, lash, 'face')
    rect(14, 8, 16, 8, lash, 'face')
    set(7, 8, tone(c.skin, -0.05), 'skin')
    set(16, 7, lash, 'face')
    set(16, 8, lash, 'face')
    set(14, 8, tone(c.skin, -0.05), 'skin')
  }
  if (c.narrow && !blink) {
    // 가늘고 날카로운 눈: 긴 윗선 아래로 흰자 한 칸 + 폭 1칸 눈동자(2줄)
    const lid = tone(c.hair, -0.1)
    const white = '#f4f0ef'
    const shade = '#e2d8d6'
    rect(7, 9, 9, 9, lid, 'face')
    rect(14, 9, 16, 9, lid, 'face')
    set(6 + fs, 9, c.skin, 'skin')
    rect(7, 10, 9, 11, c.skin, 'skin')
    rect(14, 10, 16, 11, c.skin, 'skin')
    set(8, 10, white, 'face')
    set(9, 10, c.eye, 'face')
    set(8, 11, shade, 'face')
    set(9, 11, tone(c.eye, -0.4), 'face')
    set(14, 10, c.eye, 'face')
    set(15, 10, white, 'face')
    set(14, 11, tone(c.eye, -0.4), 'face')
    set(15, 11, shade, 'face')
    // 올라간 눈꼬리
    set(7, 10, tone(lid, 0.3), 'face')
    set(16, 10, tone(lid, 0.3), 'face')
  }
  if (c.tired && !blink) {
    set(8, 12, tone(c.skin, -0.12), 'face')
    set(9, 12, tone(c.skin, -0.12), 'face')
    set(14, 12, tone(c.skin, -0.12), 'face')
    set(15, 12, tone(c.skin, -0.12), 'face')
  }
  if (c.brow) {
    // 왼쪽(화면 오른쪽) 눈썹을 한 칸 올림
    rect(14, 8, 16, 8, tone(c.skin, -0.05), 'skin')
    rect(14, 7, 16, 7, lash, 'face')
  }
  if (c.hairStyle === 'curtain') curtainBangs()
  if (c.blush) {
    set(7, 13, tone('#f08a8a', 0.2), 'face')
    set(16, 13, '#e47a7a', 'face')
  }
  if (c.beard) {
    rect(8, 13, 15, 15, tone(c.hair, -0.1), 'hair')
    rect(10, 13, 13, 13, skinD, 'skin')
    del(8, 15)
    del(15, 15)
  }
  if (talk) {
    rect(11, 13, 12, 14, '#7a2e35', 'face')
  } else if (c.smirk) {
    // 한쪽 입꼬리만 올라간 미소
    set(11, 13, c.lips ?? tone(c.skin, -0.35), 'face')
    set(12, 13, c.lips ?? tone(c.skin, -0.35), 'face')
    set(13, 12, tone(c.skin, -0.3), 'face')
    set(10, 13, tone(c.skin, -0.15), 'face')
  } else {
    rect(11, 13, 12, 13, c.lips ?? tone(c.skin, -0.35), 'face')
  }
  if (c.headset) {
    rect(4, 8, 5, 12, '#3b3f48', 'acc')
    rect(6, 1, 17, 1, '#3b3f48', 'acc')
    set(5, 2, '#3b3f48', 'acc')
    set(18, 2, '#3b3f48', 'acc')
    rect(6, 13, 8, 13, '#3b3f48', 'acc')
  }

  // ── 색이 들어간 외곽선 ──
  const out: Grid = g.map((r) => r.slice())
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (g[y][x]) continue
      const n = [g[y - 1]?.[x], g[y + 1]?.[x], g[y][x - 1], g[y][x + 1]].find(Boolean)
      if (n) out[y][x] = tone(n, -0.62)
    }
  // 머리와 얼굴 경계에 어두운 선
  for (let y = 1; y < H; y++)
    for (let x = 0; x < W; x++)
      if (p[y][x] === 'skin' && p[y - 1][x] === 'hair' && y < 12) out[y][x] = tone(c.skin, -0.3)
  return out
}
