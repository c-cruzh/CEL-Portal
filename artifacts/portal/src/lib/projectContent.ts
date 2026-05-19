export const ROLES = [
  { id: "pm_lead", label: "PM / Líder de Proyecto (Camila Cruz)", description: "Liderazgo general del piloto, planificación y coordinación con CEL." },
  { id: "pm_cel", label: "PM / Contraparte CEL", description: "Contraparte de gestión por parte de CEL: agenda, accesos y stakeholders internos." },
  { id: "hydrology_lead_cel", label: "Líder Hidrología (CEL)", description: "Validación de patrones, ground-truth y evaluación de pronósticos." },
  { id: "geospatial_expert_cel", label: "Experto Geoespacial (CEL)", description: "MDE, HydroATLAS, cobertura de suelos y delimitación de cuencas." },
  { id: "meteo_expert", label: "Experto Meteorológico", description: "ERA5, GPM, CHIRPS, precipitación y evapotranspiración." },
  { id: "ml_engineer", label: "ML Engineer", description: "LSTM, NeuralHydrology, hiperparámetros y validación rodante." },
  { id: "data_engineer", label: "Data Engineer (ETL / Mage)", description: "Canalizaciones de datos, ingesta automática y orquestación." },
  { id: "infra_devops", label: "Infraestructura / DevOps", description: "Entorno, redes, VPN, bases de datos y stack de software." },
  { id: "fullstack_dev", label: "Frontend / Backend Dev", description: "Web app, dashboards operativos y alertas." },
  { id: "qa_validation", label: "QA / Validación", description: "Pruebas fuera de muestra y validación del piloto." },
  { id: "docs_training", label: "Documentación / Capacitación", description: "POE, informes y talleres de transferencia." },
  { id: "stakeholder_cel", label: "Stakeholder CEL", description: "Revisión, retroalimentación y sesiones de avance." }
];

export type { PhaseDefinition as Phase } from "@workspace/project-domain";
export { PHASES } from "@workspace/project-domain";

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
