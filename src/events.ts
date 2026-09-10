export type EventKind = 'factory' | 'messaging' | 'filesystem' | 'sandbox'

export type DemoEvent = {
  id: number
  ts: string
  kind: EventKind
  detail: string
}

export function countEvents(events: DemoEvent[]) {
  return {
    factory: events.filter((event) => event.kind === 'factory').length,
    messaging: events.filter((event) => event.kind === 'messaging').length,
    filesystem: events.filter((event) => event.kind === 'filesystem').length
  }
}
