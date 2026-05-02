import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ptyPlugin } from './vite-plugin-pty'
import { agentPlugin } from './vite-plugin-agent'

export default defineConfig({
  plugins: [react(), ptyPlugin(), agentPlugin()],
  server: {
    host: true,
    port: 9876
  },
  preview: {
    host: true,
    port: 9876
  }
})
