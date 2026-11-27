// 클라우드 퀘스트 가입 함수 (Supabase Edge Function: signup)
// 초대 코드를 확인한 뒤 아이디+비밀번호 계정과 프로필을 만든다.
// - 초대 코드는 Edge Function Secrets의 INVITE_CODE에만 있다(앱·저장소에 없음).
// - 아이디는 로그인용 가짜 이메일(아이디@users.cloud-quest.invalid)로 바꿔 저장한다.
//   관리자 API로 만들기 때문에 메일은 발송되지 않는다.
import { createClient } from 'npm:@supabase/supabase-js@2'

const EMAIL_DOMAIN = 'users.cloud-quest.invalid'
const USERNAME_RE = /^[a-z0-9_]{4,16}$/

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function sameText(a: string, b: string) {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'method' })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return reply(400, { error: 'bad_request' })
  }
  const username = String(body.username ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const nickname = String(body.nickname ?? '').trim()
  const invite = String(body.invite ?? '').trim()

  const inviteCode = Deno.env.get('INVITE_CODE') ?? ''
  if (!inviteCode) return reply(500, { error: 'invite_not_set' })
  if (!sameText(invite, inviteCode)) {
    await new Promise((r) => setTimeout(r, 800)) // 초대 코드 무작위 대입을 느리게
    return reply(403, { error: 'invite' })
  }
  if (!USERNAME_RE.test(username)) return reply(400, { error: 'username' })
  if (password.length < 6 || password.length > 72) return reply(400, { error: 'password' })
  if (nickname.length < 1 || [...nickname].length > 12 || /[\p{Cc}]/u.test(nickname)) return reply(400, { error: 'nickname' })

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  // 새 방식(secret 키 목록)을 먼저 쓰고, 없으면 예전 service_role 키
  let key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  try {
    key = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? key
  } catch {
    /* 예전 키 사용 */
  }
  if (!url || !key) return reply(500, { error: 'server_key' })
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: taken } = await admin.from('profiles').select('id').eq('username', username).maybeSingle()
  if (taken) return reply(409, { error: 'taken' })

  const { data: created, error } = await admin.auth.admin.createUser({
    email: `${username}@${EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (error || !created.user) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('already') || msg.includes('exists')) return reply(409, { error: 'taken' })
    if (msg.includes('password')) return reply(400, { error: 'password', detail: error?.message })
    return reply(500, { error: 'create_failed' })
  }

  const { error: pErr } = await admin.from('profiles').insert({ id: created.user.id, username, nickname })
  if (pErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return reply(pErr.code === '23505' ? 409 : 500, { error: pErr.code === '23505' ? 'taken' : 'profile_failed' })
  }

  return reply(200, { ok: true })
})
