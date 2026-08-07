import { useCallback, useEffect, useState } from 'react'

export type Route = '/' | '/amika'

const routes: Route[] = ['/', '/amika']

function readRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return routes.includes(path as Route) ? (path as Route) : '/'
}

/**
 * Minimal history-based router. Two static routes is not enough to justify a
 * routing dependency in a mocked demo, and Vite's dev/preview servers already
 * fall back to index.html for unknown paths.
 */
export function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const syncRoute = () => setRoute(readRoute())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const navigate = useCallback((to: Route) => {
    if (readRoute() !== to) {
      window.history.pushState({}, '', to)
      setRoute(to)
    }
    window.scrollTo({ top: 0 })
  }, [])

  return { route, navigate }
}
