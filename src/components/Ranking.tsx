// 랭킹: 3개 분야(탭) · 상위 3명 시상대 · 4위부터 목록 · 아래 고정 "나" 바 · 프로필 보기/설정
import { useCallback, useEffect, useMemo, useState } from 'react'
import { demoMode, fetchRanking, updateProfile, useCloud, type RankRow } from '../cloud'
import { ANIMALS } from '../data/animalArt'
import { AVATARS, CATEGORIES, PERIOD_LABEL, QUESTIONS, TITLES, titleName, type CategoryId } from '../data/ranking'
import { ownedTitles, type Progress } from '../store'
import { AnimalAvatar, animalFor } from './AnimalAvatar'
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
  const none = rows.filter((r) => r[cat] <= 0).sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'))
  return [...out, ...none.map((r) => ({ ...r, rank: null, tie: false }))]
}

const rankText = (r: { rank: number | null; tie: boolean }) => (r.rank == null ? '순위 없음' : `${r.tie ? '공동 ' : ''}${r.rank}위`)
const fmt = (n: number) => n.toLocaleString('ko-KR')

function Crown({ place }: { place: number }) {
  return (
    <span className={`rk-crown c${place}`} aria-hidden>
      <svg viewBox="0 0 24 16">
        <path d="M2 14 L2 4 L7.5 9 L12 2 L16.5 9 L22 4 L22 14 Z" />
      </svg>
      <b>{place}</b>
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
  const shown = rows?.find((r) => r.user_id === sel) ?? null
  const category = CATEGORIES.find((c) => c.id === cat)!
  const withRec = ranked.filter((r) => r.rank != null)
  const podium = withRec.slice(0, 3)
  const rest = ranked.filter((r) => !podium.includes(r))
  const meRow = ranked.find((r) => r.is_me)

  const head = (
    <header className="rk-head">
      <button className="rk-back" onClick={onBack} aria-label="홈으로">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M15 5 L8 12 L15 19" />
        </svg>
      </button>
      <b>랭킹</b>
    </header>
  )

  if (!cloud.enabled || !cloud.signedIn) {
    return (
      <div className="ranking">
        {head}
        <section className="rk-empty">
          <div className="rk-empty-pets">
            {['a_cat', 'a_rabbit', 'a_bear'].map((a) => (
              <AnimalAvatar key={a} name={a} className="rk-empty-pet" />
            ))}
          </div>
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

  const scoreOf = (r: RankRow) => (
    <>
      {fmt(r[cat])}
      <small>{category.unit}</small>
    </>
  )

  // 시상대 자리: 2위 · 1위 · 3위 순서로 놓는다
  const seats = [podium[1], podium[0], podium[2]]

  return (
    <div className="ranking">
      {head}

      <div className="rk-intro">
        <div className="rk-tabs" role="tablist">
          {CATEGORIES.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <h1>{QUESTIONS[cat]}</h1>
        <p>
          {category.rule} · {PERIOD_LABEL}
        </p>
        {demoMode && <p className="rk-demo">미리보기용 예시 데이터예요. 실제 순위가 아니에요.</p>}
      </div>

      <section className={`rk-podium ${cat}`}>
        {err ? (
          <div className="rk-band-msg">
            <p>{err}</p>
            <button className="ghost small" onClick={load}>
              다시 시도
            </button>
          </div>
        ) : !rows ? (
          <div className="rk-seats loading" aria-busy="true">
            {[2, 1, 3].map((p) => (
              <div key={p} className={`rk-seat p${p} skel`} />
            ))}
          </div>
        ) : (
          <div className="rk-seats">
            {seats.map((r, i) => {
              const place = [2, 1, 3][i]
              return r ? (
                <button key={r.user_id} className={`rk-seat p${place} ${r.is_me ? 'me' : ''}`} onClick={() => setSel(r.user_id)}>
                  <Crown place={r.rank ?? place} />
                  <AnimalAvatar name={r.avatar} seed={r.user_id} className="rk-seat-pet" />
                  <span className="rk-seat-name">{r.nickname}</span>
                  <b className="rk-seat-score">{scoreOf(r)}</b>
                  {r.title && titleName(r.title) ? <span className="rk-seat-title">{titleName(r.title)}</span> : <span className="rk-seat-title none">{r.tie ? '공동' : ' '}</span>}
                </button>
              ) : (
                <div key={`empty-${place}`} className={`rk-seat p${place} empty`}>
                  <Crown place={place} />
                  <span className="rk-seat-q">?</span>
                  <span className="rk-seat-name">도전자 모집 중</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rk-board">
        <div className="rk-board-head">
          <span>
            총 <b>{rows ? fmt(rows.length) : '-'}명</b> 참여 중
          </span>
          <span>{category.name}</span>
        </div>
        {rows && withRec.length === 0 && <p className="rk-state">아직 이 분야의 기록이 없어요. 첫 기록의 주인공이 되어 보세요.</p>}
        <ul className="rk-list">
          {rest.map((r) => (
            <li key={r.user_id}>
              <button className={`rk-row ${r.is_me ? 'me' : ''}`} onClick={() => setSel(r.user_id)}>
                <span className="rk-rank">
                  {r.rank ?? '-'}
                  {r.tie && <small>공동</small>}
                </span>
                <AnimalAvatar name={r.avatar} seed={r.user_id} className="rk-pet" />
                <span className="rk-who">
                  <span className="rk-line1">
                    <b>{r.nickname}</b>
                    {r.is_me && <em className="rk-me">나</em>}
                    {r.title && titleName(r.title) && <span className="rk-title">{titleName(r.title)}</span>}
                  </span>
                  {r.status_msg && <span className="rk-status">{r.status_msg}</span>}
                </span>
                <span className="rk-score">{r.rank == null ? <small>미집계</small> : scoreOf(r)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {meRow && (
        <button className="rk-mebar" onClick={() => setSel(meRow.user_id)} aria-label="내 프로필">
          <span className="rk-rank">
            {meRow.rank ?? '-'}
            {meRow.tie && <small>공동</small>}
          </span>
          <AnimalAvatar name={meRow.avatar} seed={meRow.user_id} className="rk-pet" />
          <span className="rk-who">
            <b>나</b>
            <small>{meRow.nickname}</small>
          </span>
          <span className="rk-score">{meRow.rank == null ? <small>미집계</small> : scoreOf(meRow)}</span>
        </button>
      )}

      {shown && (
        <div className="sheet-back" onClick={() => setSel(null)}>
          <div className="sheet rk-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${shown.nickname} 프로필`}>
            <header className="sheet-head">
              <b>{shown.is_me ? '내 프로필' : '프로필'}</b>
              <button className="ghost small" onClick={() => setSel(null)}>
                닫기
              </button>
            </header>
            <div className="sheet-body rk-profile">
              <div className="rk-p-top">
                <AnimalAvatar name={shown.avatar} seed={shown.user_id} className="rk-p-pet" />
                <b className="rk-p-name">
                  {shown.nickname}
                  {shown.is_me && <em className="rk-me">나</em>}
                </b>
                {shown.title && titleName(shown.title) && <span className="rk-title">{titleName(shown.title)}</span>}
              </div>
              <p className={`rk-p-status ${shown.status_msg ? '' : 'none'}`}>{shown.status_msg || '상태메시지가 없어요'}</p>
              <ul className="rk-p-ranks">
                {CATEGORIES.map((c) => {
                  const x = byCat[c.id]?.find((y) => y.user_id === shown.user_id)
                  return (
                    <li key={c.id}>
                      <PixelArt name={c.icon} className="rk-p-icon" />
                      <span>{c.name}</span>
                      <b>{x ? rankText(x) : '-'}</b>
                      <small>
                        {fmt(shown[c.id])}
                        {c.unit}
                      </small>
                    </li>
                  )
                })}
              </ul>
              {shown.is_me && (
                <button className="play-btn" onClick={() => setEditing(true)}>
                  프로필 설정
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && shown?.is_me && (
        <ProfileEditor
          me={shown}
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
  const [avatar, setAvatar] = useState(animalFor(me.avatar, me.user_id))
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
          <div className="rk-edit-preview">
            <AnimalAvatar name={avatar} className="rk-p-pet" />
            <small>{ANIMALS[avatar]?.label}</small>
          </div>
          <div>
            <b className="rk-label">프로필 사진</b>
            <div className="rk-avatars">
              {AVATARS.map((a) => (
                <button key={a} className={avatar === a ? 'on' : ''} onClick={() => setAvatar(a)} aria-label={ANIMALS[a].label} aria-pressed={avatar === a}>
                  <AnimalAvatar name={a} />
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
