import { useMemo, useState } from 'react'
import { Terminal } from '@wterm/react'
import '@wterm/react/css'

type EventKind = 'factory' | 'messaging' | 'filesystem' | 'sandbox'

type DemoEvent = {
  id: number
  ts: string
  kind: EventKind
  detail: string
}

const filePath = '/workspaces/release-2026/config/deploy.json'
const buildMessage = JSON.stringify(
  {
    workflow: 'build-and-verify',
    commit: '3b42aef',
    target: 'us-east-1'
  },
  null,
  2
)

function makeTimestamp() {
  return new Date().toLocaleTimeString([], { hour12: false })
}

function nextSandboxId() {
  return `sbx-${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const [sandboxId, setSandboxId] = useState<string>('not-created')
  const [topic] = useState('factory.events.deploy')
  const [events, setEvents] = useState<DemoEvent[]>([])
  const [fileBody, setFileBody] = useState<string>('')
  const [fileReads, setFileReads] = useState<number>(0)
  const [messagesSent, setMessagesSent] = useState<number>(0)

  const counts = useMemo(() => {
    return {
      factory: events.filter((e) => e.kind === 'factory').length,
      messaging: events.filter((e) => e.kind === 'messaging').length,
      filesystem: events.filter((e) => e.kind === 'filesystem').length
    }
  }, [events])

  function appendEvent(kind: EventKind, detail: string) {
    setEvents((prev) => [
      {
        id: prev.length + 1,
        ts: makeTimestamp(),
        kind,
        detail
      },
      ...prev
    ])
  }

  function createSandbox() {
    const id = nextSandboxId()
    setSandboxId(id)
    appendEvent('sandbox', `Created isolated sandbox ${id}`)
    appendEvent('factory', `Factory registered pipeline on ${id}`)
  }

  function runFactoryTask() {
    if (sandboxId === 'not-created') {
      appendEvent('factory', 'Skipped task run: create sandbox first')
      return
    }
    appendEvent('factory', `Executed software factory workflow in ${sandboxId}`)
  }

  function publishMessage() {
    if (sandboxId === 'not-created') {
      appendEvent('messaging', 'Skipped publish: no active sandbox')
      return
    }
    setMessagesSent((n) => n + 1)
    appendEvent('messaging', `Published to ${topic} from ${sandboxId}`)
  }

  function writeFile() {
    if (sandboxId === 'not-created') {
      appendEvent('filesystem', 'Skipped write: no active sandbox')
      return
    }
    setFileBody(buildMessage)
    appendEvent('filesystem', `Wrote ${buildMessage.length} bytes to ${filePath}`)
  }

  function readFile() {
    if (!fileBody) {
      appendEvent('filesystem', `Read ${filePath}: file not found`)
      return
    }
    setFileReads((n) => n + 1)
    appendEvent('filesystem', `Read ${buildMessage.length} bytes from ${filePath}`)
  }

  function teardownSandbox() {
    if (sandboxId === 'not-created') {
      appendEvent('sandbox', 'No sandbox to teardown')
      return
    }
    appendEvent('sandbox', `Destroyed sandbox ${sandboxId} and cleaned mount namespace`)
    setSandboxId('not-created')
  }

  return (
    <div className="page-shell">
      <div className="mesh-bg" aria-hidden="true" />

      <header className="hero">
        <p className="eyebrow">Mock Product Demo • Vite + React + TypeScript</p>
        <h1>Build, message, and persist in one isolated runtime.</h1>
        <p className="hero-copy">
          This demo simulates how Amika software factory workflows coordinate sandbox messaging and sandbox filesystem
          operations for reproducible delivery.
        </p>
        <div className="hero-actions">
          <button type="button">Run Demo</button>
          <button type="button" className="ghost">
            View API
          </button>
        </div>
      </header>

      <section className="terminal-section" aria-label="Interactive terminal">
        <h3>Interactive Terminal</h3>
        <div className="terminal-container">
          <Terminal
            theme="default"
            onData={(data) => {
              console.log('Terminal input:', data)
            }}
            onReady={(wt) => {
              wt.write('Welcome to wterm!\r\n')
              wt.write('This is a web-based terminal emulator.\r\n')
              wt.write('$ ')
            }}
          />
        </div>
      </section>

      <section className="pillars" aria-label="Product pillars">
        <article>
          <h2>Software Factory</h2>
          <p>Deterministic workflow execution with auditable task steps and controlled runtime inputs.</p>
        </article>
        <article>
          <h2>Sandbox Messaging</h2>
          <p>Scoped event channels for build orchestration, status telemetry, and policy-aware routing.</p>
        </article>
        <article>
          <h2>Sandbox Filesystem</h2>
          <p>Ephemeral or persistent mounts with explicit read/write traces and lifecycle-aware cleanup.</p>
        </article>
      </section>

      <section className="demo-grid" aria-label="Interactive demo panel">
        <article className="panel controls">
          <h3>Factory Control Plane</h3>
          <div className="meta">
            <span>Sandbox: {sandboxId}</span>
            <span>Topic: {topic}</span>
          </div>
          <div className="button-grid">
            <button type="button" onClick={createSandbox}>
              Create Sandbox
            </button>
            <button type="button" onClick={runFactoryTask}>
              Run Factory Job
            </button>
            <button type="button" onClick={publishMessage}>
              Publish Message
            </button>
            <button type="button" onClick={writeFile}>
              Write File
            </button>
            <button type="button" onClick={readFile}>
              Read File
            </button>
            <button type="button" onClick={teardownSandbox}>
              Teardown
            </button>
          </div>

          <div className="stats-row">
            <div>
              <span>Factory Events</span>
              <strong>{counts.factory}</strong>
            </div>
            <div>
              <span>Messages</span>
              <strong>{messagesSent}</strong>
            </div>
            <div>
              <span>Filesystem Reads</span>
              <strong>{fileReads}</strong>
            </div>
          </div>
        </article>

        <article className="panel stream">
          <h3>Sandbox Event Stream</h3>
          <ul>
            {events.length === 0 ? (
              <li className="placeholder">No events yet. Start with Create Sandbox.</li>
            ) : (
              events.map((event) => (
                <li key={event.id}>
                  <span className={`kind ${event.kind}`}>{event.kind}</span>
                  <code>{event.ts}</code>
                  <p>{event.detail}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="architecture" aria-label="Architecture flow">
        <h3>Reference Flow</h3>
        <div className="flow">
          <div>Software Factory</div>
          <div>Sandbox Runtime</div>
          <div>Messaging Bus</div>
          <div>Sandbox Filesystem</div>
        </div>
      </section>

      <section className="api" aria-label="API snippets">
        <h3>API Sketch</h3>
        <pre>
          <code>{`POST /v1/sandboxes
{ "profile": "build-runner", "ttl": "30m" }

POST /v1/messages/publish
{ "topic": "factory.events.deploy", "payload": {"status":"ok"} }

PUT /v1/fs/write
{ "sandboxId": "${sandboxId}", "path": "${filePath}", "bytes": 78 }`}</code>
        </pre>
      </section>

      <section className="env-vars" aria-label="Environment variables">
        <h3>Environment Variables</h3>
        <dl className="env-list">
          <div>
            <dt>VITE_FRONTEND_URL</dt>
            <dd>{import.meta.env.VITE_FRONTEND_URL ?? <span className="env-unset">not set</span>}</dd>
          </div>
          <div>
            <dt>VITE_FRONTEND_PORT</dt>
            <dd>{import.meta.env.VITE_FRONTEND_PORT ?? <span className="env-unset">not set</span>}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
