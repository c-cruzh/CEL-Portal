# Documentation Index — Portal CEL Piloto

This folder is the canonical documentation for the Portal CEL Piloto. Product/admin guides are in Spanish (audience: Camila + Kevin + equipo CEL). Technical docs are in English (audience: engineers).

## Audience map

| Doc | Audience | Language |
|---|---|---|
| `PRODUCT.md` | PM + stakeholders + new team members | Español |
| `ADMIN_GUIDE.md` | Camila + Kevin (admins) | Español |
| `BATCH_IMPORTS.md` | Anyone preparing CSV/JSON for batch upload | Español |
| `ARCHITECTURE.md` | Engineers | English |
| `DATA_MODEL.md` | Engineers + DB ops | English |
| `API.md` | Engineers + integrators | English |
| `CHANGELOG.md` | All | English |

## Quick orientation

- **What is this?** A private web portal that coordinates the CEL × C2 Labs hydrological-forecasting pilot. 9 tabs, role-based access, admin tooling.
- **Who can log in?** Anyone with `@cel.gob.sv` or `@c2labs.ai`.
- **Who are admins?** `camila@c2labs.ai` and `kevin@c2labs.ai` only (email allowlist in `requireAdmin`).
- **Where is the production code?** `artifacts/portal` (UI) + `artifacts/api-server` (REST) + `lib/db` (schema + seed).
- **What was shipped?** See `CHANGELOG.md` for the per-task breakdown.

## Reading order for a new engineer

1. `ARCHITECTURE.md` — monorepo, artifacts, build pipeline.
2. `DATA_MODEL.md` — what lives in Postgres and why.
3. `API.md` — REST surface (mirrors `lib/api-spec/openapi.yaml`).
4. `PRODUCT.md` — what each tab does (helps debug user reports).
5. `CHANGELOG.md` — history and rationale of past decisions.

## Reading order for a new PM / stakeholder

1. `PRODUCT.md` — qué hace el portal, módulo por módulo.
2. `ADMIN_GUIDE.md` — cómo Camila/Kevin operan el portal.
3. `BATCH_IMPORTS.md` — cómo subir lotes de sesiones, tarjetas y decisiones.
