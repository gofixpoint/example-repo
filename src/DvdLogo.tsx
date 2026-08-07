import { useEffect, useRef } from 'react'

const LOGO_WIDTH = 140
const LOGO_HEIGHT = 73 // matches .dvd-logo, and 140 x the SVG's 200:104 ratio
const SPEED = 0.14 // px per ms, applied to both axes for a 45° drift

const COLORS = ['#1dd6a5', '#fd9d4b', '#9ad6ff', '#f7b4ff', '#b8ff8f', '#ffc889']

type DvdLogoProps = {
  /** Start position as a fraction (0–1) of the area the logo can occupy. */
  startX?: number
  startY?: number
  /** Initial travel direction on each axis. */
  dirX?: 1 | -1
  dirY?: 1 | -1
  /** Where in COLORS this logo begins, so two logos aren't the same colour. */
  colorOffset?: number
  /** Travel speed in px per ms, equal on both axes for a 45° drift. */
  speed?: number
}

export default function DvdLogo({
  startX = 0.5,
  startY = 0.5,
  dirX = 1,
  dirY = 1,
  colorOffset = 0,
  speed = SPEED
}: DvdLogoProps = {}) {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = logoRef.current
    if (!node) return

    // Deterministic start, positioned as a fraction of the free area.
    let x = Math.max(0, window.innerWidth - LOGO_WIDTH) * startX
    let y = Math.max(0, window.innerHeight - LOGO_HEIGHT) * startY
    let colorIndex = colorOffset % COLORS.length
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    node.style.color = COLORS[colorIndex]

    // Reduced motion: render it parked at that spot, never animate.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let vx = speed * dirX
    let vy = speed * dirY
    let last = 0
    let frame = 0

    // An arrow const rather than a function declaration, so `node` stays
    // narrowed to non-null inside the closure.
    const step = (now: number) => {
      // First frame has no previous timestamp to diff against.
      const delta = last === 0 ? 0 : Math.min(now - last, 50)
      last = now

      const maxX = Math.max(0, window.innerWidth - LOGO_WIDTH)
      const maxY = Math.max(0, window.innerHeight - LOGO_HEIGHT)

      x += vx * delta
      y += vy * delta

      let bounced = false
      if (x <= 0) {
        x = 0
        vx = speed
        bounced = true
      } else if (x >= maxX) {
        x = maxX
        vx = -speed
        bounced = true
      }
      if (y <= 0) {
        y = 0
        vy = speed
        bounced = true
      } else if (y >= maxY) {
        y = maxY
        vy = -speed
        bounced = true
      }

      if (bounced) {
        colorIndex = (colorIndex + 1) % COLORS.length
        node.style.color = COLORS[colorIndex]
      }

      node.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
  }, [startX, startY, dirX, dirY, colorOffset, speed])

  return (
    <div ref={logoRef} className="dvd-logo" aria-hidden="true">
      {/* Geometry keeps the ellipse stroke inside the viewBox and the wordmark
          clear of the VIDEO plate, so nothing clips or collides. */}
      <svg viewBox="0 0 200 104" role="presentation" focusable="false">
        <ellipse cx="100" cy="38" rx="92" ry="32" fill="none" stroke="currentColor" strokeWidth="4" />
        <text x="100" y="51" textAnchor="middle" fontSize="38" fontWeight="800" fontStyle="italic" fill="currentColor">
          DVD
        </text>
        <rect x="56" y="80" width="88" height="21" rx="4" fill="currentColor" />
        <text x="100" y="95" textAnchor="middle" fontSize="14" fontWeight="700" letterSpacing="2" fill="#02111b">
          VIDEO
        </text>
      </svg>
    </div>
  )
}
