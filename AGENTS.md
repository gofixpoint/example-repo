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
npm install
npm run dev
```

Default port: `9876`

## Key files

- `src/App.tsx` contains demo logic and event simulation.
- `src/styles.css` contains visual system and responsive behavior.
- `vite.config.ts` sets server defaults.

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Prefer mocked data and deterministic UI behavior.
- Preserve React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
