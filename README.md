# Amika TODO

A demo TODO list manager built with Laravel, React, and TypeScript.

- Laravel backend exposing a REST API at `/api/todos`
- SQLite for storage
- React + TypeScript frontend served through Laravel's Vite integration

## Run locally

First-time setup:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
pnpm install
```

Development (two terminals):

```bash
php artisan serve --port 9876   # http://localhost:9876
pnpm dev                        # Vite dev server with HMR
```

## Build

```bash
pnpm build
php artisan serve --port 9876
```

Laravel serves the built assets from `public/build`.

If `VITE_APP_URL` is set at build time, the React app uses it as the API base
URL (used by Amika sandboxes to point the browser at the proxied app URL);
otherwise it falls back to relative `/api` paths.

## Tests

```bash
php artisan test
pnpm typecheck
```

## Project structure

- `app/Http/Controllers/TodoController.php`: TODO CRUD API
- `app/Models/Todo.php`: Todo model
- `routes/api.php`: API routes
- `resources/js/App.tsx`: React TODO manager UI
- `resources/js/main.tsx`: React entry point
- `resources/css/app.css`: styling
- `resources/views/welcome.blade.php`: blade shell mounting the React app
- `vite.config.ts`: Vite config (Laravel + React plugins)
