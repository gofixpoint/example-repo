#!/usr/bin/env bash

DEMO_SITE_PORT=4102

if [ ! -d '/home/amika/workspace/example-repo' ]; then
  echo "example-repo volume missing at /home/amika/workspace/example-repo; skipping demo dev server bootstrap" > /var/log/amika/example-repo-dev.log
elif command -v pnpm >/dev/null 2>&1; then
  cd '/home/amika/workspace/example-repo'
  pnpm install --frozen-lockfile || pnpm install
  nohup pnpm dev --host 0.0.0.0 --port "$DEMO_SITE_PORT" > /tmp/example-repo-dev.log 2>&1 &
  echo "$!" > /run/amika/example-repo-dev.pid
  echo "$DEMO_SITE_PORT" > /run/amika/example-repo-dev.port
else
  echo "pnpm not found; skipping example-repo dev server bootstrap" > /tmp/amika/example-repo-dev.log
fi
