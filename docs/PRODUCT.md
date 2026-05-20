# Producto — Portal CEL Piloto

Portal web privado para coordinar el piloto de pronóstico hidrológico CEL × C2 Labs. Audiencia: equipo del piloto. Acceso restringido por dominio (`@cel.gob.sv` y `@c2labs.ai`). Diseño en navy PANTONE 289 C, sin emojis, todo en español.

## Roles y acceso

- **Cualquier integrante** (cualquiera con un correo permitido y sesión activa en Clerk) tiene acceso de lectura a las 8 pestañas operativas y puede editar lo que le corresponde por rol.
- **Admins (PM Portal)**: Camila Cruz (`camila@c2labs.ai`) y Kevin Centeno (`kevin@c2labs.ai`). Tienen acceso a Configuración y a los flujos de batch upload / edición de miembros. El admin se decide por correo (no por rol asignado) — ver `ADMIN_GUIDE.md`.
- **Multi‑rol**: una persona puede tener N roles asignados (p. ej. PM Lead (C2 Labs)). Un rol puede tener N personas. La asignación canónica de personas reales vive en `lib/db/src/governance.ts` y se muestra en Equipo y Cronograma.

## Las 9 pestañas

### 1. Equipo

Quién integra el piloto y qué hace cada uno.

- Vista "Personas": tarjetas por persona con avatar (iniciales), nombre, correo, roles (chips), CV (link si existe).
- Vista "Roles": catálogo de roles del piloto, alineado al Paquete Maestro — Piloto CEL (Core Pilot Team C²Labs/CEL, Comité de Informática desdoblado en 5 sub-roles —Jefa de Unidad, Redes, Sistemas, DBA, Ciberseguridad—, Gerente de Proyecto CEL, Hidrólogos Operativos CEL y Equipo de Dirección del Piloto). Cada rol muestra descripción, conteo, personas asignadas (avatares) y, cuando aplica, badges:
  - **"Por determinar (TBD)"** — el rol existe pero CEL aún no asignó persona.
  - **"Pendiente Comité de Dirección CEL"** — el rol depende del Comité de Dirección de CEL (Gerente de Proyecto CEL e Hidrólogos Operativos).
  - **"Pendiente por etapa"** — el Equipo de Dirección del Piloto (Guillermo Colorado, Gerardo Ávalos, Mauricio Herrera Landaverde, Rigoberto Ávila) tiene candidatos confirmados, pero el involucramiento específico por etapa está pendiente de definir conforme al DSP.
- Subida de CV propio (PDF/DOC/DOCX, ≤10 MB) desde la propia tarjeta del integrante.

### 2. Cronograma

Línea de tiempo + drilldown por fase con personas involucradas.

- **Gantt** horizontal arriba (5 fases del piloto + Contingencia), con `T0` configurable por admins.
- **Tarjetas de fase** debajo, cada una expandible (accordion) mostrando:
  - **Etapa → Entregable → Actividad** con jerarquía clara.
  - Chips R/C/I (RACI) por actividad con los roles responsables.
  - Avatares de las personas reales asignadas a esos roles (vía `lib/db/src/governance.ts`).
  - Badge **"Por validar (Kevin)"** donde el mapeo tenga ambigüedad.
- Link "Ver en Cronograma →" desde Metodología hace deep-link a `#fase-<id>` con scroll suave y ring temporal.

### 3. Metodología

3 secciones operativas + "Detalle por fase" (esta última congelada).

- **High‑Level (timeline animado)**: 3 fases del enfoque metodológico (Data, Modeling, Operación) con `framer-motion`, íconos y flechas conectoras. Respeta `prefers-reduced-motion`.
- **Infraestructura del piloto** (categoría amalgamadora con 4 sub‑secciones):
  - Infra física / cómputo (silo IA, hardware, BOM resumen)
  - F1 — Infraestructura de datos
  - F2 — Infraestructura de modelado
  - F3 — Infraestructura de servicio
- **Ruta y entregables**: vista granular complementaria al Cronograma (propósito, tareas, bloque "Colaboración con CEL", grid de entregables, link a Cronograma).
- **Detalle por fase**: capítulos largos por fase. **Congelado**, no se toca.

### 4. Desarrollo Técnico

Documento técnico navegable de 11 capítulos.

- **Cap. 1 — Flujo del sistema**: resúmenes cortos por etapa + cross-links a Cronograma, Metodología y Decisiones.
- **Cap. 2 — Datos de entrada**: registro estructurado de 13 fuentes (`DATA_REGISTRY`) con status badges (confirmado / por validar Kevin).
- **Cap. 3 — ETL**: 5 etapas ordenadas (extracción → staging → transformación → carga → orquestación) + diagrama Mermaid.
- **Cap. 4 — Modelos de predicción**: LSTM + modelo de inundación. **Congelado**.
- **Cap. 5 — Validación**: rolling validation + métricas + criterios de éxito. **Congelado**.
- **Cap. 6 — Decisiones abiertas y dependencias CEL**: tabla `OPEN_DECISIONS` (OD-01..20) con filtro por área. Link a /portal/decisiones para cada decisión formal.
- **Cap. 7 — Operación diaria**: incluye sub‑sección de responsabilidades diarias CEL.
- **Cap. 8 — Visualización**: integración + capacitación/ejercicios.
- **Cap. 9 — BOM final aprobado por CEL**: BOM completo del Paquete Maestro §8.2 (Anexo Complementario No. 1) — Dell PowerEdge R770×2 (IA y virtualización), R570 NAS, switch S5224F-ON, GPU H100 NVL 94 GB, estaciones Pro Max, ProSupport Plus, NVIDIA AI Enterprise y TechCircle 30h. Incluye la tabla de software/runtime separando la base provista por la plataforma (Ubuntu 24.04, Docker, Windows Server 2025, SmartFabric OS10, iDRAC, NVIDIA AI Enterprise, Dell AI Ops) del stack funcional del piloto (Mage, Python/PyTorch/NeuralHydrology, PostgreSQL+PostGIS, MongoDB, Node/React) y las 5 cláusulas defendibles §6.1–§6.5 del Paquete (alineación técnica, no ampliación de alcance, inicio efectivo de Fase 0, Mage/observabilidad y ownership de infraestructura).
- **Cap. 10 — Lempa**: contexto hidrológico del río Lempa con estilo renovado.
- **Cap. 11 — RACI y equipo**: 2 bloques (A. Quién, B. Cómo) con matriz RACI consolidada + drilldown por fase.

### 5. Kanban

Tablero operativo con 5 columnas: Backlog, En curso, En revisión, Bloqueado, Hecho.

- **Categorías**:
  - `piloto` (default): tareas del piloto en curso.
  - `preproyecto`: tareas que deben definirse antes de arrancar; se renderizan con banda lateral y badge "Preproyecto".
- Filtros: fase, rol, prioridad, **categoría** (default `piloto`).
- Drag & drop entre columnas (dnd-kit).
- Botón "Nueva tarjeta" con form completo (título, descripción, fase, roles, prioridad, fecha objetivo, categoría, columna inicial). Se deshabilita con tooltip si no hay columnas configuradas.
- **Importar lote** (admin only) — ver `BATCH_IMPORTS.md`.

### 6. Calendario

Sesiones, hitos y entregables del piloto, con autogen desde T0 y exportación ICS.

- Vista de calendario (mes) + vista lista próximas sesiones.
- Hitos categorizados por `kind`: hitos de fase, entregables, comités, talleres, **`weekly_session`** (sesión semanal de seguimiento).
- **Autogen desde T0**: al cambiar `T0` en Configuración, el backend regenera idempotentemente N (default 28) `weekly_session` con `source='system'`. Si T0 = null, las borra. Sesiones `manual` o `import` nunca se tocan automáticamente.
- **Exportación ICS** (`/api/calendar/export.ics` + feed URL con token): se mantiene siempre.
- **Importar sesiones (admin)**: dialog con tabs JSON/CSV, preview, plantilla descargable, validación inline, audit log — ver `BATCH_IMPORTS.md`.

### 7. Decisiones

Registro de decisiones del piloto con ciclo de vida completo.

- Cada decisión tiene: título, contexto, opciones consideradas (texto libre), fase, owner (persona o rol), fecha objetivo, status (`open | in_analysis | resolved | cancelled`).
- **Ciclo de vida extendido (Task #44)**:
  - Al resolver: outcome (textarea, obligatorio), opción elegida (select de las opciones + "Otra"), fecha (default hoy). El usuario que confirma queda como `decidedByUserId`.
  - La tarjeta resuelta muestra prominente: "Decidido por [Nombre] el [fecha] · [opción]" + outcome.
  - Reabrir conserva los campos de decisión (auditoría histórica).
- Filtro nuevo "Decididas por mí".
- **Importar lote** (admin only) — ver `BATCH_IMPORTS.md`.
- Notificaciones por email: `decision_created`, `decision_resolved` (incluye outcome + decisor), `decision_assigned`.

### 8. Documentos

Repositorio de documentos del piloto, organizados por carpetas.

- Carpetas (sortOrder): Propuesta, Contratos, Técnicos, Operación, Misc.
- Cada documento: nombre, descripción, fase asociada (opcional), versión, mime, tamaño, uploader.
- Subida vía signed URL al Object Storage de Replit (`storage/uploads/request-url`).
- Soft-delete vía `is_active` (no se borra físicamente).

### 9. Configuración (admin only)

Portal de administración. Visible sólo si `me.isAdmin === true`. No‑admins ven "Acceso restringido".

- **Miembros**: tabla de usuarios registrados con nombre, correo, fecha de alta, última actividad, roles (chips), CV. Botón "Editar" abre el `AdminEditMemberDialog` (renombrar, ajustar roles, gestionar CV).
- **Invitaciones**: crear invitación con correo + roles sugeridos + expiración. Tabla con estado (`pending | accepted | revoked | expired`), reenviar, revocar. Al hacer signup con un correo invitado, los roles sugeridos se asignan automáticamente.
- **Roles**: catálogo de los 14 roles con descripción y conteo de personas; editar descripción / `sortOrder`.
- **Notificaciones**: destinatarios CC fijos + test email + log de notificaciones.
- **Auditoría**: últimas 200 entradas de `admin_audit_log` con filtros por acción y actor.
- **T0 del proyecto**: setear / cambiar / limpiar; cualquier cambio dispara `ensureSystemWeeklies`.

## Gobernanza (Paquete Maestro)

Estructura confirmada en el Paquete Maestro — Piloto CEL. Fuente única de verdad en `lib/db/src/governance.ts`:

- **C² Labs (consultora):** Camila Cruz (`camila@c2labs.ai`) y Kevin Centeno (`kevin@c2labs.ai`).
- **Core Pilot Team (CEL):** Ing. José Mauricio Herrera Mercado (`jmherreram@cel.gob.sv`) como PM CEL + Contrato; Ing. Víctor Alabí (`vialabi@cel.gob.sv`) como Líder Técnico Hidrología; Ing. Fernando Garay (`fgaray@cel.gob.sv`) SIG; Ing. William Juárez (`wjuarez@cel.gob.sv`) Datos; Ing. José Manuel Guardado (`jmguardado@cel.gob.sv`) DevOps / enlace operativo.
- **Comité de Informática (CEL):** Lic. Lorena Pineda (`alpineda@cel.gob.sv`, Jefa de Unidad), Nelson Flores (`nfloresc@cel.gob.sv`, Redes), Adrián Miranda (Sistemas), Carlos Sánchez (DBA), Miladis (Ciberseguridad). José Manuel Guardado no se cuenta como sexto miembro consultivo (figura embebido como DevOps operativo) — cero doble conteo FTE.
- **Equipo de Dirección del Piloto (CEL) — TBD por etapa:** Ing. Guillermo Colorado, Ing. Gerardo Ávalos, Ing. Mauricio Herrera Landaverde (persona distinta de Herrera Mercado), Ing. Rigoberto Ávila (`ravila@cel.gob.sv`). Aparecen como `direccion_member` con badge "Pendiente por etapa": rol e involucramiento se definen conforme al DSP.

**Dinámica de escalación operativa:** Consultora (C²Labs) → José Mauricio Herrera Mercado (PM CEL + Contrato) → Lorena Pineda / Nelson Flores (Comité de Informática) para autorizaciones y lineamientos. José Manuel Guardado actúa como enlace operativo embebido entre el Comité y el Core Pilot Team.

## Reglas transversales

- **Cualquier mutación admin** (editar miembro, T0, invitación, batch upload, destinatarios) escribe en `admin_audit_log` automáticamente vía `logAdminAction()`.
- **Cualquier asignación / decisión / resolución** dispara notificación por email (best-effort; sin provider configurado se registran en `notification_log`).
- **Notificaciones**: cada usuario puede opt‑out vía `email_notifications_opt_out` (no UI todavía; campo existe).
- **Contenido del piloto**: cuando un dato está incierto, se marca con badge "Por validar (Kevin)" o "Por determinar (TBD)" en vez de inventarse.

## Fuera de alcance del MVP

- Lógica del Comité de Dirección CEL (2ª iteración).
- Histórico de cambios campo‑por‑campo (más allá de `admin_audit_log`).
- Comentarios / hilos sobre decisiones o tarjetas Kanban.
- Edición de RACI por actividad desde la UI (hoy es lectura; se edita en código en `phaseInvolvement.ts`).
- Móvil nativo (el portal es responsive web).
