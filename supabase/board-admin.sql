-- 관리자 지정: 아래 문자열을 내 앱 로그인 아이디로 바꾼 뒤 SQL Editor에서 실행하세요.
-- 닉네임이 아니라 로그인할 때 입력하는 영문 아이디입니다.
do $$
declare
  v_username text := '여기에_앱_아이디';
  v_id uuid;
begin
  if v_username='여기에_앱_아이디' then raise exception '먼저 앱 로그인 아이디를 입력해 주세요.'; end if;
  select id into v_id from public.profiles where username=lower(btrim(v_username));
  if v_id is null then raise exception '해당 로그인 아이디를 찾지 못했습니다.'; end if;
  insert into public.board_admins(user_id) values(v_id) on conflict do nothing;
end;
$$;
select '게시판 관리자 등록 완료. 앱에서 게시판을 다시 열어 주세요.' as result;
