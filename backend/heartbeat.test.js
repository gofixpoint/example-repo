import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { app, server } from './server.js'

const baseUrl = `http://localhost:${server.address().port}`

describe('GET /heartbeat', () => {
  after(() => server.close())

  it('returns 200 with correct JSON shape', async () => {
    const res = await fetch(`${baseUrl}/heartbeat`)
    assert.equal(res.status, 200)

    const body = await res.json()
    assert.equal(body.status, 'ok')
    assert.equal(typeof body.timestamp, 'string')

    // Verify timestamp is valid ISO-8601
    const parsed = new Date(body.timestamp)
    assert.equal(isNaN(parsed.getTime()), false)
  })
})
