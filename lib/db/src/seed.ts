import { db, pool, rolesTable, projectConfigTable } from "./index";
import { sql } from "drizzle-orm";

const ROLES: Array<{
  id: string;
  label: string;
  description: string;
  sortOrder: number;
}> = [
  { id: "product_owner", label: "Product Owner / Líder de Producto", description: "Define visión, prioriza el backlog y acepta entregables.", sortOrder: 1 },
  { id: "project_manager", label: "Gerente de Proyecto", description: "Coordina cronograma, presupuesto, riesgos y stakeholders.", sortOrder: 2 },
  { id: "tech_lead", label: "Líder Técnico / Arquitecto de Soluciones", description: "Define la arquitectura, integraciones y estándares técnicos.", sortOrder: 3 },
  { id: "hydrology_lead", label: "Líder Hidrológico", description: "Aporta conocimiento del dominio hidrológico y valida modelos.", sortOrder: 4 },
  { id: "data_engineer", label: "Ingeniería de Datos", description: "Construye pipelines de ingesta y curaduría de datos hidrometeorológicos.", sortOrder: 5 },
  { id: "ml_engineer", label: "Ingeniería de ML", description: "Entrena, evalúa y despliega modelos de pronóstico.", sortOrder: 6 },
  { id: "mlops", label: "MLOps / Plataforma", description: "Operación, monitoreo y CI/CD de modelos en producción.", sortOrder: 7 },
  { id: "backend_engineer", label: "Ingeniería Backend", description: "APIs, integraciones y orquestación de servicios.", sortOrder: 8 },
  { id: "frontend_engineer", label: "Ingeniería Frontend / UX", description: "Portales internos, dashboards de operación y visualización.", sortOrder: 9 },
  { id: "qa_validation", label: "QA / Validación Operativa", description: "Pruebas, validación cruzada con hidrólogos y aceptación.", sortOrder: 10 },
  { id: "devops_sre", label: "DevOps / SRE", description: "Infraestructura, observabilidad, seguridad y confiabilidad.", sortOrder: 11 },
  { id: "change_management", label: "Gestión del Cambio / Capacitación", description: "Adopción, documentación y capacitación de usuarios.", sortOrder: 12 },
];

async function main(): Promise<void> {
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
