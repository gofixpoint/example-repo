# AGENTS.md

## Purpose

This repository contains a mocked demo website for Amika's products.

## Scope

The current implementation is mostly a frontend prototype, with one real backend
integration:

- The `Demo` tab is fully mocked (no real messaging bus, no real filesystem ops).
- The `Terminal` tab connects to a real shell on the host via a WebSocket backend
  served by a Vite plugin (`vite-plugin-pty.ts`) using `node-pty`.
- The `Agent` tab is a placeholder chat UI with no model wired up.

⚠️ The terminal is intentionally **unauthenticated** and the dev server binds to
`0.0.0.0` (`server.host: true` in `vite.config.ts`), so anyone who can reach the
port has full shell access. This is a deliberate demo-only configuration — do
not deploy as-is.

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

## Key files

- `src/App.tsx` contains demo logic, tab routing, and event simulation.
- `src/Terminal.tsx` mounts xterm.js and connects to `/pty` WebSocket.
- `src/Agent.tsx` is the placeholder agent chat UI.
- `src/styles.css` contains visual system and responsive behavior.
- `vite.config.ts` sets server defaults.
- `vite-plugin-pty.ts` runs the WebSocket → node-pty backend in dev mode.

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior for the Demo tab.
- The Terminal tab is the one place where real backend behavior is allowed.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
