import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 배포(GitHub Pages)에서는 Railway 백엔드를, 개발 서버에서는 로컬 백엔드를 바라본다.
// __API_BASE_URL__은 빌드 시점에 아래 값으로 치환된다(테스트(jest)에서는 미정의 → config.ts가 폴백 사용).
const PROD_API_BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app'
const DEV_API_BASE_URL = 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/shopping-cart-full-stack/',
  plugins: [react()],
  server: {
    port: 8080,
  },
  define: {
    __API_BASE_URL__: JSON.stringify(
      command === 'build' ? PROD_API_BASE_URL : DEV_API_BASE_URL,
    ),
  },
}))
