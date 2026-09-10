import { describe, expect, it } from 'vitest'

import { countEvents, type DemoEvent } from './events'

function event(id: number, kind: DemoEvent['kind']): DemoEvent {
  return { id, kind, ts: '12:00:00', detail: `${kind} event` }
}

describe('countEvents', () => {
  it('counts each product event independently', () => {
    expect(
      countEvents([
        event(1, 'factory'),
        event(2, 'messaging'),
        event(3, 'factory'),
        event(4, 'filesystem')
      ])
    ).toEqual({ factory: 2, messaging: 1, filesystem: 1 })
  })

  it('does not include sandbox lifecycle events in product totals', () => {
    expect(countEvents([event(1, 'sandbox')])).toEqual({
      factory: 0,
      messaging: 0,
      filesystem: 0
    })
  })
})
