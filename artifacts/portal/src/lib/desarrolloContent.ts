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
  { id: "decisiones", label: "6. Decisiones abiertas y dependencias CEL", shortLabel: "Decisiones abiertas" },
  { id: "operacion", label: "7. Operación diaria", shortLabel: "Operación" },
  { id: "visualizacion", label: "8. Visualización y alertas", shortLabel: "Visualización" },
  { id: "infraestructura", label: "9. BOM final aprobado por CEL", shortLabel: "BOM final" },
  { id: "anexo-lempa", label: "10. Anexo Lempa", shortLabel: "Anexo Lempa" },
  { id: "raci", label: "11. Equipo y RACI", shortLabel: "Equipo y RACI" },
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

export interface FlujoStage {
  id: string;
  tag: string;
  title: string;
  summary: string;
  detailChapter?: { id: string; label: string };
}

export const FLUJO_STAGES: FlujoStage[] = [
  {
    id: "fase0",
    tag: "Fase 0",
    title: "Habilitación del silo de IA",
    summary:
      "Construcción y comisionamiento del entorno on-premise dedicado dentro del data center de CEL. Requisito previo para cualquier ingesta o entrenamiento.",
    detailChapter: { id: "infraestructura", label: "Cap. 9 — BOM final aprobado por CEL" },
  },
  {
    id: "etapa1",
    tag: "Etapa 1",
    title: "Adquisición y validación de datos",
    summary:
      "Ingesta automática de fuentes meteorológicas, hidrológicas y geoespaciales con QA/QC, normalización temporal/espacial y carga al silo.",
    detailChapter: { id: "etl", label: "Cap. 3 — Pipelines ETL con Mage" },
  },
  {
    id: "etapa2",
    tag: "Etapa 2",
    title: "Pronóstico de caudales (LSTM)",
    summary:
      "Modelo LSTM regional que proyecta caudales/niveles a 7 días en puntos clave del río.",
    detailChapter: { id: "modelos", label: "Cap. 4 — Modelos de predicción" },
  },
  {
    id: "etapa3",
    tag: "Etapa 3",
    title: "Modelado de inundación",
    summary:
      "Conversión del caudal pronosticado en extensión inundada (umbral + manifold).",
    detailChapter: { id: "modelos", label: "Cap. 4 — Modelos de predicción" },
  },
  {
    id: "etapa4",
    tag: "Etapa 4",
    title: "Alertas y visualización",
    summary:
      "Dashboard web integrado al portal CEL y alertas automáticas por umbrales a destinatarios definidos.",
    detailChapter: { id: "visualizacion", label: "Cap. 8 — Visualización y alertas" },
  },
];

export const FLUJO_OUTRO =
  "El flujo va “de datos a decisión”. Esta vista panorámica intencionalmente no repite el detalle de cada etapa: cada subsistema se desarrolla a profundidad en su capítulo dedicado (referencias arriba), y la planificación temporal y la metodología de ejecución se gestionan en sus tabs propios del portal.";

export interface FlujoCrossLink {
  label: string;
  description: string;
  href: string;
}

export const FLUJO_CROSS_LINKS: FlujoCrossLink[] = [
  {
    label: "Cronograma del proyecto",
    description: "Planificación de fases, hitos y fechas objetivo de cada etapa del flujo.",
    href: "/portal/cronograma",
  },
  {
    label: "Metodología de ejecución",
    description: "Marco metodológico, ceremonias y mecánica de avance del piloto.",
    href: "/portal/metodologia",
  },
  {
    label: "Módulo de Decisiones",
    description: "Decisiones formales que afectan transversalmente al flujo (ver también Cap. 6).",
    href: "/portal/decisiones",
  },
];

export const DATOS_INTRO =
  "El sistema aprovechará fuentes heterogéneas —meteorológicas, hidrológicas, geoespaciales y de características de cuenca— para alimentar los modelos de pronóstico. Todas las fuentes son abiertas o de acceso público. Más abajo, el registro de fuentes (data registry) consolida cada insumo con su formato, proveedor, frecuencia, tamaño aproximado, propietario y estado de confirmación con CEL.";

export type DataRegistryStatus = "confirmado" | "por-confirmar" | "por-validar-kevin";

export interface DataRegistryEntry {
  id: string;
  category: "Meteorología" | "Hidrología" | "Geoespacial" | "Atributos de cuenca";
  name: string;
  format: string;
  provider: string;
  frequency: string;
  approxSize: string;
  owner: string;
  status: DataRegistryStatus;
  note?: string;
}

export const DATA_REGISTRY: DataRegistryEntry[] = [
  {
    id: "ecmwf",
    category: "Meteorología",
    name: "ECMWF — Pronóstico numérico global",
    format: "GRIB / NetCDF",
    provider: "ECMWF (Copernicus)",
    frequency: "2 ciclos/día (00 y 12 UTC), horizonte 7 días",
    approxSize: "~1-2 GB/día tras recorte a la cuenca",
    owner: "Consultora (ingesta) → CEL (almacenamiento)",
    status: "confirmado",
  },
  {
    id: "era5",
    category: "Meteorología",
    name: "ERA5 / ERA5-Land — Reanálisis histórico",
    format: "NetCDF",
    provider: "Copernicus Climate Data Store",
    frequency: "Histórico 1980-presente, descarga única + actualizaciones",
    approxSize: "~50-100 GB para la cuenca Lempa, horizonte 40+ años",
    owner: "Consultora (descarga) → PostgreSQL/NAS CEL",
    status: "confirmado",
  },
  {
    id: "gpm",
    category: "Meteorología",
    name: "NASA GPM / IMERG — Precipitación satelital",
    format: "HDF5 / NetCDF",
    provider: "NASA GES DISC",
    frequency: "Cada 30 min, latencia ~4 h",
    approxSize: "~200-400 MB/día",
    owner: "Consultora (ingesta automática)",
    status: "confirmado",
  },
  {
    id: "chirps",
    category: "Meteorología",
    name: "CHIRPS — Precipitación interpolada Mesoamérica",
    format: "GeoTIFF",
    provider: "UCSB Climate Hazards Group",
    frequency: "Diario",
    approxSize: "~10-20 MB/día tras recorte",
    owner: "Consultora",
    status: "confirmado",
  },
  {
    id: "cel-hidro",
    category: "Hidrología",
    name: "Caudales y niveles — Estaciones hidrométricas CEL",
    format: "PostgreSQL (BD productiva CEL)",
    provider: "CEL — Unidad de Hidrología",
    frequency: "Sub-horaria a diaria según estación",
    approxSize: "Series multi-anuales; volumen TBD",
    owner: "Carlos Sánchez (DBA, CEL) — acceso solo-lectura desde silo",
    status: "por-confirmar",
    note: "Por confirmar con CEL: alcance temporal de las series, calendario de acceso y mecanismo de replicación/lectura.",
  },
  {
    id: "marn",
    category: "Hidrología",
    name: "Datos hidro-meteorológicos institucionales (SV)",
    format: "Por confirmar (CSV / API)",
    provider: "MARN El Salvador",
    frequency: "Diario u horario, según convenio",
    approxSize: "TBD",
    owner: "Coordinación interinstitucional CEL",
    status: "por-validar-kevin",
    note: "Por validar (Kevin): ¿el piloto utilizará datos del MARN? ¿existe convenio activo o se gestiona uno nuevo?",
  },
  {
    id: "trinacional",
    category: "Hidrología",
    name: "Caudales transfronterizos (Guatemala / Honduras)",
    format: "TBD",
    provider: "INSIVUMEH (GT) / SERNA (HN) — vía Plan Trifinio",
    frequency: "TBD",
    approxSize: "Disponibilidad limitada (~65-70% del caudal Lempa nace fuera de SV)",
    owner: "TBD — gestión interinstitucional",
    status: "por-validar-kevin",
    note: "Por validar (Kevin): el doc menciona vacíos en intercambio de datos transfronterizos en tiempo real. ¿Hay canal formal o se trabaja con teledetección satelital como compensación?",
  },
  {
    id: "grdc",
    category: "Hidrología",
    name: "GRDC — Global Runoff Data Centre",
    format: "CSV",
    provider: "GRDC (Alemania)",
    frequency: "Histórico, actualización periódica",
    approxSize: "Series por estación, MB-escala",
    owner: "Consultora",
    status: "confirmado",
  },
  {
    id: "mde",
    category: "Geoespacial",
    name: "Modelo Digital de Elevaciones (MDE)",
    format: "GeoTIFF",
    provider: "SRTM ~30 m (base) / LiDAR local CEL si disponible",
    frequency: "Estático",
    approxSize: "~1-5 GB para la cuenca",
    owner: "Fernando Garay (SIG, CEL)",
    status: "por-confirmar",
    note: "Por confirmar con CEL: disponibilidad y resolución del LiDAR local frente al SRTM público.",
  },
  {
    id: "sentinel1",
    category: "Geoespacial",
    name: "Sentinel-1 SAR — Mapas históricos de inundación",
    format: "SAFE / GeoTIFF procesado",
    provider: "ESA Copernicus",
    frequency: "Revisita ~6-12 días",
    approxSize: "Eventos seleccionados (~5-20 GB total)",
    owner: "Fernando Garay (SIG, CEL) + Consultora",
    status: "confirmado",
  },
  {
    id: "landcover",
    category: "Geoespacial",
    name: "Uso del suelo y cobertura terrestre",
    format: "Vector / ráster",
    provider: "CORINE Land Cover / cartografía nacional",
    frequency: "Estático, actualización plurianual",
    approxSize: "<1 GB",
    owner: "Fernando Garay (SIG, CEL)",
    status: "por-confirmar",
  },
  {
    id: "hydroatlas",
    category: "Atributos de cuenca",
    name: "HydroATLAS / HydroSheds — Atributos fisiográficos",
    format: "Vector + atributos tabulares",
    provider: "WWF / McGill",
    frequency: "Estático",
    approxSize: "<1 GB para la cuenca",
    owner: "Consultora",
    status: "confirmado",
  },
  {
    id: "subcuencas",
    category: "Atributos de cuenca",
    name: "Delimitación sub-cuencas Lempa (alta GT, media, baja SV)",
    format: "Shapefile / GeoJSON",
    provider: "Derivado del MDE por SIG CEL",
    frequency: "Estático",
    approxSize: "MB-escala",
    owner: "Fernando Garay (SIG, CEL)",
    status: "por-confirmar",
  },
];

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
  "Para convertir los datos brutos en insumos listos para modelar, se implementará una canalización moderna basada en Python orquestada por Mage. Esta decisión reemplaza Pentaho PDI para mejorar fiabilidad, observabilidad y versionamiento del código (pipelines como código en Git). El nuevo Nodo de Datos & ETL actúa como cliente dentro de la red CEL, consultando en solo-lectura PostgreSQL y MongoDB existentes; todo el procesamiento se ejecuta en el hardware dedicado del silo de IA, sin sobrecargar los sistemas productivos y manteniendo la soberanía de los datos.";

export const ETL_DIAGRAM = `flowchart LR
  subgraph EXT["1. Extracción"]
    A1[ECMWF / ERA5 / GPM / CHIRPS]
    A2[Sentinel-1 SAR]
    A3[PostgreSQL CEL solo-lectura]
    A4[MongoDB CEL solo-lectura]
  end
  STG[(2. Staging<br/>silo de IA)]
  subgraph TRF["3. Transformación"]
    T1[Homogeneización unidades / TZ]
    T2[Gap-filling y re-muestreo]
    T3[Geoespacial: media areal / SAR]
    T4[Ingeniería de features]
  end
  subgraph LOAD["4. Carga"]
    L1[(PostgreSQL + PostGIS<br/>históricos y geometrías)]
    L2[(MongoDB<br/>operativo tiempo real)]
  end
  ORC{{5. Orquestación Mage<br/>Python + Git + QA/QC}}
  EXT --> STG --> TRF --> LOAD
  ORC -.coordina.-> EXT
  ORC -.coordina.-> TRF
  ORC -.coordina.-> LOAD`;

export interface EtlStage {
  num: string;
  title: string;
  body: string;
  items: string[];
}

export const ETL_STAGES_ORDERED: EtlStage[] = [
  {
    num: "1",
    title: "Extracción automática",
    body:
      "Scripts Python dentro de Mage se conectan de forma programada a las fuentes externas e internas. Externas: APIs meteorológicas (ECMWF, ERA5, GPM, CHIRPS) e imágenes Sentinel-1. Internas: bases productivas de CEL mediante conectores específicos (psycopg2 para PostgreSQL, pymongo para MongoDB) en modo solo-lectura, sin impacto sobre los sistemas operativos.",
    items: [
      "APIs meteorológicas (GRIB / NetCDF / HDF5)",
      "Descarga de productos satelitales (GPM, Sentinel-1) con requests",
      "Conectores psycopg2 / pymongo a las DBs productivas de CEL (solo-lectura)",
      "Política de reintentos, timeouts y manejo de fallos parcial",
    ],
  },
  {
    num: "2",
    title: "Staging en el silo de IA",
    body:
      "Los datos crudos aterrizan en un área de staging dentro de las nuevas bases de datos del silo, separada de las tablas analíticas y operativas. El staging conserva el dato tal cual fue ingerido y permite reprocesar transformaciones sin volver a tocar las fuentes originales.",
    items: [
      "Esquema staging dedicado en PostgreSQL del silo",
      "Almacenamiento crudo de archivos brutos en disco/NAS para trazabilidad",
      "Metadatos de origen: timestamp de ingesta, fuente, versión del script",
    ],
  },
  {
    num: "3",
    title: "Transformación y limpieza",
    body:
      "Una vez en staging, se aplican transformaciones con el ecosistema Python (Pandas, GeoPandas, NumPy, rasterio). Cubre homogeneización temporal y espacial, limpieza de series, procesamiento geoespacial e ingeniería de variables para alimentar al LSTM.",
    items: [
      "Conversión de unidades, estandarización de zonas horarias y re-muestreo a paso común (diario)",
      "Gap-filling en series históricas: interpolación lineal, media estacional",
      "Precipitación media areal por subcuenca superponiendo máscaras del MDE sobre ERA5/GPM",
      "Sentinel-1: clasificación de agua (umbral de backscatter) → polígonos vectoriales históricos",
      "Ingeniería de features: día del año, evapotranspiración potencial (fórmulas empíricas)",
    ],
  },
  {
    num: "4",
    title: "Carga en bases de datos del silo",
    body:
      "Los datos transformados se persisten en dos repositorios del silo según su naturaleza, alineados con los consumidores aguas abajo (modelos y dashboard).",
    items: [
      "MongoDB del silo — datos operativos en tiempo real: lluvia reciente, caudales recientes, predicciones diarias (JSON flexible para el frontend)",
      "PostgreSQL + PostGIS del silo — históricos depurados, geometrías de cuenca, mapas de inundación (tipos espaciales)",
    ],
  },
  {
    num: "5",
    title: "Orquestación y QA/QC con Mage",
    body:
      "Mage coordina todos los pipelines como código Python versionado en GitLab. Cada paso integra aserciones automáticas y la interfaz de Mage permite monitorear ejecuciones, reintentos y notificar fallas. Resultado: un lago de datos unificado, reproducible y observable, listo para alimentar los modelos y la visualización.",
    items: [
      "Definición de pipelines como código (Python + Git/GitLab)",
      "Aserciones por script: caudal no negativo, lluvia dentro de rango esperado, esquemas válidos",
      "Logs estructurados, reintentos y notificaciones de error",
      "Solo datos que pasan QA/QC alimentan los modelos LSTM y de inundación",
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

export type OpenDecisionStatus = "abierta" | "en-discusion" | "bloqueada-cel" | "cerrada" | "por-validar-kevin";

export interface OpenDecision {
  id: string;
  area:
    | "Infraestructura"
    | "Redes y ciberseguridad"
    | "Datos y accesos"
    | "Stack / Software"
    | "Operación"
    | "Gobernanza"
    | "Recursos humanos";
  decision: string;
  detail: string;
  responsable: string;
  contraparteCel: string;
  fechaObjetivo: string;
  status: OpenDecisionStatus;
  decisionLink?: string;
}

export const OPEN_DECISIONS_INTRO =
  "Este capítulo consolida todas las decisiones abiertas y dependencias críticas con CEL identificadas a lo largo del documento técnico. Cada fila explicita la decisión a tomar, quién la propone, qué contraparte de CEL debe validarla o aprobarla, la fecha objetivo y el estado. Las decisiones de mayor impacto se enlazan al módulo Decisiones del portal para seguimiento formal.";

export const OPEN_DECISIONS: OpenDecision[] = [
  {
    id: "OD-01",
    area: "Infraestructura",
    decision: "Aprobación del BOM final de hardware del silo de IA",
    detail:
      "Aprobar configuración exacta de cómputo ML (CPU, RAM, NVMe), nodo Datos & ETL, NAS, switch, UPS y rack. El BOM propuesto por la consultora es scaffold; el BOM final aprobado por CEL es la base para compras.",
    responsable: "Consultora IA (propuesta) + DevOps CEL",
    contraparteCel: "Comité TI (Nelson, José Manuel, Adrián) + Lorena (autorización)",
    fechaObjetivo: "Fase 0 — antes de OC al proveedor",
    status: "bloqueada-cel",
    decisionLink: "BOM final aprobado por CEL",
  },
  {
    id: "OD-02",
    area: "Infraestructura",
    decision: "Ubicación física exacta del silo dentro del data center CEL",
    detail:
      "Rack disponible, espacio en U, alimentación eléctrica redundante y refrigeración suficiente para el nodo ML con GPU.",
    responsable: "DevOps CEL",
    contraparteCel: "Adrián (Redes/Infra) + José Manuel (Sistemas)",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-03",
    area: "Redes y ciberseguridad",
    decision: "Diseño de VLAN dedicada y ACLs del silo",
    detail:
      "Segmentación del silo en VLAN propia, reglas de ACL hacia PostgreSQL/MongoDB productivos en solo-lectura, lista blanca de IPs salientes para APIs externas (ECMWF, NASA, Sentinel).",
    responsable: "DevOps CEL (ejecuta)",
    contraparteCel: "Adrián (lineamientos) + Miladis (seguridad)",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-04",
    area: "Redes y ciberseguridad",
    decision: "Solución de VPN site-to-site / acceso remoto del consultor",
    detail:
      "Tipo de appliance, política MFA, perfiles de acceso del equipo C2Labs (qué nodos del silo y qué horarios). Soporte de Tech Circle vía la misma VPN.",
    responsable: "DevOps CEL",
    contraparteCel: "Adrián + Miladis",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-05",
    area: "Redes y ciberseguridad",
    decision: "Política de gestión de identidades y secretos",
    detail:
      "Usuarios nominales con MFA donde el stack lo soporte, gestor de secretos (Vault / KeePass / nativo CEL), llaves SSH gestionadas. Política de rotación.",
    responsable: "DevOps CEL",
    contraparteCel: "Miladis (ciberseguridad)",
    fechaObjetivo: "Fase 0 — antes de pase a producción",
    status: "abierta",
  },
  {
    id: "OD-06",
    area: "Redes y ciberseguridad",
    decision: "Pre-auditoría de ciberseguridad y redes previa a producción",
    detail:
      "Alcance de la pre-auditoría, criterios de aceptación y proceso de remediación de hallazgos.",
    responsable: "Comité TI CEL",
    contraparteCel: "Miladis + Adrián",
    fechaObjetivo: "Fase 3 — antes del go-live",
    status: "abierta",
  },
  {
    id: "OD-07",
    area: "Datos y accesos",
    decision: "Mecanismo y calendario de acceso solo-lectura a las DBs productivas",
    detail:
      "Modelo de replicación o lectura directa, usuario de servicio dedicado, alcance temporal de las series históricas que se podrán consultar y SLA del DBA para resolución de incidentes de acceso.",
    responsable: "Ingenieros de Datos (William / J. M. Herrera)",
    contraparteCel: "Carlos Sánchez (DBA) + Nelson (jefatura)",
    fechaObjetivo: "Fase 1 — antes del primer pipeline",
    status: "bloqueada-cel",
  },
  {
    id: "OD-08",
    area: "Datos y accesos",
    decision: "Disponibilidad y resolución del LiDAR local frente al SRTM público",
    detail:
      "¿CEL dispone de un MDE LiDAR de la cuenca baja que mejore al SRTM ~30 m? De confirmarse, define la calidad del modelo de inundación por umbral.",
    responsable: "Fernando Garay (SIG)",
    contraparteCel: "Unidad de Hidrología CEL",
    fechaObjetivo: "Fase 1",
    status: "abierta",
  },
  {
    id: "OD-09",
    area: "Datos y accesos",
    decision: "Integración de datos hidro-meteorológicos transfronterizos (GT/HN)",
    detail:
      "65-70% del caudal del Lempa nace fuera de El Salvador. El doc original señala vacíos en intercambio de datos en tiempo real. Definir si el piloto opera solo con teledetección (CHIRPS/GPM/Sentinel) o si se gestiona convenio con INSIVUMEH/SERNA vía Plan Trifinio.",
    responsable: "Líder Hidrología/PM CEL",
    contraparteCel: "Lorena (gobernanza interinstitucional)",
    fechaObjetivo: "Fase 1-2",
    status: "por-validar-kevin",
  },
  {
    id: "OD-10",
    area: "Datos y accesos",
    decision: "Convenio o canal con MARN para datos hidro-meteorológicos nacionales",
    detail:
      "¿El piloto utiliza datos del MARN? ¿Hay convenio activo o se gestiona uno nuevo?",
    responsable: "Líder Hidrología/PM CEL",
    contraparteCel: "Lorena (gobernanza)",
    fechaObjetivo: "Fase 1",
    status: "por-validar-kevin",
  },
  {
    id: "OD-11",
    area: "Stack / Software",
    decision: "Versión y modalidad de instalación de Mage",
    detail:
      "Versión exacta LTS, modo single-node vs cluster, gestión de actualizaciones, política de imágenes/contenedores.",
    responsable: "Consultora IA + DevOps CEL",
    contraparteCel: "José Manuel (Sistemas)",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-12",
    area: "Stack / Software",
    decision: "GitLab — instancia self-hosted en el silo vs instancia corporativa CEL",
    detail:
      "Define dónde vive el repo de pipelines, código del modelo y configuración como código; impacta CI/CD y permisos.",
    responsable: "DevOps CEL",
    contraparteCel: "José Manuel (Sistemas)",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-13",
    area: "Stack / Software",
    decision: "Mapas base: Mapbox vs OpenStreetMap (open source)",
    detail:
      "Mapbox tiene costo recurrente y mejor UX cartográfica; OSM es gratuito y soberano. Decisión basada en políticas TI y presupuesto operativo.",
    responsable: "Consultora IA",
    contraparteCel: "Comité TI + Hidrólogo Operativo",
    fechaObjetivo: "Fase 3",
    status: "abierta",
  },
  {
    id: "OD-14",
    area: "Stack / Software",
    decision: "Stack de monitoreo y backup (Prometheus/Grafana, restic/Borg)",
    detail:
      "Versiones, hospedaje (en el silo o en infraestructura corporativa), integración con el SOC de CEL si aplica.",
    responsable: "DevOps CEL",
    contraparteCel: "José Manuel + Miladis",
    fechaObjetivo: "Fase 0",
    status: "abierta",
  },
  {
    id: "OD-15",
    area: "Operación",
    decision: "Umbrales cuantitativos de alerta (verde / amarilla / roja) por sitio",
    detail:
      "Definir, en m³/s o cm, los umbrales por punto de control (p. ej. periodo de retorno 2, 5, 10 años). Insumo crítico del módulo de alertas.",
    responsable: "Hidrólogo Operativo (Víctor Alabi)",
    contraparteCel: "Líder Hidrología/PM",
    fechaObjetivo: "Fase 2-3",
    status: "abierta",
  },
  {
    id: "OD-16",
    area: "Operación",
    decision: "Listas de destinatarios y canales por nivel de alerta",
    detail:
      "Quién recibe email, quién recibe SMS, escalamiento entre niveles, frecuencia mínima entre alertas para evitar fatiga.",
    responsable: "Hidrólogo Operativo + Líder Hidrología/PM",
    contraparteCel: "Lorena (gobernanza institucional)",
    fechaObjetivo: "Fase 3",
    status: "abierta",
  },
  {
    id: "OD-17",
    area: "Operación",
    decision: "RTO/RPO objetivo y plan de DR del silo",
    detail:
      "Tiempo objetivo de recuperación y punto de recuperación tras un desastre. Define el dimensionamiento del NAS, la frecuencia de snapshots y la documentación de re-instalación.",
    responsable: "DevOps CEL",
    contraparteCel: "Miladis + José Manuel",
    fechaObjetivo: "Fase 3",
    status: "abierta",
  },
  {
    id: "OD-18",
    area: "Recursos humanos",
    decision: "Asignación nominal del Ingeniero DevOps / Enlace operativo (FTE 1.0)",
    detail:
      "Identificar al recurso interno 100% dedicado durante la fase de ejecución. Refresh abril 2026: pendiente confirmación de staffing.",
    responsable: "Comité TI CEL",
    contraparteCel: "Lorena (autoriza) + Nelson",
    fechaObjetivo: "Fase 0",
    status: "bloqueada-cel",
  },
  {
    id: "OD-19",
    area: "Gobernanza",
    decision: "SLAs entre el Comité Consultivo y la operación del piloto",
    detail:
      "Tiempos de respuesta del Comité para aprobaciones (accesos, cambios de red, despliegues). Cadencia de revisiones y formato de actas. Refresh abril 2026: pendiente afinar antes de oficializar.",
    responsable: "Lorena + Líder Hidrología/PM",
    contraparteCel: "Comité TI (todos)",
    fechaObjetivo: "Fase 0",
    status: "en-discusion",
  },
  {
    id: "OD-20",
    area: "Gobernanza",
    decision: "Esquema de aprobación de cambios en producción",
    detail:
      "Workflow para cambios de código del modelo, pipelines ETL, umbrales de alerta y configuración de infraestructura una vez en producción.",
    responsable: "DevOps CEL + Consultora IA",
    contraparteCel: "Comité TI",
    fechaObjetivo: "Fase 3",
    status: "abierta",
  },
];

export const DECISIONES_CONFIRMADAS_INTRO =
  "Decisiones técnicas ya cerradas o adoptadas en el diseño base. Se incluyen como referencia; los puntos abiertos se gestionan en la tabla superior.";

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

export interface CelResponsibility {
  area: "Informática (Comité)" | "Hidrología" | "Operativo";
  role: string;
  responsibilities: string[];
  accesos: string[];
  sla: string;
  inputs: string[];
}

export const CEL_DAILY_RESPONSIBILITIES_INTRO =
  "La operación diaria del piloto descansa en una colaboración explícita entre el equipo del piloto y CEL. Esta sección detalla, para cada área de CEL, qué hace en el día a día, qué accesos requiere, el SLA esperado del Comité y los inputs que debe proveer al sistema.";

export const CEL_DAILY_RESPONSIBILITIES: CelResponsibility[] = [
  {
    area: "Informática (Comité)",
    role: "Comité Consultivo de TI + Ingeniero DevOps de enlace",
    responsibilities: [
      "Garantizar la disponibilidad del silo (cómputo, red, energía) dentro del data center CEL.",
      "Aprobar y aplicar cambios de configuración en red, accesos y stack del silo.",
      "Custodiar las credenciales y secretos; rotar accesos del consultor según política.",
      "Mantener el monitoreo de hardware, GPU y servicios base (Prometheus/Grafana).",
      "Ejecutar respaldos al NAS y verificar restauraciones periódicas.",
    ],
    accesos: [
      "Acceso root al silo (DevOps) bajo control del Comité.",
      "Acceso al panel de monitoreo y al gestor de secretos.",
      "Acceso solo-lectura a las DBs productivas (usuario de servicio para los pipelines).",
    ],
    sla: "Respuesta del Comité a solicitudes operativas críticas: por definir formalmente (target propuesto: 4 horas hábiles para incidentes; 2 días hábiles para cambios planificados).",
    inputs: [
      "Estado de salud del silo (uptime, alertas de hardware/red).",
      "Confirmación de que los respaldos diarios completaron correctamente.",
      "Notificación temprana de mantenimientos planificados en la red CEL.",
    ],
  },
  {
    area: "Hidrología",
    role: "Líder Hidrología/PM + Ingenieros de Datos",
    responsibilities: [
      "Validar diariamente la coherencia hidrológica de los pronósticos vs observado.",
      "Gestionar la calidad de las series hidrométricas y reportar estaciones con problemas.",
      "Mantener el catálogo de puntos de control y umbrales con el equipo operativo.",
      "Coordinar el re-entrenamiento periódico del modelo con datos frescos.",
    ],
    accesos: [
      "Dashboard del piloto con vista experta (hidrogramas, métricas, residuales).",
      "PostgreSQL del silo en lectura para análisis ad-hoc.",
    ],
    sla: "Revisión técnica del pronóstico diario en ventana matinal post-corrida 00 UTC.",
    inputs: [
      "Eventos hidrológicos relevantes (mantenimientos de embalse, fallos de estación).",
      "Cambios en la red de estaciones o en la operación de presas.",
      "Validación final de los re-entrenamientos del LSTM antes de pasar a producción.",
    ],
  },
  {
    area: "Operativo",
    role: "Hidrólogo Operativo (Víctor Alabi)",
    responsibilities: [
      "Usuario principal del sistema: monitoreo diario del desempeño e interpretación de alertas.",
      "Activación de protocolos de aviso ante alertas amarilla/roja según procedimientos CEL.",
      "Retroalimentación continua sobre falsos positivos/negativos y mejoras de UX.",
      "Validador final de coherencia y utilidad operativa de los resultados del modelo.",
    ],
    accesos: [
      "Dashboard operativo (mapa, hidrogramas, alertas, histórico).",
      "Canales de notificación (email, SMS) y lista de destinatarios.",
    ],
    sla: "Revisión operativa al menos dos veces al día tras las corridas (00 UTC y 12 UTC). En eventos críticos: monitoreo continuo.",
    inputs: [
      "Observaciones de campo y reportes de afectación.",
      "Ajustes finos a umbrales de alerta según experiencia operativa.",
    ],
  },
];

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
  integration: {
    title: "Integración con el portal CEL",
    body:
      "El dashboard se aloja en el Nodo de Aplicación del silo y se expone únicamente en la intranet de CEL, tras los firewalls corporativos. Consume MongoDB para el estado operativo en vivo y PostgreSQL/PostGIS para históricos y capas geoespaciales. La autenticación se integra con el directorio interno de CEL bajo los lineamientos del Comité de TI; los permisos se segmentan por perfil (operativo, hidrología técnica, administrador).",
    bullets: [
      "Frontend React + Vite empaquetado y servido desde el silo.",
      "API Node.js que media entre el frontend y las DBs del silo.",
      "SSO / autenticación corporativa — modalidad por confirmar con CEL.",
      "Perfiles diferenciados: vista operativa simplificada vs vista experta con métricas y residuales.",
    ],
  },
  training: {
    title: "Capacitación, ejercicios y adopción",
    body:
      "El éxito del piloto depende de que CEL adopte y opere el sistema con confianza. La consultora entrega capacitación estructurada al equipo operativo y técnico, y se realizan ejercicios de mesa (tabletop) y simulacros con eventos históricos para calibrar protocolos.",
    bullets: [
      "Manual operativo y sesiones de onboarding al Hidrólogo Operativo y a Hidrología técnica.",
      "Capacitación al DevOps de enlace sobre el stack (Mage, GitLab, Prometheus/Grafana).",
      "Ejercicios con eventos históricos (p. ej. Stan, evento 2011) para validar respuesta del sistema y de los protocolos.",
      "Retroalimentación estructurada del usuario operativo durante los primeros meses (operación semi-supervisada).",
    ],
  },
};

export const INFRA_TECNICA_INTRO =
  "Este capítulo consolida las decisiones técnicas e informáticas que dan soporte al desarrollo y operación diaria del sistema: entorno de desarrollo y lenguajes, bases de datos y almacenamiento en el silo de IA, integración con servicios externos (con costos marginales o nulos), y consideraciones de seguridad y disponibilidad. Complementa la arquitectura on-premise con los componentes de cómputo (GPU) y los puntos de integración con APIs externas necesarios para la ingesta y operación.";

export interface InfraTecnicaBlock {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
}

export const INFRA_TECNICA_BLOCKS: InfraTecnicaBlock[] = [
  {
    id: "entorno",
    title: "Entorno de desarrollo y lenguajes",
    body: "La implementación del modelo LSTM y de inundación se realizará en Python, aprovechando bibliotecas científicas (NumPy, Pandas, GeoPandas) y de deep learning (PyTorch, NeuralHydrology). El entorno Node.js/React existente en CEL se utilizará para el dashboard web, conectado a las nuevas bases de datos vía APIs seguras. La orquestación y automatización del flujo se gestiona con Mage y se versiona con Git/GitLab.",
  },
  {
    id: "bases-datos",
    title: "Bases de datos y almacenamiento",
    body: "Se utilizarán MongoDB y PostgreSQL/PostGIS residentes en el nuevo Nodo de Datos & ETL dedicado. Esta configuración asegura que las operaciones intensivas de lectura/escritura del proyecto de IA no afecten el rendimiento de las bases de datos productivas existentes de CEL. El esquema de respaldo se gestiona a través del nodo NAS dedicado.",
  },
  {
    id: "gpu",
    title: "Recursos GPU para entrenamiento e inferencia",
    body: "El entrenamiento y la inferencia del LSTM se ejecutan localmente en el silo de IA sobre GPU dedicada (ver capítulo de Silo de IA y BOM para especificaciones). Esto permite tiempos de inferencia de segundos a minutos en operación diaria y elimina costos recurrentes y dependencias de servicios cloud para el cómputo del modelo.",
  },
];

export interface ExternalService {
  id: string;
  name: string;
  category: "Meteorología" | "Mapas" | "Notificaciones" | "Procesamiento satelital";
  scope: string;
  detail: string;
  cost: "Gratuito" | "Costo marginal" | "Opcional";
}

export const EXTERNAL_SERVICES: ExternalService[] = [
  {
    id: "meteo",
    name: "Copernicus / ECMWF + NASA POWER / IMERG",
    category: "Meteorología",
    scope: "Obtención de pronósticos meteorológicos y datos de lluvia observada.",
    detail:
      "APIs abiertas y gratuitas. Se requiere conexión a internet estable y mecanismos de redundancia y reintentos en los scripts de ingesta para garantizar disponibilidad.",
    cost: "Gratuito",
  },
  {
    id: "mapas",
    name: "Mapbox / OpenStreetMap",
    category: "Mapas",
    scope: "Servicios de mapas base para la visualización en el dashboard web.",
    detail:
      "Se evaluará Mapbox vs. una solución de código abierto (OpenStreetMap) para eliminar costos recurrentes. La decisión se tomará junto a CEL según requerimientos visuales y políticas de TI.",
    cost: "Opcional",
  },
  {
    id: "notif",
    name: "Twilio (SMS) + SMTP CEL (Email)",
    category: "Notificaciones",
    scope: "Envío de alertas críticas por SMS y correos electrónicos.",
    detail:
      "Los correos se envían a través del servidor SMTP existente de CEL. Para SMS críticos se utilizará un gateway como Twilio, cuyo costo es insignificante dado el bajo volumen de alertas esperado.",
    cost: "Costo marginal",
  },
  {
    id: "gee",
    name: "Google Earth Engine (GEE)",
    category: "Procesamiento satelital",
    scope: "Apoyo opcional durante la fase de desarrollo para análisis geoespaciales.",
    detail:
      "Uso únicamente exploratorio para acelerar análisis. No se integra al flujo de producción para mantener la independencia respecto de servicios cloud.",
    cost: "Opcional",
  },
];

export const INFRA_TECNICA_SEGURIDAD =
  "La aplicación web y las bases de datos residen en los servidores del silo de IA, protegidas por los firewalls de CEL. La redundancia se logra a nivel de componentes de hardware (PSU, RAID) y con una política robusta de respaldos en el nodo NAS. No se contempla replicación en la nube para el piloto. Esta arquitectura on-premise cumple las políticas de seguridad y soberanía de datos de CEL, maximiza la inversión en capacidad interna y minimiza dependencias y costos recurrentes de servicios externos.";

export const RACI_INTRO =
  "Este capítulo consolida el equipo del piloto: estructura operativa con asignación de esfuerzo (FTE), perfiles técnicos con personas asignadas, detalle de tareas por fase y matriz RACI completa. Refleja el refresh acordado con CEL en abril de 2026, que enmarca a la Unidad de Informática como Comité Consultivo de gobernanza y centraliza la ejecución operativa en un único Ingeniero DevOps de enlace.";

export const FTE_BREAKDOWN: {
  label: string;
  fte: string;
  scope: string;
  detail: string;
  tone: "external" | "committee" | "operational";
}[] = [
  {
    label: "Tech Circle (soporte remoto)",
    fte: "0.3",
    scope: "30 horas de soporte técnico contratadas vía el proveedor de hardware.",
    detail:
      "Acompañamiento remoto para guiar el desarrollo del piloto y resolver bloqueos puntuales de arquitectura, hardware y stack de orquestación.",
    tone: "external",
  },
  {
    label: "Comité Consultivo de TI (6 roles)",
    fte: "0.35 compartido",
    scope:
      "Lorena, Nelson, José Manuel, Carlos Sánchez, Adrián y Miladis (Unidad de Informática de CEL).",
    detail:
      "No tiene rol operativo diario. Funciona como comité que autoriza, informa y dicta cómo proceder en ciberseguridad, acceso a datos, infraestructura, redes y aprobaciones formales.",
    tone: "committee",
  },
  {
    label: "Ingeniero DevOps / Enlace operativo",
    fte: "1.0",
    scope: "Recurso 100% operativo durante la fase de ejecución (asignación TBD).",
    detail:
      "Único punto de contacto entre el equipo del piloto y la Unidad de Informática. Ejecuta la implementación técnica siguiendo estrictamente los lineamientos del Comité, aprovechando su conocimiento interno de la infraestructura de CEL.",
    tone: "operational",
  },
];

export interface TeamProfile {
  id: string;
  role: string;
  person: string;
  scope: "Externo" | "Interno CEL";
  responsibilities: string[];
}

export const TEAM_PROFILES: TeamProfile[] = [
  {
    id: "consultora",
    role: "Consultora Líder en IA e Ingeniería de Datos",
    person: "Equipo C2Labs",
    scope: "Externo",
    responsibilities: [
      "Diseño, desarrollo e implementación del modelo basado en redes neuronales LSTM.",
      "Estrategia de ingeniería de datos con Mage y diseño del dashboard web.",
      "Guía remota al equipo de CEL: especificaciones técnicas, sesiones de co-desarrollo de código y supervisión de la arquitectura.",
      "Liderazgo de la documentación técnica exhaustiva del proyecto.",
    ],
  },
  {
    id: "pm-hidrologia",
    role: "Líder Técnico en Hidrología y Gerente de Proyecto",
    person: "José Mauricio (CEL)",
    scope: "Interno CEL",
    responsibilities: [
      "Supervisión integral de la ejecución: cronogramas, comunicación interinstitucional y asignación de recursos.",
      "Orientación experta y conocimiento empírico del río Lempa.",
      "Interpretación de la dinámica hidrológica y validación de coherencia operativa de las predicciones.",
    ],
  },
  {
    id: "devops",
    role: "Administrador de Sistemas / Ingeniero DevOps",
    person: "Enlace operativo (TBD)",
    scope: "Interno CEL",
    responsibilities: [
      "Enlace directo entre el Comité de Informática y el equipo del piloto.",
      "Liderazgo de la implementación física y configuración del AI Silo, ejecutando estrictamente los lineamientos del Comité.",
      "Instalación de Mage y configuración del repositorio Git/GitLab; bases para CI/CD y mantenibilidad.",
    ],
  },
  {
    id: "datos",
    role: "Ingenieros de Datos y Backend",
    person: "William Juárez / José Mauricio Herrera (CEL)",
    scope: "Interno CEL",
    responsibilities: [
      "Migración de la lógica de negocio a los nuevos pipelines en Python con Mage.",
      "Pair programming con la consultora para desarrollar, probar y desplegar flujos ETL como código.",
      "Coordinación estrecha con el DBA (Carlos Sánchez) para asegurar el flujo correcto de datos históricos y en tiempo real.",
    ],
  },
  {
    id: "sig",
    role: "Especialista SIG / Teledetección",
    person: "Fernando Garay (CEL)",
    scope: "Interno CEL",
    responsibilities: [
      "Procesamiento local de imágenes satelitales (Sentinel-1) siguiendo metodologías y scripts provistos.",
      "Preparación del Modelo Digital de Elevación (DEM) y capas cartográficas.",
      "Colaboración estrecha con la consultora en los aspectos geoespaciales del proyecto.",
    ],
  },
  {
    id: "operacion",
    role: "Hidrólogo Operativo",
    person: "Víctor Alabi (CEL)",
    scope: "Interno CEL",
    responsibilities: [
      "Usuario principal del sistema durante todo el proyecto.",
      "Monitoreo diario del desempeño e interpretación de alertas.",
      "Validador final de coherencia y utilidad operativa de los resultados del modelo.",
    ],
  },
];

export interface CommitteeMember {
  name: string;
  area: string;
  responsibility: string;
}

export const COMMITTEE_INTRO =
  "Comité multidisciplinario de la Unidad de Informática de CEL. No ejecuta desarrollo diario: actúa como ente rector que autoriza, dicta lineamientos y define cómo la solución residirá y se integrará de manera segura en la infraestructura de CEL.";

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    name: "Lorena",
    area: "Gobernanza y Autorizaciones",
    responsibility:
      "Toma de decisiones de alto nivel, asignación de personal y enlace entre dependencias de CEL. Principal stakeholder no operativo.",
  },
  {
    name: "Nelson",
    area: "Jefatura de DB y Redes",
    responsibility:
      "Aprueba accesos y sistemas; dicta lineamientos sobre cómo alojar la solución a nivel de servidores y redes internas.",
  },
  {
    name: "José Manuel",
    area: "Administración de OS y Aplicaciones",
    responsibility:
      "Lineamientos sobre sistemas operativos y aplicaciones que correrán en el AI Silo; aprobación de stacks de software.",
  },
  {
    name: "Carlos Sánchez",
    area: "DBA — Bases de datos",
    responsibility:
      "Define la gobernanza de las bases de datos del piloto (topografía, DEMs, GIS). Interdependencia crítica con los Ingenieros de Datos para replicación y accesos al ground truth.",
  },
  {
    name: "Adrián",
    area: "Redes e Infraestructura",
    responsibility:
      "Configuración de entornos: VLANs, túneles VPN, listas blancas de IPs. Pre-auditorías de red antes del pase a producción.",
  },
  {
    name: "Miladis",
    area: "Ciberseguridad",
    responsibility:
      "Lineamientos de seguridad y pre-auditorías de ciberseguridad de la solución antes del pase a producción.",
  },
];

export interface PhaseTask {
  task: string;
  responsible: string;
  notes: string;
}

export interface PhaseTaskGroup {
  phaseId: "F0" | "F1" | "F2" | "F3";
  title: string;
  tasks: PhaseTask[];
}

export const PHASE_TASKS: PhaseTaskGroup[] = [
  {
    phaseId: "F0",
    title: "Fase 0 — Infraestructura",
    tasks: [
      {
        task: "Diseño del entorno técnico y arquitectura general",
        responsible: "Consultora IA",
        notes: "Define especificaciones técnicas para AI Silo, Git y Mage.",
      },
      {
        task: "Definición de lineamientos, políticas de red y seguridad",
        responsible: "Comité de Informática (CEL)",
        notes:
          "Nelson, Adrián, Miladis y José Manuel dictan reglas, IPs y accesos. Lorena autoriza.",
      },
      {
        task: "Montaje físico de servidores e infraestructura (AI Silo) y configuración de red",
        responsible: "DevOps (CEL)",
        notes: "Ejecuta basándose en los lineamientos del Comité y guía remota de la consultora.",
      },
      {
        task: "Instalación de Mage, GitLab y entorno base de orquestación",
        responsible: "DevOps (CEL)",
        notes: "Consultora provee documentación y soporte remoto.",
      },
    ],
  },
  {
    phaseId: "F1",
    title: "Fase 1 — Preparación de datos",
    tasks: [
      {
        task: "Aprobación y provisión de accesos a fuentes de datos (DBs, GIS)",
        responsible: "Carlos Sánchez (DBA, CEL)",
        notes: "Interdependencia crítica para proveer el entorno de datos ground truth.",
      },
      {
        task: "Migración de lógica de negocio a nuevos pipelines",
        responsible: "William Juárez / José Mauricio Herrera (CEL)",
        notes: "Pair programming con la consultora.",
      },
      {
        task: "Desarrollo de flujos ETL en Python usando Mage",
        responsible: "Consultora IA + Ingenieros de Datos CEL",
        notes: "Validación cruzada conjunta.",
      },
      {
        task: "Pruebas de integración de pipelines con fuentes internas",
        responsible: "William / José Mauricio (CEL)",
        notes: "Consultora supervisa.",
      },
    ],
  },
  {
    phaseId: "F2",
    title: "Fase 2 — Modelado IA",
    tasks: [
      {
        task: "Desarrollo e implementación del modelo LSTM",
        responsible: "Consultora IA",
        notes: "Apoyo conceptual del líder hidrológico.",
      },
      {
        task: "Selección y justificación de variables de entrada",
        responsible:
          "Consultora IA + Líder Hidrología/PM + Hidrólogo Operativo + Fernando Garay + William/José Mauricio",
        notes: "Basado en contexto del Lempa.",
      },
      {
        task: "Entrenamiento y validación cruzada del modelo",
        responsible: "Consultora IA",
        notes: "Iteración con CEL.",
      },
      {
        task: "Documentación del modelo y resultados de validación",
        responsible: "Consultora IA",
        notes: "Base para publicaciones y capacitación futura.",
      },
    ],
  },
  {
    phaseId: "F3",
    title: "Fase 3 — Visualización y operación",
    tasks: [
      {
        task: "Implementación del dashboard web",
        responsible: "Consultora IA",
        notes: "Entorno React + GIS, seguimiento remoto.",
      },
      {
        task: "Generación de mapas estáticos y capas cartográficas",
        responsible: "Fernando Garay (CEL)",
        notes: "Con scripts provistos por la consultora.",
      },
      {
        task: "Pre-auditoría de ciberseguridad y redes para pase a producción",
        responsible: "Comité de Informática (CEL)",
        notes: "Adrián y Miladis verifican cumplimiento de lineamientos de seguridad.",
      },
      {
        task: "Validación funcional y operativa del sistema",
        responsible: "Líder Hidrología/PM + Hidrólogo Operativo (CEL)",
        notes: "Usuario principal del sistema.",
      },
      {
        task: "Ajuste final basado en retroalimentación",
        responsible: "Consultora IA + Equipo CEL",
        notes: "Mejora continua antes del cierre técnico.",
      },
    ],
  },
];

export interface RaciRole {
  short: string;
  full: string;
}

export const RACI_ROLES: RaciRole[] = [
  { short: "Consultora IA", full: "Consultora IA (Equipo C2Labs)" },
  { short: "Líder/PM", full: "José Mauricio — Líder Hidrología y PM (CEL)" },
  { short: "Comité TI", full: "Comité de Informática — Autorización y Gobernanza" },
  { short: "DevOps", full: "DevOps / Enlace (TBD)" },
  { short: "Datos", full: "William / José Mauricio Herrera (Datos)" },
  { short: "SIG", full: "Fernando Garay (SIG)" },
  { short: "Operaciones", full: "Víctor Alabi (Operaciones)" },
];

export const RACI_TASKS: { task: string; note?: string; values: string[] }[] = [
  { task: "Diseño arquitectura AI", values: ["R/A", "C", "C", "I", "C", "I", "I"] },
  { task: "Definición de lineamientos y permisos TI", values: ["C", "I", "A/R", "I", "I", "I", "I"] },
  { task: "Implementación infraestructura (Fase 0)", values: ["C", "I", "A", "R", "I", "I", "I"] },
  { task: "Configuración Mage + GitLab", values: ["C/A", "I", "I", "R", "I", "I", "I"] },
  { task: "Gobernanza y provisión de accesos a DBs", note: "Comité: Carlos S.", values: ["I", "I", "A/R", "I", "C", "I", "I"] },
  { task: "Desarrollo pipelines ETL", values: ["R/C", "I", "I", "I", "R/A", "I", "I"] },
  { task: "Validación pipelines", values: ["A/R", "C", "I", "I", "R", "I", "I"] },
  { task: "Diseño y entrenamiento IA", values: ["R/A", "C/I", "I", "I", "C", "I", "C"] },
  { task: "Visualización (dashboard)", values: ["R", "I", "I", "I", "I", "C", "C"] },
  { task: "Cartografía y mapas SIG", values: ["C/A", "I", "I", "I", "I", "R", "I"] },
  { task: "Pre-auditoría y pase a producción", values: ["C", "I", "A", "R", "I", "I", "I"] },
  { task: "Validación operacional", values: ["C", "I", "I", "I", "I", "I", "R/A"] },
  { task: "Gestión y coordinación general", note: "Comité: Lorena (A/I)", values: ["C", "R/A", "A/I", "I", "I", "I", "I"] },
];

export const RACI_LEGEND = [
  { k: "R", v: "Responsable directo de ejecutar y desarrollar la tarea." },
  { k: "A", v: "Aprobador final, con autoridad y responsabilidad definitiva." },
  { k: "C", v: "Consultado para contribuir técnicamente, brindar lineamientos o validar." },
  { k: "I", v: "Informado del progreso y de los entregables clave." },
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
  "El silo de IA es un entorno on-premise dedicado, instalado dentro del data center de CEL, que aloja el pipeline completo de pronóstico hidrológico (ingesta, ETL, entrenamiento y servicio del modelo, base histórica y dashboard). Opera como cliente en solo-lectura sobre las bases productivas de CEL (PostgreSQL y MongoDB) y mantiene aislado todo el cómputo intensivo, evitando impacto en los sistemas operativos del negocio.";

export const INFRA_BOM_DISCLAIMER =
  "Importante — Este capítulo es el scaffold del BOM final aprobado por CEL. El BOM definitivo (modelos, fabricantes, cantidades, costos y cronograma de compra) se cerrará en sesión conjunta con el Comité de TI antes de la orden de compra. Hasta entonces, cada ítem está marcado como “Por confirmar con CEL — BOM final”. La consultora aporta especificaciones técnicas mínimas; CEL aprueba los modelos y proveedores según sus políticas internas (decisión OD-01 en el capítulo de Decisiones abiertas).";

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
