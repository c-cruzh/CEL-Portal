import {
  db,
  pool,
  rolesTable,
  projectConfigTable,
  kanbanColumnsTable,
  milestonesTable,
  documentFoldersTable,
  usersTable,
  userRolesTable,
  allowedEmailDomainsTable,
  decisionsTable,
} from "./index";
import { sql, eq } from "drizzle-orm";
import { PHASES_FOR_SEED } from "@workspace/project-domain";

const KANBAN_COLUMNS: Array<{ key: string; label: string; sortOrder: number }> = [
  { key: "backlog", label: "Backlog", sortOrder: 1 },
  { key: "in_progress", label: "En curso", sortOrder: 2 },
  { key: "in_review", label: "En revisión", sortOrder: 3 },
  { key: "blocked", label: "Bloqueado", sortOrder: 4 },
  { key: "done", label: "Hecho", sortOrder: 5 },
];

const DOCUMENT_FOLDERS: Array<{ key: string; label: string; sortOrder: number }> = [
  { key: "metodologia", label: "Metodología", sortOrder: 1 },
  { key: "datos", label: "Datos", sortOrder: 2 },
  { key: "modelado", label: "Modelado", sortOrder: 3 },
  { key: "operacion", label: "Operación", sortOrder: 4 },
  { key: "actas", label: "Actas", sortOrder: 5 },
  { key: "presentaciones", label: "Presentaciones", sortOrder: 6 },
];

const ROLES: Array<{
  id: string;
  label: string;
  description: string;
  sortOrder: number;
}> = [
  { id: "pm_lead", label: "PM / Líder de Proyecto (C2 Labs)", description: "Liderazgo y PM del piloto por parte de C2 Labs. Camila Cruz dirige y gobierna la relación global; Kevin Centeno coordina la ejecución, seguimiento y operación PM del piloto.", sortOrder: 1 },
  { id: "pm_cel", label: "PM / Líder de Proyecto + Adm. del Contrato (CEL)", description: "Contraparte de proyecto y administración del contrato por parte de CEL. Coordina el Core Pilot Team, la cadencia con C2 Labs y la operatividad con el equipo CEL.", sortOrder: 2 },
  { id: "hydrology_lead_cel", label: "Líder Técnico en Hidrología (CEL)", description: "Liderazgo técnico hidrológico del piloto. Define requerimientos, valida modelos y lidera la relación técnica directa con las cinco centrales (15 de Septiembre, 5 de Noviembre, Cerrón Grande, 3 de Febrero, Guajoyo).", sortOrder: 3 },
  { id: "geospatial_expert_cel", label: "Especialista SIG / Teledetección (CEL)", description: "Departamento de Catastro GIS. MDE, HydroATLAS, cobertura de suelos, delimitación de cuencas y validación SIG.", sortOrder: 4 },
  { id: "data_engineer", label: "Ingeniero de Datos y Backend (CEL)", description: "Ingesta de datos, pipelines y backend del piloto desde CEL. Trabaja con el Líder Técnico de Hidrología en requerimientos y con DevOps en infraestructura y despliegue.", sortOrder: 5 },
  { id: "infra_devops", label: "Adm. de Sistemas / Ingeniero DevOps (CEL)", description: "Unidad de Informática — enlace operativo entre el Core Pilot Team y el Comité de Informática. Coordina infraestructura, redes, despliegue y autorización de acciones técnicas.", sortOrder: 6 },
  { id: "it_committee_lead", label: "Jefa de Unidad de Informática (CEL)", description: "Lidera el Comité de Informática de CEL. Autoridad final: aprueba, autoriza y permanece informada del piloto. Owner de infraestructura. Autorización exclusiva para exposición de servicios al exterior.", sortOrder: 7 },
  { id: "it_committee_networks", label: "Jefe de Adm. de Redes e Informática (CEL)", description: "Comité de Informática — Jefatura de Administración de Redes e Informática. Aprueba, autoriza, delega y maneja recursos. Mecanismo operativo de escalamiento para el enlace DevOps.", sortOrder: 8 },
  { id: "it_committee_sysadmin", label: "Administrador de Sistemas y Redes (CEL)", description: "Comité de Informática — Configura entornos (VLANs, túneles VPN, listas blancas de IPs) y entrega recursos al enlace DevOps. Realiza pre-auditorías de red antes del pase a producción.", sortOrder: 9 },
  { id: "it_committee_dba", label: "Administrador de Base de Datos (CEL)", description: "Comité de Informática — DBA. Gobierna las bases de datos del piloto (acceso, replicación, ground truth) y entrega recursos al enlace DevOps.", sortOrder: 10 },
  { id: "it_committee_security", label: "Especialista de Ciberseguridad (CEL)", description: "Comité de Informática — Lineamientos de seguridad y pre-auditorías de ciberseguridad antes del pase a producción. Entrega recursos al enlace DevOps.", sortOrder: 11 },
  { id: "pm_director_cel", label: "Gerente de Proyecto (CEL)", description: "Gerente de Proyecto por parte de CEL. Por determinar por el Comité de Dirección de CEL.", sortOrder: 12 },
  { id: "hydrology_ops_cel", label: "Hidrólogos Operativos (CEL)", description: "Hidrólogos operativos asignados por CEL al piloto. Por determinar por el Comité de Dirección de CEL.", sortOrder: 13 },
  { id: "direccion_member", label: "Equipo de Dirección del Piloto (CEL)", description: "Integrantes del Equipo de Dirección del piloto por parte de CEL. Rol e involucramiento por definir por etapa, conforme al DSP.", sortOrder: 14 },
];

type SeedMilestone = {
  seedKey: string;
  title: string;
  description: string | null;
  kind: string;
  weekOffset: number;
  phaseId: string | null;
  ownersRoles: string[];
};

function buildSeedMilestones(): SeedMilestone[] {
  const items: SeedMilestone[] = [];

  // Kickoff
  items.push({
    seedKey: "kickoff",
    title: "Kickoff del piloto",
    description: "Reunión inicial con todo el equipo. Alineamiento, RACI y objetivos del piloto.",
    kind: "phase_milestone",
    weekOffset: 1,
    phaseId: "F0",
    ownersRoles: ["pm_lead", "pm_cel"],
  });

  // Phase start/end + deliverables + presentation per phase, derived from the
  // shared PHASES definition so the seed never drifts from the Cronograma UI.
  for (const p of PHASES_FOR_SEED) {
    const endWeek = p.startWeek + p.durationWeeks - 1;

    items.push({
      seedKey: `phase_start_${p.id}`,
      title: `Inicio ${p.label}`,
      description: `Comienzo formal de ${p.label}.`,
      kind: "phase_milestone",
      weekOffset: p.startWeek,
      phaseId: p.id,
      ownersRoles: p.ownersRoles,
    });

    p.deliverables.forEach((d, i) => {
      items.push({
        seedKey: `deliverable_${p.id}_${i + 1}`,
        title: d,
        description: `Entregable principal de ${p.label}.`,
        kind: "deliverable",
        weekOffset: endWeek,
        phaseId: p.id,
        ownersRoles: p.ownersRoles,
      });
    });

    items.push({
      seedKey: `phase_review_${p.id}`,
      title: `Presentación de cierre — ${p.label}`,
      description: "Revisión formal de entregables contra criterios de aceptación.",
      kind: "presentation",
      weekOffset: endWeek,
      phaseId: p.id,
      ownersRoles: ["pm_lead", "pm_cel", "direccion_member"],
    });
  }

  // NOTE: weekly_session rows are NOT seeded here. They are owned by the
  // backend helper `ensureSystemWeeklies()`, which is invoked whenever T0
  // changes (PATCH /project/config) and is exposed via
  // POST /admin/milestones/regenerate-weeklies. While T0 is null, no weekly
  // sessions exist in the database.

  // Capacitación durante Fase 4
  items.push({
    seedKey: "workshop_handoff",
    title: "Taller de capacitación y handoff",
    description: "Transferencia de conocimiento al equipo operativo de CEL.",
    kind: "workshop",
    weekOffset: 27,
    phaseId: "F4",
    ownersRoles: ["pm_lead", "hydrology_lead_cel"],
  });

  return items;
}

async function seedMilestones(): Promise<number> {
  const items = buildSeedMilestones();
  const validKeys = items.map((i) => i.seedKey);

  // Remove system milestones whose seed key is no longer in our generated set.
  // We deliberately preserve `weekly_*` rows — those are owned by
  // ensureSystemWeeklies() on the API side and must survive seed reruns.
  await db.execute(
    sql`DELETE FROM milestones
        WHERE source = 'system'
          AND (seed_key IS NULL OR seed_key NOT IN (${sql.join(
            validKeys.map((k) => sql`${k}`),
            sql`, `,
          )}))
          AND (seed_key IS NULL OR seed_key NOT LIKE 'weekly_%')`,
  );

  for (const m of items) {
    await db
      .insert(milestonesTable)
      .values({
        title: m.title,
        description: m.description,
        kind: m.kind,
        weekOffset: m.weekOffset,
        phaseId: m.phaseId,
        ownersRoles: m.ownersRoles,
        source: "system",
        seedKey: m.seedKey,
      })
      .onConflictDoUpdate({
        target: milestonesTable.seedKey,
        set: {
          title: m.title,
          description: m.description,
          kind: m.kind,
          weekOffset: m.weekOffset,
          phaseId: m.phaseId,
          ownersRoles: m.ownersRoles,
        },
      });
  }

  return items.length;
}

// Idempotent admin bootstrap. Ensures that Camila and Kevin have the expected
// PM/admin roles whenever they already have an account in the portal. Does NOT
// create user rows (those come from Clerk-driven signup), so it is safe to run
// before either of them has logged in.
const ADMIN_ROLE_BOOTSTRAP: Array<{ email: string; roles: string[] }> = [
  {
    email: "camila@c2labs.ai",
    roles: ["pm_lead"],
  },
  { email: "kevin@c2labs.ai", roles: ["pm_lead"] },
  { email: "jmherreram@cel.gob.sv", roles: ["pm_cel"] },
  { email: "vialabi@cel.gob.sv", roles: ["hydrology_lead_cel"] },
  { email: "fgaray@cel.gob.sv", roles: ["geospatial_expert_cel"] },
  { email: "wjuarez@cel.gob.sv", roles: ["data_engineer"] },
  { email: "jmguardado@cel.gob.sv", roles: ["infra_devops"] },
  { email: "alpineda@cel.gob.sv", roles: ["it_committee_lead"] },
  { email: "nfloresc@cel.gob.sv", roles: ["it_committee_networks"] },
  { email: "ravila@cel.gob.sv", roles: ["direccion_member"] },
];

// "Placeholder" titular users — pre-seeded so the canonical titulares appear
// in Equipo / Cronograma / RACI BEFORE they have logged in via Google SSO.
// On their first real Clerk login, `requireAuth.ts` reconciles the placeholder
// row with the real Clerk identity (see reconcilePlaceholderUser there).
// IDs use the `placeholder_` prefix so the reconciliation routine can detect
// them safely without needing a schema column.
const SEED_PLACEHOLDER_USERS: Array<{
  email: string;
  displayName: string;
  orgPosition: string | null;
  roles: string[];
}> = [
  {
    email: "kevin@c2labs.ai",
    displayName: "Kevin Centeno",
    orgPosition: "Project Manager (C2 Labs)",
    roles: ["pm_lead"],
  },
  {
    email: "jmherreram@cel.gob.sv",
    displayName: "Ing. José Mauricio Herrera Mercado",
    orgPosition: "Gerencia de Producción (CEL) — PM CEL + Adm. del Contrato",
    roles: ["pm_cel"],
  },
  {
    email: "vialabi@cel.gob.sv",
    displayName: "Ing. Víctor Alabí",
    orgPosition: "Gerencia de Producción (CEL) — Líder Técnico en Hidrología",
    roles: ["hydrology_lead_cel"],
  },
  {
    email: "fgaray@cel.gob.sv",
    displayName: "Ing. Fernando Garay",
    orgPosition: "Catastro GIS (CEL) — Especialista SIG / Teledetección",
    roles: ["geospatial_expert_cel"],
  },
  {
    email: "wjuarez@cel.gob.sv",
    displayName: "Ing. William Juárez",
    orgPosition: "Gerencia Comercial (CEL) — Ingeniero de Datos y Backend",
    roles: ["data_engineer"],
  },
  {
    email: "jmguardado@cel.gob.sv",
    displayName: "Ing. José Manuel Guardado",
    orgPosition: "Unidad de Informática (CEL) — Adm. de Sistemas / DevOps",
    roles: ["infra_devops"],
  },
  {
    email: "alpineda@cel.gob.sv",
    displayName: "Lic. Lorena Pineda",
    orgPosition: "Unidad de Informática (CEL) — Jefa de Unidad",
    roles: ["it_committee_lead"],
  },
  {
    email: "nfloresc@cel.gob.sv",
    displayName: "Nelson Flores",
    orgPosition: "Unidad de Informática (CEL) — Jefe de Adm. de Redes",
    roles: ["it_committee_networks"],
  },
  {
    email: "ravila@cel.gob.sv",
    displayName: "Ing. Rigoberto Ávila",
    orgPosition: "Equipo de Dirección del Piloto (CEL)",
    roles: ["direccion_member"],
  },
];

function placeholderIdFor(email: string): string {
  return `placeholder_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

async function seedPlaceholderUsers(): Promise<void> {
  for (const u of SEED_PLACEHOLDER_USERS) {
    const emailLower = u.email.toLowerCase();
    // Skip if a real (non-placeholder) user already exists with this email
    // (e.g. the titular already signed in via Clerk).
    const existing = await db.execute(
      sql`SELECT id FROM users WHERE lower(email) = ${emailLower} LIMIT 1`,
    );
    const existingId = (existing.rows[0] as { id?: string } | undefined)?.id;
    if (existingId && !existingId.startsWith("placeholder_")) {
      continue;
    }
    const id = placeholderIdFor(u.email);
    await db
      .insert(usersTable)
      .values({
        id,
        email: emailLower,
        displayName: u.displayName,
        orgPosition: u.orgPosition,
        status: "active",
        statusChangedBy: "seed-placeholder",
      })
      .onConflictDoNothing();
    // Keep org_position fresh if it changed in the seed source.
    await db.execute(
      sql`UPDATE users SET display_name = ${u.displayName},
                            org_position = ${u.orgPosition},
                            status = 'active'
          WHERE id = ${id}`,
    );
    for (const roleId of u.roles) {
      await db
        .insert(userRolesTable)
        .values({ userId: id, roleId })
        .onConflictDoNothing();
      // If the canonical titular slot for this role is still vacant,
      // assign the placeholder so Equipo / RACI render it as titular.
      await db.execute(
        sql`UPDATE roles SET titular_user_id = ${id}
            WHERE id = ${roleId} AND titular_user_id IS NULL`,
      );
    }
  }
}

// Hard allowlist of portal admins (mirrors ADMIN_EMAILS in the api-server
// `requireAdmin` middleware). These two principals must never get stuck in
// the `pending` approval queue — otherwise the only people who CAN approve
// pending users get locked out themselves.
const ADMIN_AUTO_APPROVE_EMAILS = new Set<string>([
  "camila@c2labs.ai",
  "kevin@c2labs.ai",
]);

async function bootstrapAdminRoles(): Promise<void> {
  for (const entry of ADMIN_ROLE_BOOTSTRAP) {
    const rows = await db.execute(
      sql`SELECT id FROM users WHERE lower(email) = ${entry.email} LIMIT 1`,
    );
    const userId = (rows.rows[0] as { id?: string } | undefined)?.id;
    if (!userId) continue;
    for (const roleId of entry.roles) {
      await db
        .insert(userRolesTable)
        .values({ userId, roleId })
        .onConflictDoNothing();
      // Claim titular slot if vacant. Mirrors seedPlaceholderUsers — runs
      // BEFORE placeholders so a real user (e.g. Camila) wins the pm_lead
      // titular over Kevin's placeholder when both have the same role.
      await db.execute(
        sql`UPDATE roles SET titular_user_id = ${userId}
            WHERE id = ${roleId} AND titular_user_id IS NULL`,
      );
    }
  }

  // Auto-approve the hard-coded portal admins so a freshly-seeded environment
  // (or a re-seed after Clerk re-creates the user) never leaves Camila/Kevin
  // sitting in `pending` with no one to approve them.
  for (const email of ADMIN_AUTO_APPROVE_EMAILS) {
    await db.execute(
      sql`UPDATE users SET status = 'active'
          WHERE lower(email) = ${email} AND status <> 'active'`,
    );
  }
  void usersTable;
}

type SeedDecision = {
  title: string;
  // Legacy titles previously seeded (with the "[Bloqueante Fase 0]" prefix).
  // The seed renames any matching row to the canonical `title` so the formal
  // `blocksMilestoneSeedKey` link replaces the prefix-as-marker convention.
  legacyTitles?: string[];
  context: string;
  optionsConsidered: string;
  phase: string | null;
  ownerEmail: string | null;
  ownerRole: string | null;
  status: "open" | "in_analysis" | "resolved" | "cancelled";
  decidedOutcome?: string;
  decidedAt?: Date;
  decidedByEmail?: string | null;
  // Seed key of the milestone this decision formally blocks. Resolved to a
  // milestone UUID at seed time.
  blocksMilestoneSeedKey?: string;
};

const SEED_DECISIONS: SeedDecision[] = [
  {
    title:
      "Host final de Mage / PostgreSQL+PostGIS / MongoDB / API",
    legacyTitles: [
      "[Bloqueante Fase 0] Host final de Mage / PostgreSQL+PostGIS / MongoDB / API",
    ],
    blocksMilestoneSeedKey: "phase_review_F0",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.1.\n\nCEL/TI debe definir en qué host físico/virtual corren Mage, PostgreSQL+PostGIS, MongoDB y la API del piloto. La oferta Martinexsa/Dell entrega ML server (R770), virtualización (R770) y NAS (R570) — falta la decisión de mapeo final, incluyendo IPs/DNS/VLANs, credenciales, storage mounts y política de backup. Bloquea el cierre formal de Fase 0 porque ningún pipeline puede desplegarse hasta que el host esté autorizado por el Comité de Informática.",
    optionsConsidered:
      "Opción A: Servidor de virtualización R770 como host principal (Mage + API + BDs).\nOpción B: Mage e inferencia en el ML server R770; BDs en virtualización.\nOpción C: BDs en el NAS R570 (no recomendado por performance).",
    phase: "F0",
    ownerEmail: null,
    ownerRole: "it_committee_lead",
    status: "open",
  },
  {
    title: "Validación de GPU efectiva entregada",
    legacyTitles: [
      "[Bloqueante Fase 0] Validación de GPU efectiva entregada",
    ],
    blocksMilestoneSeedKey: "phase_review_F0",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.2.\n\nLa oferta aceptada Martinexsa/Dell lista una NVIDIA H100 NVL 94GB para el servidor ML (R770). Hay que confirmar contra la entrega física que efectivamente es esa GPU (modelo y VRAM), porque el dimensionamiento del entrenamiento LSTM/NeuralHydrology y el throughput de inferencia diaria asumen ese hardware. Bloqueante de Fase 0: sin GPU validada no se puede comprometer ventana de entrenamiento ni SLA de inferencia.",
    optionsConsidered:
      "Confirmación documental (orden + remisión + acta de entrega) + verificación en sitio con nvidia-smi por parte de DevOps.",
    phase: "F0",
    ownerEmail: "jmguardado@cel.gob.sv",
    ownerRole: "infra_devops",
    status: "open",
  },
  {
    title:
      "Zona de responsabilidad intermedia (admin continua, backups, hardening, identidad)",
    legacyTitles: [
      "[Bloqueante Fase 0] Zona de responsabilidad intermedia (admin continua, backups, hardening, identidad)",
    ],
    blocksMilestoneSeedKey: "phase_review_F0",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.3.\n\nLa administración continua del entorno, backups corporativos, hardening avanzado, SIEM, AD/LDAP, HA/DR y soporte de plataforma NO están dentro del alcance de la Consultora y tampoco están en la oferta base de Martinexsa/Dell. Default: quedan en CEL salvo adenda expresa. Hay que documentar formalmente la exclusión y confirmar que el Comité de Informática asume estas funciones — o emitir adenda con quien sí las asuma. Bloqueante de Fase 0 porque define quién opera el silo después del piloto.",
    optionsConsidered:
      "Opción A: CEL asume vía Unidad de Informática (default, sin adenda).\nOpción B: Adenda con Martinexsa para administración gestionada.\nOpción C: Adenda con la Consultora para alcance ampliado (fuera del DSP actual).",
    phase: "F0",
    ownerEmail: null,
    ownerRole: "it_committee_lead",
    status: "open",
  },
  {
    title: "SLAs Comité de Informática ↔ DevOps",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.4.\n\nLa dinámica acordada es Consultora → Mauricio Herrera Mercado → (Lorena / Nelson); José Manuel Guardado es el enlace operativo. Falta definir los tiempos de respuesta esperados para que el Comité autorice acciones (exposición externa, cambios de red, accesos, credenciales) y para que DevOps ejecute. Sin estos SLAs el piloto puede quedar bloqueado en cualquier gate de autorización.",
    optionsConsidered:
      "Propuesta inicial: 2 días hábiles para autorizaciones estándar; mismo día para emergencias operativas; semanal para cambios de arquitectura.",
    phase: "F1",
    ownerEmail: "alpineda@cel.gob.sv",
    ownerRole: "it_committee_lead",
    status: "open",
  },
  {
    title: "Equipo de Dirección — alcance e involucramiento por etapa",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.5.\n\nEl Equipo de Dirección — Ing. Guillermo Colorado, Ing. Gerardo Ávalos, Ing. Mauricio Herrera Landaverde (distinto de Mauricio Herrera Mercado) e Ing. Rigoberto Ávila (ravila@cel.gob.sv) — está nombrado pero su rol concreto en el piloto está TBD. Hay que derivar del DSP, etapa por etapa, qué deciden, qué aprueban y en qué hitos se les presenta avance. Sin esto el piloto no tiene un canal claro de escalamiento ejecutivo.",
    optionsConsidered:
      "Opción A: Comité de Dirección como aprobador formal en cierres de fase.\nOpción B: Rol consultivo / informado en sesiones de avance mensuales.\nOpción C: Un único Sponsor Ejecutivo del grupo, los demás como informados.",
    phase: "F0",
    ownerEmail: "jmherreram@cel.gob.sv",
    ownerRole: "pm_cel",
    status: "open",
  },
  {
    title: "Idioma de diagramas técnicos (arquitectura lógica y topología física)",
    context:
      "Fuente: Paquete Maestro §6 — Asuntos abiertos; referencia cruzada: Anexo Técnico §6.6.\n\nLos dos diagramas Mermaid nuevos — arquitectura lógica/funcional por capas y topología física del data center — están en inglés. El resto del Paquete Maestro está en español. Hay que decidir si se traducen para alinear con la documentación entregable al cliente, o si se mantienen en inglés por consistencia con la convención técnica del equipo.",
    optionsConsidered:
      "Opción A: Traducir ambos al español para coherencia con el Paquete.\nOpción B: Mantener en inglés, agregar leyenda bilingüe.\nOpción C: Versión bilingüe (cada nodo con etiqueta ES/EN).",
    phase: "F0",
    ownerEmail: "camila@c2labs.ai",
    ownerRole: "pm_lead",
    status: "open",
  },
  {
    title:
      "Propagación de las 3 reconciliaciones a Sección 10 / RACI del DSP",
    context:
      "Fuente: Paquete Maestro §5 — Las tres reconciliaciones; referencia cruzada: Comunicación de Seguimiento Apr 1 (refresh Sección 10 + RACI + modelo FTE).\n\nLas tres reconciliaciones acordadas por el equipo son:\n1. DevOps confirmado: José Manuel Guardado deja de ser TBD; queda en perfiles y en la columna RACI.\n2. FTE limpio: José Manuel = DevOps FTE 1.0 únicamente; el Comité Consultivo de TI (0.35) lo integran los otros 5 (Lorena, Nelson, Adrián, Carlos, Miladis). Sin doble conteo.\n3. Perfiles desdoblados: separar \"Líder Técnico en Hidrología y Gerente de Proyecto\" en Mauricio Herrera Mercado (PM + Contrato) y Víctor Alabí (Líder Hidrología). En la RACI, Víctor pasa de \"Operaciones\" a \"Líder Técnico Hidrología\" (C/A en validación de modelo y variables, no solo I).\n\nÚnico pendiente: comunicación formal a CEL para que la versión vigente de Sección 10 / RACI refleje estos tres ajustes.",
    optionsConsidered: "",
    phase: null,
    ownerEmail: "kevin@c2labs.ai",
    ownerRole: "pm_lead",
    status: "resolved",
    decidedOutcome:
      "Acuerdo de equipo registrado en Paquete Maestro §5; las tres reconciliaciones quedan aprobadas internamente. Pendiente sólo la comunicación formal a CEL para que la próxima versión de Sección 10 / RACI las refleje.",
    decidedAt: new Date(),
    decidedByEmail: "kevin@c2labs.ai",
  },
];

async function lookupUserId(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  const rows = await db.execute(
    sql`SELECT id FROM users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1`,
  );
  const userId = (rows.rows[0] as { id?: string } | undefined)?.id;
  return userId ?? null;
}

async function lookupMilestoneIdBySeedKey(
  seedKey: string | null | undefined,
): Promise<string | null> {
  if (!seedKey) return null;
  const [row] = await db
    .select({ id: milestonesTable.id })
    .from(milestonesTable)
    .where(eq(milestonesTable.seedKey, seedKey))
    .limit(1);
  return row?.id ?? null;
}

async function seedDecisions(): Promise<number> {
  let inserted = 0;
  for (const d of SEED_DECISIONS) {
    // Rename any pre-existing rows that still carry a legacy title so the
    // canonical title + formal blocksMilestoneId combination replaces the old
    // "[Bloqueante Fase 0]" prefix-as-marker convention.
    if (d.legacyTitles && d.legacyTitles.length > 0) {
      for (const legacy of d.legacyTitles) {
        if (legacy === d.title) continue;
        await db
          .update(decisionsTable)
          .set({ title: d.title })
          .where(eq(decisionsTable.title, legacy));
      }
    }

    const blocksMilestoneId = await lookupMilestoneIdBySeedKey(
      d.blocksMilestoneSeedKey,
    );

    const [existing] = await db
      .select({ id: decisionsTable.id, blocksMilestoneId: decisionsTable.blocksMilestoneId })
      .from(decisionsTable)
      .where(eq(decisionsTable.title, d.title))
      .limit(1);
    if (existing) {
      // Backfill blocksMilestoneId on already-seeded rows that pre-date this
      // column. We never overwrite a manually-set value.
      if (blocksMilestoneId && !existing.blocksMilestoneId) {
        await db
          .update(decisionsTable)
          .set({ blocksMilestoneId })
          .where(eq(decisionsTable.id, existing.id));
      }
      continue;
    }

    const ownerUserId = await lookupUserId(d.ownerEmail);
    const decidedByUserId =
      d.status === "resolved"
        ? await lookupUserId(d.decidedByEmail ?? null)
        : null;

    await db.insert(decisionsTable).values({
      title: d.title,
      context: d.context,
      optionsConsidered: d.optionsConsidered,
      phase: d.phase,
      ownerUserId,
      ownerRole: ownerUserId ? null : d.ownerRole,
      status: d.status,
      decidedOutcome: d.status === "resolved" ? d.decidedOutcome ?? null : null,
      resolution: d.status === "resolved" ? d.decidedOutcome ?? null : null,
      decidedAt: d.status === "resolved" ? d.decidedAt ?? new Date() : null,
      resolvedAt: d.status === "resolved" ? d.decidedAt ?? new Date() : null,
      decidedByUserId,
      resolvedBy: decidedByUserId,
      blocksMilestoneId,
    });
    inserted += 1;
  }
  return inserted;
}

async function main(): Promise<void> {
  const validIds = ROLES.map((r) => r.id);
  await db.execute(
    sql`DELETE FROM roles WHERE id NOT IN (${sql.join(validIds.map((id) => sql`${id}`), sql`, `)})`
  );
  for (const role of ROLES) {
    await db
      .insert(rolesTable)
      .values(role)
      .onConflictDoUpdate({
        target: rolesTable.id,
        set: {
          label: role.label,
          description: role.description,
          sortOrder: role.sortOrder,
        },
      });
  }

  await db
    .insert(projectConfigTable)
    .values({ id: 1, startDate: null })
    .onConflictDoNothing();

  // Ensure a synthetic "system" user exists so system-uploaded rows (e.g. the
  // Paquete Maestro seed in api-server) can satisfy the uploaded_by FK.
  await db
    .insert(usersTable)
    .values({
      id: "system",
      email: "system@portal.local",
      displayName: "Sistema (Paquete Maestro)",
      status: "active",
    })
    .onConflictDoNothing();

  for (const col of KANBAN_COLUMNS) {
    await db
      .insert(kanbanColumnsTable)
      .values(col)
      .onConflictDoUpdate({
        target: kanbanColumnsTable.key,
        set: { label: col.label, sortOrder: col.sortOrder },
      });
  }

  const milestoneCount = await seedMilestones();

  for (const folder of DOCUMENT_FOLDERS) {
    await db
      .insert(documentFoldersTable)
      .values(folder)
      .onConflictDoUpdate({
        target: documentFoldersTable.key,
        set: { label: folder.label, sortOrder: folder.sortOrder },
      });
  }

  await bootstrapAdminRoles();
  await seedPlaceholderUsers();

  await seedDecisions();

  // Ensure historical default allowed sign-up domains are present. Admins can
  // add/remove additional domains from the portal after seeding.
  const DEFAULT_ALLOWED_DOMAINS: Array<{ domain: string; note: string }> = [
    { domain: "cel.gob.sv", note: "Dominio institucional CEL (default)" },
    { domain: "c2labs.ai", note: "Dominio institucional C2Labs (default)" },
  ];
  for (const d of DEFAULT_ALLOWED_DOMAINS) {
    await db
      .insert(allowedEmailDomainsTable)
      .values({ domain: d.domain, addedBy: "system", note: d.note })
      .onConflictDoNothing();
  }

  const count = await db.execute(sql`SELECT COUNT(*)::int AS n FROM roles`);
  // eslint-disable-next-line no-console
  console.log(
    `Seed complete. Roles: ${(count.rows[0] as { n: number }).n}. System milestones: ${milestoneCount}.`,
  );
}

main()
  .then(() => pool.end())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    pool.end();
    process.exit(1);
  });
