import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set base to your repo name
  // base: '/buget-romania-2026/',
  // For Cloudflare Pages: leave base as default '/'
  base: '/Buget-Romania-2026/',
})
