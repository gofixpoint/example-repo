import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9876,
    // Amika exposes sandbox services through per-session e2b.app subdomains.
    allowedHosts: ['.style.dev', '.vercel.run', '.e2b.app']
  },
  preview: {
    port: 9876
  }
})
