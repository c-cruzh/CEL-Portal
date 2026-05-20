# Portal CEL — Piloto

Portal web privado para la coordinación del piloto de pronóstico hidrológico de **CEL** (Comisión Ejecutiva Hidroeléctrica del Río Lempa), liderado por **C2 Labs**. Centraliza equipo, cronograma, metodología, desarrollo técnico, kanban, calendario, decisiones, documentos y configuración admin.

Acceso restringido a correos `@cel.gob.sv` y `@c2labs.ai`. Admins (PM Portal): `camila@c2labs.ai` y `kevin@c2labs.ai`.

## Documentación

- `docs/README.md` — índice general
- `docs/PRODUCT.md` — qué hace cada uno de los 9 módulos y para quién
- `docs/ARCHITECTURE.md` — arquitectura técnica del monorepo
- `docs/DATA_MODEL.md` — referencia del schema Postgres
- `docs/API.md` — referencia de endpoints REST
- `docs/ADMIN_GUIDE.md` — playbook para Camila y Kevin
- `docs/BATCH_IMPORTS.md` — plantillas y reglas de validación CSV/JSON
- `docs/CHANGELOG.md` — historial de cambios por tarea

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/portal run dev` — portal frontend
- `pnpm --filter @workspace/mockup-sandbox run dev` — sandbox de mockups (canvas)
- `pnpm run typecheck` — typecheck completo del monorepo
- `pnpm run build` — typecheck + build de todos los packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks de API y schemas Zod desde el spec OpenAPI
- `pnpm --filter @workspace/db run push` — aplicar cambios de schema en dev
- `pnpm --filter @workspace/db exec tsx src/seed.ts` — re-correr el seed (idempotente)

Env requerido: `DATABASE_URL`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`. Auth se delega a Clerk vía proxy interno (no requiere claves en este repo).

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (`drizzle-kit push` + migraciones en `lib/db/drizzle/`)
- Validación: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval desde `lib/api-spec/openapi.yaml`
- Frontend: React 18 + Vite 6, Tailwind, shadcn/ui, TanStack Query, Wouter, Framer Motion, dnd-kit
- Auth: Clerk vía proxy mTLS (provista por Replit)
- Storage: Replit Object Storage (CVs, documentos)
- Email: provider configurable vía `notification_recipients` (best-effort; sin provider quedan en `notification_log`)

## Architecture decisions

- **Path-based artifacts**: cada artifact (`portal`, `api-server`, `mockup-sandbox`) tiene su propio `previewPath` y workflow. El portal consume el API server mediante `customFetch` con `import.meta.env.BASE_URL` como prefijo.
- **OpenAPI como única fuente de verdad**: cualquier cambio de contrato pasa por `lib/api-spec/openapi.yaml` + `pnpm --filter @workspace/api-spec run codegen`. No se edita `lib/api-zod` ni `lib/api-client-react/src/generated/` a mano.
- **Multi-rol por persona**: una persona puede tener N roles y un rol puede tener N personas. La gobernanza CEL/C2 Labs vive en `lib/db/src/governance.ts` (alineada al Paquete Maestro — Piloto CEL) y se overlaya sobre `users` sin crear filas falsas (los CEL aún no se autentican). Estructura: C²Labs (Camila, Kevin) → Core Pilot Team (Mauricio Herrera Mercado PM CEL+Contrato, Víctor Alabí Líder Hidrología, Fernando Garay SIG, William Juárez Datos, José Manuel Guardado DevOps) → Comité de Informática (Lorena Pineda, Nelson Flores, Adrián Miranda, Carlos Sánchez, Miladis; José Manuel NO duplicado aquí) → Equipo de Dirección TBD por etapa (Guillermo Colorado, Gerardo Ávalos, Mauricio Herrera **Landaverde** —distinto de Herrera Mercado—, Rigoberto Ávila). Escalación operativa: Consultora → Herrera Mercado → Lorena/Nelson; José Manuel como enlace operativo embebido.
- **Idempotencia en seed y autogen**: el seed corre seguro N veces. Los `weekly_session` ya no son seedeados; los maneja `ensureSystemWeeklies(startDate, n=28)` desde `PATCH /project/config`. `source` discrimina `system | manual | import`; los no-system nunca se borran automáticamente.
- **Admin layer**: PM-only se define por **email allowlist** en `requireAdmin` (Camila + Kevin), no por rol. Toda mutación admin registra en `admin_audit_log` vía `logAdminAction()`.
- **Notificaciones best-effort**: si no hay provider configurado, se registra en `notification_log` con status `noProvider` y nada se rompe.
- **Branding**: navy PANTONE 289 C; sin emojis; todo el contenido user-facing en español.
- **Infraestructura del piloto (fuente única)**: el BOM vigente y la arquitectura física del silo de IA están definidos por el Paquete Maestro §8.2 (Anexo Complementario No. 1) y las cláusulas defendibles §6.1–§6.5. Cualquier contenido del portal que mencione hardware, software de plataforma, ownership o alcance de infraestructura debe alinearse con esa fuente; el BOM original del DSP (3 nodos genéricos, RTX 4090, ZFS, switch 10GbE, Pentaho, Grafana) ya no aplica. La definición canónica vive en `INFRA_HARDWARE`, `INFRA_SOFTWARE` e `INFRA_DEFENSIBLE_CLAUSES` dentro de `artifacts/portal/src/lib/desarrolloContent.ts`.

## Where things live

- `artifacts/portal/src/pages/portal/` — las 9 pestañas del portal
- `artifacts/portal/src/lib/` — contenido estático del piloto (PHASES, RACI, ETL, BOM, etc.)
- `artifacts/api-server/src/routes/` — endpoints REST (mirror del OpenAPI spec)
- `artifacts/api-server/src/middlewares/` — `requireAuth`, `requirePM`, `requireAdmin`
- `artifacts/api-server/src/lib/` — notifications, weeklies helper, admin audit
- `lib/db/src/schema/` — tablas Drizzle (source of truth de la DB)
- `lib/db/src/seed.ts` — seed idempotente (roles, columnas Kanban, folders, admins)
- `lib/db/src/governance.ts` — overlay de personas reales del piloto
- `lib/db/drizzle/` — migraciones SQL versionadas
- `lib/api-spec/openapi.yaml` — contrato API
- `lib/api-zod/` y `lib/api-client-react/` — generados (no editar a mano)
- `lib/project-domain/` — tipos y constantes compartidas (PHASES, etc.)

## User preferences

- Spanish only en el producto; sin emojis.
- Navy PANTONE 289 C como acento principal.
- Las secciones explícitamente congeladas no se tocan:
  - Metodología → "Detalle por fase".
  - Desarrollo Técnico → capítulos 4 (Modelos LSTM) y 5 (Validación rolling).
- Lógica del Comité de Dirección de CEL queda fuera del MVP (2ª iteración).
- Cualquier ambigüedad de contenido se marca con badge "Por validar (Kevin)" en lugar de inventar.

## Gotchas

- **Migraciones + tareas paralelas**: si dos tareas tocan el schema en paralelo, los archivos `lib/db/drizzle/000X_*.sql` colisionan. Se serializan vía `dependsOn` en project tasks.
- **OpenAPI + codegen**: tras editar `openapi.yaml` siempre correr `pnpm --filter @workspace/api-spec run codegen` antes de typecheck.
- **CV upload**: usa Replit Object Storage; los uploads pasan por `POST /storage/uploads/request-url` (signed URL) y se confirman con `POST /me/cv`.
- **Weekly sessions**: nunca insertar `kind='weekly_session'` `source='system'` manualmente; lo gobierna `ensureSystemWeeklies`. Para sesiones curadas usar `source='import'` vía `/admin/milestones/batch`.
- **isAdmin viene del servidor**: el portal jamás computa admin en cliente; se lee de `me.isAdmin` (campo required en `MemberMe`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- See `docs/ARCHITECTURE.md` for the full system map.
