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
} from "./index";
import { sql } from "drizzle-orm";
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
  { id: "pm_lead", label: "PM / Líder de Proyecto (C2Labs)", description: "Liderazgo general del piloto, planificación y coordinación con CEL. Puede ser asumido por más de una persona.", sortOrder: 1 },
  { id: "pm_cel", label: "PM / Contraparte CEL", description: "Contraparte de gestión por parte de CEL: agenda, accesos y stakeholders internos.", sortOrder: 2 },
  { id: "hydrology_lead_cel", label: "Líder Hidrología (CEL)", description: "Validación de patrones, ground-truth y evaluación de pronósticos.", sortOrder: 3 },
  { id: "geospatial_expert_cel", label: "Experto Geoespacial (CEL)", description: "MDE, HydroATLAS, cobertura de suelos y delimitación de cuencas.", sortOrder: 4 },
  { id: "meteo_expert", label: "Experto Meteorológico", description: "ERA5, GPM, CHIRPS, precipitación y evapotranspiración.", sortOrder: 5 },
  { id: "ml_engineer", label: "ML Engineer", description: "LSTM, NeuralHydrology, hiperparámetros y validación rodante.", sortOrder: 6 },
  { id: "data_engineer", label: "Data Engineer (ETL / Mage)", description: "Canalizaciones de datos, ingesta automática y orquestación.", sortOrder: 7 },
  { id: "infra_devops", label: "Infraestructura / DevOps", description: "Entorno, redes, VPN, bases de datos y stack de software.", sortOrder: 8 },
  { id: "fullstack_dev", label: "Frontend / Backend Dev", description: "Web app, dashboards operativos y alertas.", sortOrder: 9 },
  { id: "qa_validation", label: "QA / Validación", description: "Pruebas fuera de muestra y validación del piloto.", sortOrder: 10 },
  { id: "docs_training", label: "Documentación / Capacitación", description: "POE, informes y talleres de transferencia.", sortOrder: 11 },
  { id: "stakeholder_cel", label: "Stakeholder CEL", description: "Revisión, retroalimentación y sesiones de avance.", sortOrder: 12 },
  { id: "it_committee_lead", label: "Jefa de Unidad de Informática (CEL)", description: "Lidera el Comité de Informática de CEL. Autoridad final: aprueba, autoriza y permanece informada del piloto. Autorización exclusiva para exposición de servicios al exterior.", sortOrder: 13 },
  { id: "it_committee_networks", label: "Jefe de Redes e Informática (CEL)", description: "Comité de Informática — Jefatura de Administración de Redes e Informática. Aprueba, delega y maneja recursos. Mecanismo operativo de escalamiento para el enlace DevOps.", sortOrder: 14 },
  { id: "it_committee_sysadmin", label: "Administrador de Sistemas y Redes (CEL)", description: "Comité de Informática — Configura entornos (VLANs, túneles VPN, listas blancas de IPs) y entrega recursos al enlace DevOps. Realiza pre-auditorías de red antes del pase a producción.", sortOrder: 15 },
  { id: "it_committee_dba", label: "Administrador de Base de Datos (CEL)", description: "Comité de Informática — DBA. Gobierna las bases de datos del piloto (acceso, replicación, ground truth) y entrega recursos al enlace DevOps.", sortOrder: 16 },
  { id: "it_committee_security", label: "Especialista de Ciberseguridad (CEL)", description: "Comité de Informática — Lineamientos de seguridad y pre-auditorías de ciberseguridad antes del pase a producción. Entrega recursos al enlace DevOps.", sortOrder: 17 },
  { id: "pm_director_cel", label: "Gerente de Proyecto (CEL)", description: "Gerente de Proyecto por parte de CEL. Por determinar por el Comité de Dirección de CEL.", sortOrder: 18 },
  { id: "hydrology_ops_cel", label: "Hidrólogos Operativos (CEL)", description: "Hidrólogos operativos asignados por CEL al piloto. Por determinar por el Comité de Dirección de CEL.", sortOrder: 19 },
  { id: "direccion_member", label: "Equipo de Dirección del Piloto (CEL)", description: "Integrantes del Equipo de Dirección del piloto por parte de CEL. Rol e involucramiento por definir por etapa, conforme al DSP.", sortOrder: 20 },
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
      ownersRoles: ["pm_lead", "pm_cel", "stakeholder_cel"],
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
    ownersRoles: ["docs_training", "hydrology_lead_cel"],
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
    roles: ["pm_lead", "ml_engineer", "data_engineer"],
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
    }
  }
  void usersTable;
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
