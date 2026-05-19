export interface DevSection {
  id: string;
  label: string;
  shortLabel: string;
}

export const DEV_SECTIONS: DevSection[] = [
  { id: "flujo", label: "1. Flujo del sistema", shortLabel: "Flujo" },
  { id: "datos", label: "2. Datos de entrada", shortLabel: "Datos" },
  { id: "etl", label: "3. Pipelines ETL (Mage)", shortLabel: "ETL" },
  { id: "modelos", label: "4. Modelos de predicción", shortLabel: "Modelos" },
  { id: "validacion", label: "5. Validación y métricas", shortLabel: "Validación" },
  { id: "decisiones", label: "6. Decisiones técnicas", shortLabel: "Decisiones" },
  { id: "operacion", label: "7. Operación diaria", shortLabel: "Operación" },
  { id: "visualizacion", label: "8. Visualización y alertas", shortLabel: "Visualización" },
  { id: "raci", label: "9. Matriz RACI", shortLabel: "RACI" },
  { id: "infraestructura", label: "10. Infraestructura local (BOM)", shortLabel: "Infraestructura" },
  { id: "anexo-lempa", label: "Anexo: Río Lempa", shortLabel: "Anexo Lempa" },
];

export const FLUJO_DIAGRAM = `flowchart TD
  subgraph FUENTES["Fuentes de Datos"]
    direction LR
    MET["Datos Meteorológicos<br/>(ECMWF, GPM)"]
    HID["Datos Hidrológicos<br/>(Aforos CEL, GRDC)"]
    GEO["Datos Geoespaciales<br/>(DEM, Sentinel-1)"]
  end

  subgraph SILO["AI Silo On-Premise (Nuevo)"]
    direction TB
    ORQ{"Orquestador de Flujos<br/>(Python / Mage)"}
    DBH["DB Histórica y Geoespacial<br/>(PostgreSQL/PostGIS)"]
    DBO["DB Operacional<br/>(MongoDB)"]
    LSTM["Modelo LSTM de Caudal<br/>(Entrenamiento/Inferencia<br/>en GPU)"]
    INUND["Modelo de Inundación"]
    DASH["Dashboard & Alertas<br/>(Node.js/React)"]
  end

  MET --> ORQ
  HID --> ORQ
  GEO --> ORQ

  ORQ -->|"Procesa y Carga"| DBH
  ORQ -->|"Procesa y Carga"| DBO
  ORQ -->|"Dispara<br/>Entrenamiento/Inferencia"| LSTM

  DBH -->|"Alimenta"| LSTM
  DBO -->|"Alimenta"| LSTM

  LSTM -->|"Pronóstico de Caudal"| INUND
  INUND -->|"Mapa de Inundación"| DASH
  DBO -->|"Datos en tiempo real"| DASH

  classDef source fill:#ecebff,stroke:#9b83ff,stroke-width:1px,color:#333;
  classDef process fill:#ecebff,stroke:#9b83ff,stroke-width:1px,color:#333;
  class MET,HID,GEO source;
  class ORQ,DBH,DBO,LSTM,INUND,DASH process;

  style FUENTES fill:#ffffdf,stroke:#c9c96b,stroke-width:1px
  style SILO fill:#ffffdf,stroke:#c9c96b,stroke-width:1px
`;

export const FLUJO_INTRO =
  "El sistema de pronóstico hidrológico basado en IA seguirá un flujo de procesamiento de extremo a extremo, desde la recopilación de datos hasta la generación de alertas tempranas de inundación. Se compone de cuatro subsistemas principales —inspirados en Google Flood Hub (Nevo et al., 2022)— integrados en la plataforma de CEL, precedidos por una Fase 0 de habilitación de infraestructura.";

export const FLUJO_STAGES = [
  {
    id: "fase0",
    tag: "Fase 0",
    title: "Configuración de infraestructura y entorno",
    body:
      "Etapa inicial dedicada a la construcción y comisionamiento de la infraestructura de servidores on-premise dedicada, garantizando un entorno de alto rendimiento, seguro y escalable. Incluye la instalación de hardware y la configuración del stack de software, y es requisito indispensable para iniciar la ingesta de datos.",
  },
  {
    id: "etapa1",
    tag: "Etapa 1",
    title: "Adquisición y validación de datos (Data Ingestion)",
    body:
      "Recopilación automática de datos meteorológicos, hidrológicos y geoespaciales de múltiples fuentes, con controles de calidad y transformaciones. Los datos crudos son ingeridos mediante procesos ETL orquestados con Mage (pipelines en Python), reemplazando a Pentaho PDI para mejorar fiabilidad, versionamiento y mantenibilidad, y asegurando estandarización temporal y espacial antes del almacenamiento.",
  },
  {
    id: "etapa2",
    tag: "Etapa 2",
    title: "Pronóstico de caudales (modelo LSTM)",
    body:
      "Redes neuronales recurrentes LSTM entrenadas con datos históricos pronostican caudales/niveles futuros en puntos clave del río (estaciones de aforo o gauges virtuales). Procesa series de precipitaciones pronosticadas y observadas, caudales recientes y otros atributos, con un horizonte de hasta 7 días. Este enfoque supera a los modelos lineales tradicionales en la predicción de crecientes repentinas.",
  },
  {
    id: "etapa3",
    tag: "Etapa 3",
    title: "Modelado de inundación",
    body:
      "Traduce las predicciones de caudal en áreas inundadas mediante dos enfoques complementarios: (a) modelo de umbral, que asocia un caudal proyectado con la extensión esperada usando mapas predefinidos y elevaciones críticas; y (b) modelo de inundación por manifold (ML avanzado) que estima extensión y profundidad directamente desde las predicciones hidrológicas.",
  },
  {
    id: "etapa4",
    tag: "Etapa 4",
    title: "Alertas y visualización",
    body:
      "Los resultados se integran en un tablero web interactivo (Node.js/React) que muestra mapas de inundación previstos sobre una interfaz geográfica y curvas de caudal vs umbrales en puntos de control. Si un pronóstico excede niveles críticos, el sistema activa alertas automáticas —correo, SMS u otros canales— dirigidas a los responsables y comunidades pertinentes.",
  },
];

export const FLUJO_OUTRO =
  "El flujo integral va “de datos a decisión”: captura datos brutos multisectoriales, los convierte mediante IA en pronósticos de caudal confiables, traduce esos pronósticos en zonas de inundación probables y comunica oportunamente las alertas a quienes las necesitan.";

export const DATOS_INTRO =
  "El sistema aprovechará fuentes heterogéneas —meteorológicas, hidrológicas, geoespaciales y de características de cuenca— para alimentar los modelos de pronóstico. Todas las fuentes son abiertas o de acceso público.";

export const DATOS_CATEGORIES = [
  {
    id: "meteo",
    title: "Datos meteorológicos",
    sources: ["ECMWF (pronósticos hasta 7 días)", "ERA5 / ERA5-Land (reanálisis 1980-presente)", "NASA GPM / IMERG (precipitación satelital)", "CHIRPS (precipitación Mesoamérica)"],
    body:
      "Pronósticos numéricos del modelo global ECMWF para horizontes de hasta 7 días, reanálisis ERA5 para series climáticas de largo plazo y estimaciones satelitales GPM/IMERG con pocas horas de retraso. CHIRPS complementa zonas con escasa cobertura de estaciones. La combinación de múltiples productos reduce la incertidumbre de los pronósticos.",
  },
  {
    id: "hidro",
    title: "Datos hidrológicos",
    sources: ["Estaciones hidrométricas CEL", "Autoridades hidro-meteorológicas (SV, GT, HN)", "GRDC (Global Runoff Data Centre)", "Gauges virtuales en sitios sin sensores"],
    body:
      "Caudales observados en el Lempa y tributarios para entrenar y calibrar el modelo. Registros históricos locales y datos abiertos GRDC para contrastar y extender. El sistema generará gauges virtuales en ubicaciones sin estación física (p. ej. desembocadura en el Bajo Lempa), heredando conocimiento de la red hidrográfica y patrones de lluvia. En operación se incorporarán observaciones en tiempo real para asimilación de datos.",
  },
  {
    id: "geo",
    title: "Datos geoespaciales",
    sources: ["MDE SRTM ~30 m / LiDAR local", "Sentinel-1 SAR (mapas históricos de inundación)", "CORINE Land Cover / cobertura nacional"],
    body:
      "MDE de alta resolución para delinear zonas que quedarían bajo agua para un nivel dado (insumo clave del modelo de umbral). Sentinel-1 detecta agua superficial aún bajo nubes, permitiendo derivar extensiones de inundaciones pasadas para calibrar y validar el modelo. Capas de uso del suelo para entender la interacción agua-terreno.",
  },
  {
    id: "cuenca",
    title: "Características de la cuenca",
    sources: ["HydroATLAS / HydroSheds", "Atributos: área de drenaje, pendiente, suelo, vegetación", "Sub-cuencas (alta GT, media con embalses, baja SV)"],
    body:
      "Atributos fisiográficos e hidrológicos del Lempa: área de drenaje, elevación media, pendiente, tipo de suelo, parámetros climáticos medios y cobertura vegetal. Estos rasgos estáticos se incorporan como features del LSTM para regionalizar el modelo y transferir aprendizaje desde cuencas similares hacia segmentos del Lempa con pocos datos locales.",
  },
];

export const ETL_INTRO =
  "Para convertir los datos brutos en insumos listos para modelar, se implementará una canalización moderna basada en Python orquestada por Mage. Esta decisión reemplaza Pentaho PDI para mejorar fiabilidad, observabilidad y versionamiento del código. El nuevo Nodo de Datos & ETL actúa como cliente dentro de la red CEL, consultando en solo-lectura PostgreSQL y MongoDB existentes; todo el procesamiento se ejecuta en el hardware dedicado del silo de IA.";

export const ETL_STAGES = [
  {
    title: "Extracción automática",
    items: [
      "Conexión programada a APIs meteorológicas (GRIB/NetCDF de ECMWF)",
      "Descarga de imágenes satelitales (GPM, Sentinel-1) con requests",
      "Conectores psycopg2 (PostgreSQL CEL) y pymongo (MongoDB CEL)",
      "Carga inicial en área de staging dentro del silo de IA",
    ],
  },
  {
    title: "Transformación y limpieza",
    items: [
      "Conversión de unidades, zonas horarias y re-muestreo temporal (Pandas)",
      "Gap-filling: interpolación lineal, media estacional",
      "Geoespacial: precipitación media areal por subcuenca (rasterio, geopandas)",
      "Clasificación de agua en Sentinel-1 (umbral de backscatter) → polígonos vectoriales",
      "Ingeniería de features: día del año, evapotranspiración potencial",
    ],
  },
  {
    title: "Carga en bases de datos",
    items: [
      "MongoDB: datos operativos en tiempo real (lluvia reciente, caudales, predicciones diarias)",
      "PostgreSQL + PostGIS: históricos depurados, geometrías de cuenca, mapas de inundación",
    ],
  },
  {
    title: "QA / QC continuo",
    items: [
      "Aserciones por script: caudal no negativo, lluvia dentro de rango",
      "Logs y notificaciones de error en la interfaz de Mage",
      "Solo datos confiables alimentan los modelos",
    ],
  },
];

export const MODEL_LSTM = {
  title: "4.1 Modelo LSTM para predicción de caudales",
  body:
    "Red neuronal recurrente LSTM elegida por su eficacia capturando dependencias temporales largas en series precipitación-escorrentía. Multivariable: ingiere precipitaciones diarias sobre la cuenca, caudal/nivel actual (autoregresión), indicadores temporales y atributos estáticos de la cuenca (área de drenaje, pendiente, uso del suelo). Salida: caudales pronosticados para los próximos 7 días.",
  bullets: [
    "Arquitectura: capas LSTM (hiperparámetro) + densas; esquema sequence-to-sequence (N días → 7 días)",
    "Framework: NeuralHydrology (Kratzert et al.) sobre PyTorch",
    "Cómputo: NVIDIA RTX 4090 (24 GB VRAM) del silo de IA",
    "Pérdida: MSE con métricas hidrológicas (NSE) en validación",
    "Hiperparámetros: búsqueda Bayesiana con Optuna (unidades ocultas, ventana temporal, learning rate, regularización)",
    "Integración de embalses: nivel del embalse como input adicional o segmentación arriba/abajo de la presa",
  ],
};

export const MODEL_FLOOD = {
  title: "4.2 Modelo de inundación",
  body: "Dos enfoques complementarios para traducir caudales pronosticados en áreas inundadas:",
  approaches: [
    {
      name: "Modelo de umbral (Thresholding)",
      body:
        "Método basado en reglas fijas que relaciona un nivel de río con una extensión predefinida. Se generan mapas de inundación por nivel umbral usando el MDE (ej. 5 m en estación X). Calibrados con expertos y SAR históricos. Ligero, interpretable y suficiente como baseline operacional. Soporta múltiples umbrales (alerta verde, amarilla, roja) con mapas incrementales.",
    },
    {
      name: "Modelo manifold (ML avanzado)",
      body:
        "Aprende un espacio latente de configuraciones de inundación y mapea condiciones hidrológicas (caudal pico, volumen excedente, estado del suelo, pendiente, ancho de valle) a mapas de extensión y profundidad. Entrenado con verdades terreno de Sentinel-1 + transfer learning desde simulaciones HEC-RAS 2D. Modelo tipo autoencoder/CNN. Mucho más rápido que un modelo físico en tiempo real y con precisión similar.",
    },
  ],
  integration:
    "El LSTM entrega un hidrograma pronosticado en puntos de control; el sistema extrae caudal pico y timing, los pasa al modelo de umbral o al manifold ML, y opcionalmente alimenta la duración esperada de caudales altos para inundaciones prolongadas. Arquitectura modular para facilitar ajustes.",
};

export const VALIDATION_ROLLING = {
  title: "Validación con origen rodante (LSTM)",
  body:
    "Dado que los datos temporales no son independientes, se divide la serie histórica en segmentos cronológicos: entrenar hasta el año X y validar pronosticando X+1; ampliar la ventana y repetir. Genera varios folds secuenciales que prueban el modelo en periodos no usados en el ajuste. Se reservará un conjunto out-of-sample (últimos 1-2 años o un evento extremo) para prueba ciega final.",
};

export const VALIDATION_METRICS = [
  { metric: "NSE (Nash-Sutcliffe)", desc: "Eficiencia del pronóstico respecto a la media observada (1 = perfecto). Estándar en hidrología." },
  { metric: "RMSE / MAE", desc: "Error cuadrático medio y absoluto medio en m³/s." },
  { metric: "R²", desc: "Correlación entre predicho y observado." },
  { metric: "Skill score vs persistencia", desc: "Comparación contra la línea base trivial (caudal igual al de ayer)." },
  { metric: "POD / FAR", desc: "Probabilidad de detección y tasa de falsas alarmas para eventos de creciente." },
  { metric: "Índice de Jaccard (IoU)", desc: "Para inundación: coincidencia espacial entre polígono pronosticado y observado." },
  { metric: "Omisión / comisión", desc: "Área inundada real no predicha vs área predicha que no se inundó." },
  { metric: "Distribución de profundidades", desc: "Comparación de profundidades estimadas vs mediciones puntuales." },
];

export const VALIDATION_GOALS = [
  "NSE ≥ 0.8 en pronóstico a 3 días",
  "NSE ≥ 0.7 en pronóstico a 7 días",
  "POD ~ 100% para inundaciones mayores",
  "FAR < 20%",
  "Validación indirecta cruzada con Sentinel-1 GMM (Google method)",
];

export const DECISIONES_TECNICAS = [
  {
    title: "Lenguajes y entorno",
    body: "Python para LSTM, modelo de inundación y orquestación (NumPy, Pandas, GeoPandas, PyTorch, NeuralHydrology). Node.js/React para dashboard. Mage para orquestación, GitLab para versionamiento.",
  },
  {
    title: "Bases de datos y almacenamiento",
    body: "MongoDB (tiempo real) + PostgreSQL/PostGIS (históricos + geoespacial) en el Nodo de Datos & ETL dedicado. Respaldos en NAS dedicado. No afecta rendimiento de DBs productivas de CEL.",
  },
  {
    title: "Datos meteorológicos (externos, APIs abiertas)",
    body: "Servicios gratuitos Copernicus/ECMWF y NASA POWER/IMERG. Conexión a internet estable con redundancia y reintentos en scripts.",
  },
  {
    title: "Mapas base",
    body: "Mapbox o solución open source (OpenStreetMap) según requerimientos visuales y políticas de TI de CEL.",
  },
  {
    title: "Notificaciones",
    body: "SMTP de CEL para correos; gateway Twilio para SMS críticos (costo insignificante por bajo volumen).",
  },
  {
    title: "Procesamiento satelital (opcional)",
    body: "Google Earth Engine solo como apoyo en fase de desarrollo, sin integrarse en producción para mantener independencia de la nube.",
  },
  {
    title: "Seguridad y disponibilidad",
    body: "App y DBs en el silo de IA tras firewalls CEL. Redundancia por hardware (PSU, RAID) + respaldos en NAS. Sin replicación en la nube para el piloto.",
  },
];

export const OPERACION_DIARIA = {
  scheduling:
    "Dos ciclos diarios alineados con los pronósticos meteorológicos globales (00 UTC y 12 UTC): ~6:00 a.m. y ~6:00 p.m. hora local. Aumento de frecuencia en eventos críticos. Orquestación con Mage (DAGs con dependencias y reintentos).",
  steps: [
    "Descarga de pronósticos meteorológicos (ECMWF) y lluvia observada (GPM 24 h)",
    "Preprocesamiento ETL: precipitación media en cuenca, normalización según parámetros de entrenamiento",
    "Ejecución del modelo LSTM en GPU (segundos a minutos)",
    "Cálculo de inundación y comparación contra umbrales críticos",
    "Actualización de DBs (MongoDB tiempo real, PostgreSQL histórico)",
    "Notificación (email + SMS) y actualización del dashboard",
  ],
  monitoring:
    "Mage ofrece interfaz visual de monitoreo en tiempo real, políticas de reintento y timeouts como código. Fallas irrecuperables notifican a administradores (email o Slack) con registro detallado.",
  retraining:
    "Operación semi-supervisada los primeros meses. Re-entrenamiento trimestral o semestral del LSTM con datos recientes, versionado en Git y validado contra la versión previa antes de pasar a producción.",
};

export const VISUALIZACION = {
  intro:
    "Dashboard web integrado al portal interno de CEL como única fuente de verdad. Audiencia mixta técnica-operativa, enfoque en claridad y síntesis.",
  features: [
    {
      title: "Mapa de la cuenca con capas dinámicas",
      body: "Mapa interactivo (Leaflet / Mapbox GL JS) con trazo del río, embalses, estaciones y zonas vulnerables. Capa semitransparente del área inundable prevista con área y profundidad máxima en hover.",
    },
    {
      title: "Gráficos de series temporales",
      body: "Hidrogramas pronosticados vs históricos a 7 días, contrastados con observados recientes y umbrales. Bandas de incertidumbre (percentiles 25-75) cuando hay pronósticos probabilísticos.",
    },
    {
      title: "Tablas resumidas y cifras clave",
      body: "Estado de alertas tipo semáforo por sitio con contadores de anticipación (“Días para posible desborde: 3”).",
    },
    {
      title: "Funcionalidades interactivas",
      body: "Selección de escenarios meteorológicos, histórico de pronósticos, capas de vulnerabilidad (población, infraestructura) superpuestas.",
    },
  ],
  alerts: {
    title: "Sistema de alertas proactivo",
    body:
      "Umbrales cuantitativos definidos con CEL (p. ej. Alerta Amarilla = retorno de 5 años). Cada nivel tiene su lista de destinatarios. Notificaciones claras y descriptivas que redirigen al dashboard para análisis.",
    samples: [
      'Email — "Alerta Roja de Inundación – Bajo Lempa. Se anticipa caudal ~3000 m³/s el miércoles 03:00, superando el umbral rojo. Revise el dashboard para análisis detallado."',
      'SMS — "ALERTA ROJA: Pronóstico de caudal >3000 m³/s en Bajo Lempa en 3 días. Revise el dashboard. Info: [enlace]"',
    ],
  },
};

export const RACI_ROLES = ["Consultor", "PM CEL", "Hidrología CEL", "Geoespacial CEL", "Data Eng", "ML Eng", "Stakeholder CEL"] as const;

export const RACI_TASKS: { task: string; values: string[] }[] = [
  { task: "Configuración Mage + GitLab", values: ["C/A", "I", "R", "I", "I", "I", "I"] },
  { task: "Desarrollo de pipelines ETL", values: ["R/C", "I", "I", "I", "R/A", "I", "I"] },
  { task: "Validación de pipelines", values: ["A/R", "C", "I", "I", "R", "I", "I"] },
  { task: "Diseño y entrenamiento de IA", values: ["R/A", "C/I", "I", "I", "C", "I", "C"] },
  { task: "Visualización (dashboard)", values: ["R", "I", "I", "I", "C", "C", "—"] },
  { task: "Cartografía y mapas SIG", values: ["C/A", "I", "I", "I", "R", "I", "—"] },
  { task: "Validación operacional", values: ["C", "I", "I", "I", "I", "R/A", "—"] },
  { task: "Gestión y coordinación", values: ["C", "R/A", "I", "I", "I", "I", "I"] },
];

export const RACI_LEGEND = [
  { k: "R", v: "Responsable de ejecutar la tarea" },
  { k: "A", v: "Aprobador final de la actividad" },
  { k: "C", v: "Consultado para contribuir técnicamente o validar" },
  { k: "I", v: "Informado del progreso y entregables clave" },
];

export type InfraStatus = "confirmado" | "por-confirmar";

export interface InfraArchNode {
  id: string;
  name: string;
  layer: "Compute" | "Data & ETL" | "Backup" | "Red" | "Energía";
  role: string;
  specs: string[];
}

export interface HardwareItem {
  category: "Cómputo / ML" | "Almacenamiento" | "Red" | "Energía / Rack";
  item: string;
  qty: string;
  specs: string;
  role: string;
  status: InfraStatus;
}

export interface SoftwareItem {
  layer: "Sistema operativo" | "Bases de datos" | "Orquestación / ETL" | "ML / Modelos" | "Aplicación" | "Monitoreo / Seguridad";
  product: string;
  version: string;
  purpose: string;
  status: InfraStatus;
}

export interface CommissioningTest {
  id: string;
  area: "GPU / Cómputo" | "Almacenamiento / E-S" | "Red / VPN" | "Datos / ETL" | "Aplicación";
  test: string;
  criteria: string;
  status: InfraStatus;
}

export interface BackupPolicy {
  title: string;
  body: string;
  status: InfraStatus;
}

export const INFRA_INTRO =
  "El silo de IA es un entorno on-premise dedicado, instalado dentro del data center de CEL, que aloja el pipeline completo de pronóstico hidrológico (ingesta, ETL, entrenamiento y servicio del modelo, base histórica y dashboard). Opera como cliente en solo-lectura sobre las bases productivas de CEL (PostgreSQL y MongoDB) y mantiene aislado todo el cómputo intensivo, evitando impacto en los sistemas operativos del negocio. Los ítems pendientes de cierre con el equipo de CEL se identifican explícitamente como “Por confirmar con CEL”.";

export const INFRA_ARCHITECTURE: InfraArchNode[] = [
  {
    id: "ml",
    name: "Nodo ML / Compute",
    layer: "Compute",
    role: "Entrenamiento e inferencia del LSTM y del modelo de inundación manifold",
    specs: [
      "1× servidor workstation con GPU NVIDIA RTX 4090 (24 GB VRAM)",
      "CPU multi-núcleo, 64–128 GB RAM (Por confirmar con CEL)",
      "Almacenamiento NVMe local para datasets de entrenamiento",
    ],
  },
  {
    id: "data",
    name: "Nodo Datos & ETL",
    layer: "Data & ETL",
    role: "Mage, scripts de extracción, PostgreSQL/PostGIS y MongoDB locales",
    specs: [
      "1× servidor (RAID 1/10) — Por confirmar con CEL",
      "PostgreSQL + PostGIS para históricos y geometrías",
      "MongoDB para datos operativos en tiempo real",
    ],
  },
  {
    id: "app",
    name: "Nodo Aplicación",
    layer: "Compute",
    role: "API Node.js, dashboard React y servicio de notificaciones",
    specs: [
      "Puede co-residir con Nodo Datos en el piloto (Por confirmar con CEL)",
      "Tras firewall de CEL, expuesto solo en intranet",
    ],
  },
  {
    id: "nas",
    name: "NAS de Respaldo",
    layer: "Backup",
    role: "Backup de DBs, modelos entrenados y artefactos ETL",
    specs: [
      "NAS dedicado con discos en RAID (capacidad y modelo Por confirmar con CEL)",
      "Snapshots diarios + retención semanal/mensual",
    ],
  },
  {
    id: "net",
    name: "Red interna y VPN",
    layer: "Red",
    role: "Switching del silo y enlace seguro hacia DBs productivas y consultor",
    specs: [
      "Switch gigabit gestionado (modelo Por confirmar con CEL)",
      "VLAN dedicada al silo, ACLs hacia PostgreSQL/MongoDB productivos en solo-lectura",
      "VPN site-to-site / acceso remoto para el equipo consultor",
    ],
  },
  {
    id: "ups",
    name: "Energía protegida",
    layer: "Energía",
    role: "Continuidad y protección eléctrica del rack",
    specs: [
      "UPS de rack con autonomía mínima para apagado ordenado (capacidad Por confirmar con CEL)",
      "Doble PSU en servidores donde aplique",
    ],
  },
];

export const INFRA_HARDWARE: HardwareItem[] = [
  {
    category: "Cómputo / ML",
    item: "Servidor / workstation GPU para entrenamiento e inferencia",
    qty: "1",
    specs: "NVIDIA RTX 4090 (24 GB VRAM), CPU multi-núcleo, 64–128 GB RAM, NVMe ≥ 2 TB",
    role: "Nodo ML — entrenar LSTM (NeuralHydrology/PyTorch) y ejecutar inferencia diaria",
    status: "por-confirmar",
  },
  {
    category: "Cómputo / ML",
    item: "Servidor Datos & ETL (puede alojar también la aplicación en el piloto)",
    qty: "1",
    specs: "CPU multi-núcleo, 32–64 GB RAM, discos en RAID 1/10 — modelo Por confirmar con CEL",
    role: "Mage + PostgreSQL/PostGIS + MongoDB + API Node.js / dashboard",
    status: "por-confirmar",
  },
  {
    category: "Almacenamiento",
    item: "NAS de respaldo dedicado",
    qty: "1",
    specs: "Capacidad útil ≥ 8 TB en RAID, doble interfaz de red — modelo Por confirmar con CEL",
    role: "Backups de DBs, modelos entrenados, artefactos ETL y logs",
    status: "por-confirmar",
  },
  {
    category: "Red",
    item: "Switch gigabit gestionado",
    qty: "1",
    specs: "≥ 24 puertos 1 GbE, soporte VLAN/ACL — modelo Por confirmar con CEL",
    role: "Segmentación del silo y enlace controlado a la red CEL",
    status: "por-confirmar",
  },
  {
    category: "Red",
    item: "Appliance / endpoint VPN",
    qty: "1",
    specs: "VPN site-to-site o acceso remoto seguro — solución Por confirmar con CEL",
    role: "Acceso del equipo consultor y administración remota",
    status: "por-confirmar",
  },
  {
    category: "Energía / Rack",
    item: "UPS de rack",
    qty: "1",
    specs: "Capacidad suficiente para apagado ordenado de todo el silo — Por confirmar con CEL",
    role: "Continuidad eléctrica y protección frente a transitorios",
    status: "por-confirmar",
  },
  {
    category: "Energía / Rack",
    item: "Rack y accesorios (PDU, organizadores, cableado)",
    qty: "1",
    specs: "Rack estándar 19” compatible con el data center de CEL",
    role: "Alojamiento físico del silo dentro del data center",
    status: "por-confirmar",
  },
];

export const INFRA_SOFTWARE: SoftwareItem[] = [
  {
    layer: "Sistema operativo",
    product: "Ubuntu Server LTS",
    version: "22.04 LTS (o LTS vigente)",
    purpose: "Base de todos los nodos del silo; soporte largo plazo y compatibilidad con CUDA",
    status: "confirmado",
  },
  {
    layer: "Sistema operativo",
    product: "NVIDIA Driver + CUDA Toolkit",
    version: "Driver ≥ 535 / CUDA 12.x",
    purpose: "Aceleración GPU para entrenamiento e inferencia del LSTM",
    status: "confirmado",
  },
  {
    layer: "Bases de datos",
    product: "PostgreSQL + PostGIS",
    version: "PostgreSQL 16 / PostGIS 3.x",
    purpose: "Históricos depurados, geometrías de cuenca y mapas de inundación",
    status: "confirmado",
  },
  {
    layer: "Bases de datos",
    product: "MongoDB Community",
    version: "7.x",
    purpose: "Datos operativos en tiempo real (lluvia reciente, caudales, predicciones diarias)",
    status: "confirmado",
  },
  {
    layer: "Orquestación / ETL",
    product: "Mage",
    version: "Última estable LTS — versión exacta Por confirmar con CEL",
    purpose: "Orquestación de pipelines ETL en Python, monitoreo y reintentos",
    status: "por-confirmar",
  },
  {
    layer: "Orquestación / ETL",
    product: "Python + librerías de datos",
    version: "Python 3.11 + Pandas, GeoPandas, rasterio, psycopg2, pymongo",
    purpose: "Extracción, transformación y limpieza de datos meteorológicos, hidrológicos y geoespaciales",
    status: "confirmado",
  },
  {
    layer: "ML / Modelos",
    product: "PyTorch + NeuralHydrology",
    version: "PyTorch 2.x (con CUDA)",
    purpose: "Entrenamiento e inferencia del modelo LSTM hidrológico",
    status: "confirmado",
  },
  {
    layer: "ML / Modelos",
    product: "Optuna",
    version: "Última estable",
    purpose: "Búsqueda bayesiana de hiperparámetros del LSTM",
    status: "confirmado",
  },
  {
    layer: "Aplicación",
    product: "Node.js + React (dashboard)",
    version: "Node.js LTS",
    purpose: "API y dashboard interactivo del portal interno de CEL",
    status: "confirmado",
  },
  {
    layer: "Aplicación",
    product: "Leaflet / Mapbox GL JS",
    version: "Última estable",
    purpose: "Mapas interactivos con capas dinámicas de inundación",
    status: "confirmado",
  },
  {
    layer: "Monitoreo / Seguridad",
    product: "Prometheus + Grafana",
    version: "Última estable (Por confirmar con CEL)",
    purpose: "Monitoreo de hardware, GPU, pipelines y bases de datos",
    status: "por-confirmar",
  },
  {
    layer: "Monitoreo / Seguridad",
    product: "GitLab (versionamiento de código y modelos)",
    version: "Self-hosted o instancia CEL — Por confirmar con CEL",
    purpose: "Repositorio de pipelines ETL, código del modelo y configuración como código",
    status: "por-confirmar",
  },
  {
    layer: "Monitoreo / Seguridad",
    product: "Backup tool (restic / Borg / nativo NAS)",
    version: "Por confirmar con CEL",
    purpose: "Respaldos cifrados de DBs, modelos y artefactos al NAS",
    status: "por-confirmar",
  },
];

export const INFRA_COMMISSIONING: CommissioningTest[] = [
  {
    id: "C1",
    area: "GPU / Cómputo",
    test: "Benchmark de la RTX 4090 (nvidia-smi, PyTorch, entrenamiento corto del LSTM)",
    criteria: "Uso estable de VRAM, throughput esperado y temperatura dentro de rango bajo carga sostenida",
    status: "por-confirmar",
  },
  {
    id: "C2",
    area: "Almacenamiento / E-S",
    test: "Pruebas de I/O secuencial y aleatorio en NVMe local y en NAS (fio)",
    criteria: "Cumple umbrales mínimos definidos con CEL para ingesta y backups (Por confirmar con CEL)",
    status: "por-confirmar",
  },
  {
    id: "C3",
    area: "Red / VPN",
    test: "Latencia y ancho de banda entre silo ↔ DBs productivas y consultor ↔ silo vía VPN",
    criteria: "Latencia estable, sin pérdidas y suficiente ancho de banda para descargas ECMWF/GPM",
    status: "por-confirmar",
  },
  {
    id: "C4",
    area: "Datos / ETL",
    test: "Ejecución end-to-end de un pipeline Mage (descarga ECMWF → preprocesamiento → carga en DBs)",
    criteria: "Pipeline corre sin errores, datos llegan a PostgreSQL/MongoDB y pasan QA/QC",
    status: "por-confirmar",
  },
  {
    id: "C5",
    area: "Aplicación",
    test: "Despliegue del dashboard y verificación de un pronóstico simulado end-to-end",
    criteria: "Dashboard renderiza mapa e hidrograma; alerta de prueba se envía por email/SMS",
    status: "por-confirmar",
  },
];

export const INFRA_BACKUP_POLICIES: BackupPolicy[] = [
  {
    title: "Respaldo de bases de datos",
    body: "Dumps diarios de PostgreSQL y MongoDB al NAS, con retención semanal y mensual. Verificación periódica de restauración en entorno aislado.",
    status: "por-confirmar",
  },
  {
    title: "Respaldo de modelos y artefactos",
    body: "Checkpoints del LSTM y artefactos del modelo de inundación versionados en GitLab + copia en NAS por release.",
    status: "por-confirmar",
  },
  {
    title: "Recuperación ante desastre (DR)",
    body: "Procedimiento documentado de re-instalación del silo (SO, drivers, stack) y restauración desde NAS. RTO/RPO objetivo Por confirmar con CEL.",
    status: "por-confirmar",
  },
  {
    title: "Seguridad de red",
    body: "Silo detrás de los firewalls de CEL, segmentado en VLAN propia. Acceso a DBs productivas solo en lectura y desde el Nodo de Datos. Acceso remoto exclusivamente por VPN.",
    status: "confirmado",
  },
  {
    title: "Gestión de identidades y secretos",
    body: "Usuarios nominales con MFA donde el stack lo permita, llaves SSH gestionadas y secretos fuera del repositorio (gestor a definir con CEL).",
    status: "por-confirmar",
  },
  {
    title: "Monitoreo y alertas operativas",
    body: "Métricas de hardware, GPU, pipelines y bases de datos en Prometheus/Grafana; notificación de fallas críticas a administradores por email/Slack.",
    status: "por-confirmar",
  },
];

export const LEMPA = {
  title: "Anexo Técnico — Dinámicas Hidrológicas y Gobernanza Trinacional",
  intro:
    "El Río Lempa es el sistema hidrológico más relevante de El Salvador y uno de los más complejos de Centroamérica. Su cuenca transfronteriza abarca 18,246 km² distribuidos entre Guatemala (12.6% / 2,295 km²), Honduras (31.2% / 5,696 km²) y El Salvador (56.2% / 10,255 km²). El 49% del territorio salvadoreño está cubierto por esta cuenca y alberga al ~77.5% de la población, incluida San Salvador.",
  geo: {
    title: "Características geográficas e hidrológicas",
    items: [
      {
        h: "Origen y trayecto",
        b: "Nace en la Sierra Madre de Guatemala a más de 2,800 m s.n.m. (Río Olopa). Recorre 30.4 km en Guatemala, 31.4 km en Honduras y 360 km en El Salvador (desde Chalatenango) hasta el Pacífico. Total: 422 km. Caudal promedio: 362 m³/s en el puente Cuscatlán.",
      },
      {
        h: "Zonas hidrológicas",
        b: "Zona Alta (>1,500 m): andosoles volcánicos con infiltración 80-120 mm/hr pero saturación rápida. Zona Media (500-1,500 m): transmisión hidrológica, onda de crecida hasta 7 días desde Guatemala. Zona Baja (<500 m): planicies costeras (Bajo Lempa) con retención hasta 72 h, amortiguador natural.",
      },
      {
        h: "Puntos críticos",
        b: "La Garganta de Cuscatlán (300 m de ancho) convierte hasta el 90% de la energía cinética aguas arriba en flujo turbulento durante crecidas máximas, amplificando el potencial destructivo.",
      },
    ],
  },
  climate: {
    title: "Riesgos e impactos del cambio climático",
    items: [
      { h: "Temperatura 2070-2099", b: "+1.9 °C (B1) a +3.4 °C (A2)." },
      { h: "Precipitación 2070-2099", b: "-5.0% (B1) a -10.4% (A2)." },
      { h: "Caudal a embalses", b: "Reducción del 13% (B1) al 24% (A2)." },
      { h: "Estacionalidad", b: "Mayores reducciones en jun-sep. Julio: -39% Cerrón Grande y -41% 15 de Septiembre bajo A2." },
      { h: "Evento 2011", b: "Liberación de ~9,500 m³/s por más de 12 horas provocó fallo de diques en el Bajo Lempa." },
      { h: "Sedimentos", b: "28 millones de toneladas anuales de origen volcánico. Cerrón Grande intercepta el 78% de la carga de fondo, acelerando su colmatación." },
    ],
  },
  governance: {
    title: "Gobernanza trinacional",
    items: [
      { h: "Plan Trifinio (1987)", b: "Principal iniciativa de gobernanza transfronteriza para la cuenca alta, derivada de los acuerdos de paz de Esquipulas. Tratado internacional pionero en Centroamérica." },
      { h: "Desafíos", b: "Enfoque descendente con limitada participación local. Vacíos en protocolos operacionales transfronterizos, especialmente en liberaciones de agua durante extremos y en el intercambio de datos hidrometeorológicos en tiempo real." },
      { h: "USAID Upper Lempa Watershed", b: "Implementado por Winrock International: trabaja con gobiernos, comunidades y grupos ambientales en la cuenca alta. Beneficia a ~180,000 personas en los tres países." },
    ],
  },
  implications: {
    title: "Implicaciones para el sistema de pronóstico con IA",
    items: [
      {
        h: "Datos transfronterizos",
        b: "~65-70% del caudal del Lempa se origina fuera de El Salvador. Se requiere compensar la limitada disponibilidad de datos en tiempo real fuera de jurisdicción CEL, manejar fuentes heterogéneas y de calidad variable, e integrar teledetección satelital.",
      },
      {
        h: "Variabilidad espacial",
        b: "El sistema de IA debe reconocer respuestas de escorrentía por tipo de suelo/elevación, tiempos de viaje de hasta 7 días desde Guatemala y el efecto regulador del Bajo Lempa (retención 72 h).",
      },
      {
        h: "Modelado adaptativo",
        b: "LSTM para patrones temporales complejos, ensambles para robustez, productos de teledetección (CHIRPS, ERA5, satélites) para compensar la baja densidad de estaciones, y marcos probabilísticos para cuantificar incertidumbre.",
      },
    ],
  },
  conclusion:
    "La cuenca del Lempa combina desafíos hidrológicos, ambientales e institucionales. Un sistema de pronóstico con IA que aborde explícitamente su naturaleza transfronteriza y los retos del cambio climático puede convertirse en modelo replicable para cuencas compartidas en toda la región, y consolidar a CEL como referente en gestión hídrica inteligente.",
};
