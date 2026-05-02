import net from 'node:net'
import type { Plugin } from 'vite'

const WS_PATH = '/ws/agent'

export function agentProxyPlugin(): Plugin {
  return {
    name: 'vite-plugin-agent-proxy',
    configureServer(server) {
      const port = Number(process.env.AGENT_PORT ?? 9877)
      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (!req.url?.startsWith(WS_PATH)) return

        const upstream = net.connect(port, '127.0.0.1', () => {
          const lines = [`${req.method ?? 'GET'} ${req.url} HTTP/${req.httpVersion}`]
          for (const [name, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              for (const v of value) lines.push(`${name}: ${v}`)
            } else if (value !== undefined) {
              lines.push(`${name}: ${value}`)
            }
          }
          upstream.write(lines.join('\r\n') + '\r\n\r\n')
          if (head && head.length) upstream.write(head)
          upstream.pipe(socket)
          socket.pipe(upstream)
        })

        const cleanup = () => {
          upstream.destroy()
          socket.destroy()
        }
        upstream.on('error', cleanup)
        socket.on('error', cleanup)
      })
    }
  }
}
