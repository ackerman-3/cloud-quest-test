// 프로필 설정: 동물 프로필 사진 · 닉네임(랜덤) · 대표 칭호 · 상태메시지. 랭킹·홈 상단·기록 탭 계정 카드에서 연다
import { useEffect, useState } from 'react'
import { updateProfile } from '../cloud'
import { ANIMALS } from '../data/animalArt'
import { randomNickname } from '../data/nicknames'
import { AVATARS, TITLES } from '../data/ranking'
import { AnimalAvatar, animalFor } from './AnimalAvatar'

export interface ProfileValues {
  nickname: string
  avatar?: string
  title?: string
  status?: string
}

export function ProfileEditor({
  initial,
  seed,
  owned,
  onClose,
  onSaved,
}: {
  initial: ProfileValues
  seed?: string
  owned: Set<string>
  onClose: () => void
  onSaved: () => void
}) {
  const [avatar, setAvatar] = useState(animalFor(initial.avatar, seed))
  const [nickname, setNickname] = useState(initial.nickname)
  const [title, setTitle] = useState(initial.title && owned.has(initial.title) ? initial.title : '')
  const [status, setStatus] = useState(initial.status ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const left = 40 - [...status].length

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

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
            <NicknameInput value={nickname} onChange={setNickname} />
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

/** 닉네임 입력 + 랜덤 버튼 */
export function NicknameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <span className="nick-input">
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={12} autoComplete="nickname" />
      <button type="button" className="nick-dice" onClick={() => onChange(randomNickname(value))} aria-label="랜덤 닉네임">
        🎲 랜덤
      </button>
    </span>
  )
}
