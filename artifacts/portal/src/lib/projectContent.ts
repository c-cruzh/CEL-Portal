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

export const PHASES = [
  {
    id: "F0",
    label: "Fase 0 — Preparación y Habilitación",
    durationWeeks: 4,
    startWeek: 1,
    activities: [
      "Alineamiento del equipo y kickoff",
      "Inventario de fuentes de datos hidrometeorológicos",
      "Habilitación de entornos (datos, cómputo, repositorios)",
      "Definición de métricas de éxito y línea base"
    ]
  },
  {
    id: "F1",
    label: "Fase 1 — Datos y Diagnóstico",
    durationWeeks: 5,
    startWeek: 5,
    activities: [
      "Ingesta y limpieza de series históricas",
      "Análisis exploratorio y caracterización de cuencas",
      "Definición de features hidrológicas",
      "Selección del enfoque de modelado"
    ]
  },
  {
    id: "F2",
    label: "Fase 2 — Modelado y Pronóstico",
    durationWeeks: 9,
    startWeek: 10,
    activities: [
      "Entrenamiento de modelos de pronóstico de caudales",
      "Validación cruzada con datos históricos",
      "Calibración con hidrólogos",
      "Comparación con baseline operativo",
      "Iteración de hiperparámetros y arquitectura"
    ]
  },
  {
    id: "F3",
    label: "Fase 3 — Integración y Operación",
    durationWeeks: 5,
    startWeek: 19,
    activities: [
      "Despliegue del modelo en ambiente piloto",
      "Construcción del portal interno de operación",
      "Conexión a fuentes en tiempo real",
      "Pruebas integradas extremo a extremo"
    ]
  },
  {
    id: "F4",
    label: "Fase 4 — Validación Operativa y Cierre",
    durationWeeks: 5,
    startWeek: 24,
    activities: [
      "Operación supervisada del piloto",
      "Comparación contra pronóstico tradicional",
      "Documentación, capacitación y handoff",
      "Recomendaciones para escalamiento"
    ]
  },
  {
    id: "CONT",
    label: "Contingencia",
    durationWeeks: 2,
    startWeek: 29,
    activities: [
      "Buffer para riesgos, retrabajos o validaciones adicionales"
    ]
  }
];

export const METHODOLOGY_TEXT = "Una estrategia de pronóstico hidrológico aumentada por IA que combina datos hidrometeorológicos históricos, la experiencia de dominio de los hidrólogos de CEL y ML moderno para producir pronósticos de caudales operativos. El enfoque prioriza el modelado híbrido (basado en datos + hidrología), la validación continua contra el baseline operativo y un despliegue progresivo a través de un portal interno de uso institucional.";
