// 테스트 페이지 구분 — 저장소 이름이 '-test'로 끝나는 GitHub Pages 주소(예: /cloud-quest-test/)에서 열리면 테스트 모드.
// GitHub Pages는 같은 계정의 저장소끼리 저장 공간(localStorage)을 공유하므로,
// 테스트 모드에서는 모든 저장 키 앞에 'test:'를 붙여 실제 앱 기록과 섞이지 않게 한다.
export const IS_TEST = typeof location !== 'undefined' && /-test\//.test(location.pathname)
export const KEY_PREFIX = IS_TEST ? 'test:' : ''
