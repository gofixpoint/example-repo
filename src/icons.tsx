// Inline SVGs so the demo stays dependency-free. Everything is drawn with
// `currentColor`, which lets the existing accent tokens control the color.
type IconProps = {
  size?: number
}

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false
  }
}

/** A sandbox: an isolated box you can boot anywhere. */
export function SandboxIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2.6 21 7v10l-9 4.4L3 17V7z" />
      <path d="M3 7l9 4.4L21 7" />
      <path d="M12 11.4v10" />
    </svg>
  )
}

/** A devbox you SSH into. */
export function TerminalIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="2.6" y="4" width="18.8" height="16" rx="2.4" />
      <path d="M6.6 9.5l2.8 2.5-2.8 2.5" />
      <path d="M12 15h5" />
    </svg>
  )
}

/** A team driving shared agents. */
export function TeamIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="9" cy="8.4" r="3.4" />
      <path d="M2.8 20c.7-3.4 3.2-5.2 6.2-5.2s5.5 1.8 6.2 5.2" />
      <path d="M16.4 5.4a3.4 3.4 0 0 1 0 6" />
      <path d="M18.2 14.9c1.6.8 2.6 2.4 3 5.1" />
    </svg>
  )
}

/** Workflows that fire on their own. */
export function AutomationIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M13.4 2.6 5.2 13.4h5.1l-.7 8 8.2-10.8h-5.1z" />
    </svg>
  )
}

/** Configuration that lives in a git repo. */
export function GitIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="6.6" cy="5.4" r="2.6" />
      <circle cx="6.6" cy="18.6" r="2.6" />
      <circle cx="17.4" cy="12" r="2.6" />
      <path d="M6.6 8v8" />
      <path d="M14.8 12h-1.6a4 4 0 0 0-4 4v.4" />
    </svg>
  )
}

/** Snapshot boots — restore a prepared machine fast. */
export function SnapshotIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.4 2" />
      <path d="M3.4 9.6h4.2" />
    </svg>
  )
}

/** Reachable over the network, from anywhere. */
export function NetworkIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z" />
    </svg>
  )
}

/** Guardrails: the agent has to prove the work is correct. */
export function ShieldCheckIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2.8l7.4 2.8v6c0 4.4-3 8-7.4 9.6-4.4-1.6-7.4-5.2-7.4-9.6v-6z" />
      <path d="M8.8 12.2l2.4 2.4 4-4.6" />
    </svg>
  )
}

/** Any agent, any model — no lock-in. */
export function ModelIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="7.8" y="7.8" width="8.4" height="8.4" rx="1.8" />
      <path d="M10.4 3.4v2.6M13.6 3.4v2.6M10.4 18v2.6M13.6 18v2.6" />
      <path d="M3.4 10.4h2.6M3.4 13.6h2.6M18 10.4h2.6M18 13.6h2.6" />
    </svg>
  )
}

/** Every session is recorded — transcripts, diffs, cost. */
export function RecordIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M4.4 4h15.2a1.6 1.6 0 0 1 1.6 1.6v12.8a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6V5.6A1.6 1.6 0 0 1 4.4 4z" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M6 8.4h.01M18 15.6h.01" />
    </svg>
  )
}

/** Message an agent from Slack, Linear, the web, or an API. */
export function ChatIcon({ size = 22 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M20.4 12.4c0 3.9-3.8 7-8.4 7-1.1 0-2.2-.2-3.1-.5L4 20.4l1.4-3.6c-1.1-1.2-1.8-2.7-1.8-4.4 0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7z" />
      <path d="M8.6 12h.01M12 12h.01M15.4 12h.01" />
    </svg>
  )
}
