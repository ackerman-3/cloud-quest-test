-- 클라우드 퀘스트 서버(Supabase) 테이블과 보안 규칙
-- Supabase 대시보드 → SQL Editor → New query에 이 파일 전체를 붙여 넣고 Run.
-- 여러 번 실행해도 안전하도록 작성했습니다(있으면 건너뛰거나 다시 만듦).

-- ── 1. 프로필: 아이디(로그인용, 바꿀 수 없음)와 닉네임(화면 표시용) ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{4,16}$'),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 12 and nickname !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 로그인한 참여자끼리는 아이디·닉네임을 볼 수 있다(명예의 전당·참여자 수에 사용)
drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles" on public.profiles
  for select to authenticated using (true);

-- 본인 닉네임만 바꿀 수 있다. 가입(insert)은 서버 함수(signup)만 한다
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;

-- ── 2. 학습 기록: 앱의 기록(Progress) 전체를 사용자별 한 줄로 보관 ──
-- rev: 저장할 때마다 1씩 오름. 다른 기기가 먼저 저장했는지 알아내는 데 쓴다.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  rev bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint progress_shape check (
    jsonb_typeof(data) = 'object'
    and data ->> 'version' = '1'
    and jsonb_typeof(data -> 'completions') = 'array'
  ),
  constraint progress_size check (pg_column_size(data) < 1000000)
);

alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.progress from anon, authenticated;
grant select on public.progress to authenticated;
-- 쓰기는 아래 save_progress 함수로만 한다

-- ── 3. 기록 저장 함수 ──
-- p_base_rev: 이 기기가 마지막으로 알고 있던 rev(처음이면 0).
-- 서버 rev가 그대로면 저장하고 새 rev를 돌려준다. 다른 기기가 먼저 저장했으면 null(→ 앱이 합친 뒤 다시 저장).
-- p_force: 기록 초기화·백업 복원처럼 서버 기록을 통째로 바꿀 때 true.
create or replace function public.save_progress(p_data jsonb, p_base_rev bigint, p_force boolean default false)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_rev bigint;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update public.progress
     set data = p_data, rev = rev + 1, updated_at = now()
   where user_id = uid and (p_force or rev = p_base_rev)
  returning rev into new_rev;

  if new_rev is null then
    if exists (select 1 from public.progress where user_id = uid) then
      return null; -- 다른 기기가 먼저 저장함
    end if;
    insert into public.progress (user_id, data, rev) values (uid, p_data, 1)
    on conflict (user_id) do nothing
    returning rev into new_rev;
  end if;

  return new_rev;
end;
$$;

revoke all on function public.save_progress(jsonb, bigint, boolean) from public, anon;
grant execute on function public.save_progress(jsonb, bigint, boolean) to authenticated;

-- ── 4. 참여자 수(로그인하지 않아도 볼 수 있음, 숫자만) ──
create or replace function public.member_count()
returns bigint
language sql
security definer
set search_path = ''
stable
as $$
  select count(*) from public.profiles
$$;

revoke all on function public.member_count() from public;
grant execute on function public.member_count() to anon, authenticated;
