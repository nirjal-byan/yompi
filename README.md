# YOMPI

YOMPI is a full-stack monorepo for a Nepal-focused trekking and adventure discovery platform.

## Repository structure

- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/database` — Prisma schema and database client
- `packages/shared` — shared TypeScript types and validation
- `packages/config` — shared configuration package
- `docker-compose.yml` — PostgreSQL + PostGIS service definition

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

Required values:

- `DATABASE_URL` for Prisma/PostgreSQL
- `PORT` or `API_PORT` for the API server
- `WEB_PORT` for the frontend server
- `POSTGRES_*` values for the database container

## Install dependencies

```powershell
pnpm install
```

## Start PostgreSQL + PostGIS

```powershell
docker compose up -d
```

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
pnpm --filter api start:dev
```

## Production build check

```powershell
pnpm build
```

## Database notes

- The Docker service uses the `postgis/postgis:16-3.4` image.
- Prisma uses PostgreSQL with PostGIS extensions enabled.
- The schema is defined in `packages/database/prisma/schema.prisma`.

## Notes

This repository is in the early foundation stage. The goal of this milestone is to ensure the monorepo, environment, database configuration, and app startup behavior are valid before product feature work begins.
