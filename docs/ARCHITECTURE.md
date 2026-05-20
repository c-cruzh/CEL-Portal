# Architecture — Portal CEL Piloto

Monorepo pnpm with three runtime artifacts and shared libraries. Single Postgres database. Auth via Clerk through Replit's mTLS proxy. Object storage via Replit's bucket service.

## Runtime topology

```
                       Replit proxy (mTLS, path-based routing)
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
artifacts/portal              artifacts/api-server         artifacts/mockup-sandbox
  (Vite + React, :PORT)        (Express 5, :PORT)            (Vite dev, :PORT)
        │                            │
        │  customFetch (Bearer)      │
        └────────────►◄──────────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                         Postgres        Replit Object Storage
                       (Drizzle ORM)     (CVs, documents)
```

- **portal**: React 18 + Vite 6 SPA mounted at `/portal/*` (Wouter). State via TanStack Query against generated client (`@workspace/api-client-react`).
- **api-server**: Express 5. Routes per resource, mirroring `openapi.yaml`. Auth via Clerk JWT verification (proxy middleware). Bearer is forwarded from portal via `customFetch`.
- **mockup-sandbox**: design playground for component variants on the canvas. Not part of production user flow.

## Monorepo layout

```
artifacts/
  portal/             React frontend (9 tabs, dialogs, charts)
  api-server/         Express REST + middlewares + lib helpers
  mockup-sandbox/     Component variant playground
lib/
  api-spec/           openapi.yaml (single source of truth) + codegen scripts
  api-zod/            generated: Zod request/response schemas
  api-client-react/   generated: TanStack Query hooks + customFetch
  db/                 Drizzle schema, migrations, seed, governance overlay
  project-domain/     shared TS types (PHASES, role IDs, etc.)
  ui-components/      shared shadcn primitives (Button, Dialog, etc.)
docs/                 this folder
scripts/              post-merge.sh and other automation
```

## Build & codegen pipeline

1. **Schema authoring**: edit `lib/db/src/schema/*.ts`. For non-trivial changes write a hand-rolled migration in `lib/db/drizzle/000X_*.sql` (idempotent: `IF NOT EXISTS`, backfills). For dev iteration, `pnpm --filter @workspace/db run push` (drizzle-kit push) is OK.
2. **API contract**: edit `lib/api-spec/openapi.yaml`. Run `pnpm --filter @workspace/api-spec run codegen` which uses Orval to regenerate `lib/api-zod` and `lib/api-client-react/src/generated/api.ts`. Never edit generated files by hand.
3. **Server impl**: implement the new route in `artifacts/api-server/src/routes/` and wire it in `routes/index.ts`. Use the generated Zod schemas for body validation.
4. **Client usage**: import the generated hook (`useListXxx`, `useCreateYyy`) from `@workspace/api-client-react`.
5. **Typecheck**: `pnpm run typecheck` from the repo root must be clean before merging.
6. **Post-merge**: `scripts/post-merge.sh` runs `drizzle-kit push` and `tsx src/seed.ts` automatically after each task merge.

## Auth flow

1. User signs in via Clerk on the portal (Clerk JS).
2. Clerk issues a JWT; the portal stashes it and `customFetch` attaches `Authorization: Bearer <jwt>` to every API call.
3. `api-server` validates the JWT via Clerk's verification middleware (proxied; no Clerk SDK in code).
4. `requireAuth` middleware (`artifacts/api-server/src/middlewares/requireAuth.ts`) upserts the user into `users` (id = Clerk user id) and throttles a `last_activity_at` touch.
5. `requirePM` allows users with roles `pm_lead` or `pm_cel`. **Used for PM-only flows** (e.g. editing other members).
6. `requireAdmin` (stricter) checks an email allowlist hardcoded in `requireAdmin.ts`: only `camila@c2labs.ai` and `kevin@c2labs.ai`. **Used for admin-only flows** (invitations, audit log, batch uploads, project config).
7. `me.isAdmin` (required field in `MemberMe`) is computed server-side via `isAdminEmail()` and consumed by the portal to gate UI.

## Notifications

- `artifacts/api-server/src/lib/notifications.ts` exposes `notifyAsync(event)` and event-specific helpers (`notifyDecisionAssignedAsync`, etc.).
- Recipients = users with the relevant role(s) + admin CC list (`notification_recipients` table).
- Provider is pluggable. If no provider is configured, the event is logged in `notification_log` with `status='noProvider'` and execution continues — never blocks the request.
- Every send (including no-provider) is logged in `notification_log` for the admin audit view.

## Admin audit log

- Table: `admin_audit_log`.
- Every admin mutation calls `logAdminAction(actor, action, targetType, targetId, payload)` from `artifacts/api-server/src/lib/adminAudit.ts`.
- Logged actions include: `member.update`, `invitation.create | resend | revoke`, `project_config.update`, `notification_recipient.add | remove`, `weeklies.regenerate`, `batch.upload`, `role.update`.
- Visible at `GET /admin/audit-log` (paginated, filterable by action and actor) and rendered in Configuración → Auditoría.

## Calendar: T0 → weekly autogen

- T0 = `project_config.start_date` (single row, `id = 1`).
- `ensureSystemWeeklies(startDate, n=28)` lives at `artifacts/api-server/src/lib/weeklies.ts`. Idempotent contract:
  - `startDate = null` → deletes all `kind='weekly_session' AND source='system'`.
  - `startDate ≠ null` → upserts `n` weeklies with `seed_key='weekly_<i>'`, `week_offset = i`, `source='system'`. Prunes extras.
  - Never touches rows with `source='manual'` or `source='import'`.
- Hooked into `PATCH /project/config` (and `POST /admin/milestones/regenerate-weeklies` for manual re-runs). Failures propagate as 500 (`weeklies_regen_failed`) — no silent swallow.

## Object storage

- CVs: `user_cvs` table holds metadata; the file lives in Replit Object Storage under `${PRIVATE_OBJECT_DIR}/cv/<userId>/<filename>`.
- Documents: `documents` table; same pattern, in private path.
- Upload flow: client requests signed URL via `POST /storage/uploads/request-url`, PUTs the file directly to storage, then confirms via `POST /me/cv` (or `POST /documents`).

## Frontend conventions

- All page components live under `artifacts/portal/src/pages/portal/`.
- All static pilot content (PHASES, role IDs, RACI, ETL stages, BOM, etc.) lives under `artifacts/portal/src/lib/*.ts` as typed constants. The UI never hardcodes content inline.
- shadcn primitives are imported from `@/components/ui/*` (re-exports from `@workspace/ui-components`).
- TanStack Query keys come from generated `get<Endpoint>QueryKey()` helpers — never construct keys by hand.

## Parallel task safety

When multiple project tasks ran in parallel during the initial build, the team enforced these rules to avoid merge conflicts:

- Tasks touching `lib/db/drizzle/` were serialized (they own sequential migration numbers).
- Tasks touching the same OpenAPI section were serialized.
- Tasks touching different sections / different artifacts / different pages were run in parallel.
- After each merge, `scripts/post-merge.sh` runs drizzle push + seed to keep the environment consistent.

## Environments

- **Dev** (this Repl): `pnpm` workflows for each artifact. DB is the Replit-managed Postgres (`DATABASE_URL`).
- **Production**: Replit Deployment. The publish flow rebuilds, runs migrations, and serves the same artifacts behind the configured domain.
