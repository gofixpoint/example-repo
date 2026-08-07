import App from './App'
import AmikaPage from './AmikaPage'
import SiteNav from './SiteNav'
import { useRoute } from './routing'

export default function Site() {
  const { route, navigate } = useRoute()

  return (
    <div className="page-shell">
      <div className="mesh-bg" aria-hidden="true" />
      <SiteNav route={route} onNavigate={navigate} />
      {route === '/amika' ? <AmikaPage /> : <App />}
    </div>
  )
}
