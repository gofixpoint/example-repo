# Amika VM environment

How this repo runs inside an Amika sandbox, as opposed to a plain local checkout.

## systemd and sudo

systemd (v255) is PID 1, but the sandbox image ships **no D-Bus** — there is no
`/run/dbus/system_bus_socket`. Running `systemctl` as the `amika` user therefore fails with
`Failed to connect to bus: No such file or directory`.

Use `sudo` instead, which falls back to the `/run/systemd/private` socket. `sudo` is
passwordless here. It also prints a harmless `unable to resolve host sandbox` warning on
every call.

## The dev server

Inside a sandbox the dev server is **not** started by hand. `amika-scripts/setup.sh` (wired
up via `[lifecycle] setup_script` in `.amika/config.toml`) installs and enables a systemd
unit, `example-repo-dev.service`, which runs Vite on port **4102** — the port registered as
the `frontend` service in `.amika/config.toml`.

Note this differs from the `9876` default used by a plain local `pnpm dev`. Only the
explicit `--port` in the unit bridges the two.

The unit is `Restart=always` with `StartLimitIntervalSec=0`, so the server comes back if it
crashes, and `WantedBy=multi-user.target` starts it again after a sandbox reboot.

```bash
sudo systemctl status example-repo-dev     # state, current PID, restart count
sudo systemctl restart example-repo-dev    # pick up vite.config.ts changes
tail -f /var/log/amika/example-repo-dev.log
```

## Passing environment variables to the server

systemd units do not inherit the sandbox environment, so `setup.sh` copies the injected
`VITE_*` vars into `/etc/amika/example-repo-dev.env`, which the unit loads via
`EnvironmentFile`. Anything new that `src/` reads through `import.meta.env` must be
`VITE_`-prefixed to be picked up.

That file lives in `/etc` rather than `/run` because `/run` is tmpfs: the enabled unit
starts on boot *before* `setup.sh` reruns, so a `/run` path would fail on every reboot.

Only `VITE_`-prefixed vars are copied. Those end up in the client bundle anyway, so no
secrets are written to disk.

## Previews on a BYOC host

On e2b each service gets a domain of its own (`4102-<sandbox>.e2b.app`), so the app is
served at `/`. On a BYOC host every service goes through one amika-hostd address instead,
and the app lives under its service link:

```text
https://<tunnel>/v0beta1/rigs/<rig>/service-links/frontend/<token>/
```

Vite writes root-absolute URLs (`/@vite/client`, `/src/main.tsx`). Left at `base: '/'`,
the browser asks hostd for `/@vite/client`, which names no rig, service, or token, and
hostd answers `401`, leaving a blank page.

So `vite.config.ts` sets `base` to the path of `VITE_FRONTEND_URL`, the service link
Amika injects. Every URL Vite writes then stays under the link. hostd strips the link's
prefix before forwarding, so the `amika-restore-base` plugin puts it back for Vite to
match. Where `VITE_FRONTEND_URL` has no path (e2b) or is unset (local `pnpm dev`), the
base is `/` and the plugin does nothing.

Limits on BYOC:

- The link's token expires 24 hours after the rig is created, and the base carries it,
  so the preview stops loading after that until the server restarts with a fresh link.
- Hot reload does not connect: hostd does not forward Vite's websocket. Reload the page
  after an edit.

## Why not just `nohup ... &`

The original `setup.sh` backgrounded the server with `nohup pnpm dev &`. `nohup` only
ignores `SIGHUP`, so the process stayed in the setup script's process group and was reaped
about a second after the lifecycle runner finished the script — leaving the registered
`frontend` service with nothing behind it.

`setup.sh` keeps a fallback path for hosts without systemd, and that path uses `setsid` so
the detached process lands in its own session and survives the same process-group reap.
