# YOMPI agent & contributor guide

Read this before changing anything. Keep structure and commits strict.

## Repository layout

```
apps/
  api/src/                     NestJS REST API
    main.ts, app.module.ts     bootstrap + root module only
    common/                    decorators/ guards/ filters/ types/  (cross-cutting, no feature logic)
    infrastructure/<tech>/     database/, redis/, storage/ ... (one module per external system)
    modules/<feature>/         <feature>.module.ts, .controller.ts, .service.ts, .dto.ts
  web/src/                     Next.js App Router frontend
    app/                       routes only (route groups: (marketing), (app) ...) - no business logic
    components/ui/             generic primitives (shadcn/ui lives here)
    components/layout/         navbar, sidebar, footer
    components/shared/         reusable, app-aware components
    features/<feature>/        components/ dialogs/ hooks/ services/ schemas/ types.ts utils.ts constants.ts
    lib/                       config + cross-feature helpers
packages/
  database/                    Prisma schema, migrations, client
  shared/                      Zod schemas + types used by api AND web
  config/                      shared runtime config + tsconfig.lib.json
```

## Rules

- Web talks to the API only through `features/<feature>/services/*-api.ts`. Never import `@yompi/database` in web.
- Request/response shapes and validation live in `packages/shared` (Zod), imported by both apps.
- One feature = one folder on each side with the same name (`modules/destinations` <-> `features/destinations`).
- Files are `kebab-case`. API suffixes: `.module.ts .controller.ts .service.ts .dto.ts`. Relative imports in the API end in `.js`.
- Components are server components by default; add `"use client"` only where needed.
- Never hardcode trekking data, prices, weather or conditions. Real geodata and the illustrated map's x/y stay separate.
- New packages build to `dist/` via `tsc`; add `tsconfig.json` extending `packages/config/tsconfig.lib.json`.
- Config comes from the root `.env` (see README). Document every new variable in `.env.example`.

## Code style

- No code comments. Make the code explain itself: descriptive names, small functions, named constants instead of magic numbers.
- One responsibility per file. Split a file when it does more than one job (data, drawing, input, state, layout).
- Reusable pieces first: shared helpers and hooks over copy-paste. Keep components presentational and move logic into hooks.
- Formatting is automatic: `pnpm format` (Prettier, one config for the whole repo). `pnpm format:check` is the check.

## Commits (Conventional Commits)

Format: `type(scope): imperative summary` - lowercase, no trailing period, <= 72 chars. Body explains why.
One logical change per commit.

- Types: `feat fix refactor perf docs test build ci chore style`
- Scopes: `api web database shared config repo docs` or a feature name (`destinations`, `map`).
- Breaking change: `feat(api)!:` plus a `BREAKING CHANGE:` footer.
- Schema change: commit the Prisma schema and its migration together.

## Before committing

`pnpm build && pnpm lint && pnpm --filter api test`
