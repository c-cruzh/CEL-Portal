# Changelog — Portal CEL Piloto

Per-task summary of what shipped, in merge order. Each entry includes purpose, scope, and key files. See git history for line-level diffs.

---

## Task #45 — Metodología: HL animado + Infra F1/F2/F3 + Ruta granular

**Purpose**: Replace the flat methodology page with a more visual, better-structured version, while freezing "Detalle por fase".

**Shipped**:

- New `HighLevelTimeline` component with `framer-motion`: 3 cards (Data / Modeling / Operación), icon + one-line purpose + connector arrows, staggered entrance, subtle icon pulse. Honors `prefers-reduced-motion`.
- Infraestructura section reorganized into an amalgamator header + 4 sub-sections: Infra física / cómputo (consolidated `INFRA_AI_SILO`), F1 (datos), F2 (modelado), F3 (servicio). Sub-section names renamed (F2 was "entrenamiento", F3 was "operativa").
- Ruta y entregables replaced by `RUTA_DETALLE`: per-phase purpose, detailed tasks, "Colaboración con CEL" block, deliverables grid, link "Ver en Cronograma →" with `#fase-<id>` deep-link.
- Cronograma cards expose `id="fase-fX"` anchors with smooth scroll + temporary ring when navigated to via hash.
- New `needsHumanReview + reviewNote` flags on `InfraFaseOperativa` and `RutaDetalle` types; amber "Por validar (Kevin)" badge where applicable.

**Frozen** (verified byte-identical): `METODOLOGIA_PHASES`, `PhaseChapter` component, "Detalle por fase" section.

**Files**: `metodologia.tsx`, `metodologiaContent.ts`, `cronograma.tsx`, new components.

---

## Task #40 — Admin portal + Equipo foundation

**Purpose**: Centralize admin operations, restrict to email allowlist (Camila + Kevin), and lay the foundation that later batch tasks reuse.

**Shipped**:

- New tables: `invitations`, `admin_audit_log`. New column: `users.last_activity_at`. Single migration `0000_admin_portal.sql` with `IF NOT EXISTS` guards.
- `requireAdmin` middleware (email allowlist: `camila@c2labs.ai`, `kevin@c2labs.ai`). Applied to: `PATCH /team/members/:userId` (incl. `clearCv`), all `/admin/notification-recipients/*`, all new admin endpoints.
- Endpoints: `GET/POST/DELETE /admin/invitations`, `POST /admin/invitations/:id/resend`, `GET /admin/audit-log`, `PATCH /admin/roles/:id`.
- `MemberMe.isAdmin` (server-computed via `isAdminEmail()`, required field) consumed by portal to gate the Configuración UI. No client-side admin check.
- Throttled `last_activity_at` touch from `requireAuth` (every >5 min).
- `AdminEditMemberDialog` extended: optional CV management via `clearCv`. 409 guard on revoking already-accepted invitations.
- `logAdminAction()` helper wired into all admin mutations (member edits, T0 changes, notification recipients, invitations).

**Frozen / preserved**: `notification_recipients` flow, existing `requirePM` (kept for legacy use).

**Files**: `requireAdmin.ts`, `admin*.ts` routes, `invitations.ts` schema, `adminAuditLog.ts` schema, `configuracion.tsx`, `equipo.tsx`.

---

## Task #46 — Desarrollo Técnico overhaul (Caps 4 & 5 frozen)

**Purpose**: Rewrite chapters 1-3, 6-11 to be cleaner, more useful, and pulled from the source documents.

**Shipped**:

- **Cap 1 (Flujo)**: replaced verbose phase narrative with short summaries + cross-link cards to Cronograma / Metodología / Decisiones.
- **Cap 2 (Datos)**: new `DATA_REGISTRY` (13 sources) with `confirmed | needsHumanReview` status badges.
- **Cap 3 (ETL)**: `ETL_STAGES_ORDERED` (extracción → staging → transformación → carga → orquestación) + Mermaid `ETL_DIAGRAM` + numbered cards.
- **Caps 4 (Modelos LSTM) and 5 (Validación rolling)**: **frozen, byte-identical**. Evidence in `.local/.frozen_chapters_check.txt` (sha256 over 7 exports/components).
- **Cap 6 (Decisiones abiertas + CEL deps)**: `OPEN_DECISIONS` table (OD-01..20) with area filter + "Decisión formal" Wouter `<Link>` to `/portal/decisiones`.
- **Cap 7 (Operación)**: added CEL daily responsibilities sub-section.
- **Cap 8 (Visualización)**: integration + training/exercises sub-sections.
- **Cap 9 (Infra)**: BOM disclaimer callout (full rewrite deferred to follow-up #50).
- **Cap 10 (Lempa)**: restyled with navy eyebrows.
- **Cap 11 (RACI)**: 2 blocks — A. Quién (FTE, Comité, Perfiles), B. Cómo (Matriz consolidada → Tareas drilldown). TOC updated.

**Removed**: legacy `infra-tecnica` chapter and `InfraTecnicaSection` component (consolidated into Cap 9).

**Files**: `desarrollo.tsx`, `desarrolloContent.ts`.

---

## Task #41 — Cronograma drilldown por fase y personas

**Purpose**: Replace read-only phase cards with expandable cards showing Etapa → Entregable → Activity with people and RACI.

**Shipped**:

- New `lib/phaseInvolvement.ts` with stable TS schema (`PhaseInvolvement / PhaseStage / PhaseDeliverable / PhaseActivity`) and content hydrated from the PDF cronograma (F0–F4 + CONT). Activities carry optional R/C/I role IDs.
- New `PhaseInvolvementCard` accordion (sub-accordion per etapa). Activities show role chips coloured by R/C/I, avatars from `/team/summary` coverage, "Sin asignar" fallback, amber "Por validar (Kevin)" badge.
- `cronograma.tsx`: removed old click-to-open Sheet, consumed `useGetTeamSummary` for live person → role mapping. Gantt and "Configurar T0" untouched.

**Out of scope (per task)**: backend changes, editing assignments from UI, touching other modules.

**Files**: `cronograma.tsx`, new `phaseInvolvement.ts`, new `PhaseInvolvementCard.tsx`.

---

## Task #42 — Calendario: fix autogen T0 + batch import

**Purpose**: Fix the broken "T0 → weeklys" link and add an admin batch import for curated sessions.

**Shipped**:

- New `lib/weeklies.ts` with `ensureSystemWeeklies(startDate, n=28)`: idempotent upsert / prune of `kind='weekly_session' source='system'`. Never touches `manual` or `import`.
- Hooked into `PATCH /project/config`. New `POST /admin/milestones/regenerate-weeklies` for manual triggers. Failures surface as `500 weeklies_regen_failed`.
- New `POST /admin/milestones/batch`: JSON or multipart CSV. Strict zod validation. Atomic transaction; per-row errors. Rows inserted with `source='import'`. Audited.
- New milestone columns: `date_override (YYYY-MM-DD text)`, `duration_minutes`, `location`, `notes`. Migration `0001_calendar_batch_import.sql` (idempotent + backfill `custom → manual`).
- Default `source` renamed from `custom` to `manual` everywhere.
- ICS export now honors `date_override`; if T0 null, still exports `date_override` rows.
- Portal: `BatchImportSessionsDialog` (JSON/CSV tabs, preview, validation, CSV template, server error surface, "Regenerar semanales" button, contextual footer about Kevin's workshops). Visible only if `isPM`.
- 28 hardcoded weekly rows **removed** from `seed.ts` — fully owned by helper now. Seed `Roles: 12. System milestones: 32.` after this task.

**Files**: `weeklies.ts`, `milestones.ts` (schema + route), `calendar.ts`, `project.ts`, `BatchImportSessionsDialog.tsx`, `calendario.tsx`.

---

## Task #47 — Validar RACI / personas en Cronograma

**Purpose**: Resolve the 3 `needsHumanReview` flags in `phaseInvolvement.ts` using Kevin's governance document.

**Shipped**:

- Removed `needsHumanReview` from F3-a3 (Alertas SMS/correo), F3-a4 (Integración APIs CEL), and CONT phase.
- Expanded F3-a4 description to reflect coordination with CEL's Unidad de Informática; added `geospatial_expert_cel` to C and PM roles to I.
- CONT phase: renamed stage to `cont-plan`, replaced generic 1-activity buffer with 3 concrete activities (replanificación, retrabajos, validación adicional con CEL) each with full R/C/I.

**Files**: `phaseInvolvement.ts`.

---

## Task #53 — Nombres reales del equipo (gobernanza CEL/C2 Labs)

**Purpose**: Surface real people (from the governance doc) without inserting fake `users` rows.

**Shipped**:

- New `lib/db/src/governance.ts`: static overlay mapping `roleId → people[]` with `tbd` and `pendingOnCommittee` flags.
- 2 new roles seeded: `pm_director_cel` (Gerente de Proyecto CEL), `hydrology_ops_cel` (Hidrólogos Operativos CEL). Both marked TBD pending CEL's Comité de Dirección.
- `RoleCoverage` schema extended with `tbd` and `pendingOnCommittee`; `lib/api-zod` + `lib/api-client-react` regenerated.
- `GET /team/summary` merges governance overlay with real user_roles (dedup), exposes flags. `rolesFilled` still counts only real assignees.
- Cronograma drilldown: shows "Por determinar (TBD)" chip when role is TBD without real assignees.
- Equipo: "Por determinar (TBD)" in role view + amber "Pendiente Comité de Dirección CEL" badge.

**Files**: `governance.ts`, `team.ts` route, `cronograma.tsx`, `equipo.tsx`, `seed.ts`, `projectContent.ts`, `openapi.yaml`.

---

## Task #43 — Kanban QA + categorías + batch upload

**Purpose**: Distinguish `preproyecto` vs `piloto` tasks, add admin batch upload, run QA pass.

**Shipped**:

- New `kanban_cards.category` (default `piloto`, check-constrained `preproyecto | piloto`). Migration `0002_kanban_category_batch.sql` with explicit backfill.
- `Create/Update` schemas + handlers accept `category`. Exported `serializeCard` for batch reuse.
- New endpoint `POST /admin/kanban/cards/batch` in `adminKanban.ts` (PM-only, JSON + multipart CSV). Atomic. Position counter intra-batch so single-column batches stay gap-free. Audited.
- OpenAPI: `KanbanCategory`, `KanbanCardBatchItem`, `BatchImportKanbanCardsInput / Result`, new path. Codegen regenerated.
- UI: category filter (default `piloto`, includes `all`), radio in create/edit dialog, left band + "Preproyecto" badge for non-piloto cards, "Nueva tarjeta" disabled with tooltip when no columns exist, admin-only "Importar lote".
- New `BatchImportKanbanCardsDialog` (JSON/CSV tabs, preview, validation against live columns, CSV template).
- QA: reviewed position logic (create/move/delete in transactions); confirmed nullish tolerance for `dueDate/phaseId/assignedRoles`; dialog reset includes `category`.

**Files**: `kanban.ts` (schema + route), `adminKanban.ts`, `kanban.tsx`, `BatchImportKanbanCardsDialog.tsx`, `0002_kanban_category_batch.sql`.

---

## Task #44 — Decisiones: batch + ciclo de vida extendido

**Purpose**: Capture what was decided / by whom / when on resolve, and add admin batch upload.

**Shipped**:

- 4 new nullable columns on `decisions`: `decided_option_id`, `decided_outcome`, `decided_by_user_id` (FK), `decided_at`.
- Resolve endpoint now requires `decidedOutcome + decidedAt` (400 if missing); accepts `decidedOptionId`. Legacy `resolution` kept for back-compat.
- Reopen preserves `decided_*` as audit trail; only clears legacy `resolution / resolved_at / resolved_by`.
- New `POST /admin/decisions/batch` (PM-only, JSON + multipart CSV). Atomic; row-level zod errors; audited (`batch.upload / decisions`).
- `decision_resolved` email now includes "Decidido por X el Y · Opción".
- Portal: `ResolveDialog` with outcome textarea, option select parsed from `optionsConsidered`, date input defaulting to today. `DecisionCard` shows prominent "Decidido por X el Y · Opción" header above outcome. New "Decididas por mí" filter. Admin "Importar lote" → `BatchImportDecisionsDialog`.

**Files**: `decisions.ts` (schema + route), `notifications.ts`, `decisiones.tsx`, `BatchImportDecisionsDialog.tsx`, `0003_decisions_lifecycle.sql`.

---

## Cumulative outcome

After all 9 task merges:

- **15 Postgres tables**, 4 migrations, 14 roles seeded, 32 system milestones (generated via `ensureSystemWeeklies` after T0 is set).
- **~45 REST endpoints** across self / team / admin / kanban / milestones / decisions / documents / storage.
- **9 portal tabs**, with full PM/admin gating and a unified admin portal in Configuración.
- **3 batch import flows** (sessions, kanban cards, decisions) with consistent UX, CSV templates, and audit trail.
- **Governance overlay** so CEL personnel show up by name without forcing them to authenticate first.
- **Frozen sections honored**: Metodología → Detalle por fase, Desarrollo Técnico → Caps 4 and 5 (verified byte-identical).

## Pending follow-ups (out of these tasks)

Tracked as open project tasks #48, #49, #50, #51, #52, #54, #55. Highlights:

- **#50** Cerrar BOM final con CEL antes de comprar.
- **#54** Cerrar asignación del Gerente de Proyecto y Hidrólogos Operativos con CEL.
- **#55** Definir rol del Comité de Dirección y Unidad de Informática de CEL en el piloto.
- **#48** Anclas internas en el Gantt (las anclas por fase ya existen).
- **#49** Diagrama visual de la infraestructura del piloto.
- **#51** Confirmar fuentes de datos pendientes con Kevin.
- **#52** Limpiar contenido obsoleto del antiguo cap de infraestructura técnica.
