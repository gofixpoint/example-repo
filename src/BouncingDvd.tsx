import { useEffect, useRef, useState } from 'react'

const COLORS = ['#1dd6a5', '#fd9d4b', '#4bb8fd', '#e764f2', '#f2e764', '#fd6b6b']
const SPEED = 140 // px per second

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type BouncingDvdProps = {
  /** Index into COLORS the logo starts on, so multiple logos do not match. */
  startColor?: number
  /** Direction the logo travels on each axis. */
  directionX?: 1 | -1
  directionY?: 1 | -1
}

export default function BouncingDvd({ startColor = 0, directionX = 1, directionY = 1 }: BouncingDvdProps = {}) {
  const logoRef = useRef<HTMLDivElement>(null)
  const [colorIndex, setColorIndex] = useState(startColor % COLORS.length)
  const [still, setStill] = useState(() => prefersReducedMotion())

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setStill(motionQuery.matches)
    motionQuery.addEventListener('change', onChange)
    return () => motionQuery.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const logo = logoRef.current
    if (!logo || still) return

    let x = Math.random() * Math.max(0, window.innerWidth - logo.offsetWidth)
    let y = Math.random() * Math.max(0, window.innerHeight - logo.offsetHeight)
    let dx = SPEED * directionX
    let dy = SPEED * directionY
    let last = performance.now()
    let frame = 0

    function step(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const maxX = Math.max(0, window.innerWidth - logo!.offsetWidth)
      const maxY = Math.max(0, window.innerHeight - logo!.offsetHeight)

      x += dx * dt
      y += dy * dt

      let bounced = false
      if (x <= 0 || x >= maxX) {
        dx = -dx
        x = Math.min(Math.max(x, 0), maxX)
        bounced = true
      }
      if (y <= 0 || y >= maxY) {
        dy = -dy
        y = Math.min(Math.max(y, 0), maxY)
        bounced = true
      }
      if (bounced) {
        setColorIndex((i) => (i + 1) % COLORS.length)
      }

      logo!.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [still, directionX, directionY])

  return (
    <div className="dvd-stage" aria-hidden="true">
      <div ref={logoRef} className="dvd-logo" style={{ color: COLORS[colorIndex] }}>
        <svg viewBox="0 0 120 56" width="120" height="56" role="presentation" focusable="false">
          <g fill="currentColor">
            <text
              x="60"
              y="30"
              textAnchor="middle"
              fontFamily="var(--sans)"
              fontSize="28"
              fontWeight="700"
              transform="skewX(-12) translate(6 0)"
            >
              DVD
            </text>
            <ellipse cx="60" cy="41" rx="46" ry="9" />
            <text
              x="60"
              y="45"
              textAnchor="middle"
              fontFamily="var(--mono)"
              fontSize="9"
              fontWeight="700"
              fill="#02111b"
              letterSpacing="2"
            >
              VIDEO
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}
