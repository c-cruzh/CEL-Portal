export const ROLES = [
  { id: "pm_lead", label: "PM / Líder de Proyecto (C2 Labs)", description: "Liderazgo y PM del piloto por parte de C2 Labs. Camila Cruz dirige y gobierna la relación global; Kevin Centeno coordina la ejecución, seguimiento y operación PM del piloto." },
  { id: "pm_cel", label: "PM / Líder de Proyecto + Adm. del Contrato (CEL)", description: "Contraparte de proyecto y administración del contrato por parte de CEL. Coordina el Core Pilot Team, la cadencia con C2 Labs y la operatividad con el equipo CEL." },
  { id: "hydrology_lead_cel", label: "Líder Técnico en Hidrología (CEL)", description: "Liderazgo técnico hidrológico del piloto. Define requerimientos, valida modelos y lidera la relación técnica directa con las cinco centrales (15 de Septiembre, 5 de Noviembre, Cerrón Grande, 3 de Febrero, Guajoyo)." },
  { id: "geospatial_expert_cel", label: "Especialista SIG / Teledetección (CEL)", description: "Departamento de Catastro GIS. MDE, HydroATLAS, cobertura de suelos, delimitación de cuencas y validación SIG." },
  { id: "data_engineer", label: "Ingeniero de Datos y Backend (CEL)", description: "Ingesta de datos, pipelines y backend del piloto desde CEL. Trabaja con el Líder Técnico de Hidrología en requerimientos y con DevOps en infraestructura y despliegue." },
  { id: "infra_devops", label: "Adm. de Sistemas / Ingeniero DevOps (CEL)", description: "Unidad de Informática — enlace operativo entre el Core Pilot Team y el Comité de Informática. Coordina infraestructura, redes, despliegue y autorización de acciones técnicas." },
  { id: "it_committee_lead", label: "Jefa de Unidad de Informática (CEL)", description: "Lidera el Comité de Informática de CEL. Autoridad final: aprueba, autoriza y permanece informada del piloto. Owner de infraestructura. Autorización exclusiva para exposición de servicios al exterior." },
  { id: "it_committee_networks", label: "Jefe de Adm. de Redes e Informática (CEL)", description: "Comité de Informática — Jefatura de Administración de Redes e Informática. Aprueba, autoriza, delega y maneja recursos. Mecanismo operativo de escalamiento para el enlace DevOps." },
  { id: "it_committee_sysadmin", label: "Administrador de Sistemas y Redes (CEL)", description: "Comité de Informática — Configura entornos (VLANs, túneles VPN, listas blancas de IPs) y entrega recursos al enlace DevOps. Realiza pre-auditorías de red antes del pase a producción." },
  { id: "it_committee_dba", label: "Administrador de Base de Datos (CEL)", description: "Comité de Informática — DBA. Gobierna las bases de datos del piloto (acceso, replicación, ground truth) y entrega recursos al enlace DevOps." },
  { id: "it_committee_security", label: "Especialista de Ciberseguridad (CEL)", description: "Comité de Informática — Lineamientos de seguridad y pre-auditorías de ciberseguridad antes del pase a producción. Entrega recursos al enlace DevOps." },
  { id: "pm_director_cel", label: "Gerente de Proyecto (CEL)", description: "Gerente de Proyecto por parte de CEL. Por determinar por el Comité de Dirección de CEL." },
  { id: "hydrology_ops_cel", label: "Hidrólogos Operativos (CEL)", description: "Hidrólogos operativos asignados por CEL al piloto. Por determinar por el Comité de Dirección de CEL." },
  { id: "direccion_member", label: "Equipo de Dirección del Piloto (CEL)", description: "Integrantes del Equipo de Dirección del piloto por parte de CEL. Rol e involucramiento por definir por etapa, conforme al DSP." }
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
