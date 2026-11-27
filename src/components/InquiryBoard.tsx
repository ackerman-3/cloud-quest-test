import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useCloud, type CloudState } from '../cloud'
import { addBoardComment, boardMeta, createBoardPost, deleteBoardComment, deleteBoardPost, getBoardPost, listBoard, setBoardStatus } from '../board'
import { BOARD_CATEGORIES, NOTE_COLORS, boardLength, categoryName, type BoardCategory, type BoardDetail, type BoardList, type PostDraft } from '../data/board'
import '../board.css'

const newDraft = (): PostDraft => ({ title: '', body: '', category: 'inquiry', color: 'lemon', is_secret: false })
const dateText = (date: string) => new Date(date).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const message = (error: unknown) => error instanceof Error ? error.message : '처리하지 못했어요. 다시 시도해 주세요.'
type Props = { onBack: () => void; onLogin: () => void }

/** 계정이 바뀌면 화면 상태도 새로 만든다. 비밀글·입력 초안은 localStorage에 저장하지 않는다. */
export function InquiryBoard(props: Props) {
  const cloud = useCloud()
  return <BoardSession key={`${cloud.signedIn}:${cloud.userId ?? ''}`} {...props} cloud={cloud} />
}

function BoardSession({ onBack, onLogin, cloud }: Props & { cloud: CloudState }) {
  const [view, setView] = useState<'list' | 'compose' | 'detail'>('list')
  const [list, setList] = useState<BoardList | null>(null)
  const [detail, setDetail] = useState<BoardDetail | null>(null)
  const [admin, setAdmin] = useState(false)
  const [category, setCategory] = useState<BoardCategory | 'all'>('all')
  const [mine, setMine] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<PostDraft>(newDraft)
  const [comment, setComment] = useState('')
  const [secretComment, setSecretComment] = useState(false)
  const postRequest = useRef('')
  const commentRequest = useRef('')
  const listRequest = useRef(0)
  const detailRequest = useRef(0)
  const busy = useRef(false)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => { live.current = false; listRequest.current++; detailRequest.current++ }
  }, [])

  useEffect(() => {
    if (!cloud.enabled || !cloud.signedIn || view !== 'list') return
    const request = ++listRequest.current
    setList(null)
    setLoading(true)
    setError(null)
    const timer = window.setTimeout(() => {
      Promise.all([listBoard(page, category, mine, search), boardMeta()])
        .then(([rows, meta]) => {
          if (!live.current || request !== listRequest.current) return
          setList(rows); setAdmin(meta.is_admin)
        })
        .catch((e: unknown) => { if (live.current && request === listRequest.current) setError(message(e)) })
        .finally(() => { if (live.current && request === listRequest.current) setLoading(false) })
    }, 250)
    return () => { window.clearTimeout(timer); listRequest.current++ }
  }, [cloud.enabled, cloud.signedIn, view, page, category, mine, search, refresh])

  const loadDetail = useCallback(async (id: string, offset = 0) => {
    const request = ++detailRequest.current
    setLoading(true); setDetail(null); setError(null)
    try {
      const next = await getBoardPost(id, offset)
      if (live.current && request === detailRequest.current) setDetail(next)
    } catch (e) {
      if (live.current && request === detailRequest.current) setError(message(e))
    } finally {
      if (live.current && request === detailRequest.current) setLoading(false)
    }
  }, [])

  const toList = () => {
    if (busy.current) return
    detailRequest.current++
    setView('list'); setDetail(null); setError(null); setNotice(null); setRefresh((n) => n + 1)
  }
  const openPost = (id: string) => {
    listRequest.current++
    setView('detail'); setComment(''); setSecretComment(false); setNotice(null)
    commentRequest.current = crypto.randomUUID()
    void loadDetail(id)
    window.scrollTo(0, 0)
  }
  const compose = () => {
    listRequest.current++
    setDraft(newDraft()); postRequest.current = crypto.randomUUID()
    setView('compose'); setError(null); setNotice(null)
    window.scrollTo(0, 0)
  }
  const mutate = async (action: () => Promise<unknown>, done: () => void | Promise<void>) => {
    if (busy.current) return
    busy.current = true; setWorking(true); setError(null); setNotice(null)
    try { await action(); if (live.current) await done() }
    catch (e) { if (live.current) setError(message(e)) }
    finally { busy.current = false; if (live.current) setWorking(false) }
  }
  const submitPost = (e: FormEvent) => {
    e.preventDefault()
    let created = ''
    void mutate(async () => { created = await createBoardPost(draft, postRequest.current) }, async () => {
      setDraft(newDraft()); setView('detail'); setComment(''); setSecretComment(false)
      commentRequest.current = crypto.randomUUID()
      await loadDetail(created); setNotice('메모를 남겼어요.')
    })
  }
  const submitComment = (e: FormEvent) => {
    e.preventDefault()
    if (!detail) return
    const post = detail.post
    const offset = Math.floor(post.comment_count / 50) * 50
    void mutate(() => addBoardComment(post.id, comment, secretComment || post.is_secret, commentRequest.current), async () => {
      setComment(''); setSecretComment(false); commentRequest.current = crypto.randomUUID()
      await loadDetail(post.id, offset); setNotice('댓글을 남겼어요.')
    })
  }
  const back = () => {
    if (working) return
    if (view === 'compose' && (draft.title.trim() || draft.body.trim()) && !window.confirm('작성 중인 메모를 닫을까요? 내용은 저장되지 않아요.')) return
    if (view === 'list') onBack(); else toList()
  }

  const head = <header className="ib-head">
    <button type="button" onClick={back} disabled={working} aria-label={view === 'list' ? '홈으로' : '게시판 목록으로'}>‹</button>
    <b>{view === 'compose' ? '메모 남기기' : '문의 게시판'}</b>
    {view === 'list' && cloud.signedIn ? <button type="button" onClick={() => setRefresh((n) => n + 1)} aria-label="새로고침" disabled={loading}>↻</button> : <span />}
  </header>

  if (!cloud.enabled || !cloud.signedIn) return <div className="inquiry-board">{head}<section className="ib-login">
    <span className="ib-big-note" aria-hidden>✎</span><h1>궁금한 점을 메모로 남겨 주세요</h1>
    <p>문의사항, 원하는 기능, 발견한 오류를 함께 이야기해요.<br />로그인하면 글과 댓글을 남길 수 있어요.</p>
    {cloud.enabled ? <button className="ib-primary" onClick={onLogin}>로그인하러 가기</button> : <p>게시판을 준비 중이에요.</p>}
  </section></div>

  return <div className="inquiry-board">{head}<main className="ib-main">
    {notice && <p className="ib-notice" role="status">{notice}</p>}
    {error && <div className="ib-error" role="alert">{error}{view === 'list' && <button type="button" onClick={() => setRefresh((n) => n + 1)}>다시 시도</button>}{view === 'detail' && !detail && <button type="button" onClick={toList}>목록으로</button>}</div>}
    {view === 'list' && <>
      <section className="ib-intro"><div><small>CLOUD QUEST · OFFICE BOARD</small><h1>한 장의 메모를 남겨 주세요</h1><p>궁금한 점도, 있었으면 하는 기능도 편하게요.</p></div><button className="ib-primary" onClick={compose}>＋ 메모 남기기</button></section>
      <div className="ib-tools"><div className="ib-tabs" aria-label="문의 유형">
        {[{ id: 'all', label: '전체' }, ...BOARD_CATEGORIES].map((c) => <button type="button" key={c.id} className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => { setCategory(c.id as BoardCategory | 'all'); setPage(0) }}>{c.label}</button>)}
      </div><label className="ib-mine"><input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); setPage(0) }} />내 글만</label></div>
      <label className="ib-search"><span aria-hidden>⌕</span><input aria-label="제목과 내용 검색" placeholder="어떤 메모를 찾고 있나요?" maxLength={80} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} /></label>
      <p className="ib-privacy">🔒 비밀글은 글쓴이와 운영자에게만 보여요.</p>
      {loading && <p className="ib-empty" role="status">메모를 가져오는 중이에요…</p>}
      {list && !list.posts.length && <div className="ib-empty"><b>{search || mine || category !== 'all' ? '조건에 맞는 메모가 없어요' : '아직 붙어 있는 메모가 없어요'}</b><p>첫 번째 이야기를 남겨 주세요.</p><button type="button" className="ib-primary" onClick={compose}>메모 남기기</button></div>}
      {list && <div className="ib-wall">{list.posts.map((post) => <button type="button" className={`ib-note note-${post.color}`} key={post.id} onClick={() => openPost(post.id)}>
        <i className="ib-pin" aria-hidden /><span className="ib-note-top"><span>{categoryName(post.category)}</span><em className={post.status === 'answered' ? 'answered' : ''}>{post.status === 'answered' ? '답변 완료' : '접수'}</em></span>
        <strong>{post.is_secret && <span aria-label="비밀글">🔒 </span>}{post.title}</strong><p>{post.excerpt}</p>
        <span className="ib-note-bottom"><span>{post.nickname}{post.is_mine ? ' · 나' : ''}</span><span>댓글 {post.comment_count}</span></span><time dateTime={post.created_at}>{dateText(post.created_at)}</time>
      </button>)}</div>}
      {list && (page > 0 || list.has_more) && <nav className="ib-pages" aria-label="게시글 페이지"><button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</button><span>{page + 1} 페이지</span><button disabled={!list.has_more} onClick={() => setPage((p) => p + 1)}>다음</button></nav>}
    </>}

    {view === 'compose' && <form className={`ib-compose note-${draft.color}`} onSubmit={submitPost}>
      <i className="ib-pin" aria-hidden /><h1>어떤 이야기를 남길까요?</h1>
      <fieldset disabled={working}><legend>메모 유형</legend><div className="ib-tabs">{BOARD_CATEGORIES.map((c) => <button type="button" key={c.id} className={draft.category === c.id ? 'active' : ''} aria-pressed={draft.category === c.id} onClick={() => setDraft({ ...draft, category: c.id })}>{c.label}</button>)}</div></fieldset>
      <fieldset disabled={working}><legend>메모 색상</legend><div className="ib-colors">{NOTE_COLORS.map((c) => <button type="button" key={c.id} className={`note-${c.id} ${draft.color === c.id ? 'selected' : ''}`} aria-label={`${c.label} 메모`} aria-pressed={draft.color === c.id} onClick={() => setDraft({ ...draft, color: c.id })}>{draft.color === c.id ? '✓' : ''}</button>)}</div></fieldset>
      <label className="ib-field">제목<input aria-label="제목" required maxLength={80} placeholder="한눈에 알 수 있는 제목을 적어 주세요" value={draft.title} disabled={working} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><small>{boardLength(draft.title)}/80</small></label>
      <label className="ib-field">내용<textarea aria-label="내용" required maxLength={3000} rows={8} placeholder="궁금한 점이나 원하는 기능을 자유롭게 적어 주세요" value={draft.body} disabled={working} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /><small>{boardLength(draft.body)}/3,000</small></label>
      <label className="ib-check"><input type="checkbox" checked={draft.is_secret} disabled={working} onChange={(e) => setDraft({ ...draft, is_secret: e.target.checked })} />🔒 비밀글로 남기기</label>
      <p className="ib-privacy">{draft.is_secret ? '글쓴이와 운영자만 제목과 내용을 볼 수 있어요.' : '로그인한 동료들이 제목과 내용을 볼 수 있어요.'}</p>
      <div className="ib-actions"><button type="button" className="ib-secondary" disabled={working} onClick={back}>취소</button><button className="ib-primary" disabled={working || !draft.title.trim() || !draft.body.trim()}>{working ? '붙이는 중…' : '게시판에 붙이기'}</button></div>
    </form>}

    {view === 'detail' && <>
      {loading && <p role="status" className="ib-empty">메모를 여는 중이에요…</p>}
      {detail && <>
        <article className={`ib-detail note-${detail.post.color}`}><i className="ib-pin" aria-hidden /><div className="ib-note-top"><span>{categoryName(detail.post.category)}{detail.post.is_secret ? ' · 🔒 비밀글' : ''}</span><em className={detail.post.status === 'answered' ? 'answered' : ''}>{detail.post.status === 'answered' ? '답변 완료' : '접수'}</em></div>
          <h1>{detail.post.title}</h1><p className="ib-byline">{detail.post.nickname}{detail.post.is_mine ? ' · 나' : ''} · {dateText(detail.post.created_at)}</p><p className="ib-body">{detail.post.body}</p>
          <div className="ib-post-actions">{admin && <button disabled={working} onClick={() => void mutate(() => setBoardStatus(detail.post.id, detail.post.status === 'open' ? 'answered' : 'open'), () => loadDetail(detail.post.id, detail.comments_offset))}>{detail.post.status === 'open' ? '답변 완료로 표시' : '다시 접수로 표시'}</button>}
          {(admin || detail.post.is_mine) && <button className="ib-delete" disabled={working} onClick={() => { if (window.confirm('이 메모와 댓글을 모두 삭제할까요?')) void mutate(() => deleteBoardPost(detail.post.id), () => { setView('list'); setDetail(null); setRefresh((n) => n + 1); setNotice('메모를 삭제했어요.') }) }}>글 삭제</button>}</div>
        </article>
        <section className="ib-comments"><h2>이 메모에 남긴 이야기 <span>{detail.post.comment_count}</span></h2>
          {!detail.comments.length && <p className="ib-privacy">아직 댓글이 없어요. 첫 이야기를 남겨 주세요.</p>}
          {detail.comments.map((c) => <article key={c.id} className={`ib-comment ${c.is_admin ? 'from-admin' : ''}`}><div><b>{c.nickname}</b>{c.is_admin && <em>운영자</em>}{c.is_mine && <small>나</small>}{c.is_secret && <span>🔒 비밀 댓글</span>}<time dateTime={c.created_at}>{dateText(c.created_at)}</time></div><p className="ib-body">{c.body}</p>
            {(c.is_mine || admin) && <button className="ib-delete" disabled={working} onClick={() => { if (window.confirm('이 댓글을 삭제할까요?')) void mutate(() => deleteBoardComment(c.id), () => loadDetail(detail.post.id, detail.comments_offset)) }}>삭제</button>}
          </article>)}
          {(detail.comments_offset > 0 || detail.comments_more) && <nav className="ib-pages" aria-label="댓글 페이지"><button disabled={working || detail.comments_offset === 0} onClick={() => void loadDetail(detail.post.id, detail.comments_offset - 50)}>이전 댓글</button><span>{Math.floor(detail.comments_offset / 50) + 1} 페이지</span><button disabled={working || !detail.comments_more} onClick={() => void loadDetail(detail.post.id, detail.comments_offset + 50)}>다음 댓글</button></nav>}
          <form onSubmit={submitComment} className="ib-comment-form"><label className="ib-field">댓글 남기기<textarea aria-label="댓글 내용" rows={4} required maxLength={1500} value={comment} disabled={working} onChange={(e) => setComment(e.target.value)} placeholder={admin ? '문의에 대한 답변을 적어 주세요' : '이 메모에 대한 이야기를 남겨 주세요'} /><small>{boardLength(comment)}/1,500</small></label>
            <label className="ib-check"><input type="checkbox" checked={secretComment || detail.post.is_secret} disabled={working || detail.post.is_secret} onChange={(e) => setSecretComment(e.target.checked)} />🔒 비밀 댓글</label>
            <p className="ib-privacy">{detail.post.is_secret ? '비밀글의 댓글도 글쓴이와 운영자만 볼 수 있어요.' : secretComment ? '댓글 작성자·게시글 작성자·운영자만 볼 수 있어요.' : '로그인한 동료들이 댓글을 볼 수 있어요.'}</p>
            <div className="ib-actions"><button className="ib-primary" disabled={working || !comment.trim()}>{working ? '등록 중…' : admin ? '답변 남기기' : '댓글 남기기'}</button></div>
          </form>
        </section>
      </>}
    </>}
  </main></div>
}
