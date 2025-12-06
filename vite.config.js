import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Vercel uses root path '/'
// Can be overridden with VITE_BASE_PATH env variable
export default defineConfig({
  plugins: [react()],
  // Default to root path for Vercel
  base: process.env.VITE_BASE_PATH || '/',
})

