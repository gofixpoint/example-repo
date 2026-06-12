# AGENTS.md

## Purpose

This repository contains a demo TODO list manager app for Amika.

## Scope

The app is a full-stack Laravel + React application:

- Laravel backend with a REST API (`/api/todos`)
- SQLite database (`database/database.sqlite`)
- React + TypeScript frontend served through Laravel's Vite integration

## Tech stack

- Laravel (PHP)
- React
- TypeScript
- Vite (via `laravel-vite-plugin`)
- SQLite

## Local development

```bash
composer install
cp .env.example .env && php artisan key:generate   # first run only
touch database/database.sqlite
php artisan migrate
pnpm install
```

Then run both servers:

```bash
php artisan serve --port 9876   # backend at http://localhost:9876
pnpm dev                        # Vite dev server with HMR
```

Or build assets once and serve only Laravel:

```bash
pnpm build
php artisan serve --port 9876
```

Default port: `9876`

The React app calls the API with relative `/api` paths. Laravel serves both
the built frontend and the API from one origin, so this works unchanged
behind the Amika sandbox proxy and in local development — do not bake
absolute URLs into the frontend build.

## Testing

```bash
php artisan test     # PHP test suite, includes the Todo API feature tests
pnpm typecheck       # TypeScript type checking
```

## Key files

- `app/Http/Controllers/TodoController.php` — TODO CRUD API
- `app/Models/Todo.php` — Todo Eloquent model
- `routes/api.php` — API routes (`/api/todos`)
- `resources/js/App.tsx` — React TODO manager UI
- `resources/js/main.tsx` — React entry point
- `resources/css/app.css` — visual system
- `resources/views/welcome.blade.php` — blade shell that mounts React
- `vite.config.ts` — Vite + Laravel + React plugin config
- `amika-scripts/setup.sh` — demo environment bootstrap

## Agent guidance

When modifying this project:

- Keep the experience simple and demo-focused.
- Keep the API and UI behavior deterministic.
- Preserve the Laravel + React + TypeScript + Vite structure.
- Keep documentation in sync with behavior and defaults.
