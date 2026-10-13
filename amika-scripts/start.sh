#!/usr/bin/env bash

# Starts the demo dev server. Runs at the end of setup.sh and again on every
# start of the rig, since a rig without systemd (a BYOC rig on smolvm) has
# nothing else to bring the server back after a reboot. Rerunning it also
# picks up the VITE_* values a restart hands out anew, such as the service
# URL.

DEMO_SITE_PORT=4102
REPO_DIR='/home/amika/workspace/example-repo'
UNIT_NAME='example-repo-dev.service'
UNIT_SRC="$REPO_DIR/amika-scripts/$UNIT_NAME"
# /etc rather than /run: /run is tmpfs and is wiped on reboot, but the unit is
# enabled at multi-user.target and would start (and fail) before this runs.
ENV_FILE='/etc/amika/example-repo-dev.env'
LOG_FILE='/var/log/amika/example-repo-dev.log'
PID_FILE='/run/amika/example-repo-dev.pid'

if [ ! -d "$REPO_DIR/node_modules" ]; then
  echo "example-repo dependencies missing; skipping demo dev server start" | sudo tee "$LOG_FILE" >/dev/null
  exit 0
fi

cd "$REPO_DIR" || exit 0

# Capture the sandbox-injected VITE_* vars. systemd units start from a minimal
# environment and do not inherit the sandbox env, so anything src/ reads via
# import.meta.env has to be handed over explicitly. Only VITE_-prefixed vars are
# copied -- Vite exposes those to the client bundle anyway, so no secrets here.
write_env_file() {
  {
    echo "DEMO_SITE_PORT=$DEMO_SITE_PORT"
    env | grep '^VITE_' | sort
  } | sudo tee "$ENV_FILE" >/dev/null
  sudo chmod 0600 "$ENV_FILE"
}

start_with_systemd() {
  command -v systemctl >/dev/null 2>&1 || return 1

  # systemd is PID 1 here but there is no D-Bus; systemctl falls back to
  # /run/systemd/private, which requires root. Accept any state that means the
  # manager is reachable -- "degraded" just means some unrelated unit failed,
  # and is-system-running exits non-zero for it.
  case "$(sudo -n systemctl is-system-running 2>/dev/null)" in
    running|degraded|starting|maintenance) ;;
    *) return 1 ;;
  esac

  sudo mkdir -p "$(dirname "$ENV_FILE")" /var/log/amika || return 1
  write_env_file || return 1
  sudo touch "$LOG_FILE" && sudo chown amika:amika "$LOG_FILE"

  sudo install -m 0644 -o root -g root "$UNIT_SRC" "/etc/systemd/system/$UNIT_NAME" || return 1
  sudo systemctl daemon-reload || return 1
  # enable  -> comes back after a sandbox reboot
  # --now   -> and starts right away, with Restart=always for crashes
  sudo systemctl enable --now "$UNIT_NAME" || return 1
  sudo systemctl restart "$UNIT_NAME" || return 1
}

start_detached() {
  # Fallback when systemd is unavailable. setsid (not just nohup) so the server
  # lands in its own session and survives the lifecycle runner reaping this
  # script's process group on exit. A server this script started earlier in
  # the same boot is stopped first, so the new one gets the current env.
  if [ -f "$PID_FILE" ]; then
    kill -- "-$(cat "$PID_FILE")" 2>/dev/null
    rm -f "$PID_FILE"
  fi
  setsid nohup pnpm dev --host 0.0.0.0 --port "$DEMO_SITE_PORT" > /tmp/example-repo-dev.log 2>&1 &
  echo "$!" > "$PID_FILE"
}

if start_with_systemd; then
  echo "example-repo dev server supervised by systemd ($UNIT_NAME)"
else
  echo "systemd unavailable; falling back to a detached background process"
  start_detached
fi

echo "$DEMO_SITE_PORT" > /run/amika/example-repo-dev.port
