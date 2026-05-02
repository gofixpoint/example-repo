import type { Plugin } from 'vite'
import { WebSocketServer, type WebSocket } from 'ws'
import { spawn, type ChildProcess } from 'node:child_process'

// DEMO ONLY: invokes the host `claude` CLI with caller-supplied prompts over an
// unauthenticated WebSocket. Anyone reachable on the dev server port can run
// prompts as the dev-server user.
const WS_PATH = '/ws/agent'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Mode = 'create' | 'resume'

// claude exits non-zero with these stderr strings when the wrong flag is used
// for the session's actual state. Used to trigger a one-shot retry with the
// opposite flag.
const ALREADY_IN_USE_RE = /already in use/i
const SESSION_MISSING_RE = /no conversation found|session.*not found|session.*does not exist|no session found/i

function flagFor(mode: Mode) {
  return mode === 'create' ? '--session-id' : '--resume'
}

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

        function runAttempt(mode: Mode, sessionId: string, prompt: string, isRetry: boolean) {
          const child = spawn(
            'claude',
            ['-p', '--dangerously-skip-permissions', flagFor(mode), sessionId, prompt],
            {
              cwd,
              env: process.env,
              stdio: ['ignore', 'pipe', 'pipe']
            }
          )
          active = child

          let stdoutBytes = 0
          let stderrBuf = ''

          child.stdout?.on('data', (d: Buffer) => {
            stdoutBytes += d.length
            sendJSON({ type: 'stdout', data: d.toString() })
          })
          child.stderr?.on('data', (d: Buffer) => {
            stderrBuf += d.toString()
          })
          child.on('error', (err: Error) => {
            sendJSON({ type: 'error', message: err.message })
            sendJSON({ type: 'done', code: -1 })
            active = null
          })
          child.on('close', (code: number | null) => {
            const failed = code !== 0 && stdoutBytes === 0
            const wrongFlag =
              (mode === 'create' && ALREADY_IN_USE_RE.test(stderrBuf)) ||
              (mode === 'resume' && SESSION_MISSING_RE.test(stderrBuf))

            if (!isRetry && failed && wrongFlag) {
              const fallback: Mode = mode === 'create' ? 'resume' : 'create'
              active = null
              runAttempt(fallback, sessionId, prompt, true)
              return
            }

            if (stderrBuf) sendJSON({ type: 'stderr', data: stderrBuf })
            sendJSON({ type: 'done', code: code ?? -1 })
            active = null
          })
        }

        ws.on('message', (raw) => {
          let msg: { type?: string; sessionId?: string; prompt?: string; mode?: string } | null = null
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
          const rawMode = String(msg.mode ?? 'create')
          if (!UUID_RE.test(sessionId)) {
            sendJSON({ type: 'error', message: 'invalid session id (must be a UUID)' })
            return
          }
          if (!prompt) {
            sendJSON({ type: 'error', message: 'empty prompt' })
            return
          }
          if (rawMode !== 'create' && rawMode !== 'resume') {
            sendJSON({ type: 'error', message: 'invalid mode (must be create or resume)' })
            return
          }

          runAttempt(rawMode, sessionId, prompt, false)
        })

        ws.on('close', () => {
          if (active) active.kill()
        })
      })
    }
  }
}
