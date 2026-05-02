import type { Plugin } from 'vite'
import { WebSocketServer, type WebSocket } from 'ws'
import * as pty from 'node-pty'
import os from 'node:os'

// DEMO ONLY: this exposes an unauthenticated shell on the dev server.
// Anyone who can reach the port gets a full shell as the dev-server user.
const WS_PATH = '/pty'

export function ptyPlugin(): Plugin {
  return {
    name: 'vite-plugin-pty',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })

      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (!req.url?.startsWith(WS_PATH)) return
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      })

      wss.on('connection', (ws: WebSocket) => {
        const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash')
        const term = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd: process.env.HOME,
          env: process.env as Record<string, string>
        })

        term.onData((data) => {
          if (ws.readyState === ws.OPEN) ws.send(data)
        })

        term.onExit(() => {
          if (ws.readyState === ws.OPEN) ws.close()
        })

        ws.on('message', (raw) => {
          const text = raw.toString()
          if (text.startsWith('\x1b[RESIZE]')) {
            const [cols, rows] = text.slice('\x1b[RESIZE]'.length).split(',').map(Number)
            if (Number.isFinite(cols) && Number.isFinite(rows)) term.resize(cols, rows)
            return
          }
          term.write(text)
        })

        ws.on('close', () => term.kill())
      })
    }
  }
}
