@echo off
chcp 65001 >nul
cd /d "%~dp0"
git remote get-url test >nul 2>nul
if errorlevel 1 goto setup
goto push

:setup
echo.
echo ===== 처음 한 번만: 테스트용 GitHub 저장소 연결 =====
echo GitHub에서 만든 테스트 저장소 주소를 붙여 넣으세요.
echo 예: https://github.com/ackerman-3/cloud-quest-test.git
set /p TURL=주소: 
if "%TURL%"=="" goto setup
git remote add test %TURL%

:push
echo.
echo 지금 바뀐 내용을 "테스트 페이지"에만 올립니다. 실제 앱에는 올라가지 않아요.
git add -A
git commit -m "테스트 %date% %time%"
git push -f test HEAD:main
echo.
echo 1~2분 뒤 테스트 저장소의 Actions 탭에서 초록 체크가 뜨면 배포 완료입니다.
echo 테스트 주소: https://ackerman-3.github.io/cloud-quest-test/
echo 확인이 끝나면 git-save.bat 으로 실제 앱에 올리세요.
pause
