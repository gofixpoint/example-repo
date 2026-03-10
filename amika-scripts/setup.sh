#!/usr/bin/env bash

OPENCODE_WEB_PORT=4101
DEMO_SITE_PORT=4102

if [ ! -d /home/amika/workspace/my-repo/.git ]; then git clone 'https://github.com/example/my-repo' '/home/amika/workspace/my-repo'; fi
cd '/home/amika/workspace/my-repo'
nohup env OPENCODE_SERVER_PASSWORD='example-password' opencode web --port "$OPENCODE_WEB_PORT" --mdns > /tmp/opencode-web.log 2>&1 &
echo "$!" > /tmp/opencode-web.pid
echo "$OPENCODE_WEB_PORT" > /tmp/opencode-web.port

################################################################################
# TODO(DEMO): Remove this custom `example-repo` bootstrap and abstract demo
# startup into a configurable sandbox preset while preserving the default
# OpenCode setup above as the standard path for all repositories.
################################################################################
if [ ! -d '/home/amika/workspace/example-repo' ]; then
  echo "example-repo volume missing at /home/amika/workspace/example-repo; skipping demo dev server bootstrap" > /tmp/example-repo-dev.log
elif command -v pnpm >/dev/null 2>&1; then
  cd '/home/amika/workspace/example-repo'
  pnpm install --frozen-lockfile || pnpm install
  nohup pnpm dev --host 0.0.0.0 --port "$DEMO_SITE_PORT" > /tmp/example-repo-dev.log 2>&1 &
  echo "$!" > /tmp/example-repo-dev.pid
  echo "$DEMO_SITE_PORT" > /tmp/example-repo-dev.port
else
  echo "pnpm not found; skipping example-repo dev server bootstrap" > /tmp/example-repo-dev.log
fi
