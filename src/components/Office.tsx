import { useEffect, useMemo, useRef, useState } from 'react'
import roomBg from '../assets/office/room.png'
import { CHARS } from '../data/characters'
import { ART, ART_PAL } from '../data/officeArt'
import { DESKMATES, FIXTURES, FURNITURE, MEMENTOS, RELATION_PROP_NEED, SLOTS, furniture, memento, type Furniture, type Slot } from '../data/office'
import { ROOM, SPRITES } from '../data/officeSprites'
import { BONDS, FRIENDS, GOLD, SNACKS, TALK_POINTS, PROJECT_POINTS, bondOf, giftPoints, type Episode, type GiftItem } from '../data/rewards'
import { W as SPR_W, H as SPR_H } from '../pixel'
import {
  buyItem,
  earnedMementos,
  giveGift,
  goldBalance,
  logTalk,
  ownsItem,
  placeItem,
  placedMap,
  talkCount,
  talkedToday,
  teamwork,
  teamworkParts,
  type Progress,
} from '../store'
import type { Line } from '../types'
import { Sprite } from './Sprite'
import { useZoom, ZOOM_MAX } from './useZoom'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/** officeArt.ts의 픽셀 아트를 SVG로 그린다(같은 색이 이어지는 칸은 한 사각형으로) */
export function PixelArt({ name, className, title }: { name: string; className?: string; title?: string }) {
  const rows = ART[name]
  const rects = useMemo(() => {
    const out: { x: number; y: number; w: number; c: string }[] = []
    rows?.forEach((row, y) => {
      let x = 0
      while (x < row.length) {
        const ch = row[x]
        if (ch === '.') {
          x++
          continue
        }
        let w = 1
        while (row[x + w] === ch) w++
        out.push({ x, y, w, c: ART_PAL[ch] })
        x += w
      }
    })
    return out
  }, [rows])
  if (!rows) return null
  return (
    <svg className={className} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-label={title}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  )
}

// 아이소메트릭 가구 그림(scripts/office-room.py가 만든 PNG)
const FURN_IMG = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/office/*.png', { eager: true, query: '?url', import: 'default' })).map(([k, v]) => [
    k.split('/').pop()!.replace('.png', ''),
    v as string,
  ]),
)

/** 가구는 아이소 PNG, 기념품은 픽셀 아트 */
export function ItemArt({ name, className, title }: { name: string; className?: string; title?: string }) {
  if (FURN_IMG[name] && SPRITES[name]) return <img src={FURN_IMG[name]} className={`pix ${className ?? ''}`} alt={title ?? ''} draggable={false} />
  return <PixelArt name={name} className={className} title={title} />
}

/** 바닥 좌표 → 방 그림 위 픽셀 */
const proj = (x: number, y: number, z = 0) => ({ sx: ROOM.OX + 2 * x - 2 * y, sy: ROOM.OY + x + y - z })
/** 그림 크기·기준점 */
const artMeta = (name: string) => {
  const m = SPRITES[name]
  if (m) return m
  const w = ART[name]?.[0].length ?? 16
  const h = ART[name]?.length ?? 16
  return { w, h, ax: w / 2, ay: h, front: 0 }
}
/** 기준점이 바닥 좌표에 오도록 장면 안 백분율 위치 */
const boxAt = (x: number, y: number, z: number, m: { w: number; h: number; ax: number; ay: number }) => {
  const { sx, sy } = proj(x, y, z)
  return {
    left: `${((sx - m.ax) / ROOM.W) * 100}%`,
    top: `${((sy - m.ay) / ROOM.H) * 100}%`,
    width: `${(m.w / ROOM.W) * 100}%`,
    height: `${(m.h / ROOM.H) * 100}%`,
  }
}
const itemName = (id: string) => furniture(id)?.name ?? memento(id)?.name ?? id
const itemArt = (id: string) => furniture(id)?.art ?? memento(id)?.art ?? ''
/** 빈 자리를 꾸미기 모드에서 보여 줄 크기 */
const slotSample = (s: Slot) => (s.kind === 'display' ? 'm_mug' : FURNITURE.find((f) => f.slot === s.id)!.art)

type Bubble = { lines: Line[]; i: number } | null
type Pop = { text: string; key: number } | null

/** 홈 화면용 작은 사무실 장면(보기 전용). 배치한 가구·기념품과 동료가 그대로 보인다 */
export function OfficeMini({ progress, onOpen }: { progress: Progress; onOpen: () => void }) {
  const placed = placedMap(progress)
  const seen = new Set(progress.seenEpisodes ?? [])
  const layers: { key: string; y: number; node: React.ReactNode }[] = []
  const shelfKey = (() => {
    const sh = SLOTS.find((x) => x.id === 'shelf')!
    return sh.x + sh.y + artMeta(placed.shelf ?? 'shelf_basic').front
  })()
  for (const fx of FIXTURES) {
    const m = artMeta(fx.art)
    layers.push({
      key: fx.art,
      y: fx.x + fx.y + m.front,
      node: (
        <div key={fx.art} className="o-item" style={boxAt(fx.x, fx.y, fx.z ?? 0, m)}>
          <ItemArt name={fx.art} className="o-art" />
        </div>
      ),
    })
  }
  for (const s of SLOTS) {
    const id = placed[s.id]
    if (!id) continue
    const art = itemArt(id)
    const m = artMeta(art)
    layers.push({
      key: s.id,
      y: s.floor ? -1e9 : s.kind === 'display' ? shelfKey + 0.5 : s.x + s.y + m.front,
      node: (
        <div key={s.id} className={`o-item ${s.floor ? 'floor' : ''}`} style={boxAt(s.x, s.y, s.z ?? 0, m)}>
          <ItemArt name={art} className="o-art" />
        </div>
      ),
    })
  }
  for (const m of DESKMATES) {
    const fr = FRIENDS.find((x) => x.id === m.id)!
    const newEp = fr.episodes.some((e) => teamwork(progress, m.id) >= e.need && !seen.has(e.id))
    layers.push({
      key: m.id,
      y: m.x + m.y,
      node: (
        <div key={m.id} className="o-mate mini" style={boxAt(m.x, m.y, 0, { w: SPR_W, h: SPR_H, ax: SPR_W / 2, ay: SPR_H - 1 })}>
          {newEp && <i className="mini-new">!</i>}
          <Sprite cfg={CHARS[m.id]} flip={m.flip} className="o-sprite" />
        </div>
      ),
    })
  }
  layers.sort((a, b) => a.y - b.y)
  return (
    <button className="office-mini" onClick={onOpen} aria-label="내 사무실로 가기" style={{ aspectRatio: `${ROOM.W} / ${ROOM.H}` }}>
      <div className="o-world" style={{ backgroundImage: `url(${roomBg})` }}>
        {layers.map((l) => l.node)}
      </div>
    </button>
  )
}

export function Office({
  progress,
  setProgress,
  initialFriend,
  onEpisode,
}: {
  progress: Progress
  setProgress: (p: Progress) => void
  initialFriend?: string
  onEpisode: (friendId: string, ep: Episode) => void
}) {
  const [sel, setSel] = useState<string | null>(initialFriend ?? null)
  const [mode, setMode] = useState<'main' | 'snack'>('main')
  const [snack, setSnack] = useState<GiftItem | null>(null)
  const [bubble, setBubble] = useState<Bubble>(null)
  const [shown, setShown] = useState(0)
  const [pop, setPop] = useState<Pop>(null)
  const [opened, setOpened] = useState<Episode | null>(null)
  const [decor, setDecor] = useState(false)
  const [dSlot, setDSlot] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null | undefined>(undefined)
  const [shop, setShop] = useState<null | 'furniture' | 'memento'>(null)
  const [ask, setAsk] = useState<Furniture | null>(null)
  const [bought, setBought] = useState<Furniture | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  // 아래 패널(꾸미기·상점)을 끌어내려 접으면 사무실 장면이 남은 화면을 가득 채운다
  const [full, setFull] = useState(false)
  const [fullH, setFullH] = useState(0)
  const zoom = useZoom(ROOM.W / ROOM.H, full)
  const drag = useRef<number | null>(null)
  useEffect(() => {
    if (!full) return
    const measure = () => {
      const el = zoom.box.current
      const nav = document.querySelector('.bottom-nav') as HTMLElement | null
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      setFullH(Math.max(240, window.innerHeight - top - (nav?.offsetHeight ?? 64) - 52))
    }
    window.scrollTo(0, 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full])
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (drag.current = e.touches[0].clientY),
    onTouchEnd: (e: React.TouchEvent) => {
      if (drag.current == null) return
      const dy = e.changedTouches[0].clientY - drag.current
      drag.current = null
      if (!full && dy > 40) setFull(true)
      if (full && dy < -30) setFull(false)
    },
  }
  const zs = zoom.view.s
  const toTop = () => sheetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const balance = goldBalance(progress)
  const placed = placedMap(progress)
  const earned = earnedMementos(progress)
  const seen = new Set(progress.seenEpisodes ?? [])

  const say = (m: string) => setToast(m)
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // ── 동료 패널 ──
  const f = sel ? FRIENDS.find((x) => x.id === sel)! : null
  const pts = sel ? teamwork(progress, sel) : 0
  const bond = bondOf(pts)
  const greetLine: Line | null = f ? { who: f.id, text: f.greet[bond.idx] } : null
  const line = bubble ? bubble.lines[bubble.i] : greetLine
  const text = line?.text ?? ''
  const typing = shown < text.length
  useEffect(() => setShown(0), [text, bubble?.i])
  useEffect(() => {
    if (!typing) return
    const t = window.setTimeout(() => setShown((s) => Math.min(text.length, s + 2)), 26)
    return () => clearTimeout(t)
  }, [shown, typing, text.length])

  const openFriend = (id: string) => {
    if (decor) return
    setSel(id)
    setMode('main')
    setSnack(null)
    setBubble(null)
    setPop(null)
    setOpened(null)
  }
  const closePanel = () => {
    setSel(null)
    setBubble(null)
    setPop(null)
    setOpened(null)
  }

  /** 팀워크가 오른 뒤 새로 열린 에피소드·기념품 알림 */
  const afterGain = (next: Progress, before: number) => {
    if (!f) return
    const after = teamwork(next, f.id)
    const ep = f.episodes.find((e) => before < e.need && after >= e.need)
    setOpened(ep ?? null)
    const was = earnedMementos(progress)
    const got = [...earnedMementos(next)].filter((m) => !was.has(m))
    if (got.length) say(`🎁 기념품을 받았어요: ${got.map((m) => memento(m)?.name).join(', ')}`)
  }

  const talk = () => {
    if (!f) return
    const t = f.talks[talkCount(progress, f.id) % f.talks.length]
    const before = pts
    const { next, gained } = logTalk(progress, f.id)
    setProgress(next)
    setBubble({ lines: t, i: 0 })
    setMode('main')
    setPop(gained ? { text: `팀워크 +${gained}`, key: Date.now() } : null)
    if (!gained) say('오늘 이야기하기 팀워크는 이미 받았어요. 대화는 계속 들을 수 있어요.')
    afterGain(next, before)
    toTop()
  }

  const share = () => {
    if (!f || !snack) return
    if (balance < snack.price) return
    const add = giftPoints(f, snack)
    const kind = f.likes.includes(snack.id) ? 'like' : f.dislikes.includes(snack.id) ? 'dislike' : 'normal'
    const reply = (kind === 'like' && f.special?.[snack.id]) || pick(f.react[kind])
    const before = pts
    const next = giveGift(progress, f.id, snack.id, snack.price, add)
    setProgress(next)
    setBubble({ lines: [{ who: f.id, text: reply }], i: 0 })
    setPop({ text: `팀워크 +${add}${kind === 'like' ? ' · 좋아하는 간식!' : ''}`, key: Date.now() })
    setSnack(null)
    setMode('main')
    afterGain(next, before)
    toTop()
  }

  const tapBubble = () => {
    if (typing) return setShown(text.length)
    if (bubble && bubble.i + 1 < bubble.lines.length) setBubble({ ...bubble, i: bubble.i + 1 })
  }

  // ── 꾸미기 ──
  const startDecor = (slot?: string, item?: string) => {
    closePanel()
    setShop(null)
    setDecor(true)
    setDSlot(slot ?? null)
    setPreview(item)
  }
  const endDecor = () => {
    setDecor(false)
    setDSlot(null)
    setPreview(undefined)
  }
  const pickSlot = (id: string) => {
    setDSlot(id)
    setPreview(undefined)
  }
  const confirmPlace = () => {
    if (!dSlot || preview === undefined) return
    setProgress(placeItem(progress, dSlot, preview))
    say(preview ? `${itemName(preview)}을(를) 배치했어요.` : '자리를 비웠어요.')
    setDSlot(null)
    setPreview(undefined)
  }
  const slot = dSlot ? SLOTS.find((s) => s.id === dSlot)! : null
  // 선반과 그 위 전시 자리는 한 번에 고른다(전시 자리는 장면에서 누르기엔 작아서)
  const shelfGroup = slot && (slot.id === 'shelf' || slot.kind === 'display') ? ['shelf', ...SLOTS.filter((x) => x.kind === 'display').map((x) => x.id)] : null
  const candidates = slot
    ? slot.kind === 'display'
      ? MEMENTOS.filter((m) => earned.has(m.id)).map((m) => m.id)
      : FURNITURE.filter((x) => x.slot === slot.id && ownsItem(progress, x.id)).map((x) => x.id)
    : []
  const moreInShop = slot && slot.kind === 'furniture' && FURNITURE.some((x) => x.slot === slot.id && !ownsItem(progress, x.id))

  // 장면에 보일 배치(미리보기 반영)
  const shownPlaced = { ...placed, ...(dSlot && preview !== undefined ? { [dSlot]: preview } : {}) }

  // ── 상점 ──
  const buy = () => {
    if (!ask || balance < ask.price) return
    setProgress(buyItem(progress, ask.id, ask.price))
    setBought(ask)
    setAsk(null)
  }
  const recommend = FURNITURE.filter((x) => x.price > 0 && !ownsItem(progress, x.id))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)

  // 그리기 순서: 바닥 물건 → (y가 작은 것부터) 가구·동료
  type Drawable = { key: string; y: number; node: React.ReactNode }
  const layers: Drawable[] = []
  const shelfKey = (() => {
    const sh = SLOTS.find((x) => x.id === 'shelf')!
    return sh.x + sh.y + artMeta(shownPlaced.shelf ?? 'shelf_basic').front
  })()
  for (const fx of FIXTURES) {
    const m = artMeta(fx.art)
    layers.push({
      key: fx.art,
      y: fx.x + fx.y + m.front,
      node: (
        <div key={fx.art} className="o-item" style={boxAt(fx.x, fx.y, fx.z ?? 0, m)}>
          <ItemArt name={fx.art} className="o-art" />
        </div>
      ),
    })
  }
  for (const s of SLOTS) {
    const id = shownPlaced[s.id]
    const isPreview = dSlot === s.id && preview !== undefined
    const target = decor && !dSlot && s.kind !== 'display'
    if (!id && !target && !isPreview) continue
    const art = id ? itemArt(id) : slotSample(s)
    const m = artMeta(art)
    const node = (
      <div
        key={s.id}
        className={`o-item ${s.floor ? 'floor' : ''} ${isPreview ? 'preview' : ''} ${target ? 'target' : ''} ${!id ? 'empty' : ''}`}
        style={boxAt(s.x, s.y, s.z ?? 0, m)}
      >
        {id && <ItemArt name={art} className="o-art" title={itemName(id)} />}
        {target && (
          <button className="o-slot" onClick={() => pickSlot(s.id)} aria-label={`${s.name} 바꾸기`}>
            <span>{s.name}</span>
          </button>
        )}
      </div>
    )
    // 바닥 러그는 맨 뒤, 선반 위 기념품은 선반 바로 앞에 그린다
    const key = s.floor ? -1e9 : s.kind === 'display' ? shelfKey + 0.5 : s.x + s.y + m.front
    layers.push({ key: s.id, y: key, node })
  }
  for (const m of DESKMATES) {
    const c = CHARS[m.id]
    const fr = FRIENDS.find((x) => x.id === m.id)!
    const newEp = fr.episodes.some((e) => teamwork(progress, m.id) >= e.need && !seen.has(e.id))
    const canTalk = !talkedToday(progress, m.id)
    const node = (
      <button
        key={m.id}
        className={`o-mate ${sel === m.id ? 'on' : ''}`}
        style={boxAt(m.x, m.y, 0, { w: SPR_W, h: SPR_H, ax: SPR_W / 2, ay: SPR_H - 1 })}
        onClick={() => openFriend(m.id)}
        disabled={decor}
        aria-label={`${c.name}와 이야기하기`}
      >
        <span className="o-name">
          {c.name}
          {newEp ? <i className="o-badge new">!</i> : canTalk ? <i className="o-badge">…</i> : null}
        </span>
        <Sprite cfg={c} talking={sel === m.id && typing} flip={m.flip} className="o-sprite" />
      </button>
    )
    layers.push({ key: m.id, y: m.x + m.y, node })
  }
  layers.sort((a, b) => a.y - b.y)

  return (
    <div className="office">
      <header className="office-head">
        <div>
          <h1>사무실</h1>
          <p>동료와 함께 성장하는 공간</p>
        </div>
        <span className="o-gold">
          💰 {fmt(balance)}
          {GOLD}
        </span>
      </header>

      <div
        className={`o-scene ${decor ? 'decor' : ''} ${zoom.pannable ? 'zoomed' : ''} ${full ? 'full' : ''}`}
        ref={zoom.box}
        style={full ? { height: fullH || undefined } : { aspectRatio: `${ROOM.W} / ${ROOM.H}` }}
      >
        <div
          className="o-world"
          style={
            {
              width: zoom.base.w || '100%',
              height: zoom.base.h || '100%',
              backgroundImage: `url(${roomBg})`,
              transform: `translate(${zoom.view.x}px, ${zoom.view.y}px) scale(${zs})`,
              '--zs': zs,
            } as React.CSSProperties
          }
        >
          {layers.map((l) => l.node)}
        </div>
        <div className="o-zoom">
          <button onClick={zoom.zoomIn} disabled={zs >= ZOOM_MAX - 0.01} aria-label="확대">
            +
          </button>
          <button onClick={zoom.zoomOut} disabled={zs <= zoom.minS + 0.01} aria-label="축소">
            −
          </button>
          {Math.abs(zs - 1) > 0.001 && (
            <button onClick={zoom.reset} aria-label="원래 크기" className="o-zoom-reset">
              ⤢
            </button>
          )}
        </div>
        {!decor && !sel && Math.abs(zs - 1) <= 0.001 && <div className="o-hint">👆 동료를 눌러 이야기해 보세요</div>}
        {decor && (
          <div className="o-decor-bar">
            <span>{dSlot ? `${slot?.name}에 둘 아이템을 고르세요` : '바꿀 자리를 누르세요'}</span>
            <button className="primary small" onClick={endDecor}>
              꾸미기 끝
            </button>
          </div>
        )}
      </div>

      {!decor && full && (
        <button className="o-dock" onClick={() => setFull(false)} {...swipe}>
          <i className="o-dock-grip" />
          <span>︿ 꾸미기 · 아이템 상점 열기</span>
        </button>
      )}

      {!decor && !full && (
        <section className="o-actions">
          <button className="o-panel-grip" onClick={() => setFull(true)} {...swipe} aria-label="아래로 내려 사무실만 보기">
            <i />
            <small>아래로 내려 사무실만 보기</small>
          </button>
          <div className="o-btns">
            <button className="ghost" onClick={() => startDecor()}>
              🛋️ 꾸미기
            </button>
            <button className="primary" onClick={() => setShop('furniture')}>
              🛒 아이템 상점
            </button>
          </div>
          {recommend.length > 0 && (
            <>
              <small className="o-sub">추천 가구</small>
              <ul className="o-reco">
                {recommend.map((x) => (
                  <li key={x.id}>
                    <button
                      onClick={() => {
                        setShop('furniture')
                        setAsk(x)
                      }}
                    >
                      <ItemArt name={x.art} className="o-reco-art" />
                      <b>{x.name}</b>
                      <small>
                        {fmt(x.price)}
                        {GOLD}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button className="o-memo-link" onClick={() => setShop('memento')}>
            🏆 기념품 {earned.size}/{MEMENTOS.length} · 프로젝트 성과와 팀워크로 받아요
          </button>
        </section>
      )}

      {decor && !slot && (
        <section className="o-actions">
          <p className="o-decor-help">
            🛋️ <b>꾸미기 중</b> · 장면에서 <b>민트 점선</b> 자리를 눌러 가구를 바꿔요. 선반을 누르면 선반 위 기념품 전시도 고를 수 있어요.
          </p>
          <button className="ghost" onClick={() => setShop('furniture')}>
            🛒 아이템 상점 열기
          </button>
        </section>
      )}

      {/* ── 동료 패널 ── */}
      {f && sel && (
        <>
          <div className="o-dim" onClick={closePanel} />
          <div className="o-sheet" ref={sheetRef} role="dialog" aria-label={`${CHARS[sel].name} 프로필`}>
            <button className="o-grip" onClick={closePanel} aria-label="닫기" />
            <div className="o-prof">
              <div className="o-portrait">
                <Sprite cfg={CHARS[sel]} talking={typing} className="o-portrait-spr" />
              </div>
              <div className="o-prof-text">
                <div className="o-prof-name">
                  <b>{CHARS[sel].name}</b>
                  <span className="o-stage">{bond.name}</span>
                </div>
                <small>{CHARS[sel].role}</small>
                <small className="o-spec">전문 분야 · {f.specialty}</small>
                <div className="o-tw">
                  <div className="o-tw-bar">
                    <i style={{ width: `${Math.min(100, bond.next ? ((pts - bond.min) / (bond.next - bond.min)) * 100 : 100)}%` }} />
                  </div>
                  <small>
                    팀워크 <b>{pts}</b>
                    {bond.next ? ` · 다음 단계까지 ${bond.next - pts}` : ' · 최고 단계'}
                  </small>
                </div>
              </div>
            </div>

            <div className="o-bubble" onClick={tapBubble}>
              <span className="o-who">{line?.who === 'me' ? '나' : CHARS[line?.who ?? sel]?.name}</span>
              <p>{text.slice(0, shown)}</p>
              {bubble && !typing && bubble.i + 1 < bubble.lines.length && <i className="o-next">▼</i>}
              {pop && (
                <span key={pop.key} className="o-pop">
                  {pop.text}
                </span>
              )}
            </div>

            {opened && (
              <button className="o-ep-open" onClick={() => onEpisode(sel, opened)}>
                <span>🎬 동료 에피소드가 열렸어요</span>
                <b>「{opened.title}」 지금 보기 →</b>
              </button>
            )}

            <div className="o-btns">
              <button className="ghost" onClick={talk}>
                💬 이야기하기
              </button>
              <button className={mode === 'snack' ? 'primary on' : 'primary'} onClick={() => setMode(mode === 'snack' ? 'main' : 'snack')}>
                🍪 간식 나누기
              </button>
            </div>

            {mode === 'snack' && (
              <>
                <ul className="o-snacks">
                  {SNACKS.map((g) => {
                    const like = f.likes.includes(g.id)
                    return (
                      <li key={g.id}>
                        <button className={`o-snack ${snack?.id === g.id ? 'on' : ''}`} onClick={() => setSnack(g)}>
                          <span className="o-snack-emoji">{g.emoji}</span>
                          <b>{g.name}</b>
                          <small className={balance < g.price ? 'poor' : ''}>
                            {fmt(g.price)}
                            {GOLD}
                          </small>
                          {like && bond.idx >= 1 && <i className="o-like">좋아함</i>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <button className="o-share sticky" disabled={!snack || balance < snack.price} onClick={share}>
                  {!snack
                    ? '나눌 간식을 고르세요'
                    : balance < snack.price
                      ? `골드가 ${fmt(snack.price - balance)}${GOLD} 부족해요`
                      : `🍪 ${fmt(snack.price)}${GOLD}로 나누기`}
                </button>
                <p className="o-hint2">💡 {f.hint}</p>
              </>
            )}

            {mode === 'main' && (
              <>
                <h3 className="o-h3">관계 보상</h3>
                <ol className="o-track">
                  {BONDS.slice(1).map((b, i) => {
                    const ep = f.episodes[i]
                    const ok = pts >= b.min
                    const prop = b.min === RELATION_PROP_NEED ? MEMENTOS.find((m) => m.friend === sel && !m.episode) : undefined
                    return (
                      <li key={b.name} className={ok ? 'ok' : ''}>
                        <div className="o-track-head">
                          <span className="o-stage small">{b.name}</span>
                          <small>팀워크 {b.min}</small>
                        </div>
                        {ep && (
                          <button className={`o-ep ${seen.has(ep.id) ? 'done' : ''}`} disabled={!ok} onClick={() => onEpisode(sel, ep)}>
                            <span className="o-ep-main">
                              <b>🎬 {ok ? ep.title : '동료 에피소드'}</b>
                              <small>
                                {ep.topic} · 보상: {ep.reward.kind} 「{ep.reward.name}」
                              </small>
                            </span>
                            <PixelArt name={ep.reward.art} className={`o-ep-art ${seen.has(ep.id) ? '' : 'dim'}`} />
                            <small className="o-ep-state">{ok ? (seen.has(ep.id) ? '✓ 다시 보기' : 'NEW') : '🔒'}</small>
                          </button>
                        )}
                        {prop && (
                          <div className="o-prop">
                            <PixelArt name={prop.art} className="o-prop-art" />
                            <span>
                              사무실 소품 · {prop.name}
                              {!ok && ' 🔒'}
                            </span>
                          </div>
                        )}
                        {b.min === RELATION_PROP_NEED && (
                          <div className="o-prop">
                            <PixelArt name="team_photo" className="o-prop-art" />
                            <span>세 동료 모두 이 단계면 팀 사진 액자{earned.has('team_photo') ? '' : ' 🔒'}</span>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
                <p className="o-hint2">
                  팀워크 올리기: 이야기하기(동료별 하루 1번 +{TALK_POINTS}) · 함께한 프로젝트 완료(+{PROJECT_POINTS}) · 간식 나누기(좋아하는 간식은 2배)
                  <br />
                  {(() => {
                    const x = teamworkParts(progress, sel)
                    return `지금까지: 간식 ${x.snack} · 대화 ${x.talk} · 프로젝트 ${x.project}`
                  })()}
                </p>
              </>
            )}
          </div>
        </>
      )}

      {/* ── 꾸미기: 자리별 아이템 고르기 ── */}
      {decor && slot && (
        <div className="o-sheet compact" role="dialog" aria-label={`${slot.name} 아이템`}>
          <div className="o-sheet-head">
            <b>{shelfGroup ? '전시 선반' : slot.name}</b>
            <small>{slot.kind === 'display' ? '받은 기념품을 선반 위에 전시해요' : '보유한 가구 중에서 골라요'}</small>
          </div>
          {shelfGroup && (
            <div className="o-tabs four">
              {shelfGroup.map((id) => (
                <button key={id} className={dSlot === id ? 'on' : ''} onClick={() => pickSlot(id)}>
                  {id === 'shelf' ? '선반' : `전시 ${id.slice(-1)}`}
                </button>
              ))}
            </div>
          )}
          <ul className="o-pick">
            {slot.optional && (
              <li>
                <button className={`o-tile ${preview === null ? 'on' : ''}`} onClick={() => setPreview(null)}>
                  <span className="o-tile-empty">비우기</span>
                  {placed[slot.id] === null && <i className="o-tag">배치 중</i>}
                </button>
              </li>
            )}
            {candidates.map((id) => {
              const here = placed[slot.id] === id
              const elsewhere = !here && SLOTS.some((s) => s.id !== slot.id && placed[s.id] === id)
              return (
                <li key={id}>
                  <button className={`o-tile ${preview === id ? 'on' : ''}`} onClick={() => setPreview(id)}>
                    <ItemArt name={itemArt(id)} className="o-tile-art" />
                    <b>{itemName(id)}</b>
                    {here && <i className="o-tag">배치 중</i>}
                    {elsewhere && <i className="o-tag gray">다른 자리 전시 중</i>}
                  </button>
                </li>
              )
            })}
            {candidates.length === 0 && <li className="o-none">{slot.kind === 'display' ? '아직 받은 기념품이 없어요. 프로젝트를 완료해 보세요.' : '보유한 가구가 없어요.'}</li>}
          </ul>
          {moreInShop && (
            <button className="o-link" onClick={() => setShop('furniture')}>
              🛒 상점에서 {slot.name} 더 보기
            </button>
          )}
          <div className="o-btns">
            <button className="ghost" onClick={() => setDSlot(null)}>
              다른 자리 고르기
            </button>
            <button className="primary" disabled={preview === undefined || preview === placed[slot.id]} onClick={confirmPlace}>
              배치 완료
            </button>
          </div>
        </div>
      )}

      {/* ── 상점 ── */}
      {shop && (
        <div className="modal o-shop" onClick={() => (setShop(null), setAsk(null), setBought(null))}>
          <div className="modal-body wide" onClick={(e) => e.stopPropagation()}>
            <div className="o-shop-head">
              <h3>아이템 상점</h3>
              <span className="o-gold dark">
                {fmt(balance)}
                {GOLD}
              </span>
            </div>
            <div className="o-tabs">
              <button className={shop === 'furniture' ? 'on' : ''} onClick={() => setShop('furniture')}>
                가구·소품
              </button>
              <button className={shop === 'memento' ? 'on' : ''} onClick={() => setShop('memento')}>
                기념품 {earned.size}/{MEMENTOS.length}
              </button>
            </div>
            {shop === 'furniture' &&
              SLOTS.filter((s) => s.kind === 'furniture').map((s) => (
                <div key={s.id} className="o-shop-group">
                  <h4>{s.name}</h4>
                  <ul className="o-pick">
                    {FURNITURE.filter((x) => x.slot === s.id).map((x) => {
                      const own = ownsItem(progress, x.id)
                      const on = placed[s.id] === x.id
                      return (
                        <li key={x.id}>
                          <button className={`o-tile ${ask?.id === x.id ? 'on' : ''}`} onClick={() => (own ? undefined : setAsk(x))}>
                            <ItemArt name={x.art} className="o-tile-art" />
                            <b>{x.name}</b>
                            {on ? (
                              <i className="o-tag">배치 중</i>
                            ) : own ? (
                              <i className="o-tag gray">{x.price === 0 ? '기본' : '보유'}</i>
                            ) : (
                              <small className={balance < x.price ? 'poor' : ''}>
                                {fmt(x.price)}
                                {GOLD}
                              </small>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            {shop === 'memento' && (
              <>
                <p className="muted small-note">기념품은 살 수 없어요. 프로젝트 성과와 동료 팀워크로 받고, 꾸미기에서 선반 위에 전시해요.</p>
                <ul className="o-pick">
                  {MEMENTOS.map((m) => {
                    const got = earned.has(m.id)
                    return (
                      <li key={m.id}>
                        <div className={`o-tile ${got ? '' : 'locked'}`}>
                          <PixelArt name={m.art} className="o-tile-art" />
                          <b>{got ? m.name : '???'}</b>
                          <small>{m.how}</small>
                          {got && SLOTS.some((s) => placed[s.id] === m.id) && <i className="o-tag">전시 중</i>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            {ask && (
              <div className="o-buy">
                <div>
                  <b>{ask.name}</b>
                  <small>{ask.desc}</small>
                </div>
                <button className="o-share" disabled={balance < ask.price} onClick={buy}>
                  {balance < ask.price ? `골드가 ${fmt(ask.price - balance)}${GOLD} 부족해요` : `${fmt(ask.price)}${GOLD}로 구매하기`}
                </button>
              </div>
            )}
            {bought && (
              <div className="o-buy done">
                <div>
                  <b>{bought.name}을(를) 샀어요!</b>
                  <small>꾸미기에서 언제든 바꿔 둘 수 있어요.</small>
                </div>
                <button className="primary" onClick={() => (setBought(null), startDecor(bought.slot, bought.id))}>
                  바로 배치하기
                </button>
              </div>
            )}
            <div className="row-end">
              <button className="ghost" onClick={() => (setShop(null), setAsk(null), setBought(null))}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export function EpisodeHeader({ title, name, onBack }: { title: string; name: string; onBack: () => void }) {
  return (
    <header className="play-head">
      <button className="ghost small" onClick={onBack}>
        ← 사무실로
      </button>
      <div className="play-title">
        <small>{name} 동료 에피소드</small>
        <b>{title}</b>
      </div>
    </header>
  )
}
