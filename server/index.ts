import express from 'express'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

app.get('/heartbeat', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})

export { app }
