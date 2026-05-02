import { useEffect, useRef, useState } from 'react'

type ChatRole = 'user' | 'agent'
export type AgentName = 'claude' | 'codex'

type ChatMessage = {
  id: number
  role: ChatRole
  content: string
  streaming?: boolean
}

type Props = {
  agent: AgentName
  sessionId: string
  onSelectAgent: (next: AgentName) => void
  onCodexSessionAssigned: (id: string) => void
}

type ServerMessage =
  | { type: 'stdout' | 'stderr'; data: string }
  | { type: 'done'; code: number; sessionId?: string }
  | { type: 'error'; message: string }
  | { type: 'session_assigned'; sessionId: string }

const CLAUDE_STARTED_KEY = 'agent.claude.startedSessions'

function loadStartedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(CLAUDE_STARTED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function markSessionStarted(id: string) {
  const set = loadStartedSessions()
  if (set.has(id)) return
  set.add(id)
  localStorage.setItem(CLAUDE_STARTED_KEY, JSON.stringify([...set]))
}

export default function Agent({ agent, sessionId, onSelectAgent, onCodexSessionAssigned }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const activeIdRef = useRef<number | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const activeAgentRef = useRef<AgentName>(agent)
  const threadRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProto}//${window.location.host}/ws/agent`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (ev) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      const id = activeIdRef.current

      if (msg.type === 'stdout' || msg.type === 'stderr') {
        if (id == null) return
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: m.content + msg.data } : m))
        )
      } else if (msg.type === 'session_assigned') {
        onCodexSessionAssigned(msg.sessionId)
        activeSessionIdRef.current = msg.sessionId
      } else if (msg.type === 'done') {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, streaming: false } : m))
        )
        if (msg.code === 0 && activeAgentRef.current === 'claude' && activeSessionIdRef.current) {
          markSessionStarted(activeSessionIdRef.current)
        }
        activeIdRef.current = null
        activeSessionIdRef.current = null
        setBusy(false)
      } else if (msg.type === 'error') {
        if (id != null) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, content: m.content + `\n[error: ${msg.message}]`, streaming: false }
                : m
            )
          )
        } else {
          setMessages((prev) => [
            ...prev,
            { id: prev.length + 1, role: 'agent', content: `[error: ${msg.message}]` }
          ])
        }
        activeIdRef.current = null
        activeSessionIdRef.current = null
        setBusy(false)
      }
    }

    return () => {
      ws.close()
    }
  }, [onCodexSessionAssigned])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!text || busy) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    let mode: 'create' | 'resume'
    let outboundSessionId: string | undefined
    if (agent === 'claude') {
      mode = loadStartedSessions().has(sessionId) ? 'resume' : 'create'
      outboundSessionId = sessionId
    } else {
      mode = sessionId ? 'resume' : 'create'
      outboundSessionId = sessionId || undefined
    }

    activeAgentRef.current = agent
    activeSessionIdRef.current = outboundSessionId ?? null

    setMessages((prev) => {
      const lastId = prev.length ? prev[prev.length - 1].id : 0
      const userId = lastId + 1
      const agentId = lastId + 2
      activeIdRef.current = agentId
      return [
        ...prev,
        { id: userId, role: 'user', content: text },
        { id: agentId, role: 'agent', content: '', streaming: true }
      ]
    })
    setBusy(true)
    setDraft('')
    ws.send(
      JSON.stringify({
        type: 'prompt',
        agent,
        sessionId: outboundSessionId,
        prompt: text,
        mode
      })
    )
  }

  const cliLabel = agent === 'claude' ? 'claude -p' : 'codex exec'
  const sessionLabel = sessionId ? `${sessionId.slice(0, 8)}…` : 'new'

  return (
    <article className="panel agent-panel">
      <div className="agent-header">
        <div className="agent-header-left">
          <h3>Agent</h3>
          <select
            className="agent-select"
            value={agent}
            onChange={(e) => onSelectAgent(e.target.value as AgentName)}
            aria-label="Agent type"
            disabled={busy}
          >
            <option value="claude">Claude</option>
            <option value="codex">Codex</option>
          </select>
        </div>
        <span className={`warning-pill ${connected ? 'mock' : ''}`}>
          {connected ? `${cliLabel} · ${sessionLabel}` : 'disconnected'}
        </span>
      </div>
      <div className="agent-thread" ref={threadRef}>
        {messages.length === 0 ? (
          <p className="placeholder">
            Ask the {agent} agent something — it runs `{cliLabel}` on the host.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              <span className="bubble-role">{m.role}</span>
              <p>{m.content || (m.streaming ? '…' : '')}</p>
            </div>
          ))
        )}
      </div>
      <form
        className="agent-composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={busy ? 'Streaming…' : 'Ask the agent… (shift+enter to send)'}
          aria-label="Message"
          rows={3}
          disabled={busy || !connected}
        />
        <button type="submit" disabled={busy || !connected || !draft.trim()}>
          Send
        </button>
      </form>
    </article>
  )
}
