export const ROLES: Array<{
  id: string;
  label: string;
  description: string;
  sortOrder: number;
}> = [
  { id: "project_lead", label: "Líder de Proyecto", description: "Liderazgo general del piloto. Owner de la relación completa con CEL: orquesta, gobierna y delega. Autoridad final del lado C2 Labs.", sortOrder: 0 },
  { id: "pm_lead", label: "Project Manager (C2 Labs)", description: "Coordinación ejecutiva del piloto: seguimiento, operación PM, agenda con CEL y delegación interna. Reporta al Líder de Proyecto.", sortOrder: 1 },
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
