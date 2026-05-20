# Data Model — Portal CEL Piloto

Postgres, managed by Drizzle ORM. Source of truth: `lib/db/src/schema/*.ts`. Migrations: `lib/db/drizzle/000X_*.sql` (hand-written, idempotent). Seed: `lib/db/src/seed.ts` (also idempotent).

## Tables

### `users`

Mirrors Clerk users for this app's foreign keys.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Clerk user id |
| `email` | text | Allowed domains only (`@cel.gob.sv`, `@c2labs.ai`) |
| `display_name` | text | Editable by self or admin |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `email_notifications_opt_out` | bool default false | Per-user opt-out |
| `last_activity_at` | timestamptz | Throttled touch from `requireAuth` |

### `roles`

Canonical catalog of pilot roles. Seeded with 14 entries.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | e.g. `pm_lead`, `ml_engineer`, `pm_director_cel` |
| `label` | text | Human label (Spanish) |
| `description` | text | Shown in Equipo and Configuración |
| `sort_order` | int | Display order |

### `user_roles`

N:M between users and roles. A person can have N roles; a role can have N persons.

| Column | Type |
|---|---|
| `user_id` | text FK → users |
| `role_id` | text FK → roles |
| `assigned_at` | timestamptz |
| PK | (user_id, role_id) |

### `invitations`

Pre-assigned roles for incoming members.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text unique | Lowercased |
| `invited_by` | text FK → users | nullable |
| `suggested_roles` | text[] | Auto-assigned on signup |
| `status` | text | `pending | accepted | revoked | expired` |
| `expires_at` | timestamptz | nullable |
| `created_at` | timestamptz | |
| `accepted_at` | timestamptz | |
| `accepted_user_id` | text | FK to user after acceptance |
| `revoked_at` | timestamptz | |
| `last_sent_at` | timestamptz | For resend cooldown |

### `admin_audit_log`

Append-only log of all admin mutations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `at` | timestamptz | |
| `actor_id` | text | nullable when system action |
| `actor_email` | text | Cached for display |
| `action` | text | `member.update`, `invitation.create`, `batch.upload`, etc. |
| `target_type` | text | `user`, `invitation`, `kanban`, `decisions`, `milestones`, etc. |
| `target_id` | text | UUID or composite id |
| `payload` | jsonb | Action-specific snapshot |

### `project_config`

Singleton (id = 1). Holds T0.

| Column | Type |
|---|---|
| `id` | int PK (always 1) |
| `start_date` | date nullable |
| `updated_at` | timestamptz |

### `milestones`

Hitos del calendario: fase, entregable, comité, taller, sesión semanal.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `description` | text nullable | |
| `kind` | text | `phase_start | phase_end | deliverable | committee | workshop | weekly_session` |
| `week_offset` | int | Weeks from T0 |
| `phase_id` | text nullable | F0..F4, CONT |
| `owners_roles` | jsonb (text[]) | |
| `source` | text | `system | manual | import` |
| `seed_key` | text nullable | `weekly_<n>` for system weeklies |
| `created_by` | text nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `date_override` | text (YYYY-MM-DD) | Overrides T0+offset when present |
| `duration_minutes` | int nullable | |
| `location` | text nullable | |
| `notes` | text nullable | |

**Invariant**: `source='system'` rows are owned by `ensureSystemWeeklies()`. Never insert manually. The `seed.ts` cleanup deliberately skips `weekly_*` system rows.

### `kanban_columns`

Seeded with 5 fixed columns: `backlog`, `in_progress`, `in_review`, `blocked`, `done`.

| Column | Type |
|---|---|
| `key` | text PK |
| `label` | text |
| `sort_order` | int |

### `kanban_cards`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `description` | text default '' | |
| `column_key` | text FK → kanban_columns | |
| `position` | int | Per-column ordering (gap-free) |
| `phase_id` | text nullable | |
| `assigned_roles` | jsonb (text[]) | |
| `priority` | text | `alta | media | baja` |
| `due_date` | date nullable | |
| `created_by` | text FK → users | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `category` | text | `preproyecto | piloto` (default `piloto`, check-constrained) |

**Position invariant**: positions are kept gap-free per column via transactional shifts on create/move/delete. Cross-column moves shift both columns.

### `decisions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `context` | text | |
| `options_considered` | text | Free text (markdown). Structured options is a follow-up. |
| `phase` | text nullable | |
| `owner_user_id` | text nullable | |
| `owner_role` | text nullable | |
| `requested_at` | timestamptz | |
| `due_date` | date nullable | |
| `status` | text | `open | in_analysis | resolved | cancelled` |
| `resolution` | text nullable | Legacy short summary (kept for back-compat) |
| `resolved_at` | timestamptz nullable | |
| `resolved_by` | text nullable | |
| `created_by` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `decided_option_id` | text nullable | The chosen option label (or "Otra") |
| `decided_outcome` | text nullable | Required on resolve |
| `decided_by_user_id` | text nullable FK → users | Required on resolve |
| `decided_at` | timestamptz nullable | Required on resolve |

**Resolve contract**: transitioning to `resolved` requires `decided_outcome`, `decided_by_user_id`, `decided_at`. Reopen preserves the `decided_*` fields as an audit trail.

### `notification_recipients`

Fixed CC list for admin notifications.

| Column | Type |
|---|---|
| `email` | text PK |
| `added_by` | text nullable |
| `created_at` | timestamptz |

### `notification_log`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_kind` | text | e.g. `decision_resolved`, `assignment_added` |
| `recipients` | jsonb | List of email targets |
| `recipient_count` | int | |
| `status` | text | `sent | failed | noProvider` |
| `provider_message` | text nullable | Error or provider id |
| `triggered_by` | text nullable | |
| `created_at` | timestamptz | |

### `document_folders` and `documents`

`document_folders`: seeded set of fixed folder keys (Propuesta, Contratos, Técnicos, Operación, Misc).

`documents`: metadata for files in object storage. `is_active=false` = soft-deleted. `version` is incremented per re-upload of the same logical doc.

### `user_cvs`

One CV per user. `object_path` points to private object storage.

## Governance overlay

`lib/db/src/governance.ts` exports a static map `roleId → [{ name, isCEL, tbd?, pendingOnCommittee? }]` populated from the gobernanza document. The `/team/summary` endpoint **merges** this overlay with rows from `user_roles` (dedup by name) and exposes `tbd` and `pendingOnCommittee` flags on each `RoleCoverage`. **No fake user rows are inserted** for CEL personnel — they appear only when they actually authenticate.

## Migrations

| File | Purpose |
|---|---|
| `0000_admin_portal.sql` | `invitations`, `admin_audit_log`, `users.last_activity_at` |
| `0001_calendar_batch_import.sql` | `milestones.date_override / duration_minutes / location / notes`, source default `manual`, backfill `custom → manual` |
| `0002_kanban_category_batch.sql` | `kanban_cards.category` with check constraint + backfill to `piloto` |
| `0003_decisions_lifecycle.sql` | `decisions.decided_*` columns (4 nullable) |

All migrations use `IF NOT EXISTS` guards so re-applying is safe.

## Conventions

- **All timestamps** are `timestamptz`. Dates without time use `date`.
- **All ids** for new tables use `uuid` with `gen_random_uuid()`. `users.id` is a `text` (Clerk id) for legacy reasons.
- **Soft deletes** only where it matters for audit: `documents.is_active`. Invitations use status (`revoked`).
- **Arrays**: stored as `jsonb` (e.g. `assigned_roles`, `owners_roles`) or `text[]` (e.g. `suggested_roles`). Mixed for historical reasons; new tables use `text[]`.
- **No cascading deletes** anywhere — admins delete intentionally and audit log preserves history.
