import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// For GitHub Pages: use '/portfolio/' if repo name is 'portfolio'
// Use '/' if deploying to username.github.io
// Can be overridden with VITE_BASE_PATH env variable
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/portfolio/',
})

