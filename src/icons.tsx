import type { ReactNode } from 'react'

/**
 * Inline stroke icons for the /amika page. They inherit `currentColor` so the
 * page palette stays in one place (styles.css).
 */

type IconProps = {
  children: ReactNode
}

function Icon({ children }: IconProps) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
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

export function SandboxIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 8h18" />
      <circle cx="6" cy="6" r="0.6" fill="currentColor" stroke="none" />
      <path d="M8 19h8" />
      <path d="M9.5 12.5 11 14l-1.5 1.5M13.5 15.5H16" />
    </Icon>
  )
}

export function AgentIcon() {
  return (
    <Icon>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 3v5" />
      <circle cx="12" cy="3" r="1.2" />
      <path d="M9.5 12.5v1.5M14.5 12.5v1.5" />
      <path d="M9.5 16.5h5" />
    </Icon>
  )
}

export function SurfacesIcon() {
  return (
    <Icon>
      <rect x="2" y="5" width="12" height="9" rx="1.6" />
      <path d="M6 17h5" />
      <rect x="16" y="9" width="6" height="11" rx="1.6" />
      <path d="M18.5 17.5h1" />
    </Icon>
  )
}

export function GitConfigIcon() {
  return (
    <Icon>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="17" cy="12" r="2.2" />
      <path d="M6 8.2v7.6" />
      <path d="M8.2 6h4.3a2.3 2.3 0 0 1 2.3 2.3v1.6" />
    </Icon>
  )
}

export function SnapshotIcon() {
  return (
    <Icon>
      <path d="M12 4a8 8 0 1 1-7.6 5.6" />
      <path d="M4 4v5.6h5.6" />
      <path d="M12 8.5V12l2.5 1.8" />
    </Icon>
  )
}

export function VerifyIcon() {
  return (
    <Icon>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </Icon>
  )
}

export function NetworkIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5S14.4 18.2 12 20.5C9.6 18.2 8.3 15.2 8.3 12S9.6 5.8 12 3.5z" />
    </Icon>
  )
}

export function ReplayIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10.2 9.2 15 12l-4.8 2.8z" />
    </Icon>
  )
}
