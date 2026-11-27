-- 문의 게시판. 기존 schema.sql 실행 후 SQL Editor에서 이 파일 전체를 실행하세요.
-- 비밀글: 글쓴이·관리자만. 비밀 댓글: 댓글쓴이·글쓴이·관리자만.
-- 관리자 지정은 SQL Editor에서만 가능하며 앱의 PIN/프로필 값과 무관합니다.
begin;

create table if not exists public.board_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 80 and title !~ '[[:cntrl:]]'),
  body text not null check (char_length(btrim(body, E' \n\r\t')) between 1 and 3000 and regexp_replace(body, E'[\n\r\t]', '', 'g') !~ '[[:cntrl:]]'),
  category text not null check (category in ('inquiry', 'idea', 'bug')),
  color text not null check (color in ('lemon', 'rose', 'lilac', 'mint', 'sky', 'peach')),
  is_secret boolean not null default false,
  status text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default now(),
  unique(author_id, request_id)
);
create table if not exists public.board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  body text not null check (char_length(btrim(body, E' \n\r\t')) between 1 and 1500 and regexp_replace(body, E'[\n\r\t]', '', 'g') !~ '[[:cntrl:]]'),
  is_secret boolean not null default false,
  created_at timestamptz not null default now(),
  unique(author_id, request_id)
);
create index if not exists board_posts_order on public.board_posts(created_at desc, id desc);
create index if not exists board_posts_author on public.board_posts(author_id, created_at desc);
create index if not exists board_comments_order on public.board_comments(post_id, created_at, id);

alter table public.board_admins enable row level security;
alter table public.board_posts enable row level security;
alter table public.board_comments enable row level security;
revoke all on public.board_admins, public.board_posts, public.board_comments from public, anon, authenticated;
grant select on public.board_posts, public.board_comments to authenticated;

create or replace function public.board_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.board_admins a where a.user_id = auth.uid())
$$;
revoke all on function public.board_is_admin() from public, anon, authenticated;
grant execute on function public.board_is_admin() to authenticated;

drop policy if exists "board visible posts" on public.board_posts;
create policy "board visible posts" on public.board_posts for select to authenticated
  using (not is_secret or author_id = (select auth.uid()) or (select public.board_is_admin()));
drop policy if exists "board visible comments" on public.board_comments;
create policy "board visible comments" on public.board_comments for select to authenticated
  using (exists (
    select 1 from public.board_posts p where p.id = post_id
      and (not p.is_secret or p.author_id = (select auth.uid()) or (select public.board_is_admin()))
      and (not board_comments.is_secret or board_comments.author_id = (select auth.uid()) or p.author_id = (select auth.uid()) or (select public.board_is_admin()))
  ));

create or replace function public.board_meta()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  return jsonb_build_object('is_admin', public.board_is_admin());
end;
$$;

create or replace function public.board_list(p_offset integer default 0, p_category text default 'all', p_mine boolean default false, p_search text default '')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.board_is_admin();
  v_rows jsonb;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_offset is null or p_offset < 0 or p_offset > 100000 or p_category is null or p_category not in ('all','inquiry','idea','bug') or p_mine is null or p_search is null or char_length(p_search)>80 then
    raise exception 'invalid filter' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc, q.id desc), '[]'::jsonb) into v_rows from (
    select p.id, p.title, left(p.body, 110) as excerpt, p.category, p.color, p.is_secret, p.status, p.created_at,
      coalesce(pr.nickname, '탈퇴한 동료') as nickname, p.author_id = v_uid as is_mine,
      (select count(*) from public.board_comments c where c.post_id=p.id
        and (not c.is_secret or c.author_id=v_uid or p.author_id=v_uid or v_admin)) as comment_count
    from public.board_posts p left join public.profiles pr on pr.id=p.author_id
    where (not p.is_secret or p.author_id=v_uid or v_admin)
      and (p_category='all' or p.category=p_category) and (not p_mine or p.author_id=v_uid)
      and (p_search='' or strpos(lower(p.title), lower(p_search))>0 or strpos(lower(p.body), lower(p_search))>0)
    order by p.created_at desc, p.id desc limit 21 offset p_offset
  ) q;
  return jsonb_build_object('posts', (select coalesce(jsonb_agg(e.value order by e.ordinality),'[]'::jsonb) from jsonb_array_elements(v_rows) with ordinality e(value,ordinality) where e.ordinality<=20), 'has_more', jsonb_array_length(v_rows)>20);
end;
$$;

create or replace function public.board_get(p_post_id uuid, p_comments_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.board_is_admin();
  v_post public.board_posts%rowtype;
  v_comments jsonb;
  v_count integer;
  v_offset integer;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v_post from public.board_posts p where p.id=p_post_id and (not p.is_secret or p.author_id=v_uid or v_admin);
  if not found then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_comments_offset is null or p_comments_offset<0 or p_comments_offset>100000 then raise exception 'invalid offset' using errcode='22023'; end if;
  select count(*) into v_count from public.board_comments c where c.post_id=p_post_id
    and (not c.is_secret or c.author_id=v_uid or v_post.author_id=v_uid or v_admin);
  v_offset := least(p_comments_offset, greatest(0, (v_count-1)/50)*50);
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at,q.id),'[]'::jsonb) into v_comments from (
    select c.id,c.body,c.is_secret,c.created_at,coalesce(pr.nickname,'탈퇴한 동료') as nickname,
      c.author_id=v_uid as is_mine,exists(select 1 from public.board_admins a where a.user_id=c.author_id) as is_admin
    from public.board_comments c left join public.profiles pr on pr.id=c.author_id
    where c.post_id=p_post_id and (not c.is_secret or c.author_id=v_uid or v_post.author_id=v_uid or v_admin)
    order by c.created_at,c.id limit 50 offset v_offset
  ) q;
  return jsonb_build_object('post',jsonb_build_object(
    'id',v_post.id,'title',v_post.title,'body',v_post.body,'excerpt',left(v_post.body,110),
    'category',v_post.category,'color',v_post.color,'is_secret',v_post.is_secret,'status',v_post.status,
    'created_at',v_post.created_at,'nickname',(select pr.nickname from public.profiles pr where pr.id=v_post.author_id),
    'is_mine',v_post.author_id=v_uid,'comment_count',v_count),
    'comments',v_comments,'comments_more',v_offset+50<v_count,'comments_offset',v_offset);
end;
$$;

create or replace function public.board_create(p_title text,p_body text,p_category text,p_color text,p_secret boolean,p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in' using errcode='42501'; end if;
  if p_request_id is null or p_secret is null then raise exception 'invalid input' using errcode='22023'; end if;
  insert into public.board_posts(author_id,request_id,title,body,category,color,is_secret)
    values(v_uid,p_request_id,btrim(p_title),btrim(p_body,E' \n\r\t'),p_category,p_color,p_secret)
    on conflict(author_id,request_id) do nothing returning id into v_id;
  if v_id is null then
    select p.id into v_id from public.board_posts p where p.author_id=v_uid and p.request_id=p_request_id
      and p.title=btrim(p_title) and p.body=btrim(p_body,E' \n\r\t') and p.category=p_category and p.color=p_color and p.is_secret=p_secret;
    if v_id is null then raise exception 'request already used' using errcode='22023'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.board_comment(p_post_id uuid,p_body text,p_secret boolean,p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_admin boolean:=public.board_is_admin(); v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in' using errcode='42501'; end if;
  if not exists(select 1 from public.board_posts p where p.id=p_post_id and (not p.is_secret or p.author_id=v_uid or v_admin)) then raise exception 'not allowed' using errcode='42501'; end if;
  if p_request_id is null or p_secret is null then raise exception 'invalid input' using errcode='22023'; end if;
  insert into public.board_comments(post_id,author_id,request_id,body,is_secret)
    values(p_post_id,v_uid,p_request_id,btrim(p_body,E' \n\r\t'),p_secret)
    on conflict(author_id,request_id) do nothing returning id into v_id;
  if v_id is null then
    select c.id into v_id from public.board_comments c where c.author_id=v_uid and c.request_id=p_request_id
      and c.post_id=p_post_id and c.body=btrim(p_body,E' \n\r\t') and c.is_secret=p_secret;
    if v_id is null then raise exception 'request already used' using errcode='22023'; end if;
  end if;
  if v_admin then update public.board_posts set status='answered' where id=p_post_id; end if;
  return v_id;
end;
$$;

create or replace function public.board_delete_post(p_post_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode='42501'; end if;
  delete from public.board_posts where id=p_post_id and (author_id=auth.uid() or public.board_is_admin());
  if not found then raise exception 'not allowed' using errcode='42501'; end if;
end;
$$;
create or replace function public.board_delete_comment(p_comment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode='42501'; end if;
  delete from public.board_comments c where c.id=p_comment_id and (c.author_id=auth.uid() or public.board_is_admin())
    and exists(select 1 from public.board_posts p where p.id=c.post_id and (not p.is_secret or p.author_id=auth.uid() or public.board_is_admin()));
  if not found then raise exception 'not allowed' using errcode='42501'; end if;
end;
$$;
create or replace function public.board_status(p_post_id uuid,p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.board_is_admin() then raise exception 'not allowed' using errcode='42501'; end if;
  if p_status is null or p_status not in ('open','answered') then raise exception 'invalid status' using errcode='22023'; end if;
  update public.board_posts set status=p_status where id=p_post_id;
  if not found then raise exception 'not allowed' using errcode='42501'; end if;
end;
$$;

revoke all on function public.board_meta(),public.board_list(integer,text,boolean,text),public.board_get(uuid,integer),
  public.board_create(text,text,text,text,boolean,uuid),public.board_comment(uuid,text,boolean,uuid),
  public.board_delete_post(uuid),public.board_delete_comment(uuid),public.board_status(uuid,text) from public,anon,authenticated;
grant execute on function public.board_meta(),public.board_list(integer,text,boolean,text),public.board_get(uuid,integer),
  public.board_create(text,text,text,text,boolean,uuid),public.board_comment(uuid,text,boolean,uuid),
  public.board_delete_post(uuid),public.board_delete_comment(uuid),public.board_status(uuid,text) to authenticated;

commit;

-- 관리자 계정 지정(아래 아이디를 실제 로그인 아이디로 바꾸고 별도로 실행):
-- insert into public.board_admins(user_id) select id from public.profiles where username='내아이디' on conflict do nothing;
