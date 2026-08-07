import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'

// The demo has no router dependency, so this is the smallest thing that works:
// a pathname switch over the History API. Navigations dispatch a custom event
// because pushState does not fire popstate for the tab that called it.
const NAVIGATE_EVENT = 'amika:navigate'

function normalize(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

export function navigate(to: string) {
  if (normalize(to) !== normalize(window.location.pathname)) {
    window.history.pushState({}, '', to)
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
}

export function usePath() {
  const [path, setPath] = useState(() => normalize(window.location.pathname))

  useEffect(() => {
    const sync = () => setPath(normalize(window.location.pathname))
    window.addEventListener('popstate', sync)
    window.addEventListener(NAVIGATE_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(NAVIGATE_EVENT, sync)
    }
  }, [])

  return path
}

type LinkProps = {
  to: string
  className?: string
  children: ReactNode
}

export function Link({ to, className, children }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Leave modified clicks alone so "open in new tab" still works.
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
