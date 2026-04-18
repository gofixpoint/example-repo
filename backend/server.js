import { createServer } from 'node:http'

const PORT = process.env.PORT ?? 3001

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/heartbeat') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})

export { server }
