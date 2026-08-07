# Amika Demo Site

A simple example website built with Vite, React, and TypeScript to demo:

- Software factory workflows
- Sandbox messaging
- Sandbox filesystem behavior

## Run locally

```bash
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:9876` by default.

## Build

```bash
pnpm build
pnpm preview
```

Preview also runs on port `9876`.

## Pages

- `/`: the interactive mocked demo
- `/amika`: a short explainer of what Amika is

## Project structure

- `src/Site.tsx`: page shell and route switch
- `src/routing.ts`: minimal history-based router (no routing dependency)
- `src/SiteNav.tsx`: top navigation
- `src/App.tsx`: main demo UI and mocked interactions
- `src/AmikaPage.tsx`: the `/amika` explainer page
- `src/icons.tsx`: inline SVG icons and the flow diagram
- `src/styles.css`: visual styling and responsive layout
- `vite.config.ts`: Vite config (including default ports)
