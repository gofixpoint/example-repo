import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ptyPlugin } from './vite-plugin-pty'

const AGENT_PORT = Number(process.env.AGENT_PORT ?? 9877)

export default defineConfig({
  plugins: [react(), ptyPlugin()],
  server: {
    host: true,
    port: 9876,
    proxy: {
      '/ws/agent': {
        target: `ws://127.0.0.1:${AGENT_PORT}`,
        ws: true,
        changeOrigin: false
      }
    }
  },
  preview: {
    host: true,
    port: 9876
  }
})
