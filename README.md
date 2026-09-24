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

The dev server runs on `http://localhost:9876` by default. Amika sandbox URLs on `*.e2b.app` are also allowed by the Vite host check.

## Build

```bash
pnpm build
pnpm preview
```

Preview also runs on port `9876`.

## Paseo in Amika rigs

The repo defaults to the `example-repo-paseo-0.9.2-20260924` snapshot. It was
built with [`amika-scripts/snapshot-init.sh`](amika-scripts/snapshot-init.sh)
following [the Paseo snapshot guide](https://docs.amika.dev/guides/paseo): the
script installs Paseo in a fresh base rig and enables its systemd user service
before capture. The daemon stays stopped in the base rig so each new rig
creates its own Paseo host identity on first boot.

After creating a rig from that snapshot, run
`amika rig code <rig-name> --editor paseo` and add the printed SSH host in
Paseo Desktop under **Hosts > Add host > Remote SSH**. Port `6767` stays private
to the rig.

## Project structure

- `src/App.tsx`: main demo UI and mocked interactions
- `src/styles.css`: visual styling and responsive layout
- `vite.config.ts`: Vite config (including default ports)
