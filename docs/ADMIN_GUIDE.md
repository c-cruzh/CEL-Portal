# Guía de administración — Camila y Kevin

Esta guía cubre todo lo que pueden hacer los admins del portal. Audiencia: **Camila Cruz (camila@c2labs.ai)** y **Kevin Centeno (kevin@c2labs.ai)** — únicos correos con privilegios admin.

> El admin no se asigna por rol: se decide por correo en `requireAdmin`. Si necesitan sumar un tercer admin, hay que tocar `artifacts/api-server/src/middlewares/requireAdmin.ts` y desplegar.

## Cómo se ve el portal para un admin

Al entrar al portal, los admins ven todas las pestañas igual que cualquier integrante, **más** la pestaña **Configuración** (los no-admins ven "Acceso restringido"). Configuración está organizada en 5 secciones:

1. **Miembros** — gestionar usuarios registrados
2. **Invitaciones** — convocar nuevos integrantes
3. **Roles** — editar catálogo
4. **Notificaciones** — destinatarios CC + log
5. **Auditoría** — historial de acciones admin

Además, en otros tabs aparecen acciones reservadas:

- **Kanban → "Importar lote"** (encima del tablero)
- **Calendario → "Importar sesiones (admin)"** y **"Regenerar semanales desde T0"**
- **Decisiones → "Importar lote"**
- **Botón editar (lápiz)** en cualquier tarjeta de miembro en Equipo

## Flujo: invitar a una persona nueva

1. Ir a **Configuración → Invitaciones**.
2. Clic **"Nueva invitación"**.
3. Completar:
   - **Correo** (debe ser `@cel.gob.sv` o `@c2labs.ai`).
   - **Roles sugeridos** — los que se asignarán automáticamente cuando esa persona haga signup.
   - **Expiración** (opcional).
4. Confirmar. La invitación queda en estado **`pending`** y se dispara un correo (si hay provider configurado; si no, queda en `notification_log`).
5. Cuando la persona hace signup con ese correo, los roles sugeridos se asignan automáticamente y la invitación pasa a **`accepted`**.
6. Si necesitan **reenviar**: botón "Reenviar" en la fila. Si necesitan **revocar**: botón "Revocar" (sólo funciona si la invitación sigue `pending`; si ya fue aceptada o revocada, devuelve un error 409).

## Flujo: editar un miembro existente

1. Ir a **Configuración → Miembros** (o **Equipo → tarjeta de persona → botón lápiz** si son admins).
2. Clic editar.
3. Pueden cambiar:
   - **Nombre para mostrar**
   - **Roles** asignados (multi-rol; ejemplo: Camila tiene PM Lead + ML Engineer + Data Engineer)
   - **CV** — opción "Quitar CV" si el archivo es viejo o erróneo
4. Confirmar. La acción queda registrada en **Auditoría** con la acción `member.update`.

## Flujo: cambiar el T0 del proyecto

1. **Configuración → Proyecto → Fecha de inicio (T0)**.
2. Setear, cambiar o limpiar la fecha.
3. Al guardar, el servidor:
   - Actualiza `project_config.start_date`.
   - Ejecuta `ensureSystemWeeklies(startDate, 28)`:
     - Si **T0 ≠ null**: garantiza 28 sesiones semanales con `seedKey=weekly_1..28`.
     - Si **T0 = null**: borra todas las sesiones `weekly_session` de `source='system'`.
   - Nunca toca sesiones `manual` o `import` (las que cargan ustedes).
4. Si la regeneración falla, la respuesta es **500 `weeklies_regen_failed`** (no se aplica el cambio silenciosamente). Avisar al equipo técnico.

## Flujo: importar sesiones al calendario en lote

Ver `BATCH_IMPORTS.md` para el formato completo. Resumen:

1. **Calendario → "Importar sesiones (admin)"**.
2. Tabs: **JSON** o **CSV**.
3. Descargar plantilla CSV si nunca lo han hecho.
4. Pegar / subir el archivo. La preview muestra cada fila con validación inline. Si hay errores, se bloquea el botón "Importar N sesiones".
5. Al importar, todo es atómico: si una fila falla, no se inserta ninguna.
6. Las sesiones importadas quedan con `source='import'` y aparecen en `Auditoría` como `batch.upload / milestones`.

## Flujo: importar tarjetas al Kanban en lote

Mismo patrón que sesiones. Ver `BATCH_IMPORTS.md`. Tarjetas importadas pueden ser de categoría `piloto` o `preproyecto`.

## Flujo: importar decisiones en lote

Mismo patrón. Permite cargar todas las decisiones abiertas heredadas del DSP de un solo golpe.

## Cómo se resuelve una decisión

Cualquier integrante (no sólo admin) puede resolver una decisión que tenga asignada o que sea de su responsabilidad:

1. Ir a **Decisiones → tarjeta → "Resolver"**.
2. Completar:
   - **Outcome** (texto libre, obligatorio): qué se decidió.
   - **Opción elegida** (select de las opciones registradas + "Otra (especificar)").
   - **Fecha** (default hoy).
3. Al guardar, queda registrado:
   - `decidedByUserId` = quien confirmó
   - `decidedAt` = fecha
   - `decidedOutcome` = texto
   - `decidedOptionId` = etiqueta de la opción
4. La tarjeta muestra prominente: **"Decidido por [Nombre] el [fecha] · [Opción]"** + outcome.
5. Se dispara `decision_resolved` por email a los stakeholders correspondientes (con outcome y decisor).

**Reabrir** una decisión preserva los campos `decided_*` como histórico (no se borran).

## Notificaciones por email

- Los eventos automáticos (decisión creada, asignada, resuelta) intentan enviar correo a los stakeholders + a los destinatarios CC fijos.
- Los destinatarios CC se gestionan en **Configuración → Notificaciones → Destinatarios**.
- **Test email**: botón en la misma sección para validar que el provider responde.
- **Log**: cada envío (incluso fallidos / sin provider) queda en `notification_log` y es visible abajo.
- Si no hay provider configurado, los eventos se registran con status `noProvider`. Nada se rompe, pero nadie recibe correo.

## Auditoría

**Configuración → Auditoría** muestra las últimas 200 acciones admin con filtros por:

- **Acción** (`member.update`, `invitation.create`, `batch.upload`, etc.)
- **Actor** (correo)

Cada entrada incluye `target_type`, `target_id` y un `payload` JSON con el snapshot del cambio. Es append-only: no se puede editar ni borrar desde la UI.

## CV: cuándo intervenir

Los CV los gestiona cada persona desde su propia tarjeta. Como admin pueden:

- **Ver** quién tiene CV cargado (badge en Miembros).
- **Quitar** el CV de alguien vía el diálogo editar (opción `clearCv`).
- No pueden ver el contenido del CV desde la UI por ahora — el archivo está en object storage privado, accesible por el dueño o por el endpoint de download (que requiere ser admin o el dueño).

## Límites de admin

- **No pueden** asignar personas a roles desde la UI fuera de "editar miembro" (la asignación granular por actividad vive en código en `phaseInvolvement.ts`).
- **No pueden** borrar usuarios desde la UI (se desactivan removiendo roles + opt-out).
- **No pueden** editar decisiones ya resueltas excepto reabriéndolas y volviendo a resolver.
- **No pueden** cambiar la lista de admins desde la UI: hay que tocar código (`requireAdmin.ts`).

## Cosas que NO hacer

- No insertar manualmente sesiones `kind='weekly_session'` con `source='system'`. Las gobierna `ensureSystemWeeklies`. Si necesitan una sesión semanal especial, usar `source='manual'` o importarla con `source='import'`.
- No reseedear la DB sin avisar al equipo técnico. El seed es idempotente pero `Roles: 14. System milestones: 32.` es el conteo esperado tras el seed; números distintos indican drift.
- No editar `lib/api-spec/openapi.yaml` ni archivos generados (`lib/api-zod`, `lib/api-client-react/src/generated/`) sin correr `pnpm --filter @workspace/api-spec run codegen` después.
