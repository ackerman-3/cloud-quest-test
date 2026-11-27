-- board.sql 적용 후 SQL Editor에서 실행하는 실제 권한 회귀 검사.
-- 테스트 사용자·글·댓글은 마지막 ROLLBACK으로 모두 되돌립니다.
-- 오류가 나면 ROLLBACK;을 실행하고 오류 메시지를 확인하세요.
begin;

insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-00000000ba01','board-test-a@example.invalid'),
 ('00000000-0000-4000-8000-00000000ba02','board-test-b@example.invalid'),
 ('00000000-0000-4000-8000-00000000ba03','board-test-admin@example.invalid'),
 ('00000000-0000-4000-8000-00000000ba04','board-test-c@example.invalid');
insert into public.profiles(id,username,nickname) values
 ('00000000-0000-4000-8000-00000000ba01','btest_a','검사A'),
 ('00000000-0000-4000-8000-00000000ba02','btest_b','검사B'),
 ('00000000-0000-4000-8000-00000000ba03','btest_admin','검사운영자'),
 ('00000000-0000-4000-8000-00000000ba04','btest_c','검사C');
insert into public.board_admins(user_id) values('00000000-0000-4000-8000-00000000ba03');
create temporary table board_test_ids(kind text primary key,id uuid);
grant select,insert on board_test_ids to authenticated;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000ba01',true);
set local role authenticated;
insert into board_test_ids values('public',public.board_create('공개 테스트','공개 본문','inquiry','lemon',false,gen_random_uuid()));
insert into board_test_ids values('private',public.board_create('PRIVATE_TITLE_X91','PRIVATE_BODY_X91','bug','rose',true,'00000000-0000-4000-8000-00000000bc01'));
do $$
declare v_id uuid;
begin
  v_id:=public.board_create('PRIVATE_TITLE_X91','PRIVATE_BODY_X91','bug','rose',true,'00000000-0000-4000-8000-00000000bc01');
  assert v_id=(select id from board_test_ids where kind='private'), '재전송으로 글 중복 생성';
  assert (public.board_get(v_id)->'post'->>'body')='PRIVATE_BODY_X91','본인은 비밀글을 읽을 수 있어야 함';
end;
$$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000ba02',true);
set local role authenticated;
do $$
declare v_denied boolean:=false; v_json jsonb;
begin
  assert not public.board_is_admin(),'일반 사용자 관리자 오인';
  assert not exists(select 1 from public.board_posts where id=(select id from board_test_ids where kind='private')),'RLS 비밀글 유출';
  v_json:=public.board_list(0,'all',false,'PRIVATE_TITLE_X91');
  assert jsonb_array_length(v_json->'posts')=0,'비밀 제목 검색 유출';
  assert strpos(public.board_list()::text,'PRIVATE_BODY_X91')=0,'본문 미리보기 유출';
  begin perform public.board_get((select id from board_test_ids where kind='private')); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'타인 비밀글 직접 RPC 읽기 허용';
  v_denied:=false;
  begin perform public.board_comment((select id from board_test_ids where kind='private'),'침입 댓글',false,gen_random_uuid()); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'비밀글 댓글 접근 허용';
  v_denied:=false;
  begin perform public.board_status((select id from board_test_ids where kind='public'),'answered'); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'일반 사용자 답변 상태 변경 허용';
  v_denied:=false;
  begin insert into public.board_admins(user_id) values(auth.uid()); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'앱 사용자 관리자 권한 상승';
end;
$$;
insert into board_test_ids values('secret_comment',public.board_comment((select id from board_test_ids where kind='public'),'SECRET_COMMENT_X91',true,gen_random_uuid()));
do $$
begin
  assert strpos(public.board_get((select id from board_test_ids where kind='public'))::text,'SECRET_COMMENT_X91')>0,'댓글 작성자 조회 실패';
end;
$$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000ba04',true);
set local role authenticated;
do $$
declare v_denied boolean:=false;
begin
  assert not exists(select 1 from public.board_comments where id=(select id from board_test_ids where kind='secret_comment')),'댓글 RLS 유출';
  assert strpos(public.board_get((select id from board_test_ids where kind='public'))::text,'SECRET_COMMENT_X91')=0,'비밀 댓글 RPC 유출';
  assert (public.board_get((select id from board_test_ids where kind='public'))->'post'->>'comment_count')::integer=0,'비밀 댓글 수 유출';
  begin perform public.board_delete_post((select id from board_test_ids where kind='public')); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'타인 글 삭제 허용';
  v_denied:=false;
  begin perform public.board_delete_comment((select id from board_test_ids where kind='secret_comment')); exception when insufficient_privilege then v_denied:=true; end;
  assert v_denied,'타인 댓글 삭제 허용';
end;
$$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000ba01',true);
set local role authenticated;
do $$
begin
  assert strpos(public.board_get((select id from board_test_ids where kind='public'))::text,'SECRET_COMMENT_X91')>0,'게시글 작성자 비밀 댓글 조회 실패';
end;
$$;
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000ba03',true);
set local role authenticated;
do $$
begin
  assert public.board_is_admin(),'관리자 인식 실패';
  assert strpos(public.board_get((select id from board_test_ids where kind='private'))::text,'PRIVATE_BODY_X91')>0,'관리자 비밀글 조회 실패';
  assert strpos(public.board_get((select id from board_test_ids where kind='public'))::text,'SECRET_COMMENT_X91')>0,'관리자 비밀 댓글 조회 실패';
  perform public.board_comment((select id from board_test_ids where kind='private'),'운영자 비밀 답변',true,gen_random_uuid());
  assert public.board_get((select id from board_test_ids where kind='private'))->'post'->>'status'='answered','답변 상태 반영 실패';
  perform public.board_status((select id from board_test_ids where kind='private'),'open');
end;
$$;
reset role;

-- 익명 조회·직접 쓰기 권한이 열리지 않았는지 확인
do $$
begin
  assert not has_table_privilege('authenticated','public.board_admins','SELECT'),'관리자 목록 노출';
  assert not has_table_privilege('authenticated','public.board_posts','INSERT'),'게시글 직접 INSERT 허용';
  assert not has_table_privilege('authenticated','public.board_comments','UPDATE'),'댓글 직접 UPDATE 허용';
  assert not has_function_privilege('anon','public.board_list(integer,text,boolean,text)','EXECUTE'),'익명 목록 조회 허용';
  assert not has_function_privilege('anon','public.board_get(uuid,integer)','EXECUTE'),'익명 비밀글 접근 허용';
end;
$$;

rollback;
select '게시판 권한 검사 통과. 테스트 데이터는 저장하지 않았습니다.' as result;
