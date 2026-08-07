import type { MouseEvent } from 'react'
import type { Route } from './routing'

type SiteNavProps = {
  route: Route
  onNavigate: (to: Route) => void
}

const links: { to: Route; label: string }[] = [
  { to: '/', label: 'Demo' },
  { to: '/amika', label: 'What is Amika?' }
]

export default function SiteNav({ route, onNavigate }: SiteNavProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>, to: Route) {
    // Let the browser handle modified clicks so links still open in new tabs.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    onNavigate(to)
  }

  return (
    <nav className="site-nav" aria-label="Site">
      <span className="site-mark">amika</span>
      <ul>
        {links.map(({ to, label }) => (
          <li key={to}>
            <a
              href={to}
              aria-current={route === to ? 'page' : undefined}
              onClick={(event) => handleClick(event, to)}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
