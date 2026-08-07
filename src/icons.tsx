import type { ReactNode } from 'react'

/**
 * Inline stroke icons. They inherit `currentColor` so cards can tint them with
 * the accent variables in styles.css.
 */

type IconProps = {
  className?: string
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function SandboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.6 21 7v10l-9 4.4L3 17V7z" />
      <path d="M3 7l9 4.4L21 7" />
      <path d="M12 11.4v10" />
    </Svg>
  )
}

export function AgentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="3" />
      <path d="M12 3.5v4" />
      <circle cx="9" cy="13" r="1.1" />
      <circle cx="15" cy="13" r="1.1" />
      <path d="M9.5 16.5h5" />
    </Svg>
  )
}

export function ChannelIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 5.5h16v10H12l-4.5 4v-4H4z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </Svg>
  )
}

export function VerifyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8l7.5 2.6v6c0 4.6-3.1 8.4-7.5 9.8-4.4-1.4-7.5-5.2-7.5-9.8v-6z" />
      <path d="M8.7 12.2l2.4 2.4 4.2-4.6" />
    </Svg>
  )
}

/** Small "repo → sandbox → agent" diagram used above the pillar cards. */
export function FlowDiagram() {
  return (
    <svg
      className="amika-diagram"
      viewBox="0 0 520 150"
      role="img"
      aria-label="Flow diagram: a git repo defines a sandbox VM, an agent runs inside it, and Slack, Linear, APIs, and schedules message the agent over a networked channel."
    >
      <defs>
        <marker id="amika-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 10 5 0 10z" fill="currentColor" />
        </marker>
      </defs>

      <g className="diagram-node">
        <rect x="8" y="52" width="120" height="46" rx="10" />
        <text x="68" y="72">git repo</text>
        <text x="68" y="88" className="diagram-sub">
          config as code
        </text>
      </g>

      <g className="diagram-node is-primary">
        <rect x="184" y="30" width="152" height="90" rx="12" />
        <text x="260" y="54">sandbox VM</text>
        <rect x="204" y="66" width="112" height="38" rx="8" className="diagram-inner" />
        <text x="260" y="90" className="diagram-sub">
          agent + your stack
        </text>
      </g>

      <g className="diagram-node">
        <rect x="392" y="16" width="120" height="40" rx="10" />
        <text x="452" y="41">Slack / Linear</text>
      </g>

      <g className="diagram-node">
        <rect x="392" y="64" width="120" height="40" rx="10" />
        <text x="452" y="89">API / CLI / SDK</text>
      </g>

      <g className="diagram-node">
        <rect x="392" y="112" width="120" height="40" rx="10" />
        <text x="452" y="137">webhooks / cron</text>
      </g>

      <g className="diagram-edge">
        <path d="M132 75h44" markerEnd="url(#amika-arrow)" />
        <path d="M384 36H352a12 12 0 0 1-12-12V75" markerEnd="url(#amika-arrow)" />
        <path d="M384 84h-44" markerEnd="url(#amika-arrow)" />
        <path d="M384 132H352a12 12 0 0 0-12-12V75" markerEnd="url(#amika-arrow)" />
      </g>
    </svg>
  )
}
