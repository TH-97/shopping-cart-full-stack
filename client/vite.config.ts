import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/shopping-cart-full-stack/',
  plugins: [react()],
  server: {
    port: 8080,
  },
})
