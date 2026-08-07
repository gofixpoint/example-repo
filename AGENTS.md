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

Inside an Amika sandbox this is different: the dev server is managed by systemd and runs on
port `4102`. See [devdocs/amika-vm-environment.md](devdocs/amika-vm-environment.md).

## Key files

- `src/main.tsx` resolves the current path to a page.
- `src/App.tsx` contains demo logic and event simulation (route `/`).
- `src/AmikaPage.tsx` is the "what is Amika" explainer (route `/amika`).
- `src/router.tsx` is a minimal History API router (`usePath`, `Link`) — no router dependency.
- `src/icons.tsx` holds inline SVG icons drawn with `currentColor`.
- `src/styles.css` contains visual system and responsive behavior.
- `vite.config.ts` sets server defaults.

## Routes

| Path | Page |
| --- | --- |
| `/` | Mocked product demo |
| `/amika` | Explains what Amika is |

Routing is client-side. `vite dev` and `vite preview` both fall back to `index.html` for unknown
paths, so deep links work as-is; any other static host needs the same SPA fallback configured.

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
