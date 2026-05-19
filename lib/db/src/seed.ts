import {
  db,
  pool,
  rolesTable,
  projectConfigTable,
  kanbanColumnsTable,
  milestonesTable,
  documentFoldersTable,
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

  // 28 weekly sync sessions
  for (let week = 1; week <= 28; week++) {
    items.push({
      seedKey: `weekly_${week}`,
      title: `Sesión semanal de avance — Semana ${week}`,
      description: "Sync semanal del equipo: avances, bloqueadores y próximos pasos.",
      kind: "weekly_session",
      weekOffset: week,
      phaseId: null,
      ownersRoles: ["pm_lead", "pm_cel"],
    });
  }

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
  await db.execute(
    sql`DELETE FROM milestones WHERE source = 'system' AND (seed_key IS NULL OR seed_key NOT IN (${sql.join(
      validKeys.map((k) => sql`${k}`),
      sql`, `,
    )}))`,
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
