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

-- ════ 이하 랭킹(ranking.sql과 같은 내용) ════

-- ── 5. 프로필 꾸미기: 프로필 이미지·대표 칭호·상태메시지 ──
alter table public.profiles add column if not exists avatar text not null default 'i_laptop';
alter table public.profiles add column if not exists title text not null default '';
alter table public.profiles add column if not exists status_msg text not null default '';
alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check check (avatar ~ '^[a-z0-9_]{1,24}$');
alter table public.profiles drop constraint if exists profiles_title_check;
alter table public.profiles add constraint profiles_title_check check (title ~ '^[a-z0-9_]{0,24}$');
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (char_length(status_msg) <= 40 and status_msg !~ '[[:cntrl:]]');

-- 로그인 아이디는 다른 참여자에게 보이지 않게: 프로필 직접 조회는 본인만, 랭킹은 get_ranking 함수로
drop policy if exists "members read profiles" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
grant update (nickname, avatar, title, status_msg) on public.profiles to authenticated;

-- ── 6. 랭킹 기록: 저장할 때마다 서버가 기록에서 계산하거나 상한을 확인 ──
alter table public.progress add column if not exists stats jsonb not null default '{}'::jsonb;

-- 배열이 아니면 빈 배열로
create or replace function public.jarr(v jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(v) = 'array' then v else '[]'::jsonb end
$$;

-- 숫자가 아니면 0
create or replace function public.jnum(v jsonb)
returns numeric language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(v) = 'number' then greatest((v #>> '{}')::numeric, 0) else 0 end
$$;

-- 분야별 기록
-- projects: 완료 수에 반영된 완료 기록 수(같은 날 같은 프로젝트는 1번). 서버가 직접 셈
-- office:   보유 가구 + 기념품 수. 앱이 계산해 보낸 값을 받되, 구매 기록·에피소드 수로 정한 상한을 넘지 못함
-- teamwork: 동료 3명 팀워크 합계. 앱이 보낸 값을 받되, 간식·대화·완료 기록으로 정한 상한을 넘지 못함
create or replace function public.rank_stats(d jsonb, claimed jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  with base as (
    select
      (select count(*) from jsonb_array_elements(public.jarr(d -> 'completions')) c where c ->> 'counted' = 'true') as projects,
      (select count(distinct x ->> 'item') from jsonb_array_elements(public.jarr(d -> 'purchases')) x) as bought,
      jsonb_array_length(public.jarr(d -> 'seenEpisodes')) as episodes,
      (select coalesce(sum(public.jnum(g -> 'points')), 0) from jsonb_array_elements(public.jarr(d -> 'gifts')) g) as snack,
      (select count(distinct (t ->> 'to') || '|' || (t ->> 'date')) from jsonb_array_elements(public.jarr(d -> 'talks')) t) as talk_days
  )
  select jsonb_build_object(
    'projects', projects,
    'office', floor(least(public.jnum(claimed -> 'office'), bought + episodes + 11)),
    'teamwork', floor(least(public.jnum(claimed -> 'teamwork'), snack + talk_days * 3 + projects * 9))
  )
  from base
$$;

-- 기록 저장 함수: 랭킹 기록(p_stats)을 함께 받는다
drop function if exists public.save_progress(jsonb, bigint, boolean);
create or replace function public.save_progress(p_data jsonb, p_base_rev bigint, p_force boolean default false, p_stats jsonb default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_rev bigint;
  st jsonb := public.rank_stats(p_data, coalesce(p_stats, '{}'::jsonb));
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  update public.progress
     set data = p_data, stats = st, rev = rev + 1, updated_at = now()
   where user_id = uid and (p_force or rev = p_base_rev)
  returning rev into new_rev;

  if new_rev is null then
    if exists (select 1 from public.progress where user_id = uid) then
      return null;
    end if;
    insert into public.progress (user_id, data, stats, rev) values (uid, p_data, st, 1)
    on conflict (user_id) do nothing
    returning rev into new_rev;
  end if;

  return new_rev;
end;
$$;

revoke all on function public.save_progress(jsonb, bigint, boolean, jsonb) from public, anon;
grant execute on function public.save_progress(jsonb, bigint, boolean, jsonb) to authenticated;

-- 이미 저장된 기록도 랭킹 기록을 채워 둔다(앱이 다음에 저장하면 앱 계산값으로 바뀜)
update public.progress set stats = public.rank_stats(data, '{}'::jsonb) where stats = '{}'::jsonb;

-- ── 7. 랭킹 조회: 로그인한 참여자만. 아이디는 내보내지 않음 ──
create or replace function public.get_ranking()
returns table (user_id uuid, nickname text, avatar text, title text, status_msg text, projects bigint, office bigint, teamwork bigint, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nickname, p.avatar, p.title, p.status_msg,
         coalesce((g.stats ->> 'projects')::bigint, 0),
         coalesce((g.stats ->> 'office')::bigint, 0),
         coalesce((g.stats ->> 'teamwork')::bigint, 0),
         p.id = auth.uid()
    from public.profiles p
    left join public.progress g on g.user_id = p.id
   where auth.uid() is not null
$$;

revoke all on function public.get_ranking() from public, anon;
grant execute on function public.get_ranking() to authenticated;

-- 계산용 함수는 API로 직접 부르지 못하게
revoke all on function public.jarr(jsonb) from public, anon, authenticated;
revoke all on function public.jnum(jsonb) from public, anon, authenticated;
revoke all on function public.rank_stats(jsonb, jsonb) from public, anon, authenticated;
