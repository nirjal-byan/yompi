.PHONY: db.import-trek-data db.build-profiles db.import-geo help setup services.start services.stop services.logs db.migrate db.generate db.studio run run.web run.api build clean

help:
	@echo "YOMPI Development Commands:"
	@echo "  make setup           - Install all workspace dependencies"
	@echo "  make services.start  - Start PostGIS database container"
	@echo "  make services.stop   - Stop PostGIS database container"
	@echo "  make services.logs   - Tail PostGIS container logs"
	@echo "  make db.migrate      - Run Prisma database migrations"
	@echo "  make db.generate     - Generate Prisma client"
	@echo "  make db.studio       - Open Prisma Studio GUI"
	@echo "  make run             - Run Next.js web and NestJS api together"
	@echo "  make run.web         - Run Next.js frontend only"
	@echo "  make run.api         - Run NestJS backend only"

setup:
	pnpm install

services.start:
	docker compose up -d

services.stop:
	docker compose down

services.logs:
	docker compose logs -f

db.migrate:
	pnpm --filter @yompi/database exec prisma migrate dev --schema=./prisma/schema.prisma

db.generate:
	pnpm --filter @yompi/database exec prisma generate --schema=./prisma/schema.prisma

db.studio:
	pnpm --filter @yompi/database exec prisma studio --schema=./prisma/schema.prisma

run: services.start
	pnpm turbo dev

run.web:
	pnpm --filter web dev

run.api:
	pnpm --filter api start:dev

build:
	pnpm turbo build

clean:
	docker compose down -v
db.import-geo:
	pnpm db:import-geo

db.build-profiles:
	pnpm db:build-profiles

db.import-trek-data:
	pnpm db:import-trek-data
