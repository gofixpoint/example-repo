import { useEffect, useRef } from 'react'

// Deterministic start state so the demo looks the same on every load.
const START_X = 48
const START_Y = 120
const SPEED = 0.11 // px per ms
const HUE_STEP = 47 // degrees of hue shift per wall hit
const MAX_FRAME_MS = 32 // clamp dt so tab-switches don't teleport the logo

export default function DvdBouncer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let x = START_X
    let y = START_Y
    let vx = SPEED
    let vy = SPEED
    let hue = 0
    let last = performance.now()
    let frame = 0

    const step = (now: number) => {
      const dt = Math.min(now - last, MAX_FRAME_MS)
      last = now

      const { width, height } = el.getBoundingClientRect()
      const maxX = Math.max(0, window.innerWidth - width)
      const maxY = Math.max(0, window.innerHeight - height)

      x += vx * dt
      y += vy * dt

      let bounced = false
      if (x <= 0) {
        x = 0
        vx = Math.abs(vx)
        bounced = true
      } else if (x >= maxX) {
        x = maxX
        vx = -Math.abs(vx)
        bounced = true
      }
      if (y <= 0) {
        y = 0
        vy = Math.abs(vy)
        bounced = true
      } else if (y >= maxY) {
        y = maxY
        vy = -Math.abs(vy)
        bounced = true
      }

      if (bounced) {
        hue = (hue + HUE_STEP) % 360
        el.style.setProperty('--dvd-hue', String(hue))
      }

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="dvd-bouncer" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 120 64" role="presentation">
        <ellipse className="dvd-disc" cx="60" cy="24" rx="56" ry="20" />
        <text className="dvd-word" x="60" y="32" textAnchor="middle">
          DVD
        </text>
        <rect className="dvd-bar" x="26" y="44" width="68" height="14" rx="7" />
        <text className="dvd-video" x="60" y="54" textAnchor="middle">
          VIDEO
        </text>
      </svg>
    </div>
  )
}
