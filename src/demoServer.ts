// 미리보기 전용 가짜 서버 — 실제 Supabase 없이 가입·로그인·동기화 화면을 체험하기 위한 것.
// VITE_DEMO_SERVER=1 로 빌드할 때만 켜진다. 데이터는 이 브라우저의 localStorage에만 저장된다.
export const DEMO_URL = 'https://demo.supabase.invalid'
export const DEMO_INVITE = 'demo'

interface DemoState {
  profiles: Record<string, { username: string; nickname: string }>
  pw: Record<string, string>
  progress: Record<string, { data: unknown; rev: number }>
}
const KEY = 'cloud-quest-demo-server'

function load(): DemoState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s) return s
  } catch {
    /* noop */
  }
  return {
    profiles: {
      'demo-1': { username: 'cloud_dev', nickname: '구름위설계자' },
      'demo-2': { username: 'server_cup', nickname: '서버한잔' },
      'demo-3': { username: 'net_forest', nickname: '네트워크숲' },
    },
    pw: {},
    progress: {},
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
    s.profiles[id] = { username, nickname: String(body.nickname ?? '').trim() }
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
  if (path === '/rest/v1/rpc/save_progress') {
    const row = s.progress[uid]
    if (!row) {
      s.progress[uid] = { data: body.p_data, rev: 1 }
      save(s)
      return json(200, 1)
    }
    if (!body.p_force && row.rev !== body.p_base_rev) return json(200, null)
    row.data = body.p_data
    row.rev++
    save(s)
    return json(200, row.rev)
  }
  if (path === '/rest/v1/profiles') {
    if (method === 'PATCH') {
      s.profiles[uid].nickname = body.nickname
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
