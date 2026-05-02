# AGENTS.md

## Purpose

This repository contains a mocked demo website for Amika's products.

## Scope

The current implementation is mostly a frontend prototype, with one real backend
integration:

Each tab is a real route:

- `/` — Demo: fully mocked (no real messaging bus, no real filesystem ops).
- `/bash` — Terminal: connects to a real shell on the host via a WebSocket
  (`/ws/bash`) backed by `vite-plugin-pty.ts` + `node-pty`.
- `/agent` — Agent: chat UI that sends prompts over a WebSocket (`/ws/agent`)
  to `vite-plugin-agent.ts`. The plugin defines an `IAgent` interface with two
  implementations (`ClaudeAgent`, `CodexAgent`); the prompt frame's `agent`
  field selects which one to spawn. All session state (current id, history)
  lives in browser localStorage, namespaced per agent. For Codex specifically,
  the auto-generated thread UUID is parsed from the `thread.started` JSONL
  event and pushed back to the browser via a `session_assigned` event so the
  next prompt can resume.

  Codex's settings live under `CODEX_HOME` (default `~/.codex/`); the dev
  server inherits that env var via `process.env`, so logged-in credentials
  work without extra wiring.

⚠️ Both backend endpoints are intentionally **unauthenticated** and the dev
server binds to `0.0.0.0` (`server.host: true` in `vite.config.ts`), so anyone
who can reach the port has full shell access *and* can run prompts as the dev-
server user. This is a deliberate demo-only configuration — do not deploy as-is.

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

- `src/App.tsx` contains the pathname-based tab router and demo logic.
- `src/Terminal.tsx` mounts xterm.js and connects to the `/ws/bash` WebSocket.
- `src/Agent.tsx` connects to `/ws/agent` and streams `claude -p` output.
- `src/styles.css` contains visual system and responsive behavior.
- `vite.config.ts` sets server defaults and registers the dev-mode plugins.
- `vite-plugin-pty.ts` runs the `/ws/bash` → node-pty backend in dev mode.
- `vite-plugin-agent.ts` runs the `/ws/agent` backend in dev mode (IAgent +
  ClaudeAgent + CodexAgent).

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior for the Demo tab.
- The Terminal and Agent tabs are the places where real backend behavior is allowed.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
