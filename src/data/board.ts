export const BOARD_CATEGORIES = [
  { id: 'inquiry', label: '문의' },
  { id: 'idea', label: '건의' },
  { id: 'bug', label: '오류 제보' },
] as const
export const NOTE_COLORS = [
  { id: 'lemon', label: '노랑' }, { id: 'rose', label: '분홍' },
  { id: 'lilac', label: '보라' }, { id: 'mint', label: '초록' },
  { id: 'sky', label: '하늘' }, { id: 'peach', label: '살구' },
] as const
export type BoardCategory = (typeof BOARD_CATEGORIES)[number]['id']
export type NoteColor = (typeof NOTE_COLORS)[number]['id']
export type BoardStatus = 'open' | 'answered'
export interface BoardPost {
  id: string
  title: string
  excerpt: string
  body?: string
  category: BoardCategory
  color: NoteColor
  is_secret: boolean
  status: BoardStatus
  created_at: string
  nickname: string
  is_mine: boolean
  comment_count: number
}
export interface BoardComment {
  id: string
  body: string
  is_secret: boolean
  created_at: string
  nickname: string
  is_mine: boolean
  is_admin: boolean
}
export interface BoardList { posts: BoardPost[]; has_more: boolean }
export interface BoardDetail { post: BoardPost & { body: string }; comments: BoardComment[]; comments_more: boolean; comments_offset: number }
export interface PostDraft { title: string; body: string; category: BoardCategory; color: NoteColor; is_secret: boolean }
export const categoryName = (id: string) => BOARD_CATEGORIES.find((c) => c.id === id)?.label ?? '문의'
export const boardLength = (text: string) => [...text].length
const badControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
export function validatePost(draft: PostDraft): PostDraft {
  const title = draft.title.trim()
  const body = draft.body.trim()
  if (!title || boardLength(title) > 80 || /[\r\n\t]/.test(title) || badControl.test(title)) throw new Error('제목은 줄바꿈 없이 1~80자로 적어 주세요.')
  if (!body || boardLength(body) > 3000 || badControl.test(body)) throw new Error('내용은 1~3,000자로 적어 주세요.')
  if (!BOARD_CATEGORIES.some((c) => c.id === draft.category) || !NOTE_COLORS.some((c) => c.id === draft.color) || typeof draft.is_secret !== 'boolean') throw new Error('글 설정을 다시 확인해 주세요.')
  return { ...draft, title, body }
}
export function validateComment(text: string): string {
  const body = text.trim()
  if (!body || boardLength(body) > 1500 || badControl.test(body)) throw new Error('댓글은 1~1,500자로 적어 주세요.')
  return body
}
