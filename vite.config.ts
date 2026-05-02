import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ptyPlugin } from './vite-plugin-pty'

export default defineConfig({
  plugins: [react(), ptyPlugin()],
  server: {
    host: true,
    port: 9876
  },
  preview: {
    host: true,
    port: 9876
  }
})
