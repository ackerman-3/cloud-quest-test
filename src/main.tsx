import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
