import { callBoardRpc } from './cloud'
import { validateComment, validatePost, type BoardCategory, type BoardDetail, type BoardList, type BoardStatus, type PostDraft } from './data/board'

export const boardMeta = () => callBoardRpc<{ is_admin: boolean }>('board_meta')
export const listBoard = (page: number, category: BoardCategory | 'all', mine: boolean, search: string) =>
  callBoardRpc<BoardList>('board_list', { p_offset: page * 20, p_category: category, p_mine: mine, p_search: search.trim().slice(0, 80) })
export const getBoardPost = (id: string, offset = 0) => callBoardRpc<BoardDetail>('board_get', { p_post_id: id, p_comments_offset: offset })
export function createBoardPost(draft: PostDraft, requestId: string) {
  const d = validatePost(draft)
  return callBoardRpc<string>('board_create', { p_title: d.title, p_body: d.body, p_category: d.category, p_color: d.color, p_secret: d.is_secret, p_request_id: requestId })
}
export const addBoardComment = (id: string, text: string, secret: boolean, requestId: string) =>
  callBoardRpc<string>('board_comment', { p_post_id: id, p_body: validateComment(text), p_secret: secret, p_request_id: requestId })
export const deleteBoardPost = (id: string) => callBoardRpc<null>('board_delete_post', { p_post_id: id })
export const deleteBoardComment = (id: string) => callBoardRpc<null>('board_delete_comment', { p_comment_id: id })
export const setBoardStatus = (id: string, status: BoardStatus) => callBoardRpc<null>('board_status', { p_post_id: id, p_status: status })
