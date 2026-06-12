#!/usr/bin/env bash

DEMO_SITE_PORT=4102
REPO_DIR='/home/amika/workspace/example-repo'

if [ ! -d "$REPO_DIR" ]; then
  echo "example-repo volume missing at $REPO_DIR; skipping demo server bootstrap" > /var/log/amika/example-repo-dev.log
  exit 0
fi

cd "$REPO_DIR"

# Install PHP + Composer if missing (Laravel backend)
if ! command -v php >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq php-cli php-sqlite3 php-xml php-mbstring php-curl php-zip unzip
  else
    echo "php not found and cannot install; skipping example-repo server bootstrap" > /tmp/example-repo-dev.log
    exit 0
  fi
fi

if ! command -v composer >/dev/null 2>&1; then
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/tmp --filename=composer
  sudo mv /tmp/composer /usr/local/bin/composer
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found; skipping example-repo server bootstrap" > /tmp/example-repo-dev.log
  exit 0
fi

# Backend setup
composer install --no-interaction --prefer-dist
if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate --force
fi
touch database/database.sqlite
php artisan migrate --force

# Frontend build
pnpm install --frozen-lockfile || pnpm install
pnpm build

# Serve the app (Laravel serves the built React assets)
nohup php artisan serve --host 0.0.0.0 --port "$DEMO_SITE_PORT" > /tmp/example-repo-dev.log 2>&1 &
echo "$!" > /run/amika/example-repo-dev.pid
echo "$DEMO_SITE_PORT" > /run/amika/example-repo-dev.port
