import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /<repo>/
  base: '/house-rent-mg/',
  plugins: [react(), tailwindcss()],
})
