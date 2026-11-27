// 계정 카드(기록 탭)와 로그인·가입 시트
import { useEffect, useState, type FormEvent } from 'react'
import { titleName } from '../data/ranking'
import { randomNickname } from '../data/nicknames'
import { ownedTitles, type Progress } from '../store'
import { AnimalAvatar } from './AnimalAvatar'
import { NicknameInput, ProfileEditor } from './ProfileEditor'
import { demoMode, changePassword, memberCount, signIn, signOut, signUp, syncNow, useCloud, USERNAME_RE } from '../cloud'

/** 홈 상단의 작은 계정 표시. 누르면 기록 탭의 계정 카드로 */
export function AccountChip({ onOpen }: { onOpen: () => void }) {
  const c = useCloud()
  if (!c.enabled) return null
  return (
    <button className={`account-chip${c.signedIn ? ' on' : ''}`} onClick={onOpen}>
      <span aria-hidden>{c.signedIn && c.error ? '⚠️' : '👤'}</span>
      <span className="account-chip-name">{c.signedIn ? c.nickname ?? c.username ?? '내 계정' : '로그인'}</span>
    </button>
  )
}

export function AccountCard({ onMessage, progress }: { onMessage: (m: string) => void; progress: Progress }) {
  const c = useCloud()
  const [sheet, setSheet] = useState<null | 'login' | 'signup' | 'password'>(null)
  const [editing, setEditing] = useState(false)
  const [members, setMembers] = useState<number | null>(null)
  const [askLeave, setAskLeave] = useState(false)

  useEffect(() => {
    if (c.enabled) memberCount().then(setMembers)
  }, [c.enabled, c.signedIn])

  if (!c.enabled) return null

  const done = (m: string) => {
    setSheet(null)
    onMessage(m)
  }

  return (
    <section className="card account-card">
      <div className="card-head">
        <h2>계정</h2>
        {members !== null && <span className="pill tiny">참여 중인 아키텍트 {members}명</span>}
      </div>
      {demoMode && (
        <p className="demo-note">
          🧪 미리보기용 가짜 서버예요. 초대 코드 <b>demo</b>로 가입해 보세요. 기록은 이 브라우저에만 저장돼요.
        </p>
      )}
      {!c.signedIn ? (
        <>
          <p className="account-lead">로그인하면 다른 기기에서도 같은 기록으로 이어서 할 수 있어요. 로그인하지 않아도 지금처럼 플레이할 수 있어요.</p>
          <div className="row-wrap">
            <button className="primary" onClick={() => setSheet('login')}>
              로그인
            </button>
            <button onClick={() => setSheet('signup')}>초대 코드로 가입</button>
          </div>
        </>
      ) : (
        <>
          <button className="account-me" onClick={() => setEditing(true)} aria-label="프로필 설정">
            <span className="account-avatar pet" aria-hidden>
              <AnimalAvatar name={c.avatar} seed={c.userId} />
            </span>
            <span className="account-me-text">
              <b className="account-nick">{c.nickname ?? c.username}</b>
              <span className="muted small">
                @{c.username}
                {c.title && titleName(c.title) ? ` · ${titleName(c.title)}` : ''}
              </span>
              {c.status && <span className="account-status">{c.status}</span>}
            </span>
            <span className="account-edit" aria-hidden>
              ✎
            </span>
          </button>
          {c.error && <div className="sync-line bad">⚠️ {c.error}</div>}
          <div className="row-wrap">
            <button className="small" disabled={c.syncing} onClick={() => void syncNow()}>
              새로고침
            </button>
            <button className="small" onClick={() => setEditing(true)}>
              프로필 설정
            </button>
            <button className="small" onClick={() => setSheet('password')}>
              비밀번호 변경
            </button>
            <button
              className="small ghost"
              onClick={async () => {
                if (await signOut()) onMessage('로그아웃했어요. 이 기기의 기록은 그대로 남아요.')
                else setAskLeave(true)
              }}
            >
              로그아웃
            </button>
          </div>
          {askLeave && (
            <div className="reset-confirm">
              <b>아직 계정에 반영되지 않은 기록이 있어요.</b>
              <p>지금 로그아웃해도 이 기기에는 남아 있고, 같은 계정으로 다시 로그인하면 반영돼요.</p>
              <div className="row-wrap">
                <button onClick={() => setAskLeave(false)}>취소</button>
                <button
                  className="danger"
                  onClick={async () => {
                    await signOut(true)
                    setAskLeave(false)
                    onMessage('로그아웃했어요.')
                  }}
                >
                  그래도 로그아웃
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {sheet && <AuthSheet mode={sheet} onClose={() => setSheet(null)} onDone={done} onSwitch={setSheet} />}
      {editing && c.signedIn && (
        <ProfileEditor
          initial={{ nickname: c.nickname ?? '', avatar: c.avatar, title: c.title, status: c.status }}
          seed={c.userId}
          owned={ownedTitles(progress)}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onMessage('프로필을 저장했어요.')
          }}
        />
      )}
    </section>
  )
}

function AuthSheet({
  mode,
  onClose,
  onDone,
  onSwitch,
}: {
  mode: 'login' | 'signup' | 'password'
  onClose: () => void
  onDone: (m: string) => void
  onSwitch: (m: 'login' | 'signup') => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [nickname, setNickname] = useState(mode === 'signup' ? randomNickname() : '')
  const [invite, setInvite] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const title = { login: '로그인', signup: '초대 코드로 가입', password: '비밀번호 변경' }[mode]
  const uname = username.trim().toLowerCase()

  const check = (): string | null => {
    if (mode === 'login') return !uname || !password ? '아이디와 비밀번호를 입력해 주세요.' : null
    if (mode === 'signup') {
      if (!invite.trim()) return '초대 코드를 입력해 주세요.'
      if (!USERNAME_RE.test(uname)) return '아이디는 영문 소문자·숫자·밑줄(_)로 4~16자예요.'
      if (!nickname.trim() || [...nickname.trim()].length > 12) return '닉네임은 1~12자예요.'
    }
    if (password.length < 6) return '비밀번호는 6자 이상이에요.'
    if (password !== password2) return '비밀번호 확인이 맞지 않아요.'
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const bad = check()
    if (bad) return setErr(bad)
    setBusy(true)
    setErr(null)
    try {
      if (mode === 'login') onDone(await signIn(uname, password))
      else if (mode === 'signup') onDone(`가입을 마쳤어요. ${await signUp({ username: uname, password, nickname: nickname.trim(), invite: invite.trim() })}`)
      else {
        await changePassword(password)
        onDone('비밀번호를 바꿨어요.')
      }
    } catch (x) {
      setErr((x as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet auth-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header className="sheet-head">
          <b>{title}</b>
          <button className="ghost small" onClick={onClose}>
            닫기
          </button>
        </header>
        <form className="sheet-body auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              초대 코드
              <input value={invite} onChange={(e) => setInvite(e.target.value)} autoComplete="off" autoCapitalize="none" />
            </label>
          )}
          {(mode === 'login' || mode === 'signup') && (
            <label>
              아이디
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={16}
                placeholder={mode === 'signup' ? '영문 소문자·숫자·_ 4~16자' : ''}
              />
            </label>
          )}
          {mode === 'signup' && (
            <label>
              닉네임 <small className="muted">다른 참여자에게 보여요 · 최대 12자</small>
              <NicknameInput value={nickname} onChange={setNickname} />
            </label>
          )}
          <label>
            {mode === 'password' ? '새 비밀번호' : '비밀번호'}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? '' : '6자 이상'}
            />
          </label>
          {(mode === 'signup' || mode === 'password') && (
            <label>
              비밀번호 확인
              <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
            </label>
          )}
          {err && <p className="auth-err">{err}</p>}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? '잠시만요…' : title}
          </button>
          {mode === 'login' && (
            <p className="muted small auth-foot">
              계정이 없나요?{' '}
              <button type="button" className="linkish" onClick={() => onSwitch('signup')}>
                초대 코드로 가입
              </button>
              <br />
              비밀번호를 잊었으면 관리자에게 재설정을 요청해 주세요.
            </p>
          )}
          {mode === 'signup' && (
            <p className="muted small auth-foot">
              가입하면 이 기기의 기록이 계정에 연결돼요. 아이디는 나중에 바꿀 수 없어요.{' '}
              <button type="button" className="linkish" onClick={() => onSwitch('login')}>
                이미 계정이 있어요
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
