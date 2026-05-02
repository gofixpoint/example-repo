import { useEffect, useRef, useState } from 'react'

type ChatRole = 'user' | 'agent'

type ChatMessage = {
  id: number
  role: ChatRole
  content: string
  streaming?: boolean
}

type Props = {
  sessionId: string
}

type ServerMessage =
  | { type: 'stdout' | 'stderr'; data: string }
  | { type: 'done'; code: number }
  | { type: 'error'; message: string }

const STARTED_KEY = 'agent.startedSessions'

function loadStartedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(STARTED_KEY)
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
  localStorage.setItem(STARTED_KEY, JSON.stringify([...set]))
}

export default function Agent({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const activeIdRef = useRef<number | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
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
      } else if (msg.type === 'done') {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, streaming: false } : m))
        )
        if (msg.code === 0 && activeSessionIdRef.current) {
          markSessionStarted(activeSessionIdRef.current)
        }
        activeIdRef.current = null
        activeSessionIdRef.current = null
        setBusy(false)
      } else if (msg.type === 'error') {
        if (id != null) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, content: m.content + `\n[error: ${msg.message}]`, streaming: false } : m
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
  }, [])

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

    const mode: 'create' | 'resume' = loadStartedSessions().has(sessionId) ? 'resume' : 'create'
    activeSessionIdRef.current = sessionId

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
    ws.send(JSON.stringify({ type: 'prompt', sessionId, prompt: text, mode }))
  }

  return (
    <article className="panel agent-panel">
      <div className="agent-header">
        <h3>Agent</h3>
        <span className={`warning-pill ${connected ? 'mock' : ''}`}>
          {connected ? `claude -p · ${sessionId.slice(0, 8)}…` : 'disconnected'}
        </span>
      </div>
      <div className="agent-thread" ref={threadRef}>
        {messages.length === 0 ? (
          <p className="placeholder">Ask the agent something — it runs `claude -p` on the host.</p>
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
