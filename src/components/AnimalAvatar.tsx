// 프로필 사진: 동물 픽셀 아바타(scripts/animal-art.py → data/animalArt.ts)
import { useMemo } from 'react'
import { ANIMALS, ANIMAL_IDS } from '../data/animalArt'

/** 동물 아바타 id. 예전 값이거나 비어 있으면 seed(사용자 id 등)로 정해진 동물을 쓴다 */
export function animalFor(name?: string | null, seed = '') {
  if (name && ANIMALS[name]) return name
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return ANIMAL_IDS[h % ANIMAL_IDS.length]
}

export function AnimalAvatar({ name, seed, className }: { name?: string | null; seed?: string; className?: string }) {
  const id = animalFor(name, seed)
  const art = ANIMALS[id]
  const rects = useMemo(() => {
    const out: { x: number; y: number; w: number; c: string }[] = []
    art.rows.forEach((row, y) => {
      let x = 0
      while (x < row.length) {
        const ch = row[x]
        if (ch === '.') {
          x++
          continue
        }
        let w = 1
        while (row[x + w] === ch) w++
        out.push({ x, y, w, c: art.pal[ch] })
        x += w
      }
    })
    return out
  }, [art])
  return (
    <svg className={className} viewBox={`0 0 ${art.rows[0].length} ${art.rows.length}`} shapeRendering="crispEdges" role="img" aria-label={art.label}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  )
}
