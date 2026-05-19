import { ROLES } from "./projectContent";
import { RACI_TASKS, PHASE_TASKS } from "./desarrolloContent";

export type RoleId = (typeof ROLES)[number]["id"];

/**
 * Logs (in dev only) any `raciSourceTasks` that no longer match a row in
 * `desarrolloContent.RACI_TASKS` or `PHASE_TASKS`. Non-throwing so that a
 * harmless label edit upstream never hard-fails the portal in front of CEL.
 */
function warnOnRaciSourceDrift(sources: string[]): void {
  const raciNames = new Set(RACI_TASKS.map((r) => r.task));
  const phaseTaskNames = new Set(
    PHASE_TASKS.flatMap((g) => g.tasks.map((t) => t.task)),
  );
  const missing = sources.filter(
    (s) => !raciNames.has(s) && !phaseTaskNames.has(s),
  );
  if (missing.length > 0) {
    console.warn(
      "[phaseInvolvement] raciSourceTasks no longer found in RACI_TASKS/PHASE_TASKS:",
      missing,
    );
  }
}

export interface PhaseActivity {
  id: string;
  name: string;
  description?: string;
  responsible?: RoleId[];
  consulted?: RoleId[];
  informed?: RoleId[];
  /**
   * Optional back-reference to the upstream RACI / phase-tasks rows in
   * `desarrolloContent.ts` that this activity's R/C/I derives from.
   */
  raciSourceTasks?: string[];
  needsHumanReview?: boolean;
}

export interface PhaseDeliverable {
  id: string;
  name: string;
  description?: string;
  activities: PhaseActivity[];
  needsHumanReview?: boolean;
}

export interface PhaseStage {
  id: string;
  name: string;
  description?: string;
  deliverables: PhaseDeliverable[];
  needsHumanReview?: boolean;
}

export interface PhaseInvolvement {
  phaseId: string;
  stages: PhaseStage[];
  needsHumanReview?: boolean;
}

/**
 * Derives the raw R/C/I cell values from `desarrolloContent.RACI_TASKS` for
 * the named upstream task, in the order of `RACI_COLUMNS`. Returns undefined
 * if the task is no longer present. This is a documentation/UX hook callers
 * can use to surface "fuente: RACI_TASKS[…]" details next to an activity;
 * the canonical activity-level R/C/I is still authored manually in
 * `PHASE_INVOLVEMENT` because the matrix is coarser than the drilldown.
 */
export function getRaciSourceRow(task: string):
  | { task: string; values: string[]; note?: string }
  | undefined {
  return RACI_TASKS.find((r) => r.task === task);
}

export const PHASE_INVOLVEMENT: PhaseInvolvement[] = [
  {
    phaseId: "F0",
    stages: [
      {
        id: "f0-infra",
        name: "Habilitación de infraestructura y entornos",
        description:
          "Comisionamiento del AI Silo (cómputo, datos, backup), aseguramiento de red y despliegue del stack de orquestación que soportará las fases siguientes.",
        deliverables: [
          {
            id: "f0-d1",
            name: "Entorno AI Silo operacional",
            description:
              "Hardware, red, stack de software y validaciones de rendimiento listos para iniciar la ingesta de datos.",
            activities: [
              {
                id: "f0-a1",
                name: "Comisionamiento de hardware (AI Silo)",
                description:
                  "Racking, conexión eléctrica y de red de los 3 nodos (ML/Compute, Data/ETL, NAS) según especificaciones.",
                responsible: ["infra_devops"],
                consulted: ["ml_engineer", "data_engineer"],
                informed: ["pm_lead", "pm_cel"],
                raciSourceTasks: [
                  "Montaje físico de servidores e infraestructura (AI Silo) y configuración de red",
                  "Implementación infraestructura (Fase 0)",
                ],
              },
              {
                id: "f0-a2",
                name: "Red y seguridad (VLAN / FW / VPN)",
                description:
                  "Diseño e implementación de la VLAN dedicada, reglas de firewall y túnel VPN para el equipo consultor.",
                responsible: ["infra_devops"],
                consulted: ["pm_cel"],
                informed: ["pm_lead"],
                raciSourceTasks: [
                  "Definición de lineamientos, políticas de red y seguridad",
                  "Definición de lineamientos y permisos TI",
                ],
              },
              {
                id: "f0-a3",
                name: "Stack base (Mage, PostgreSQL/PostGIS, Mongo, Python)",
                description:
                  "Instalación y configuración de orquestador Mage, bases de datos y entornos Python para los pipelines.",
                responsible: ["infra_devops", "data_engineer"],
                consulted: ["ml_engineer"],
                informed: ["pm_lead"],
                raciSourceTasks: [
                  "Instalación de Mage, GitLab y entorno base de orquestación",
                  "Configuración Mage + GitLab",
                ],
              },
              {
                id: "f0-a4",
                name: "Validación y benchmark (GPU / I/O / Red)",
                description:
                  "Pruebas de rendimiento de GPU, almacenamiento y enlaces de red contra los criterios de aceptación.",
                responsible: ["infra_devops", "ml_engineer"],
                consulted: ["qa_validation"],
                informed: ["pm_lead", "pm_cel"],
                raciSourceTasks: [
                  "Diseño del entorno técnico y arquitectura general",
                  "Diseño arquitectura AI",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phaseId: "F1",
    stages: [
      {
        id: "f1-datos",
        name: "Adquisición y pre-procesamiento de datos",
        description:
          "Ingesta automática y depuración de fuentes hidrológicas, meteorológicas y geoespaciales, con controles de calidad documentados.",
        deliverables: [
          {
            id: "f1-d1",
            name: "Conjunto de datos listo para análisis",
            description:
              "Datos hidrometeorológicos y geoespaciales estandarizados, con QC y documentación, listos para alimentar al modelo.",
            activities: [
              {
                id: "f1-a1",
                name: "Integración de datos hidrológicos (aforos y dependencias)",
                description:
                  "Conexión a estaciones CEL y fuentes abiertas (GRDC), depuración de series y relleno de huecos históricos.",
                responsible: ["data_engineer", "hydrology_lead_cel"],
                consulted: ["pm_cel"],
                informed: ["pm_lead"],
                raciSourceTasks: [
                  "Aprobación y provisión de accesos a fuentes de datos (DBs, GIS)",
                  "Gobernanza y provisión de accesos a DBs",
                ],
              },
              {
                id: "f1-a2",
                name: "Canal meteorológico (ERA5 / GPM / CHIRPS)",
                description:
                  "Descarga y normalización de productos meteorológicos; cálculo de precipitación areal y evapotranspiración por subcuenca.",
                responsible: ["data_engineer", "meteo_expert"],
                consulted: ["hydrology_lead_cel"],
                raciSourceTasks: [
                  "Desarrollo de flujos ETL en Python usando Mage",
                  "Desarrollo pipelines ETL",
                ],
              },
              {
                id: "f1-a3",
                name: "Procesamiento geoespacial (HydroATLAS / MDE / Suelos)",
                description:
                  "Compilación de HydroATLAS, MDE SRTM y cobertura de suelos; delimitación de cuenca y subcuencas del Lempa.",
                responsible: ["data_engineer", "geospatial_expert_cel"],
                consulted: ["hydrology_lead_cel"],
                raciSourceTasks: [
                  "Migración de lógica de negocio a nuevos pipelines",
                  "Cartografía y mapas SIG",
                ],
              },
              {
                id: "f1-a4",
                name: "QC y documentación (dataset listo)",
                description:
                  "Aserciones automáticas, registro de excepciones y documentación del dataset entregado para modelado.",
                responsible: ["data_engineer", "qa_validation"],
                consulted: ["hydrology_lead_cel", "docs_training"],
                informed: ["pm_lead", "pm_cel"],
                raciSourceTasks: [
                  "Pruebas de integración de pipelines con fuentes internas",
                  "Validación pipelines",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phaseId: "F2",
    stages: [
      {
        id: "f2-modelo",
        name: "Configuración y entrenamiento del modelo",
        description:
          "Implementación, ajuste y validación del LSTM hidrológico con horizonte de pronóstico de hasta 7 días.",
        deliverables: [
          {
            id: "f2-d1",
            name: "Modelo LSTM validado a 7 días",
            description:
              "Modelo entrenado y reproducible, con bitácora de hiperparámetros, validación rolling-origin y comparativa contra el baseline operativo.",
            activities: [
              {
                id: "f2-a1",
                name: "Implementación LSTM (NeuralHydrology)",
                description:
                  "Configuración de la arquitectura LSTM sobre PyTorch/NeuralHydrology y preparación del entorno de entrenamiento en GPU.",
                responsible: ["ml_engineer"],
                consulted: ["hydrology_lead_cel"],
                raciSourceTasks: [
                  "Desarrollo e implementación del modelo LSTM",
                  "Diseño y entrenamiento IA",
                ],
              },
              {
                id: "f2-a2",
                name: "Optimización bayesiana (secuencia / hidden / LR)",
                description:
                  "Búsqueda bayesiana de hiperparámetros (Optuna) sobre longitud de secuencia, unidades ocultas y tasa de aprendizaje.",
                responsible: ["ml_engineer"],
                consulted: ["hydrology_lead_cel"],
                raciSourceTasks: ["Selección y justificación de variables de entrada"],
              },
              {
                id: "f2-a3",
                name: "Validación con origen rodante (rolling-origin)",
                description:
                  "Evaluación cronológica con varios folds y reserva de un conjunto out-of-sample para prueba ciega final.",
                responsible: ["ml_engineer", "qa_validation"],
                consulted: ["hydrology_lead_cel"],
                raciSourceTasks: ["Entrenamiento y validación cruzada del modelo"],
              },
              {
                id: "f2-a4",
                name: "Informe de desempeño",
                description:
                  "Reporte con métricas hidrológicas (NSE, RMSE, POD/FAR) y comparativa cuantitativa frente al baseline operativo.",
                responsible: ["ml_engineer", "docs_training"],
                consulted: ["hydrology_lead_cel"],
                informed: ["pm_lead", "pm_cel", "stakeholder_cel"],
                raciSourceTasks: ["Documentación del modelo y resultados de validación"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phaseId: "F3",
    stages: [
      {
        id: "f3-operacion",
        name: "Operacionalización y automatización",
        description:
          "Construcción del pipeline diario en tiempo real, los tableros operativos y los canales de alertas.",
        deliverables: [
          {
            id: "f3-d1",
            name: "Sistema automatizado de pronóstico end-to-end",
            description:
              "Canalización diaria, tableros web y alertas SMS/correo integrados con los sistemas de CEL.",
            activities: [
              {
                id: "f3-a1",
                name: "Canalización diaria de pronóstico",
                description:
                  "Orquestación en Mage de la descarga ECMWF/GPM, preprocesamiento, inferencia LSTM y carga en bases operativas.",
                responsible: ["data_engineer", "infra_devops"],
                consulted: ["ml_engineer"],
                informed: ["pm_lead"],
                raciSourceTasks: ["Desarrollo de flujos ETL en Python usando Mage"],
              },
              {
                id: "f3-a2",
                name: "Tableros web CEL",
                description:
                  "Dashboard React con mapa interactivo, hidrogramas pronosticados y tablas de estado por sitio.",
                responsible: ["fullstack_dev"],
                consulted: ["hydrology_lead_cel", "geospatial_expert_cel"],
                informed: ["pm_cel"],
                raciSourceTasks: [
                  "Implementación del dashboard web",
                  "Visualización (dashboard)",
                  "Generación de mapas estáticos y capas cartográficas",
                ],
              },
              {
                id: "f3-a3",
                name: "Alertas SMS y correo",
                description:
                  "Definición de umbrales por sitio y envío automático de notificaciones a las listas de destinatarios pertinentes.",
                responsible: ["fullstack_dev", "infra_devops"],
                consulted: ["pm_cel", "hydrology_lead_cel"],
                informed: ["pm_lead", "stakeholder_cel"],
              },
              {
                id: "f3-a4",
                name: "Integración con sistemas y APIs de CEL",
                description:
                  "Conexión segura a las bases productivas (solo lectura) y exposición de endpoints en intranet, coordinada con la Unidad de Informática de CEL (Jefatura, Redes, DevOps).",
                responsible: ["fullstack_dev", "infra_devops"],
                consulted: ["pm_cel", "geospatial_expert_cel"],
                informed: ["pm_lead", "stakeholder_cel"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phaseId: "F4",
    stages: [
      {
        id: "f4-validacion",
        name: "Validación del piloto",
        description:
          "Pruebas fuera de muestra y validación operativa supervisada contra el pronóstico tradicional.",
        deliverables: [
          {
            id: "f4-d1",
            name: "Informe de validación del piloto",
            description:
              "Resultados de pruebas OOS y de la operación supervisada con recomendaciones para escalamiento.",
            activities: [
              {
                id: "f4-a1",
                name: "Pruebas fuera de muestra (OOS)",
                description:
                  "Evaluación ciega del modelo sobre el conjunto reservado y un evento extremo histórico.",
                responsible: ["qa_validation", "ml_engineer"],
                consulted: ["hydrology_lead_cel"],
                informed: ["pm_lead", "stakeholder_cel"],
                raciSourceTasks: [
                  "Validación funcional y operativa del sistema",
                  "Validación operacional",
                ],
              },
            ],
          },
          {
            id: "f4-d2",
            name: "Transferencia de conocimiento",
            description:
              "Capacitación al equipo CEL y documentación técnica/operativa completa para sostenibilidad del piloto.",
            activities: [
              {
                id: "f4-a2",
                name: "Capacitación al equipo CEL",
                description:
                  "Talleres internos sobre el modelo, los pipelines y la operación diaria del portal.",
                responsible: ["docs_training"],
                consulted: ["ml_engineer", "hydrology_lead_cel"],
                informed: ["pm_cel", "stakeholder_cel"],
              },
              {
                id: "f4-a3",
                name: "Documentación final (POE y reportes)",
                description:
                  "Procedimiento Operativo Estándar, manuales de mantenimiento y reporte ejecutivo final.",
                responsible: ["docs_training"],
                consulted: ["pm_lead", "ml_engineer", "hydrology_lead_cel"],
                informed: ["stakeholder_cel"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phaseId: "CONT",
    stages: [
      {
        id: "cont-plan",
        name: "Contingencia (mini-plan)",
        description:
          "Buffer explícito para absorber retrasos, retrabajos o validaciones adicionales sin extender el piloto, con tres líneas de acción acordadas entre C2 Labs y CEL.",
        deliverables: [
          {
            id: "cont-d1",
            name: "Bitácora de uso de contingencia",
            description:
              "Registro corto y trazable de cómo se aplicó el buffer (re-planificación, retrabajos técnicos, validaciones adicionales) firmado por ambos PMs.",
            activities: [
              {
                id: "cont-a1",
                name: "Re-planificación semanal según riesgos materializados",
                description:
                  "Revisión conjunta de los riesgos que se materializaron en la semana, re-priorización del backlog y comunicación del nuevo plan al equipo y a la dirección de CEL.",
                responsible: ["pm_lead", "pm_cel"],
                consulted: ["hydrology_lead_cel"],
                informed: ["stakeholder_cel"],
              },
              {
                id: "cont-a2",
                name: "Retrabajos técnicos puntuales (datos / modelo / pipeline)",
                description:
                  "Corrección de hallazgos específicos surgidos en QA u operación supervisada: ajustes de pipeline ETL, reentrenamiento parcial del modelo o parches en el portal.",
                responsible: ["data_engineer", "ml_engineer", "fullstack_dev"],
                consulted: ["qa_validation", "hydrology_lead_cel"],
                informed: ["pm_lead", "pm_cel"],
              },
              {
                id: "cont-a3",
                name: "Validación adicional con CEL ante hallazgos OOS",
                description:
                  "Sesiones extra de validación con el equipo de hidrología de CEL si las pruebas fuera de muestra revelan desviaciones que requieran segunda opinión o ajuste de criterios.",
                responsible: ["qa_validation", "hydrology_lead_cel"],
                consulted: ["ml_engineer"],
                informed: ["pm_lead", "pm_cel", "stakeholder_cel"],
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getPhaseInvolvement(phaseId: string): PhaseInvolvement | undefined {
  return PHASE_INVOLVEMENT.find((p) => p.phaseId === phaseId);
}

if (import.meta.env?.DEV) {
  warnOnRaciSourceDrift(
    PHASE_INVOLVEMENT.flatMap((p) =>
      p.stages.flatMap((s) =>
        s.deliverables.flatMap((d) =>
          d.activities.flatMap((a) => a.raciSourceTasks ?? []),
        ),
      ),
    ),
  );
}
