import { useState } from 'react'

type ChatRole = 'user' | 'agent'

type ChatMessage = {
  id: number
  role: ChatRole
  content: string
}

const seedMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'agent',
    content: "Hi! I'm a placeholder agent. Wire me up to a real model when you're ready."
  }
]

export default function Agent() {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages)
  const [draft, setDraft] = useState('')

  function send() {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: 'user', content: text },
      {
        id: prev.length + 2,
        role: 'agent',
        content: '(mock) I would respond here once a backend model is connected.'
      }
    ])
    setDraft('')
  }

  return (
    <article className="panel agent-panel">
      <div className="agent-header">
        <h3>Agent</h3>
        <span className="warning-pill mock">mock · no model connected</span>
      </div>
      <div className="agent-thread">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            <span className="bubble-role">{m.role}</span>
            <p>{m.content}</p>
          </div>
        ))}
      </div>
      <form
        className="agent-composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the agent…"
          aria-label="Message"
        />
        <button type="submit">Send</button>
      </form>
    </article>
  )
}
