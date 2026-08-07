# AGENTS.md

## Purpose

This repository contains a mocked demo website for Amika's products.

## Scope

The current implementation is a frontend-only prototype:

- No backend integration
- No real messaging bus
- No real filesystem operations
- All interactions are mocked in the browser UI

## Tech stack

- Vite
- React
- TypeScript

## Local development

```bash
pnpm install
pnpm dev
```

Default port: `9876`

## Routes

- `/` renders the interactive demo (`src/App.tsx`).
- `/amika` renders a short explainer of the product (`src/AmikaPage.tsx`).

Routing is a small `pushState` helper in `src/routing.ts`; there is no routing
library. Vite's dev and preview servers fall back to `index.html`, so deep links
work without extra config. Add new routes to the `Route` union in
`src/routing.ts` and to the switch in `src/Site.tsx`.

## Key files

- `src/Site.tsx` holds the page shell and route switch.
- `src/App.tsx` contains demo logic and event simulation.
- `src/AmikaPage.tsx` contains the `/amika` explainer content.
- `src/icons.tsx` holds inline SVG icons and the flow diagram.
- `src/styles.css` contains visual system and responsive behavior.
- `vite.config.ts` sets server defaults.

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
