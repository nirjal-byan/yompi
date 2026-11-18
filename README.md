<p align="center">
  <img src="apps/web/public/brand/yompi-mark.png" alt="YOMPI: a backpacking rabbit on a mountain at sunrise" width="160" />
</p>

<h1 align="center">YOMPI</h1>

<p align="center"><strong>Your Himalayan Adventure Buddy.</strong><br />One hop at a time.</p>

---

Big mountains. Little hops. 🐇⛰️

Meet YOMPI, a trekking buddy for Nepal. It's a backpack-wearing rabbit who has read every trail guide, hates surprise costs and will happily nag you to pack warmer socks.

Instead of a wall of tabs and spreadsheets, you explore Nepal like a game: an interactive map of the real country, with its mountains, trails, villages and gateway towns like Kathmandu and Pokhara. Hop into a region like Annapurna, Everest, Langtang, Manaslu or Mustang, and see what a trek really involves: how hard it is, how many days it takes, which permits you need, where to sleep and what it will cost for your group. Real trails, thoughtful stays and a budget that adds up.

**Where we are:** early days. The foundation, the design system and email sign-in are in place. The map, trek data, budget calculator and live trail conditions are next. Nothing here is live trail advice yet.

YOMPI is a full-stack monorepo: Next.js, NestJS, PostgreSQL with PostGIS, and PixiJS for the map.

## Repository structure

- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/database` — Prisma schema and database client
- `packages/shared` — shared TypeScript types and validation
- `packages/config` — shared configuration package
- `docker-compose.yml` — PostgreSQL + PostGIS service definition

See [AGENTS.md](./AGENTS.md) for folder structure and commit conventions.

## Prerequisites

Install the following before running the app:

- Node.js 20+ or 22+ recommended
- pnpm 12.21.0 (the repository is configured for this version)
- Docker Desktop or Docker Engine with Compose
- Git

### Windows / PowerShell setup

```powershell
node -v
pnpm -v
docker --version
docker compose version
```

If `pnpm` is not installed, run:

```powershell
corepack enable
corepack prepare pnpm@12.21.0 --activate
```

## Environment configuration

Copy the example environment file and adjust values if needed:

```powershell
Copy-Item .env.example .env
```

The repository includes a ready-to-copy `.env.example` file with the default local development values.

Key values:

- `DATABASE_URL` — Prisma/PostgreSQL connection string
- `API_PORT` — NestJS API port (default `3001`)
- `WEB_PORT` — Next.js port (`3000`, Next's default)
- `NEXT_PUBLIC_API_URL` — where the frontend reaches the API (`http://localhost:3001`)
- `POSTGRES_*` — documents the credentials used by the database container

Where each `.env` is read:

| File | Read by |
| --- | --- |
| `.env` (repo root) | The API (loaded via `@nestjs/config`). This is the main config file. |
| `packages/database/.env` | The Prisma CLI (`pnpm db:*`). Contains only `DATABASE_URL`, which must match the root file. |

Real environment variables always override values from `.env` files.

Shared packages (`packages/*`) are compiled to `dist/` by `pnpm build`; `pnpm dev` builds them first automatically.

## Install dependencies

```powershell
pnpm install
```

## Start PostgreSQL + PostGIS

Make sure Docker Desktop is running first (`docker info` should succeed), then:

```powershell
docker compose up -d
```

Apply the migrations to a fresh database:

```powershell
pnpm db:migrate
```

## Email in development (sign-in links)

`docker compose up -d` also starts **Mailpit**, a local mail catcher. Sign-in emails are never delivered to real inboxes in development. Open http://localhost:8025 to read them. To use a real SMTP server, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM` in `.env`. Also set `WEB_URL` and `API_PUBLIC_URL` to your real URLs, because the link in the email points at the API.

## Prisma commands

Generate Prisma client:

```powershell
pnpm db:generate
```

Create or apply migrations:

```powershell
pnpm db:migrate
```

Open Prisma Studio:

```powershell
pnpm db:studio
```

## Run development servers

Start both apps together:

```powershell
pnpm dev
```

Start the frontend only:

```powershell
pnpm --filter web dev
```

Start the backend only:

```powershell
pnpm --filter api dev
```

Verify everything is up:

- Frontend: http://localhost:3000
- API: http://localhost:3001/health (returns `{"status":"ok","database":"up"}`)
- Database: `docker exec yompi-postgres pg_isready -U yompi_admin -d yompi_db`

## Checks

```powershell
pnpm build                     # build web + api
pnpm lint                      # eslint (web) + oxlint (api)
pnpm --filter api test         # API unit tests (Vitest)
pnpm --filter api test:e2e     # API e2e tests (Vitest + supertest)
```

## Database notes

- The Docker service uses the `postgis/postgis:16-3.4` image.
- Prisma uses PostgreSQL with the PostGIS extension enabled. The initial migration also installed `postgis_topology`, `postgis_tiger_geocoder` and `fuzzystrmatch`. The schema no longer declares them, but they stay in existing databases and do no harm.
- Geometry columns use `Unsupported("geometry(...)")`, so Prisma can't read or write them directly. Spatial queries will go through raw SQL (`$queryRaw`).
- The schema is defined in `packages/database/prisma/schema.prisma`.

## Notes

This repository is in the early foundation stage. The goal of this milestone is to ensure the monorepo, environment, database configuration, and app startup behavior are valid before product feature work begins.
