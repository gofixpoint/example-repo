import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// On a BYOC host, amika-hostd serves this app under its service link,
// /v0beta1/rigs/<rig>/service-links/frontend/<token>/, rather than at the root of
// its own domain. See devdocs/amika-vm-environment.md.
const base = serviceBase(process.env.VITE_FRONTEND_URL)

export default defineConfig({
  base,
  plugins: [restoreBase(base), react()],
  server: {
    port: 9876,
    // Amika exposes sandbox services through per-session e2b.app subdomains.
    allowedHosts: ['.style.dev', '.vercel.run', '.e2b.app']
  },
  preview: {
    port: 9876
  }
})

/**
 * The path the app is served under: the service URL's path, `/` wherever the
 * service has a domain of its own (e2b, local `pnpm dev`) or no URL is set.
 */
function serviceBase(url: string | undefined): string {
  if (!url) return '/'
  try {
    const { pathname } = new URL(url)
    return pathname.endsWith('/') ? pathname : `${pathname}/`
  } catch {
    return '/'
  }
}

/**
 * amika-hostd strips the service link's prefix before forwarding a request,
 * but a dev server with a `base` only answers paths under it, so the prefix is
 * put back. Does nothing when the base is `/`.
 */
function restoreBase(base: string): Plugin {
  return {
    name: 'amika-restore-base',
    configureServer(server) {
      if (base === '/') return
      server.middlewares.use((req, _res, next) => {
        if (req.url && !req.url.startsWith(base)) {
          req.url = base.slice(0, -1) + req.url
        }
        next()
      })
    }
  }
}
