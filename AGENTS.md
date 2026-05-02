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
  to a **sidecar process** (`agent-server.ts`) bound to `127.0.0.1:9877`.
  Vite proxies `/ws/agent` to the sidecar via `server.proxy` so that Vite
  dev-server restarts (which happen whenever the agent edits a file Vite
  imports) do not kill in-flight agent runs. The sidecar defines an `IAgent`
  interface with two implementations (`ClaudeAgent`, `CodexAgent`); the
  prompt frame's `agent` field selects which one to spawn. All session state
  (current id, history) lives in browser localStorage, namespaced per
  agent. For Codex specifically, the auto-generated thread UUID is parsed
  from the `thread.started` JSONL event and pushed back to the browser via
  a `session_assigned` event so the next prompt can resume.

  Each prompt is assigned a `runId` by the sidecar and announced via a
  `run_started` event. The sidecar buffers all events for a run in memory
  (5 min TTL after `done`); on WS reconnect the client sends
  `{type: 'attach', runId}` to replay missed events and resume streaming.
  This makes a Vite restart mid-prompt invisible to the user.

  Codex's settings live under `CODEX_HOME` (default `~/.codex/`); the
  sidecar inherits that env var via `process.env`, so logged-in credentials
  work without extra wiring.

⚠️ Both backend endpoints are intentionally **unauthenticated** and the dev
server binds to `0.0.0.0` (`server.host: true` in `vite.config.ts`), so anyone
who can reach the port has full shell access *and* can run prompts as the dev-
server user. The agent sidecar itself binds only to `127.0.0.1:9877`, but
Vite's proxy exposes it through the public port. This is a deliberate
demo-only configuration — do not deploy as-is.

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
- `vite.config.ts` sets server defaults, registers the dev-mode pty plugin,
  and proxies `/ws/agent` to the agent sidecar.
- `vite-plugin-pty.ts` runs the `/ws/bash` → node-pty backend in dev mode.
- `agent-server.ts` is the standalone sidecar that runs the `/ws/agent`
  backend (IAgent + ClaudeAgent + CodexAgent) plus per-`runId` buffering
  and reconnect/attach support. Started via `pnpm dev:agent` (or
  automatically from `pnpm dev`).

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior for the Demo tab.
- The Terminal and Agent tabs are the places where real backend behavior is allowed.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
