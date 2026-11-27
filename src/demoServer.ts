// 미리보기 전용 가짜 서버 — 실제 Supabase 없이 가입·로그인·동기화 화면을 체험하기 위한 것.
// VITE_DEMO_SERVER=1 로 빌드할 때만 켜진다. 데이터는 이 브라우저의 localStorage에만 저장된다.
export const DEMO_URL = 'https://demo.supabase.invalid'
export const DEMO_INVITE = 'demo'

interface DemoProfile {
  username: string
  nickname: string
  avatar?: string
  title?: string
  status_msg?: string
}
interface DemoState {
  profiles: Record<string, DemoProfile>
  pw: Record<string, string>
  progress: Record<string, { data: unknown; rev: number; stats?: Record<string, number> }>
}
const KEY = 'cloud-quest-demo-server-v3'

function load(): DemoState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s) return s
  } catch {
    /* noop */
  }
  return {
    // 미리보기용 예시 참여자(실제 사용자 아님)
    profiles: {
      'demo-1': { username: 'cloud_dev', nickname: '구름위설계자', avatar: 'a_cat', title: 'perfect', status_msg: '복잡한 구성도 깔끔하게.' },
      'demo-2': { username: 'server_cup', nickname: '서버한잔', avatar: 'a_hamster', title: 'streak7', status_msg: '하루 한 문제, 꾸준히.' },
      'demo-3': { username: 'net_forest', nickname: '네트워크숲', avatar: 'a_panda', title: 'decorator', status_msg: '연결될 때까지 생각하기. 서브넷은 넉넉하게, 보안 그룹은 좁게 잡는 게 원칙이에요.' },
      'demo-4': { username: 'morning_c', nickname: '모닝클라우드', avatar: 'a_rabbit', title: 'first_project', status_msg: '' },
    },
    pw: {},
    progress: {
      'demo-1': { data: {}, rev: 1, stats: { projects: 12, office: 6, teamwork: 120 } },
      'demo-2': { data: {}, rev: 1, stats: { projects: 9, office: 9, teamwork: 150 } },
      'demo-3': { data: {}, rev: 1, stats: { projects: 9, office: 14, teamwork: 60 } },
      'demo-4': { data: {}, rev: 1, stats: { projects: 2, office: 1, teamwork: 15 } },
    },
  }
}
function save(s: DemoState) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' }
const json = (status: number, body: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: cors })

function session(s: DemoState, uid: string) {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: `tok-${uid}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: `ref-${uid}`,
    user: { id: uid, aud: 'authenticated', role: 'authenticated', email: `${s.profiles[uid]?.username}@users.cloud-quest.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  }
}

async function handle(url: URL, init: RequestInit, headers: Headers): Promise<Response> {
  await new Promise((r) => setTimeout(r, 250))
  const s = load()
  const method = (init.method ?? 'GET').toUpperCase()
  const body = typeof init.body === 'string' && init.body ? JSON.parse(init.body) : {}
  const auth = headers.get('authorization') ?? ''
  const uid = auth.startsWith('Bearer tok-') ? auth.slice('Bearer tok-'.length) : null
  const single = (headers.get('accept') ?? '').includes('vnd.pgrst.object')
  const path = url.pathname

  if (path === '/functions/v1/signup') {
    const username = String(body.username ?? '').toLowerCase()
    if (body.invite !== DEMO_INVITE) return json(403, { error: 'invite' })
    if (!/^[a-z0-9_]{4,16}$/.test(username)) return json(400, { error: 'username' })
    if (String(body.password ?? '').length < 6) return json(400, { error: 'password' })
    if (Object.values(s.profiles).some((p) => p.username === username)) return json(409, { error: 'taken' })
    const id = `user-${Date.now().toString(36)}`
    s.profiles[id] = { username, nickname: String(body.nickname ?? '').trim(), avatar: 'i_laptop', title: '', status_msg: '' }
    s.pw[username] = body.password
    save(s)
    return json(200, { ok: true })
  }
  if (path === '/auth/v1/token') {
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      const id = String(body.refresh_token ?? '').replace(/^ref-/, '')
      return s.profiles[id] ? json(200, session(s, id)) : json(400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token' })
    }
    const name = String(body.email ?? '').split('@')[0]
    const id = Object.keys(s.profiles).find((k) => s.profiles[k].username === name)
    if (!id || s.pw[name] !== body.password) return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' })
    return json(200, session(s, id))
  }
  if (path === '/auth/v1/logout') return new Response(null, { status: 204, headers: cors })
  if (path === '/auth/v1/user') {
    if (!uid) return json(401, { msg: 'no session' })
    if (method === 'PUT' && body.password) {
      s.pw[s.profiles[uid].username] = body.password
      save(s)
    }
    return json(200, session(s, uid).user)
  }
  if (path === '/rest/v1/rpc/member_count') return json(200, Object.keys(s.profiles).length)
  if (!uid) return json(401, { message: 'not signed in' })
  if (path === '/rest/v1/rpc/get_ranking') {
    return json(
      200,
      Object.entries(s.profiles).map(([id, p]) => ({
        user_id: id,
        nickname: p.nickname,
        avatar: p.avatar ?? 'i_laptop',
        title: p.title ?? '',
        status_msg: p.status_msg ?? '',
        projects: s.progress[id]?.stats?.projects ?? 0,
        office: s.progress[id]?.stats?.office ?? 0,
        teamwork: s.progress[id]?.stats?.teamwork ?? 0,
        is_me: id === uid,
      })),
    )
  }
  if (path === '/rest/v1/rpc/save_progress') {
    const row = s.progress[uid]
    const comps = (body.p_data?.completions ?? []) as { counted?: boolean }[]
    const stats = { projects: comps.filter((c) => c.counted).length, office: Number(body.p_stats?.office ?? 0), teamwork: Number(body.p_stats?.teamwork ?? 0) }
    if (!row) {
      s.progress[uid] = { data: body.p_data, rev: 1, stats }
      save(s)
      return json(200, 1)
    }
    if (!body.p_force && row.rev !== body.p_base_rev) return json(200, null)
    row.data = body.p_data
    row.stats = stats
    row.rev++
    save(s)
    return json(200, row.rev)
  }
  if (path === '/rest/v1/profiles') {
    if (method === 'PATCH') {
      Object.assign(s.profiles[uid], body)
      save(s)
      return new Response(null, { status: 204, headers: cors })
    }
    const p = s.profiles[uid]
    return json(200, single ? p ?? null : p ? [p] : [])
  }
  if (path === '/rest/v1/progress') {
    const r = s.progress[uid]
    const rows = r ? [{ data: r.data, rev: r.rev }] : []
    return json(200, single ? rows[0] ?? null : rows)
  }
  return json(404, { message: `demo: ${path}` })
}

export function installDemoServer() {
  const real = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!href.startsWith(DEMO_URL)) return real(input, init)
    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
    let req = init
    if (input instanceof Request && !init.body) req = { ...init, method: input.method, body: await input.text() }
    return handle(new URL(href), req, headers)
  }
}
