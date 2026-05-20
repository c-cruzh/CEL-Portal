export interface PhaseDefinition {
  id: string;
  label: string;
  shortName: string;
  durationWeeks: number;
  startWeek: number;
  colorVar: string;
  objective: string;
  narrative: string;
  activities: string[];
  deliverables: string[];
  ownersRoles: string[];
}

export const PHASES: PhaseDefinition[] = [
  {
    id: "F0",
    label: "Fase 0 — Preparación y Habilitación",
    shortName: "Preparación",
    durationWeeks: 4,
    startWeek: 1,
    colorVar: "var(--chart-1)",
    ownersRoles: ["pm_lead", "pm_cel"],
    objective:
      "Dejar al equipo, los datos y los entornos listos para producir resultados desde la Fase 1.",
    narrative:
      "La Fase 0 establece las condiciones mínimas para que el piloto pueda avanzar sin bloqueos. Se realiza el kickoff con todos los roles, se levanta el inventario completo de fuentes hidrometeorológicas (estaciones CEL, datos satelitales, MARN, históricos de caudales), se habilitan los entornos de datos, cómputo y repositorios, y se acuerdan las métricas de éxito y la línea base contra la que se comparará el modelo durante todo el piloto.",
    activities: [
      "Alineamiento del equipo y kickoff",
      "Inventario de fuentes de datos hidrometeorológicos",
      "Habilitación de entornos (datos, cómputo, repositorios)",
      "Definición de métricas de éxito y línea base",
    ],
    deliverables: [
      "Acta de kickoff y matriz RACI del equipo",
      "Inventario priorizado de fuentes de datos",
      "Entornos de desarrollo y datos operativos",
      "Documento de métricas y línea base aprobado",
    ],
  },
  {
    id: "F1",
    label: "Fase 1 — Datos y Diagnóstico",
    shortName: "Datos",
    durationWeeks: 5,
    startWeek: 5,
    colorVar: "var(--chart-2)",
    ownersRoles: ["data_engineer", "hydrology_lead_cel"],
    objective:
      "Disponer de un dataset hidrológico limpio, caracterizado y listo para modelar.",
    narrative:
      "En la Fase 1 se ingestan las series históricas, se limpian (huecos, outliers, cambios de instrumento) y se realiza un análisis exploratorio por cuenca. Hidrología y datos definen conjuntamente las variables explicativas (precipitación, temperatura, humedad de suelo, índices estacionales) y se selecciona el enfoque de modelado adecuado al horizonte de pronóstico operativo de CEL.",
    activities: [
      "Ingesta y limpieza de series históricas",
      "Análisis exploratorio y caracterización de cuencas",
      "Definición de features hidrológicas",
      "Selección del enfoque de modelado",
    ],
    deliverables: [
      "Dataset histórico curado y versionado",
      "Reporte exploratorio por cuenca",
      "Catálogo de features hidrológicas",
      "Decisión técnica de enfoque de modelado",
    ],
  },
  {
    id: "F2",
    label: "Fase 2 — Modelado y Pronóstico",
    shortName: "Modelado",
    durationWeeks: 9,
    startWeek: 10,
    colorVar: "var(--chart-3)",
    ownersRoles: ["ml_engineer", "hydrology_lead_cel"],
    objective:
      "Producir un modelo de pronóstico de caudales con desempeño aceptable y validado por hidrología.",
    narrative:
      "Es la fase más larga y técnica del piloto. Se entrenan modelos candidatos de pronóstico, se realiza validación cruzada con datos históricos, se itera sobre hiperparámetros y arquitectura, y se calibra el modelo en sesiones de trabajo con los hidrólogos. El modelo se compara explícitamente contra el baseline operativo actual para evidenciar mejora real, no solo métrica estadística.",
    activities: [
      "Entrenamiento de modelos de pronóstico de caudales",
      "Validación cruzada con datos históricos",
      "Calibración con hidrólogos",
      "Comparación con baseline operativo",
      "Iteración de hiperparámetros y arquitectura",
    ],
    deliverables: [
      "Modelo candidato versionado y reproducible",
      "Reporte de validación cruzada",
      "Comparativa cuantitativa vs. baseline operativo",
      "Bitácora de calibración con hidrología",
    ],
  },
  {
    id: "F3",
    label: "Fase 3 — Integración y Operación",
    shortName: "Integración",
    durationWeeks: 5,
    startWeek: 19,
    colorVar: "var(--chart-4)",
    ownersRoles: ["fullstack_dev", "infra_devops", "data_engineer"],
    objective:
      "Llevar el modelo al ambiente piloto con datos en tiempo real y un portal operativo funcional.",
    narrative:
      "La Fase 3 traslada el modelo del laboratorio a un ambiente operativo de piloto. Se construye el portal interno (este mismo portal extendido con los dashboards operativos), se conectan las fuentes de datos en tiempo real, y se ejecutan pruebas integradas extremo a extremo, incluyendo escenarios de degradación de datos y de respuesta a eventos hidrológicos.",
    activities: [
      "Despliegue del modelo en ambiente piloto",
      "Construcción del portal interno de operación",
      "Conexión a fuentes en tiempo real",
      "Pruebas integradas extremo a extremo",
    ],
    deliverables: [
      "Modelo desplegado en ambiente piloto",
      "Portal operativo navegable por hidrología",
      "Integraciones en tiempo real activas",
      "Reporte de pruebas integradas E2E",
    ],
  },
  {
    id: "F4",
    label: "Fase 4 — Validación Operativa y Cierre",
    shortName: "Cierre",
    durationWeeks: 5,
    startWeek: 24,
    colorVar: "var(--chart-5)",
    ownersRoles: ["pm_lead", "qa_validation", "docs_training"],
    objective:
      "Validar el piloto en operación supervisada y dejar todo listo para una decisión de escalamiento.",
    narrative:
      "Durante la Fase 4 el modelo opera supervisado por hidrología en condiciones reales y se compara día a día contra el pronóstico tradicional. Se documenta todo (modelo, pipelines, runbooks, decisiones), se capacita al personal operativo y se entregan recomendaciones formales sobre escalar, ajustar o repetir el piloto.",
    activities: [
      "Operación supervisada del piloto",
      "Comparación contra pronóstico tradicional",
      "Documentación, capacitación y handoff",
      "Recomendaciones para escalamiento",
    ],
    deliverables: [
      "Reporte de operación supervisada",
      "Documentación técnica y operativa completa",
      "Capacitación impartida al equipo CEL",
      "Recomendaciones formales de escalamiento",
    ],
  },
  {
    id: "CONT",
    label: "Contingencia",
    shortName: "Contingencia",
    durationWeeks: 2,
    startWeek: 29,
    colorVar: "var(--muted-foreground)",
    ownersRoles: ["pm_lead", "pm_cel"],
    objective:
      "Absorber retrasos, retrabajos o validaciones adicionales sin comprometer el cierre del piloto.",
    narrative:
      "Las dos últimas semanas se reservan como buffer explícito. Si todo va según plan, se usan para reforzar documentación y transferencia; si surgen riesgos, son el colchón que evita extender el piloto.",
    activities: ["Buffer para riesgos, retrabajos o validaciones adicionales"],
    deliverables: ["Plan de uso de contingencia documentado"],
  },
];

export const PHASES_FOR_SEED = PHASES.filter((p) => p.id !== "CONT");
