import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 13,
      theme: {
        background: '#031724',
        foreground: '#ebfbff',
        cursor: '#1dd6a5'
      }
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()

    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProto}//${window.location.host}/ws/bash`)

    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      ws.send(`\x1b[RESIZE]${term.cols},${term.rows}`)
    }

    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') term.write(ev.data)
      else term.write(new Uint8Array(ev.data))
    }

    ws.onclose = () => term.write('\r\n[connection closed]\r\n')
    ws.onerror = () => term.write('\r\n[connection error]\r\n')

    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    })

    const resize = () => {
      fit.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\x1b[RESIZE]${term.cols},${term.rows}`)
      }
    }
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      dataDisposable.dispose()
      ws.close()
      term.dispose()
    }
  }, [])

  return (
    <article className="panel terminal-panel">
      <div className="terminal-header">
        <h3>Host Terminal</h3>
        <span className="warning-pill">⚠️ DEMO ONLY · UNAUTHENTICATED SHELL</span>
      </div>
      <div ref={containerRef} className="terminal-host" />
    </article>
  )
}
