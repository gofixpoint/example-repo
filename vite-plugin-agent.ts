import type { Plugin } from 'vite'
import { WebSocketServer, type WebSocket } from 'ws'
import { spawn, type ChildProcess } from 'node:child_process'

// DEMO ONLY: invokes the host `claude` CLI with caller-supplied prompts over an
// unauthenticated WebSocket. Anyone reachable on the dev server port can run
// prompts as the dev-server user.
const WS_PATH = '/ws/agent'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function agentPlugin(): Plugin {
  return {
    name: 'vite-plugin-agent',
    configureServer(server) {
      const cwd = server.config.root
      const wss = new WebSocketServer({ noServer: true })

      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (!req.url?.startsWith(WS_PATH)) return
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      })

      wss.on('connection', (ws: WebSocket) => {
        let active: ChildProcess | null = null

        const sendJSON = (obj: unknown) => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
        }

        ws.on('message', (raw) => {
          let msg: { type?: string; sessionId?: string; prompt?: string } | null = null
          try {
            msg = JSON.parse(raw.toString())
          } catch {
            sendJSON({ type: 'error', message: 'invalid json' })
            return
          }
          if (msg?.type !== 'prompt') return
          if (active) {
            sendJSON({ type: 'error', message: 'busy' })
            return
          }
          const sessionId = String(msg.sessionId ?? '')
          const prompt = String(msg.prompt ?? '')
          if (!UUID_RE.test(sessionId)) {
            sendJSON({ type: 'error', message: 'invalid session id (must be a UUID)' })
            return
          }
          if (!prompt) {
            sendJSON({ type: 'error', message: 'empty prompt' })
            return
          }

          const child = spawn('claude', ['-p', '--session-id', sessionId, prompt], {
            cwd,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe']
          })
          active = child

          child.stdout?.on('data', (d: Buffer) => sendJSON({ type: 'stdout', data: d.toString() }))
          child.stderr?.on('data', (d: Buffer) => sendJSON({ type: 'stderr', data: d.toString() }))
          child.on('error', (err: Error) => {
            sendJSON({ type: 'error', message: err.message })
            sendJSON({ type: 'done', code: -1 })
            active = null
          })
          child.on('close', (code: number | null) => {
            sendJSON({ type: 'done', code: code ?? -1 })
            active = null
          })
        })

        ws.on('close', () => {
          if (active) active.kill()
        })
      })
    }
  }
}
