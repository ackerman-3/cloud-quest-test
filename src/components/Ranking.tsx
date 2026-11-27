// 랭킹: 3개 분야 순위(탭), 사용자 프로필 보기, 내 프로필 설정
import { useCallback, useEffect, useMemo, useState } from 'react'
import { demoMode, fetchRanking, updateProfile, useCloud, type RankRow } from '../cloud'
import { AVATARS, CATEGORIES, PERIOD_LABEL, TITLES, titleName, type CategoryId } from '../data/ranking'
import { ownedTitles, type Progress } from '../store'
import { PixelArt } from './Office'

type Ranked = RankRow & { rank: number | null; tie: boolean }

/** 분야별 순위. 기록이 0이면 순위 미집계(null), 같은 기록은 공동 순위(1, 1, 3…) */
function rankBy(rows: RankRow[], cat: CategoryId): Ranked[] {
  const has = rows.filter((r) => r[cat] > 0).sort((a, b) => b[cat] - a[cat] || a.nickname.localeCompare(b.nickname, 'ko'))
  const count = new Map<number, number>()
  has.forEach((r) => count.set(r[cat], (count.get(r[cat]) ?? 0) + 1))
  let rank = 0
  let prev = -1
  const out: Ranked[] = has.map((r, i) => {
    if (r[cat] !== prev) {
      rank = i + 1
      prev = r[cat]
    }
    return { ...r, rank, tie: (count.get(r[cat]) ?? 0) > 1 }
  })
  const none = rows.filter((r) => r[cat] <= 0).sort((a, b) => Number(b.is_me) - Number(a.is_me) || a.nickname.localeCompare(b.nickname, 'ko'))
  return [...out, ...none.map((r) => ({ ...r, rank: null, tie: false }))]
}

const rankText = (r: { rank: number | null; tie: boolean }) => (r.rank == null ? '순위 없음' : `${r.tie ? '공동 ' : ''}${r.rank}위`)

function Avatar({ name, size = 'm' }: { name: string; size?: 's' | 'm' | 'l' }) {
  return (
    <span className={`rk-avatar ${size}`}>
      <PixelArt name={AVATARS.includes(name as (typeof AVATARS)[number]) ? name : 'i_laptop'} />
    </span>
  )
}

export function Ranking({ progress, onBack, onLogin }: { progress: Progress; onBack: () => void; onLogin: () => void }) {
  const cloud = useCloud()
  const [cat, setCat] = useState<CategoryId>('projects')
  const [rows, setRows] = useState<RankRow[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const load = useCallback(() => {
    setErr(null)
    setRows(null)
    fetchRanking()
      .then(setRows)
      .catch((e: Error) => setErr(e.message))
  }, [])

  useEffect(() => {
    if (cloud.enabled && cloud.signedIn) load()
  }, [cloud.enabled, cloud.signedIn, load])

  const ranked = useMemo(() => (rows ? rankBy(rows, cat) : []), [rows, cat])
  const byCat = useMemo(() => (rows ? Object.fromEntries(CATEGORIES.map((c) => [c.id, rankBy(rows, c.id)])) : {}) as Record<CategoryId, Ranked[]>, [rows])
  const me = rows?.find((r) => r.is_me)
  const shownId = sel ?? (wide ? me?.user_id : null) ?? null
  const shown = rows?.find((r) => r.user_id === shownId) ?? null
  const category = CATEGORIES.find((c) => c.id === cat)!
  const anyRecord = ranked.some((r) => r.rank != null)

  const head = (
    <header className="rk-head">
      <button className="rk-back" onClick={onBack} aria-label="홈으로">
        ←
      </button>
      <div>
        <h1>랭킹</h1>
        <p>함께 쌓아 가는 성장 기록</p>
      </div>
    </header>
  )

  if (!cloud.enabled || !cloud.signedIn) {
    return (
      <div className="ranking">
        {head}
        <section className="card rk-empty">
          <PixelArt name="m_gold" className="rk-empty-art" />
          <h2>로그인하면 랭킹에 참여할 수 있어요</h2>
          <p>초대 코드로 가입한 참여자끼리 세 분야의 순위를 비교해요.</p>
          {cloud.enabled && (
            <button className="play-btn" onClick={onLogin}>
              로그인하러 가기
            </button>
          )}
        </section>
      </div>
    )
  }

  const profileView = (r: RankRow) => {
    const mine = r.is_me
    return (
      <div className="rk-profile">
        <div className="rk-p-top">
          <Avatar name={r.avatar} size="l" />
          <div className="rk-p-name">
            <b>
              {r.nickname}
              {mine && <em className="rk-me">나</em>}
            </b>
            {r.title && titleName(r.title) && <span className="rk-title">{titleName(r.title)}</span>}
          </div>
        </div>
        <p className={`rk-p-status ${r.status_msg ? '' : 'none'}`}>{r.status_msg || '상태메시지가 없어요'}</p>
        <ul className="rk-p-ranks">
          {CATEGORIES.map((c) => {
            const x = byCat[c.id]?.find((y) => y.user_id === r.user_id)
            return (
              <li key={c.id}>
                <PixelArt name={c.icon} className="rk-p-icon" />
                <span>{c.name}</span>
                <b>{x ? rankText(x) : '-'}</b>
                <small>
                  {r[c.id]}
                  {c.unit}
                </small>
              </li>
            )
          })}
        </ul>
        {mine && (
          <button className="play-btn rk-edit-btn" onClick={() => setEditing(true)}>
            프로필 설정
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="ranking">
      {head}
      {demoMode && <p className="demo-note">🧪 미리보기용 예시 데이터예요. 실제 순위가 아니에요.</p>}
      <div className="rk-layout">
        <section className="card rk-board">
          <div className="rk-tabs" role="tablist">
            {CATEGORIES.map((c) => (
              <button key={c.id} role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
                <PixelArt name={c.icon} className="rk-tab-icon" />
                {c.name}
              </button>
            ))}
          </div>
          <p className="rk-rule">
            <span>{PERIOD_LABEL}</span>
            {category.rule}
          </p>

          {err ? (
            <div className="rk-state">
              <p>{err}</p>
              <button className="ghost small" onClick={load}>
                다시 시도
              </button>
            </div>
          ) : !rows ? (
            <ul className="rk-list loading" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="rk-skel" />
              ))}
            </ul>
          ) : (
            <>
              {!anyRecord && <p className="rk-state">아직 이 분야의 기록이 없어요. 첫 기록의 주인공이 되어 보세요.</p>}
              <ul className="rk-list">
                {ranked.map((r) => (
                  <li key={r.user_id}>
                    <button className={`rk-row ${r.is_me ? 'me' : ''} ${shownId === r.user_id ? 'sel' : ''}`} onClick={() => setSel(r.user_id)}>
                      <span className={`rk-rank ${r.rank && r.rank <= 3 ? `top t${r.rank}` : ''}`}>
                        {r.rank ?? '-'}
                        {r.tie && <small>공동</small>}
                      </span>
                      <Avatar name={r.avatar} />
                      <span className="rk-who">
                        <span className="rk-line1">
                          <b>{r.nickname}</b>
                          {r.is_me && <em className="rk-me">나</em>}
                          {r.title && titleName(r.title) && <span className="rk-title">{titleName(r.title)}</span>}
                        </span>
                        <span className="rk-status">{r.status_msg || ' '}</span>
                      </span>
                      <span className="rk-score">
                        {r.rank == null ? (
                          <small>미집계</small>
                        ) : (
                          <>
                            <b>{r[cat]}</b>
                            <small>{category.unit}</small>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {wide && (
          <aside className="card rk-side">
            <h2>{shown?.is_me ? '내 프로필' : '프로필'}</h2>
            {shown ? profileView(shown) : <p className="muted">목록에서 참여자를 눌러 보세요.</p>}
          </aside>
        )}
      </div>

      {!wide && shown && (
        <div className="sheet-back" onClick={() => setSel(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${shown.nickname} 프로필`}>
            <header className="sheet-head">
              <b>{shown.is_me ? '내 프로필' : '프로필'}</b>
              <button className="ghost small" onClick={() => setSel(null)}>
                닫기
              </button>
            </header>
            <div className="sheet-body">{profileView(shown)}</div>
          </div>
        </div>
      )}

      {editing && me && (
        <ProfileEditor
          me={me}
          owned={ownedTitles(progress)}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function ProfileEditor({ me, owned, onClose, onSaved }: { me: RankRow; owned: Set<string>; onClose: () => void; onSaved: () => void }) {
  const [avatar, setAvatar] = useState(me.avatar || 'i_laptop')
  const [nickname, setNickname] = useState(me.nickname)
  const [title, setTitle] = useState(owned.has(me.title) ? me.title : '')
  const [status, setStatus] = useState(me.status_msg)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const left = 40 - [...status].length

  const save = async () => {
    setBusy(true)
    setErr(null)
    try {
      await updateProfile({ nickname, avatar, title, status })
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet rk-edit" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="프로필 설정">
        <header className="sheet-head">
          <b>프로필 설정</b>
          <button className="ghost small" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className="sheet-body auth-form">
          <div>
            <b className="rk-label">프로필 이미지</b>
            <div className="rk-avatars">
              {AVATARS.map((a) => (
                <button key={a} className={avatar === a ? 'on' : ''} onClick={() => setAvatar(a)} aria-label={a} aria-pressed={avatar === a}>
                  <PixelArt name={a} />
                </button>
              ))}
            </div>
          </div>
          <label>
            닉네임 <small className="muted">최대 12자</small>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={12} />
          </label>
          <label>
            대표 칭호 <small className="muted">보유한 칭호 중에서 골라요</small>
            <select value={title} onChange={(e) => setTitle(e.target.value)}>
              <option value="">표시 안 함</option>
              {TITLES.map((t) => (
                <option key={t.id} value={t.id} disabled={!owned.has(t.id)}>
                  {t.name}
                  {owned.has(t.id) ? '' : ` (잠김: ${t.how})`}
                </option>
              ))}
            </select>
          </label>
          <label>
            상태메시지 <small className="muted">{left}자 남음 · 비워 둬도 돼요</small>
            <input value={status} onChange={(e) => setStatus([...e.target.value].slice(0, 40).join(''))} placeholder="오늘도 설계 한 걸음 더." />
          </label>
          {err && <p className="auth-err">{err}</p>}
          <div className="rk-edit-actions">
            <button onClick={onClose}>취소</button>
            <button className="primary" disabled={busy} onClick={save}>
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
