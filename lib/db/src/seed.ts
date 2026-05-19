import { db, pool, rolesTable, projectConfigTable, kanbanColumnsTable } from "./index";
import { sql } from "drizzle-orm";

const KANBAN_COLUMNS: Array<{ key: string; label: string; sortOrder: number }> = [
  { key: "backlog", label: "Backlog", sortOrder: 1 },
  { key: "in_progress", label: "En curso", sortOrder: 2 },
  { key: "in_review", label: "En revisión", sortOrder: 3 },
  { key: "blocked", label: "Bloqueado", sortOrder: 4 },
  { key: "done", label: "Hecho", sortOrder: 5 },
];

const ROLES: Array<{
  id: string;
  label: string;
  description: string;
  sortOrder: number;
}> = [
  { id: "pm_lead", label: "PM / Líder de Proyecto (Camila Cruz)", description: "Liderazgo general del piloto, planificación y coordinación con CEL.", sortOrder: 1 },
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

  const count = await db.execute(sql`SELECT COUNT(*)::int AS n FROM roles`);
  // eslint-disable-next-line no-console
  console.log(`Seed complete. Roles: ${(count.rows[0] as { n: number }).n}`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    pool.end();
    process.exit(1);
  });
