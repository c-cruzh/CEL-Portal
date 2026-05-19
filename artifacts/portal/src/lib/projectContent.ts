export const ROLES = [
  { id: "product_owner", label: "Product Owner / Líder de Producto", description: "Define visión, prioriza el backlog y acepta entregables." },
  { id: "project_manager", label: "Gerente de Proyecto", description: "Coordina cronograma, presupuesto, riesgos y stakeholders." },
  { id: "tech_lead", label: "Líder Técnico / Arquitecto de Soluciones", description: "Define la arquitectura, integraciones y estándares técnicos." },
  { id: "hydrology_lead", label: "Líder Hidrológico", description: "Aporta conocimiento del dominio hidrológico y valida modelos." },
  { id: "data_engineer", label: "Ingeniería de Datos", description: "Construye pipelines de ingesta y curaduría de datos hidrometeorológicos." },
  { id: "ml_engineer", label: "Ingeniería de ML", description: "Entrena, evalúa y despliega modelos de pronóstico." },
  { id: "mlops", label: "MLOps / Plataforma", description: "Operación, monitoreo y CI/CD de modelos en producción." },
  { id: "backend_engineer", label: "Ingeniería Backend", description: "APIs, integraciones y orquestación de servicios." },
  { id: "frontend_engineer", label: "Ingeniería Frontend / UX", description: "Portales internos, dashboards de operación y visualización." },
  { id: "qa_validation", label: "QA / Validación Operativa", description: "Pruebas, validación cruzada con hidrólogos y aceptación." },
  { id: "devops_sre", label: "DevOps / SRE", description: "Infraestructura, observabilidad, seguridad y confiabilidad." },
  { id: "change_management", label: "Gestión del Cambio / Capacitación", description: "Adopción, documentación y capacitación de usuarios." }
];

export interface Phase {
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
}

export const PHASES: Phase[] = [
  {
    id: "F0",
    label: "Fase 0 — Preparación y Habilitación",
    shortName: "Preparación",
    durationWeeks: 4,
    startWeek: 1,
    colorVar: "var(--chart-1)",
    objective: "Dejar al equipo, los datos y los entornos listos para producir resultados desde la Fase 1.",
    narrative: "La Fase 0 establece las condiciones mínimas para que el piloto pueda avanzar sin bloqueos. Se realiza el kickoff con todos los roles, se levanta el inventario completo de fuentes hidrometeorológicas (estaciones CEL, datos satelitales, MARN, históricos de caudales), se habilitan los entornos de datos, cómputo y repositorios, y se acuerdan las métricas de éxito y la línea base contra la que se comparará el modelo durante todo el piloto.",
    activities: [
      "Alineamiento del equipo y kickoff",
      "Inventario de fuentes de datos hidrometeorológicos",
      "Habilitación de entornos (datos, cómputo, repositorios)",
      "Definición de métricas de éxito y línea base"
    ],
    deliverables: [
      "Acta de kickoff y matriz RACI del equipo",
      "Inventario priorizado de fuentes de datos",
      "Entornos de desarrollo y datos operativos",
      "Documento de métricas y línea base aprobado"
    ]
  },
  {
    id: "F1",
    label: "Fase 1 — Datos y Diagnóstico",
    shortName: "Datos",
    durationWeeks: 5,
    startWeek: 5,
    colorVar: "var(--chart-2)",
    objective: "Disponer de un dataset hidrológico limpio, caracterizado y listo para modelar.",
    narrative: "En la Fase 1 se ingestan las series históricas, se limpian (huecos, outliers, cambios de instrumento) y se realiza un análisis exploratorio por cuenca. Hidrología y datos definen conjuntamente las variables explicativas (precipitación, temperatura, humedad de suelo, índices estacionales) y se selecciona el enfoque de modelado adecuado al horizonte de pronóstico operativo de CEL.",
    activities: [
      "Ingesta y limpieza de series históricas",
      "Análisis exploratorio y caracterización de cuencas",
      "Definición de features hidrológicas",
      "Selección del enfoque de modelado"
    ],
    deliverables: [
      "Dataset histórico curado y versionado",
      "Reporte exploratorio por cuenca",
      "Catálogo de features hidrológicas",
      "Decisión técnica de enfoque de modelado"
    ]
  },
  {
    id: "F2",
    label: "Fase 2 — Modelado y Pronóstico",
    shortName: "Modelado",
    durationWeeks: 9,
    startWeek: 10,
    colorVar: "var(--chart-3)",
    objective: "Producir un modelo de pronóstico de caudales con desempeño aceptable y validado por hidrología.",
    narrative: "Es la fase más larga y técnica del piloto. Se entrenan modelos candidatos de pronóstico, se realiza validación cruzada con datos históricos, se itera sobre hiperparámetros y arquitectura, y se calibra el modelo en sesiones de trabajo con los hidrólogos. El modelo se compara explícitamente contra el baseline operativo actual para evidenciar mejora real, no solo métrica estadística.",
    activities: [
      "Entrenamiento de modelos de pronóstico de caudales",
      "Validación cruzada con datos históricos",
      "Calibración con hidrólogos",
      "Comparación con baseline operativo",
      "Iteración de hiperparámetros y arquitectura"
    ],
    deliverables: [
      "Modelo candidato versionado y reproducible",
      "Reporte de validación cruzada",
      "Comparativa cuantitativa vs. baseline operativo",
      "Bitácora de calibración con hidrología"
    ]
  },
  {
    id: "F3",
    label: "Fase 3 — Integración y Operación",
    shortName: "Integración",
    durationWeeks: 5,
    startWeek: 19,
    colorVar: "var(--chart-4)",
    objective: "Llevar el modelo al ambiente piloto con datos en tiempo real y un portal operativo funcional.",
    narrative: "La Fase 3 traslada el modelo del laboratorio a un ambiente operativo de piloto. Se construye el portal interno (este mismo portal extendido con los dashboards operativos), se conectan las fuentes de datos en tiempo real, y se ejecutan pruebas integradas extremo a extremo, incluyendo escenarios de degradación de datos y de respuesta a eventos hidrológicos.",
    activities: [
      "Despliegue del modelo en ambiente piloto",
      "Construcción del portal interno de operación",
      "Conexión a fuentes en tiempo real",
      "Pruebas integradas extremo a extremo"
    ],
    deliverables: [
      "Modelo desplegado en ambiente piloto",
      "Portal operativo navegable por hidrología",
      "Integraciones en tiempo real activas",
      "Reporte de pruebas integradas E2E"
    ]
  },
  {
    id: "F4",
    label: "Fase 4 — Validación Operativa y Cierre",
    shortName: "Cierre",
    durationWeeks: 5,
    startWeek: 24,
    colorVar: "var(--chart-5)",
    objective: "Validar el piloto en operación supervisada y dejar todo listo para una decisión de escalamiento.",
    narrative: "Durante la Fase 4 el modelo opera supervisado por hidrología en condiciones reales y se compara día a día contra el pronóstico tradicional. Se documenta todo (modelo, pipelines, runbooks, decisiones), se capacita al personal operativo y se entregan recomendaciones formales sobre escalar, ajustar o repetir el piloto.",
    activities: [
      "Operación supervisada del piloto",
      "Comparación contra pronóstico tradicional",
      "Documentación, capacitación y handoff",
      "Recomendaciones para escalamiento"
    ],
    deliverables: [
      "Reporte de operación supervisada",
      "Documentación técnica y operativa completa",
      "Capacitación impartida al equipo CEL",
      "Recomendaciones formales de escalamiento"
    ]
  },
  {
    id: "CONT",
    label: "Contingencia",
    shortName: "Contingencia",
    durationWeeks: 2,
    startWeek: 29,
    colorVar: "var(--muted-foreground)",
    objective: "Absorber retrasos, retrabajos o validaciones adicionales sin comprometer el cierre del piloto.",
    narrative: "Las dos últimas semanas se reservan como buffer explícito. Si todo va según plan, se usan para reforzar documentación y transferencia; si surgen riesgos, son el colchón que evita extender el piloto.",
    activities: [
      "Buffer para riesgos, retrabajos o validaciones adicionales"
    ],
    deliverables: [
      "Plan de uso de contingencia documentado"
    ]
  }
];

export const METHODOLOGY_BLOCKS = [
  {
    title: "Datos + Dominio",
    body: "Combinamos series hidrometeorológicas históricas, datos en tiempo real y la experiencia operativa de los hidrólogos de CEL. Los datos no se modelan en vacío: cada decisión técnica se contrasta con el conocimiento del comportamiento real de las cuencas del Río Lempa."
  },
  {
    title: "Modelado Híbrido",
    body: "El piloto explora un enfoque híbrido que integra técnicas modernas de aprendizaje automático con el entendimiento hidrológico tradicional. El criterio de éxito no es la métrica estadística aislada, sino la mejora demostrable frente al pronóstico operativo actual."
  },
  {
    title: "Despliegue Progresivo",
    body: "El sistema se entrega a través de un portal interno (este mismo portal extendido) que se construye en paralelo al modelo. La operación se valida supervisada por hidrología antes de cualquier decisión de escalamiento."
  }
];

export const TRACKING_BLOCK = {
  title: "Seguimiento y Comunicación",
  body: "El equipo opera con una cadencia semanal de revisión (avances, métricas, riesgos) y una revisión de fase al cierre de cada Fase 0–4 frente al Product Owner y la línea hidrológica. Este portal centraliza el equipo, el cronograma vigente y la metodología; los entregables formales y las decisiones técnicas se registran fuera del portal en los repositorios y bitácoras del proyecto.",
  bullets: [
    "Sync semanal de equipo: avances, bloqueadores y próximos pasos.",
    "Cierre de fase: revisión formal de entregables contra criterios de aceptación.",
    "Bitácora técnica versionada para decisiones de modelado y datos.",
    "Reporte ejecutivo mensual al patrocinador del piloto."
  ]
};

export const METHODOLOGY_TEXT = "Una estrategia de pronóstico hidrológico aumentada por IA que combina datos hidrometeorológicos históricos, la experiencia de dominio de los hidrólogos de CEL y ML moderno para producir pronósticos de caudales operativos. El enfoque prioriza el modelado híbrido (basado en datos + hidrología), la validación continua contra el baseline operativo y un despliegue progresivo a través de un portal interno de uso institucional.";
