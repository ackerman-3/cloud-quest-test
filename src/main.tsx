import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 폰트: 본문 Pretendard(OFL, 화면에 나온 글자 조각만 불러옴), 짧은 제목·숫자 Galmuri11 Bold(OFL, index.css @font-face)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'
import App from './App.tsx'
import { installDemoServer } from './demoServer'

// 미리보기 빌드에서만: 가짜 서버로 계정 기능 체험
if (import.meta.env.VITE_DEMO_SERVER === '1') installDemoServer()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
