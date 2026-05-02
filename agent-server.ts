import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { WebSocketServer, type WebSocket } from 'ws'

// DEMO ONLY: invokes host CLIs (claude, codex) with caller-supplied prompts
// over an unauthenticated WebSocket. Bound to 127.0.0.1; only the Vite dev
// server's proxy should reach this — anyone reachable through that proxy
// can run prompts as the dev-server user.
const WS_PATH = '/ws/agent'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RUN_TTL_MS = 5 * 60 * 1000

type Mode = 'create' | 'resume'
type AgentName = 'claude' | 'codex'

type ServerEvent =
  | { type: 'stdout' | 'stderr'; data: string }
  | { type: 'session_assigned'; sessionId: string }
  | { type: 'error'; message: string }
  | { type: 'done'; code: number; sessionId?: string }

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

type RunState = {
  agent: IAgent
  events: ServerEvent[]
  done: boolean
  exitCode?: number
  sessionId?: string
  attachedWs: WebSocket | null
  kill: () => void
  expireTimer?: NodeJS.Timeout
}

const runs = new Map<string, RunState>()

function sendJSON(ws: WebSocket | null, obj: unknown) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
}

function recordEvent(runId: string, evt: ServerEvent) {
  const state = runs.get(runId)
  if (!state) return
  state.events.push(evt)
  sendJSON(state.attachedWs, evt)
}

function scheduleExpiry(runId: string) {
  const state = runs.get(runId)
  if (!state) return
  if (state.expireTimer) clearTimeout(state.expireTimer)
  state.expireTimer = setTimeout(() => runs.delete(runId), RUN_TTL_MS)
}

function startRun(
  agent: IAgent,
  initialMode: Mode,
  initialSessionId: string | undefined,
  prompt: string,
  cwd: string,
  ws: WebSocket
): string {
  const runId = randomUUID()
  const state: RunState = {
    agent,
    events: [],
    done: false,
    sessionId: initialSessionId,
    attachedWs: ws,
    kill: () => {}
  }
  runs.set(runId, state)
  sendJSON(ws, { type: 'run_started', runId })

  function attempt(mode: Mode, sessionId: string | undefined, isRetry: boolean) {
    let stdoutBytes = 0
    let stderrBuf = ''
    let assignedId: string | undefined

    const handle = agent.run(
      { prompt, sessionId, mode, cwd },
      {
        onStdout: (text) => {
          stdoutBytes += text.length
          recordEvent(runId, { type: 'stdout', data: text })
        },
        onStderr: (text) => {
          stderrBuf += text
        },
        onSessionAssigned: (id) => {
          assignedId = id
          const s = runs.get(runId)
          if (s) s.sessionId = id
          recordEvent(runId, { type: 'session_assigned', sessionId: id })
        },
        onError: (message) => {
          recordEvent(runId, { type: 'error', message })
        },
        onClose: (code) => {
          const fallbackMode = !isRetry
            ? agent.detectFallback(mode, stderrBuf, stdoutBytes, code)
            : null
          if (fallbackMode) {
            const fallbackId =
              agent.name === 'codex' && fallbackMode === 'create' ? undefined : sessionId
            attempt(fallbackMode, fallbackId, true)
            return
          }
          if (stderrBuf) recordEvent(runId, { type: 'stderr', data: stderrBuf })
          const s = runs.get(runId)
          recordEvent(runId, { type: 'done', code, sessionId: s?.sessionId })
          if (s) {
            s.done = true
            s.exitCode = code
          }
          scheduleExpiry(runId)
        }
      }
    )
    state.kill = handle.kill
  }

  attempt(initialMode, initialSessionId, false)
  return runId
}

function attachRun(runId: string, ws: WebSocket): boolean {
  const state = runs.get(runId)
  if (!state) return false
  state.attachedWs = ws
  for (const evt of state.events) sendJSON(ws, evt)
  if (state.done) scheduleExpiry(runId)
  return true
}

function detachIfBound(ws: WebSocket) {
  runs.forEach((state) => {
    if (state.attachedWs === ws) state.attachedWs = null
  })
}

const httpServer = http.createServer((_req, res) => {
  res.statusCode = 404
  res.end()
})
const wss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (req, socket, head) => {
  if (!req.url?.startsWith(WS_PATH)) {
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

wss.on('connection', (ws: WebSocket) => {
  let connectionRunId: string | null = null

  ws.on('message', (raw) => {
    let msg: {
      type?: string
      agent?: string
      sessionId?: string
      prompt?: string
      mode?: string
      runId?: string
    } | null = null
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      sendJSON(ws, { type: 'error', message: 'invalid json' })
      return
    }
    if (!msg) return

    if (msg.type === 'attach') {
      const runId = String(msg.runId ?? '')
      if (!runId) {
        sendJSON(ws, { type: 'error', message: 'attach requires runId' })
        return
      }
      if (!attachRun(runId, ws)) {
        sendJSON(ws, { type: 'error', message: 'unknown run' })
        return
      }
      connectionRunId = runId
      return
    }

    if (msg.type !== 'prompt') return

    if (connectionRunId) {
      const cur = runs.get(connectionRunId)
      if (cur && !cur.done) {
        sendJSON(ws, { type: 'error', message: 'busy' })
        return
      }
    }

    const agentName: AgentName = msg.agent === 'codex' ? 'codex' : 'claude'
    const sessionId = msg.sessionId ? String(msg.sessionId) : undefined
    const prompt = String(msg.prompt ?? '')
    const rawMode = String(msg.mode ?? 'create')
    if (rawMode !== 'create' && rawMode !== 'resume') {
      sendJSON(ws, { type: 'error', message: 'invalid mode (must be create or resume)' })
      return
    }
    if (!prompt) {
      sendJSON(ws, { type: 'error', message: 'empty prompt' })
      return
    }
    if (sessionId !== undefined && !UUID_RE.test(sessionId)) {
      sendJSON(ws, { type: 'error', message: 'invalid session id (must be a UUID)' })
      return
    }
    if (agentName === 'claude' && !sessionId) {
      sendJSON(ws, { type: 'error', message: 'claude requires a sessionId' })
      return
    }
    if (agentName === 'codex' && rawMode === 'resume' && !sessionId) {
      sendJSON(ws, { type: 'error', message: 'codex resume requires a sessionId' })
      return
    }

    connectionRunId = startRun(pickAgent(agentName), rawMode, sessionId, prompt, AGENT_CWD, ws)
  })

  ws.on('close', () => {
    detachIfBound(ws)
  })
})

const AGENT_PORT = Number(process.env.AGENT_PORT ?? 9877)
const AGENT_CWD = process.env.AGENT_CWD ?? process.cwd()

httpServer.listen(AGENT_PORT, '127.0.0.1', () => {
  console.log(`[agent-server] listening on 127.0.0.1:${AGENT_PORT} (cwd=${AGENT_CWD})`)
})
