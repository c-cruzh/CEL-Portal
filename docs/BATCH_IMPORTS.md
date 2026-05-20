# Importación masiva — plantillas y validación

Tres flujos de batch upload, todos **admin only**, todos con el mismo patrón:

- Tabs **JSON** o **CSV** (multipart) en el diálogo.
- Plantilla CSV descargable desde el propio diálogo.
- Preview con validación fila‑a‑fila antes de importar.
- Transacción atómica: si una fila falla, **no se inserta ninguna**.
- Errores devueltos por fila con línea + razón.
- Cada importación registra una entrada en **Auditoría** (`batch.upload / <tipo>`).

> Los separadores aceptados dentro de celdas CSV para campos tipo array son `|` y `;`. Ejemplo: `pm_lead|hydrology_lead_cel`.

## 1. Sesiones / hitos al Calendario

Endpoint: `POST /admin/milestones/batch`.

### Estructura JSON

```json
{
  "sessions": [
    {
      "kind": "weekly_session",
      "title": "Sesión semanal 1",
      "weekOffset": 1,
      "dateOverride": null,
      "durationMinutes": 60,
      "location": "Sala virtual",
      "notes": "Primera sesión post-T0",
      "phaseId": "F1",
      "ownersRoles": ["pm_lead"],
      "description": "Sync semanal con CEL"
    }
  ]
}
```

### Plantilla CSV

```csv
kind,title,weekOffset,dateOverride,durationMinutes,location,notes,phaseId,ownersRoles,description
weekly_session,Sesión semanal 1,1,,60,Sala virtual,Primera sesión post-T0,F1,pm_lead,Sync semanal con CEL
committee,Comité de avance Q1,,2026-07-15,90,Oficinas CEL,Revisión trimestral,F1,pm_lead|pm_cel,Avance del piloto
workshop,Taller de modelado,4,,180,Sala C2 Labs,Hands-on LSTM,F2,pm_lead|hydrology_lead_cel,
```

### Reglas de validación

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `kind` | enum | sí | `phase_start | phase_end | deliverable | committee | workshop | weekly_session` |
| `title` | string ≤200 | sí | |
| `weekOffset` | int ≥0 | opcional | Si no hay `dateOverride`, se usa `T0 + weekOffset × 7d`. |
| `dateOverride` | `YYYY-MM-DD` | opcional | Toma precedencia sobre `weekOffset`. Se almacena como texto. |
| `durationMinutes` | int >0 | opcional | |
| `location` | string ≤200 | opcional | |
| `notes` | string ≤2000 | opcional | |
| `phaseId` | `F0..F4 | CONT` | opcional | Valida contra `PHASES`. |
| `ownersRoles` | array | opcional | Cada item debe ser id de rol existente (`pm_lead`, `pm_cel`, `hydrology_lead_cel`, etc.). En CSV separador `|` o `;`. |
| `description` | string ≤2000 | opcional | |

**Restricción dura**: si `weekOffset` y `dateOverride` son ambos null, la fila falla con `missing_date_basis`.

**Resultado** se inserta con `source='import'`. Es **insert-only**: no actualiza filas existentes.

### Cuándo usar `dateOverride` vs `weekOffset`

- **`weekOffset`** → si la sesión se mueve con T0 (sesión recurrente / hito relativo al inicio).
- **`dateOverride`** → si la fecha es fija (comité con fecha de calendario real, taller con fecha agendada). No se mueve cuando T0 cambia.

## 2. Tarjetas al Kanban

Endpoint: `POST /admin/kanban/cards/batch`.

### Estructura JSON

```json
{
  "cards": [
    {
      "title": "Confirmar accesos VPN con CEL",
      "description": "Coordinar con Unidad de Informática",
      "columnKey": "backlog",
      "category": "preproyecto",
      "phaseId": "F0",
      "assignedRoles": ["infra_devops", "pm_cel"],
      "priority": "alta",
      "dueDate": "2026-06-15"
    }
  ]
}
```

### Plantilla CSV

```csv
title,description,columnKey,category,phaseId,assignedRoles,priority,dueDate
Confirmar accesos VPN con CEL,Coordinar con Unidad de Informática,backlog,preproyecto,F0,infra_devops|pm_cel,alta,2026-06-15
Definir formato de logs operativos,,backlog,piloto,F1,data_engineer,media,
Validar GPU disponible en silo,Necesitamos confirmar specs,in_progress,piloto,F2,infra_devops,alta,2026-07-01
```

### Reglas de validación

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `title` | string ≤200 | sí | |
| `description` | string ≤5000 | opcional | |
| `columnKey` | string | sí | Debe existir en `kanban_columns`. |
| `category` | enum | sí | `preproyecto | piloto`. |
| `phaseId` | string | opcional | F0..F4 / CONT o null. |
| `assignedRoles` | array | opcional | IDs de rol existentes. Separador `|` o `;` en CSV. |
| `priority` | enum | opcional (default `media`) | `alta | media | baja`. |
| `dueDate` | `YYYY-MM-DD` | opcional | |

**Position**: las tarjetas se insertan al final de su columna respetando un counter intra-batch (sin gaps; sin colisiones).

## 3. Decisiones

Endpoint: `POST /admin/decisions/batch`.

### Estructura JSON

```json
{
  "decisions": [
    {
      "title": "Selección de proveedor de datos meteorológicos",
      "context": "ERA5 vs GPM vs CHIRPS — necesitamos elegir fuente principal",
      "optionsConsidered": "1) ERA5: alta resolución, latencia 5d\n2) GPM: tiempo real, menor resolución\n3) CHIRPS: regional, gratuito",
      "phase": "F1",
      "ownerRole": "data_engineer",
      "dueDate": "2026-07-01"
    }
  ]
}
```

### Plantilla CSV

```csv
title,context,optionsConsidered,phase,ownerUserId,ownerRole,dueDate
Selección de proveedor meteo,ERA5 vs GPM vs CHIRPS,1) ERA5...|2) GPM...|3) CHIRPS...,F1,,data_engineer,2026-07-01
Esquema de alertas SMS,Twilio vs proveedor local,Twilio: estable global|Local: menor costo,F3,,infra_devops,2026-08-15
```

### Reglas de validación

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `title` | string ≤200 | sí | |
| `context` | string ≤5000 | sí | |
| `optionsConsidered` | string ≤5000 | opcional | Texto libre / markdown. |
| `phase` | string | opcional | F0..F4 / CONT. |
| `ownerUserId` | string | opcional | Debe existir en `users` si se provee. |
| `ownerRole` | string | opcional | ID de rol existente. |
| `dueDate` | `YYYY-MM-DD` | opcional | |

Las decisiones se insertan en `status='open'` con `requestedAt=now()`. Para resolverlas hay que pasar después por el flujo de resolución normal en la UI (que captura outcome + decisor + fecha).

## Manejo de errores

Todos los endpoints batch responden:

```json
{
  "created": 12,
  "updated": 0,
  "rejected": 2,
  "errors": [
    { "row": 3, "code": "invalid_role", "message": "El rol 'foo_bar' no existe" },
    { "row": 7, "code": "invalid_date", "message": "dueDate debe ser YYYY-MM-DD" }
  ]
}
```

Si hay ≥1 error, **rejected = N** y **created = 0** (rollback atómico). El diálogo muestra los errores fila por fila para que el admin corrija y reintente.

## Tips operativos

- **Empezar con 2-3 filas de prueba** para validar el formato antes de subir un lote grande.
- **Mantener la plantilla CSV en Google Sheets** y exportar como CSV separado por comas (no por punto y coma). El parser de CSV detecta `,` como separador estándar.
- **Strings con comas**: encerrar en comillas dobles. Ej.: `"Sesión, semanal 1"`.
- **Strings con comillas dobles**: escapar duplicando. Ej.: `"Dijo ""hola"""`.
- **Strings vacíos vs null en CSV**: dejar la celda vacía equivale a `null`. Para forzar string vacío, ponerlo entre comillas: `""`.
- **Después de cada import**, verificar en **Auditoría** que la entrada `batch.upload` quedó con el payload correcto y que la cuenta de creadas concuerda.
