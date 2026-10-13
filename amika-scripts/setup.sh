#!/usr/bin/env bash

# Installs dependencies once, then starts the dev server through start.sh,
# which Amika also runs on every later start of the rig.

REPO_DIR='/home/amika/workspace/example-repo'

if [ ! -d "$REPO_DIR" ]; then
  echo "example-repo volume missing at $REPO_DIR; skipping demo dev server bootstrap" > /var/log/amika/example-repo-dev.log
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found; skipping example-repo dev server bootstrap" > /var/log/amika/example-repo-dev.log
  exit 0
fi

cd "$REPO_DIR" || exit 0
pnpm install --frozen-lockfile || pnpm install

exec "$REPO_DIR/amika-scripts/start.sh"
