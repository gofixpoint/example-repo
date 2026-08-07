import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'

/**
 * Minimal history-based routing. The demo only has a handful of static pages, so
 * this stays dependency-free instead of pulling in a router.
 */

export function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function navigate(to: string) {
  if (currentPath() === to) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

export function usePath() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onPopState = () => setPath(currentPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return path
}

type LinkProps = {
  to: string
  children: ReactNode
  className?: string
}

export function Link({ to, children, className }: LinkProps) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks so "open in new tab" keeps working.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  )
}
