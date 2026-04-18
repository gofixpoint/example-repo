import { describe, it, after, before } from 'node:test'
import assert from 'node:assert/strict'

let server

before(async () => {
  process.env.PORT = '0' // random available port
  const mod = await import('./server.js')
  server = mod.server
  await new Promise((resolve) => {
    if (server.listening) return resolve()
    server.on('listening', resolve)
  })
})

after(() => {
  server.close()
})

function baseUrl() {
  const addr = server.address()
  return `http://localhost:${addr.port}`
}

describe('GET /heartbeat', () => {
  it('returns 200 with correct JSON shape', async () => {
    const res = await fetch(`${baseUrl()}/heartbeat`)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('content-type'), 'application/json')

    const body = await res.json()
    assert.equal(body.status, 'ok')
    assert.equal(typeof body.timestamp, 'string')
    // Verify it's a valid ISO-8601 date
    assert.ok(!isNaN(Date.parse(body.timestamp)), 'timestamp should be valid ISO-8601')
  })

  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`${baseUrl()}/unknown`)
    assert.equal(res.status, 404)
  })
})
