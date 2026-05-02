import type { Plugin } from 'vite'
import { WebSocketServer, type WebSocket } from 'ws'
import { spawn, type ChildProcess } from 'node:child_process'

// DEMO ONLY: invokes host CLIs (claude, codex) with caller-supplied prompts
// over an unauthenticated WebSocket. Anyone reachable on the dev server port
// can run prompts as the dev-server user.
const WS_PATH = '/ws/agent'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Mode = 'create' | 'resume'
type AgentName = 'claude' | 'codex'

type AgentCallbacks = {
  onStdout: (text: string) => void
  onStderr: (text: string) => void
  onSessionAssigned?: (id: string) => void
  onError: (message: string) => void
  onClose: (code: number) => void
}

type RunOpts = {
  prompt: string
  sessionId?: string
  mode: Mode
  cwd: string
}

interface IAgent {
  readonly name: AgentName
  run(opts: RunOpts, cbs: AgentCallbacks): { kill: () => void; child: ChildProcess }
  detectFallback(mode: Mode, stderrBuf: string, stdoutBytes: number, exitCode: number): Mode | null
}

const CLAUDE_ALREADY_IN_USE = /already in use/i
const CLAUDE_SESSION_MISSING = /no conversation found|session.*not found|session.*does not exist|no session found/i
const CODEX_THREAD_MISSING = /no rollout found for thread id|thread\/resume failed/i

class ClaudeAgent implements IAgent {
  readonly name = 'claude' as const

  run(opts: RunOpts, cbs: AgentCallbacks) {
    if (!opts.sessionId) {
      cbs.onError('claude requires a sessionId')
      cbs.onClose(-1)
      return { kill: () => {}, child: null as unknown as ChildProcess }
    }
    const flag = opts.mode === 'create' ? '--session-id' : '--resume'
    const child = spawn(
      'claude',
      ['-p', '--dangerously-skip-permissions', flag, opts.sessionId, opts.prompt],
      { cwd: opts.cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    child.stdout?.on('data', (d: Buffer) => cbs.onStdout(d.toString()))
    child.stderr?.on('data', (d: Buffer) => cbs.onStderr(d.toString()))
    child.on('error', (err: Error) => {
      cbs.onError(err.message)
      cbs.onClose(-1)
    })
    child.on('close', (code: number | null) => cbs.onClose(code ?? -1))
    return { kill: () => child.kill(), child }
  }

  detectFallback(mode: Mode, stderrBuf: string, stdoutBytes: number, exitCode: number): Mode | null {
    if (exitCode === 0 || stdoutBytes > 0) return null
    if (mode === 'create' && CLAUDE_ALREADY_IN_USE.test(stderrBuf)) return 'resume'
    if (mode === 'resume' && CLAUDE_SESSION_MISSING.test(stderrBuf)) return 'create'
    return null
  }
}

class CodexAgent implements IAgent {
  readonly name = 'codex' as const

  run(opts: RunOpts, cbs: AgentCallbacks) {
    const args = ['exec']
    if (opts.mode === 'resume') {
      if (!opts.sessionId) {
        cbs.onError('codex resume requires a sessionId')
        cbs.onClose(-1)
        return { kill: () => {}, child: null as unknown as ChildProcess }
      }
      args.push('resume', opts.sessionId)
    }
    args.push(
      '--json',
      '--dangerously-bypass-approvals-and-sandbox',
      '--skip-git-repo-check',
      opts.prompt
    )
    const child = spawn('codex', args, {
      cwd: opts.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdoutBuf = ''
    child.stdout?.on('data', (d: Buffer) => {
      stdoutBuf += d.toString()
      let nl: number
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, nl).trim()
        stdoutBuf = stdoutBuf.slice(nl + 1)
        if (!line) continue
        handleCodexLine(line, cbs)
      }
    })
    child.stderr?.on('data', (d: Buffer) => cbs.onStderr(d.toString()))
    child.on('error', (err: Error) => {
      cbs.onError(err.message)
      cbs.onClose(-1)
    })
    child.on('close', (code: number | null) => {
      const trailing = stdoutBuf.trim()
      if (trailing) handleCodexLine(trailing, cbs)
      cbs.onClose(code ?? -1)
    })
    return { kill: () => child.kill(), child }
  }

  detectFallback(mode: Mode, stderrBuf: string, _stdoutBytes: number, exitCode: number): Mode | null {
    if (exitCode === 0) return null
    if (mode === 'resume' && CODEX_THREAD_MISSING.test(stderrBuf)) return 'create'
    return null
  }
}

function handleCodexLine(line: string, cbs: AgentCallbacks) {
  let evt: { type?: string; thread_id?: string; item?: { type?: string; text?: string } }
  try {
    evt = JSON.parse(line)
  } catch {
    return
  }
  if (evt.type === 'thread.started' && typeof evt.thread_id === 'string') {
    cbs.onSessionAssigned?.(evt.thread_id)
    return
  }
  if (evt.type === 'item.completed' && evt.item?.type === 'agent_message' && typeof evt.item.text === 'string') {
    cbs.onStdout(evt.item.text + '\n')
    return
  }
}

function pickAgent(name: AgentName): IAgent {
  return name === 'codex' ? new CodexAgent() : new ClaudeAgent()
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
        let activeKill: (() => void) | null = null

        const sendJSON = (obj: unknown) => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
        }

        function runAttempt(
          agent: IAgent,
          mode: Mode,
          sessionId: string | undefined,
          prompt: string,
          isRetry: boolean
        ) {
          let stdoutBytes = 0
          let stderrBuf = ''
          let assignedId: string | undefined

          const handle = agent.run(
            { prompt, sessionId, mode, cwd },
            {
              onStdout: (text) => {
                stdoutBytes += text.length
                sendJSON({ type: 'stdout', data: text })
              },
              onStderr: (text) => {
                stderrBuf += text
              },
              onSessionAssigned: (id) => {
                assignedId = id
                sendJSON({ type: 'session_assigned', sessionId: id })
              },
              onError: (message) => {
                sendJSON({ type: 'error', message })
              },
              onClose: (code) => {
                const fallbackMode = !isRetry
                  ? agent.detectFallback(mode, stderrBuf, stdoutBytes, code)
                  : null
                if (fallbackMode) {
                  activeKill = null
                  // For codex resume → create fallback, drop the bad sessionId so create runs fresh.
                  const fallbackId = agent.name === 'codex' && fallbackMode === 'create' ? undefined : sessionId
                  runAttempt(agent, fallbackMode, fallbackId, prompt, true)
                  return
                }
                if (stderrBuf) sendJSON({ type: 'stderr', data: stderrBuf })
                sendJSON({ type: 'done', code, sessionId: assignedId })
                activeKill = null
              }
            }
          )
          activeKill = handle.kill
        }

        ws.on('message', (raw) => {
          let msg: {
            type?: string
            agent?: string
            sessionId?: string
            prompt?: string
            mode?: string
          } | null = null
          try {
            msg = JSON.parse(raw.toString())
          } catch {
            sendJSON({ type: 'error', message: 'invalid json' })
            return
          }
          if (msg?.type !== 'prompt') return
          if (activeKill) {
            sendJSON({ type: 'error', message: 'busy' })
            return
          }
          const agentName = msg.agent === 'codex' ? 'codex' : 'claude'
          const sessionId = msg.sessionId ? String(msg.sessionId) : undefined
          const prompt = String(msg.prompt ?? '')
          const rawMode = String(msg.mode ?? 'create')
          if (rawMode !== 'create' && rawMode !== 'resume') {
            sendJSON({ type: 'error', message: 'invalid mode (must be create or resume)' })
            return
          }
          if (!prompt) {
            sendJSON({ type: 'error', message: 'empty prompt' })
            return
          }
          if (sessionId !== undefined && !UUID_RE.test(sessionId)) {
            sendJSON({ type: 'error', message: 'invalid session id (must be a UUID)' })
            return
          }
          if (agentName === 'claude' && !sessionId) {
            sendJSON({ type: 'error', message: 'claude requires a sessionId' })
            return
          }
          if (agentName === 'codex' && rawMode === 'resume' && !sessionId) {
            sendJSON({ type: 'error', message: 'codex resume requires a sessionId' })
            return
          }

          runAttempt(pickAgent(agentName), rawMode, sessionId, prompt, false)
        })

        ws.on('close', () => {
          if (activeKill) activeKill()
        })
      })
    }
  }
}
