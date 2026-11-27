// 서버(Supabase) 연결 정보 — 설정 방법은 SERVER-SETUP.md
// 두 값이 비어 있으면 계정 기능이 화면에 나타나지 않고 지금처럼 기기에만 저장한다.
// Publishable 키(sb_publishable_…, 예전 이름 anon 키)는 앱에 넣어 공개해도 되는 키다.
// 기록 보호는 supabase/schema.sql의 보안 규칙(RLS)이 맡는다. secret/service_role 키는 절대 넣지 않는다.
export const SUPABASE_URL = 'https://rryifvfwrrxzohawlrrc.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_3nNmx3pgqou1kotddVvdNA_LLjbe4BH'

/** 아이디를 로그인용 이메일 형식으로 바꿀 때 쓰는 주소. supabase/functions/signup/index.ts의 EMAIL_DOMAIN과 같아야 한다 */
export const USER_EMAIL_DOMAIN = 'users.cloud-quest.invalid'
