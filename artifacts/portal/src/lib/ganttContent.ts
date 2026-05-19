export interface GanttTask {
  label: string;
  startMonth: number;
  endMonth: number;
}

export interface GanttPhase {
  num: number;
  label: string;
  color: string;
  tasks: GanttTask[];
}

export const GANTT_TOTAL_MONTHS = 12;

export const GANTT_PHASES: GanttPhase[] = [
  {
    num: 1,
    label: "Configuración de infraestructura y entorno",
    color: "#3b5bdb",
    tasks: [
      { label: "Comisionamiento HW (silo IA)", startMonth: 1, endMonth: 1 },
      { label: "Red / Seguridad (VLAN / FW / VPN)", startMonth: 1, endMonth: 1 },
      { label: "Stack (Mage, PG/PostGIS, Mongo, Python)", startMonth: 1, endMonth: 1 },
      { label: "Validación / Benchmark (GPU / IO / Red)", startMonth: 1, endMonth: 1 },
    ],
  },
  {
    num: 2,
    label: "Adquisición y Pre-procesamiento de Datos",
    color: "#4c6ef5",
    tasks: [
      { label: "Integración datos hidrológicos", startMonth: 2, endMonth: 2 },
      { label: "Canal meteorológico (ERA5 / GPM / CHIRPS)", startMonth: 2, endMonth: 3 },
      { label: "Geoespacial (HydroATLAS / MDE / Suelos)", startMonth: 2, endMonth: 2 },
      { label: "QC + documentación (dataset listo)", startMonth: 3, endMonth: 3 },
    ],
  },
  {
    num: 3,
    label: "Configuración y Entrenamiento del Modelo",
    color: "#12b886",
    tasks: [
      { label: "Implementación LSTM (NeuralHydrology)", startMonth: 4, endMonth: 4 },
      { label: "Optimización bayesiana", startMonth: 4, endMonth: 5 },
      { label: "Validación rolling-origin", startMonth: 5, endMonth: 5 },
      { label: "Informe de desempeño", startMonth: 6, endMonth: 6 },
    ],
  },
  {
    num: 4,
    label: "Operacionalización y Automatización",
    color: "#37b24d",
    tasks: [
      { label: "Canalización diaria", startMonth: 6, endMonth: 7 },
      { label: "Tableros web CEL", startMonth: 7, endMonth: 7 },
      { label: "Alertas SMS / correo", startMonth: 7, endMonth: 8 },
      { label: "Integración con sistemas / APIs", startMonth: 8, endMonth: 8 },
    ],
  },
  {
    num: 5,
    label: "Validación del Piloto y Transferencia",
    color: "#f59f00",
    tasks: [
      { label: "Pruebas OOS", startMonth: 9, endMonth: 10 },
      { label: "Capacitación CEL", startMonth: 10, endMonth: 11 },
      { label: "Documentación final", startMonth: 11, endMonth: 12 },
    ],
  },
];
