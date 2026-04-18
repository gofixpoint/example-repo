import express from 'express'

const app = express()
const port = process.env.PORT || 3001

app.get('/heartbeat', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})

export { app, server }
