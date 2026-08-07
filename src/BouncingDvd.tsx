import { useEffect, useRef } from 'react'

const LOGO_WIDTH = 132
const LOGO_HEIGHT = 68

// px per millisecond, applied to both axes for the classic 45-degree drift
const SPEED = 0.14

// Long frame gaps (backgrounded tab, slow paint) would otherwise teleport the logo past a wall
// and skip the bounce entirely.
const MAX_FRAME_MS = 50

const HUES = [166, 28, 198, 320, 54, 268]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function BouncingDvd() {
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let x = 24
    let y = 24
    let vx = SPEED
    let vy = SPEED
    let hue = 0
    let last = 0
    let frame = 0

    function paint() {
      const el = logoRef.current
      if (!el) return
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      el.style.color = `hsl(${HUES[hue]} 90% 62%)`
    }

    function step(now: number) {
      const delta = last === 0 ? 0 : Math.min(now - last, MAX_FRAME_MS)
      last = now

      // Recomputed per frame so the logo stays inside the viewport across resizes.
      const maxX = Math.max(0, window.innerWidth - LOGO_WIDTH)
      const maxY = Math.max(0, window.innerHeight - LOGO_HEIGHT)

      x += vx * delta
      y += vy * delta

      // Only reverse when heading into a wall, so a resize that leaves the logo out of bounds
      // clamps back in instead of getting pinned to the edge.
      let bounced = false
      if (maxX > 0 && ((x <= 0 && vx < 0) || (x >= maxX && vx > 0))) {
        vx = -vx
        bounced = true
      }
      if (maxY > 0 && ((y <= 0 && vy < 0) || (y >= maxY && vy > 0))) {
        vy = -vy
        bounced = true
      }
      x = clamp(x, 0, maxX)
      y = clamp(y, 0, maxY)

      if (bounced) {
        hue = (hue + 1) % HUES.length
      }

      paint()
      frame = requestAnimationFrame(step)
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    function sync() {
      cancelAnimationFrame(frame)
      last = 0
      if (reducedMotion.matches) {
        paint()
        return
      }
      frame = requestAnimationFrame(step)
    }

    sync()
    reducedMotion.addEventListener('change', sync)

    return () => {
      cancelAnimationFrame(frame)
      reducedMotion.removeEventListener('change', sync)
    }
  }, [])

  return (
    <div className="bouncing-dvd" ref={logoRef} aria-hidden="true">
      <svg viewBox="0 0 132 68" width={LOGO_WIDTH} height={LOGO_HEIGHT} focusable="false">
        <ellipse
          cx="66"
          cy="25"
          rx="60"
          ry="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.5"
          transform="rotate(-8 66 25)"
        />
        <text x="66" y="34" textAnchor="middle" fontSize="27" fontWeight="700" letterSpacing="1" fill="currentColor">
          DVD
        </text>
        <rect x="40" y="43" width="52" height="16" rx="3" fill="currentColor" />
        <text x="66" y="55" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2" fill="var(--bg)">
          VIDEO
        </text>
      </svg>
    </div>
  )
}
