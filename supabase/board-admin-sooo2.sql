-- board.sql 적용 후 Supabase SQL Editor에서 실행합니다.
-- 기존 관리자 목록에 sooo2의 게시판 권한을 추가합니다.
do $$
declare
  v_id uuid;
begin
  select id into v_id from public.profiles where username = 'sooo2';
  if v_id is null then
    raise exception '로그인 아이디 sooo2를 찾지 못했습니다.';
  end if;

  insert into public.board_admins (user_id) values (v_id)
  on conflict do nothing;
end;
$$;
