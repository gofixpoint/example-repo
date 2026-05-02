import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ptyPlugin } from './vite-plugin-pty'
import { agentProxyPlugin } from './vite-plugin-agent-proxy'

export default defineConfig({
  plugins: [react(), ptyPlugin(), agentProxyPlugin()],
  server: {
    host: true,
    port: 9876
  },
  preview: {
    host: true,
    port: 9876
  }
})
