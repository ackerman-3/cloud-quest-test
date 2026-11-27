# 서버(Supabase) 설정 안내 — 여러 사람이 함께 쓰기

클라우드 퀘스트는 원래 기기에만 기록을 저장합니다. 아래 설정을 마치면 **초대 코드로 가입 → 아이디·비밀번호 로그인 → 기록이 서버에 저장**됩니다. 같은 계정이면 아이폰·PC 등 여러 기기에서 이어서 할 수 있습니다. 나중에 만들 명예의 전당은 이 서버 기록으로 순위를 매깁니다.

- 비용: Supabase 무료 플랜으로 충분합니다(월 활성 사용자 5만 명, DB 500MB).
- **주의:** 무료 프로젝트는 **1주일 동안 아무도 접속하지 않으면 일시 정지**됩니다. 정지되면 대시보드에서 프로젝트를 열어 **Restore**를 누르면 됩니다. 그동안 앱은 기기 저장으로 계속 동작합니다.
- 메뉴 이름은 Supabase가 화면을 바꾸면 조금 다를 수 있습니다.

## 1. 프로젝트 만들기
1. **supabase.com** → 가입/로그인 → **New project**
2. 설정
   - Name: `cloud-quest`
   - Database Password: 아무 값이나 길게 입력하고 **따로 보관**(앱에는 쓰지 않음)
   - Region: **Northeast Asia (Seoul)**
3. **Create new project** → 1~2분 기다리기

## 2. 테이블과 보안 규칙 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 폴더의 `supabase/schema.sql` 내용을 **전부** 붙여 넣고 **Run**
3. "Success. No rows returned"가 나오면 완료(여러 번 실행해도 괜찮습니다)

## 3. 아무나 가입하지 못하게 막기
1. 왼쪽 메뉴 **Authentication** → **Sign In / Providers**
2. **Allow new users to sign up** 를 **끄고** 저장
3. 아래 **Email** 항목은 켜진 상태로 둡니다(아이디 로그인이 내부적으로 이메일 형식을 씁니다. 메일은 보내지 않습니다)

> 이렇게 하면 가입은 다음 단계의 `signup` 함수(초대 코드 확인)로만 할 수 있습니다.

## 4. 가입 함수(signup) 올리기
1. 왼쪽 메뉴 **Edge Functions** → **Deploy a new function** → **Via Editor**
2. 함수 이름: `signup` (정확히 이 이름)
3. 편집기 내용을 지우고 `supabase/functions/signup/index.ts` 내용을 **전부** 붙여 넣기 → **Deploy**
4. 배포된 `signup` 함수의 **Details(설정)** 탭에서 **Verify JWT(JWT 확인)** 를 **끄고** 저장
   - 앱이 로그인 전에 이 함수를 부르기 때문에 꺼야 합니다. 대신 함수가 초대 코드를 직접 확인합니다.

## 5. 초대 코드 정하기
1. **Edge Functions** → **Secrets**(또는 Project Settings → Edge Functions → Secrets)
2. Key: `INVITE_CODE` / Value: 원하는 초대 코드 → **Save**
   - 추측하기 어렵게 **10자 이상**으로 정하세요(예: `quest-봄-7392` 같은 형태도 가능)
   - 이 코드를 아는 사람만 가입할 수 있습니다. 바꾸고 싶으면 값만 바꾸면 됩니다(이미 가입한 사람은 영향 없음)

## 6. 앱에 연결하기
1. **Project Settings** → **API Keys**
2. 두 값을 복사
   - **Project URL** (`https://xxxx.supabase.co`, Project Settings → Data API 또는 General에 있음)
   - **Publishable key** (`sb_publishable_…`). 이 탭이 없으면 Legacy 탭의 **anon public** 키
3. `src/data/server.ts`의 `SUPABASE_URL`, `SUPABASE_KEY`에 넣기 → 저장 → `git-save.bat`
   - Claude에게 두 값을 보내 주면 넣어 드립니다.
   - ⚠️ **secret 키(`sb_secret_…`)와 service_role 키는 절대 앱·채팅·GitHub에 넣지 마세요.** Publishable 키는 공개돼도 괜찮습니다(기록 보호는 2단계의 보안 규칙이 담당).

## 7. 확인
1. 배포가 끝나면 앱 → **기록** 탭 맨 위 **계정** 카드 → **초대 코드로 가입**
2. 가입하면 이 기기의 기존 기록이 계정으로 올라갑니다
3. Supabase **Table Editor**에서 `profiles`(가입자), `progress`(기록)에 한 줄씩 생겼는지 확인

---

## 관리자 할 일

**비밀번호를 잊은 사람** — SQL Editor에서 아이디와 새 비밀번호를 바꿔 실행한 뒤 알려 주기:
```sql
update auth.users
   set encrypted_password = extensions.crypt('새비밀번호123', extensions.gen_salt('bf'))
 where email = '아이디@users.cloud-quest.invalid';
```

**참여자 보기** — Table Editor → `profiles`

**탈퇴시키기** — Authentication → Users → 해당 사용자(`아이디@users.cloud-quest.invalid`) → Delete user. 프로필과 기록도 함께 지워집니다.

**초대 코드 바꾸기** — 5단계의 `INVITE_CODE` 값만 변경

## 동작 방식 요약 (개발 참고)
| 구성 | 내용 |
|---|---|
| 로그인 | 아이디를 `아이디@users.cloud-quest.invalid`로 바꿔 Supabase 이메일+비밀번호 로그인. 메일 발송 없음 |
| 가입 | `signup` Edge Function: 초대 코드 확인 → 관리자 API로 계정 생성(이메일 확인 완료 처리) → `profiles` 저장. 실패 시 계정 되돌림 |
| `profiles` | 아이디(바꿀 수 없음)·닉네임. 로그인한 참여자끼리 조회 가능, 본인 닉네임만 수정 |
| `progress` | 사용자별 기록 JSON 한 줄 + `rev`. 본인만 조회, 쓰기는 `save_progress` 함수로만 |
| 동기화 | 기기 기록이 기준. 바뀌면 2.5초 뒤 업로드, 앱을 다시 열 때 확인. 다른 기기가 먼저 올렸으면 받아 오거나(올릴 것 없을 때) 합침. 초기화·복원은 서버 기록을 통째로 교체 |
| 로그인 안 함 | 지금처럼 기기에만 저장. 설정값이 비어 있으면 계정 화면 자체가 숨겨짐 |
