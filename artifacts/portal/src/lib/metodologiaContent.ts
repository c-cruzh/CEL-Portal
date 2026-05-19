export const METODOLOGIA_INTRO =
  "Una estrategia de pronóstico hidrológico aumentada por IA que combina datos hidrometeorológicos históricos, la experiencia de dominio de los hidrólogos de CEL y aprendizaje automático moderno para producir pronósticos operativos de caudales del Río Lempa. El enfoque prioriza el modelado híbrido (datos + hidrología), la validación continua contra el baseline operativo y un despliegue progresivo a través de un portal interno de uso institucional.";

export type HighLevelPhase = {
  id: string;
  number: string;
  title: string;
  purpose: string;
  icon: "data" | "model" | "ops";
};

export const METODOLOGIA_HIGH_LEVEL: HighLevelPhase[] = [
  {
    id: "datos-dominio",
    number: "1",
    title: "Datos + Dominio",
    purpose:
      "Series hidrometeorológicas y experiencia operativa de CEL, validadas en conjunto.",
    icon: "data",
  },
  {
    id: "modelado-hibrido",
    number: "2",
    title: "Modelado Híbrido",
    purpose:
      "Aprendizaje automático moderno contrastado contra el baseline operativo actual.",
    icon: "model",
  },
  {
    id: "despliegue-progresivo",
    number: "3",
    title: "Despliegue Progresivo",
    purpose:
      "Portal interno y operación supervisada por hidrología antes de cualquier escalamiento.",
    icon: "ops",
  },
];

export const METODOLOGIA_PILARES = [
  {
    id: "datos-dominio",
    title: "Datos + Dominio",
    body: "Combinamos series hidrometeorológicas históricas, datos en tiempo real y la experiencia operativa de los hidrólogos de CEL. Los datos no se modelan en vacío: cada decisión técnica se contrasta con el conocimiento del comportamiento real de las cuencas del Río Lempa.",
  },
  {
    id: "modelado-hibrido",
    title: "Modelado Híbrido",
    body: "El piloto explora un enfoque híbrido que integra técnicas modernas de aprendizaje automático con el entendimiento hidrológico tradicional. El criterio de éxito no es la métrica estadística aislada, sino la mejora demostrable frente al pronóstico operativo actual.",
  },
  {
    id: "despliegue-progresivo",
    title: "Despliegue Progresivo",
    body: "El sistema se entrega a través de un portal interno (este mismo portal extendido) que se construye en paralelo al modelo. La operación se valida supervisada por hidrología antes de cualquier decisión de escalamiento.",
  },
];

export const INFRA_AI_SILO = {
  intro:
    "La Fase 0 establece la base tecnológica sobre la cual se construirá todo el proyecto. El éxito de las fases subsecuentes depende críticamente de un entorno de alto rendimiento, seguro y escalable, implementado desde el primer día. Esta etapa se enfoca en la creación de un \u201CSilo de IA\u201D dedicado on-premise para CEL, asegurando que los recursos computacionales y de almacenamiento estén optimizados para cargas de machine learning sin competir con otros sistemas de producción.",
  objective:
    "Implementar, configurar y validar la infraestructura de hardware y el stack de software completos que servirán como cimiento para el sistema de pronóstico. El objetivo final es entregar a CEL un entorno llave en mano, listo para el desarrollo.",
  actividades: [
    {
      id: "comisionamiento",
      title: "Comisionamiento de infraestructura física",
      body: "En colaboración con el equipo de TI de CEL, supervisar la adquisición, instalación física (racking) y conexión eléctrica y de red de los 3 nodos de servidores especificados: ML/Compute, Data/ETL y Backup NAS. Se valida que cada componente cumpla con las especificaciones técnicas requeridas.",
    },
    {
      id: "red-seguridad",
      title: "Configuración de red y seguridad",
      body: "Diseñar e implementar la arquitectura de red aislada para el AI Silo. Esto incluye la configuración de VLANs, firewalls y políticas de acceso. Se trabaja estrechamente con el equipo de seguridad de CEL para configurar y validar el canal de acceso remoto seguro (VPN), permitiendo la colaboración y el desarrollo desde Boston.",
    },
    {
      id: "software-stack",
      title: "Instalación y configuración del stack de software",
      body: "Desplegar y configurar todo el software base: sistemas operativos (Ubuntu Server LTS), bases de datos (PostgreSQL/PostGIS, MongoDB) y, crucialmente, la herramienta de orquestación de flujos de trabajo (Mage). Incluye el establecimiento de mejores prácticas para gestión de dependencias y entornos virtuales de Python.",
    },
    {
      id: "benchmark",
      title: "Validación y pruebas de esfuerzo (benchmarking)",
      body: "Ejecutar una serie de pruebas para certificar la estabilidad y el rendimiento del entorno. Se realizan benchmarks de la GPU, pruebas de velocidad de E/S en discos NVMe y SSD, y pruebas de conectividad de red entre los nodos y con las fuentes de datos externas.",
    },
  ],
  entregable:
    "Documento de \u201CCertificación de Entorno Operacional\u201D que detalle la configuración final de hardware y software, los resultados de las pruebas de rendimiento y la confirmación de un acceso remoto seguro y funcional. Este entregable marca la conclusión exitosa de la Fase 0 y el inicio formal del desarrollo del piloto de IA.",
  rolesCEL: [
    "Administrador de Sistemas / Ingeniero DevOps (CEL): rol protagónico — lidera la implementación física y la configuración de la nueva infraestructura siguiendo la guía remota de la consultora.",
    "Equipo de seguridad de CEL: configuración y validación del canal VPN y políticas de acceso al silo.",
    "Equipo de TI de CEL: adquisición, racking, conexión eléctrica y de red de los nodos.",
  ],
};

export type InfraFaseOperativa = {
  id: string;
  titulo: string;
  resumen: string;
  componentes: string[];
  rolCEL: string;
  needsHumanReview?: boolean;
  reviewNote?: string;
};

export const INFRA_FASES_OPERATIVAS: InfraFaseOperativa[] = [
  {
    id: "F1",
    titulo: "Fase 1 — Infraestructura de datos",
    resumen:
      "Sobre el silo de IA certificado en la Fase 0 se despliega la capa de datos del piloto. Los pipelines de ETL se escriben como código Python orquestado por Mage, versionado en Git/GitLab.",
    componentes: [
      "Pipelines ETL en Mage que se conectan en modo solo lectura a los PostgreSQL y MongoDB existentes de CEL, sin sobrecargar los sistemas de producción.",
      "Base de staging en el silo de IA donde aterrizan los datos crudos de fuentes externas (ECMWF, GPM/IMERG, ERA5, CHIRPS, Sentinel-1, HydroATLAS).",
      "Repositorio Git/GitLab como fuente única de verdad para los pipelines, habilitando control de versiones, code review y CI.",
      "PostgreSQL/PostGIS para series históricas y capas geoespaciales; MongoDB para datos operativos en tiempo real consumidos por el dashboard.",
    ],
    rolCEL:
      "Ingenieros de Datos y Backend de CEL trabajan en pair programming con la consultora migrando lógica de negocio existente a los nuevos pipelines en Python. SIG/Teledetección de CEL valida el procesamiento geoespacial.",
  },
  {
    id: "F2",
    titulo: "Fase 2 — Infraestructura de modelado",
    needsHumanReview: true,
    reviewNote:
      "El doc original no separa explícitamente el versionado de experimentos/MLOps entre F2 y F3. Aquí lo asignamos a F2 (modelado) por estar ligado a entrenamiento.",
    resumen:
      "El entrenamiento del modelo LSTM se ejecuta sobre la GPU NVIDIA RTX 4090 (24 GB VRAM) del nodo ML/Compute, aprovechando el paralelismo para manejar grandes volúmenes de datos en menos tiempo.",
    componentes: [
      "Stack PyTorch + NeuralHydrology desplegado en el nodo ML/Compute del silo.",
      "Búsqueda automatizada de hiperparámetros con Optuna integrado a PyTorch, ejecutando decenas de corridas en paralelo sobre la GPU.",
      "Versionado de experimentos, modelos y artefactos vinculado al repositorio Git/GitLab establecido en la Fase 0.",
      "Almacenamiento de datasets de entrenamiento y validación sobre los discos NVMe del nodo Data/ETL, con respaldo en el nodo Backup NAS.",
    ],
    rolCEL:
      "Líder Técnico en Hidrología de CEL acompaña la selección de variables de entrada y la validación de patrones aprendidos, asegurando coherencia con el comportamiento real del Río Lempa.",
  },
  {
    id: "F3",
    titulo: "Fase 3 — Infraestructura de servicio",
    resumen:
      "Se construye la canalización en tiempo real y la web app sobre la misma infraestructura on-premise, de manera que CEL conserve soberanía total sobre datos, modelos y pronósticos.",
    componentes: [
      "Scheduler diario que ejecuta el modelo en el nodo ML/Compute consumiendo los datos más recientes de MongoDB.",
      "Web app (Node.js/React) servida desde el silo y publicada al portal interno de CEL para uso operativo.",
      "Capas cartográficas y mapas estáticos generados con scripts SIG sobre los datos procesados.",
      "Sistema de alertas tempranas vía correo electrónico, SMS u otros canales, configurable por umbrales y puntos de control definidos por CEL.",
    ],
    rolCEL:
      "Administrador de Sistemas / DevOps de CEL asegura el despliegue, monitoreo y backup del sistema automatizado. Hidrólogo Operativo de CEL es el usuario principal del dashboard y validador final de los pronósticos.",
  },
];

export type MetodologiaPhase = {
  id: "F0" | "F1" | "F2" | "F3" | "F4";
  number: string;
  title: string;
  shortName: string;
  weeks: string;
  durationLabel: string;
  objective: string;
  narrative: string;
  actividades: string[];
  celAsk: { title: string; bullets: string[] } | null;
  entregables: string[];
  roles: string[];
};

export const METODOLOGIA_PHASES: MetodologiaPhase[] = [
  {
    id: "F0",
    number: "0",
    title: "Configuración de infraestructura y entorno",
    shortName: "Infraestructura",
    weeks: "S1–S4",
    durationLabel: "4 semanas",
    objective:
      "Construir y comisionar el silo de IA dedicado on-premise de CEL, dejando hardware, red y stack de software certificados y listos para desarrollo.",
    narrative:
      "Esta fase inicial y fundamental se dedica a la construcción y comisionamiento de la infraestructura de servidores on-premise dedicada para el silo de IA de CEL. La finalización exitosa de esta fase — que incluye la instalación del hardware y la configuración del stack de software — es el requisito indispensable para dar paso a la primera etapa operativa de ingesta de datos.",
    actividades: [
      "Comisionamiento físico de los 3 nodos del AI Silo (ML/Compute, Data/ETL, Backup NAS) con TI de CEL.",
      "Diseño e implementación de la red aislada del silo: VLANs, firewalls, políticas de acceso y VPN para acceso remoto seguro.",
      "Instalación y configuración del stack: Ubuntu Server LTS, PostgreSQL/PostGIS, MongoDB y Mage como orquestador de pipelines.",
      "Benchmarks de GPU, E/S de discos NVMe/SSD y conectividad entre nodos y fuentes externas.",
    ],
    celAsk: {
      title: "Participación esperada de CEL",
      bullets: [
        "Administrador de Sistemas / Ingeniero DevOps de CEL como líder de la implementación física, siguiendo la guía remota de la consultora.",
        "Equipo de seguridad de CEL para configuración y validación de la VPN y políticas de acceso.",
        "Equipo de TI de CEL para adquisición, racking y conexión eléctrica/red de los servidores.",
      ],
    },
    entregables: [
      "Certificación de Entorno Operacional (hardware + software + pruebas de rendimiento).",
      "VPN y acceso remoto seguro funcional para el equipo distribuido.",
      "Entorno base de Mage + Git/GitLab listo para el desarrollo de pipelines.",
    ],
    roles: ["infra_devops", "pm_lead", "pm_cel"],
  },
  {
    id: "F1",
    number: "1",
    title: "Adquisición y preprocesamiento de datos",
    shortName: "Datos",
    weeks: "S5–S9",
    durationLabel: "5 semanas",
    objective:
      "Replicar fielmente la metodología base con los datos iniciales y establecer un nuevo baseline interpretado conjuntamente con CEL.",
    narrative:
      "Esta fase replica estrictamente la metodología utilizando los datos base, estableciendo un nuevo baseline. Posteriormente se explorará la posibilidad de aumentar este baseline con datos locales de CEL y procesarlos para que se conformen a los requerimientos de la metodología, con el objetivo de mejorar la precisión. El rol crucial del equipo de CEL es interpretar esta nueva información de manera colaborativa, asegurando que los datos base para la replicación sean representativos de su ground-truth actual.",
    actividades: [
      "Ingesta automática de aforos hidrológicos, depuración y rellenado de lagunas históricas.",
      "Canalización meteorológica: descarga y procesamiento de ERA5, GPM e IMERG, complementado con CHIRPS para precipitación, temperatura y evapotranspiración (ET).",
      "Procesamiento geoespacial: evaluación de Modelos Digitales de Elevación (SRTM), compilación de HydroATLAS y datos de cobertura de suelos para delimitación precisa de cuencas y subcuencas.",
      "Pruebas de integración de los pipelines de Mage con las fuentes internas de CEL (PostgreSQL/MongoDB en modo solo lectura).",
    ],
    celAsk: {
      title: "Participación esperada de CEL",
      bullets: [
        "Integración hidrológica: expertos en hidrología de CEL evalúan y validan la información hidrológica descargada (aforos, lagunas históricas) para asegurar la fidelidad de la replicación.",
        "Canalización meteorológica: revisión y familiarización con los productos ERA5/GPM/CHIRPS y el cálculo de ET, contrastándolos con la experiencia operativa.",
        "Procesamiento geoespacial: CEL designa expertos SIG para evaluar el MDE y validar las compilaciones de HydroATLAS y cobertura de suelos para delimitar cuencas y subcuencas.",
      ],
    },
    entregables: [
      "Dataset hidrometeorológico curado, versionado y reproducible.",
      "Catálogo de features y reporte exploratorio por subcuenca.",
      "Pipelines de ETL en Mage en producción, conectados a las fuentes de CEL.",
    ],
    roles: ["data_engineer", "meteo_expert", "geospatial_expert_cel", "hydrology_lead_cel"],
  },
  {
    id: "F2",
    number: "2",
    title: "Configuración y entrenamiento del modelo",
    shortName: "Modelo LSTM",
    weeks: "S10–S18",
    durationLabel: "9 semanas",
    objective:
      "Entrenar y validar un modelo LSTM de pronóstico de caudales a 7 días, calibrado con el conocimiento operativo de los hidrólogos de CEL.",
    narrative:
      "Es la fase más larga y técnica del piloto. Se entrenan y calibran los modelos LSTM para el pronóstico de caudales del Río Lempa. La valiosa perspectiva del equipo de CEL es fundamental para asegurar la calidad y relevancia del modelo: su conocimiento profundo del comportamiento histórico del sistema hidrológico permite evaluar la validez de los patrones que el modelo aprende y guiar el ajuste de hiperparámetros.",
    actividades: [
      "Implementación del modelo LSTM con NeuralHydrology/PyTorch sobre la GPU RTX 4090 del silo.",
      "Selección y justificación de variables de entrada en función del contexto del Río Lempa.",
      "Entrenamiento y validación cruzada con origen rodante (rolling validation) sobre datos históricos.",
      "Búsqueda automatizada de hiperparámetros (e.g., Optuna) para optimizar arquitectura, ventana temporal y regularización.",
      "Documentación del modelo y de los resultados de validación.",
    ],
    celAsk: {
      title: "Participación esperada de CEL",
      bullets: [
        "Validación de patrones y detección de sesgos: el equipo de hidrología de CEL evalúa la validez de los patrones aprendidos por el modelo a partir de su conocimiento operativo.",
        "Colaboración en el ajuste de hiperparámetros: feedback sobre las dinámicas del sistema para guiar la optimización del modelo.",
        "Evaluación de la capacidad de pronóstico a 7 días: validación de la coherencia y confiabilidad de las predicciones frente al comportamiento esperado del sistema hidrológico.",
      ],
    },
    entregables: [
      "Modelo LSTM versionado y reproducible, entrenado sobre el silo de IA.",
      "Reporte de validación cruzada y comparativa cuantitativa vs. baseline operativo.",
      "Bitácora de calibración con hidrología.",
    ],
    roles: ["ml_engineer", "hydrology_lead_cel", "data_engineer"],
  },
  {
    id: "F3",
    number: "3",
    title: "Operacionalización y automatización",
    shortName: "Web app + Alertas",
    weeks: "S19–S23",
    durationLabel: "5 semanas",
    objective:
      "Construir la web app operativa de CEL y automatizar las canalizaciones en tiempo real para la operación continua del modelo.",
    narrative:
      "En esta etapa se construyen las canalizaciones en tiempo real necesarias para la operación continua del modelo y se desarrolla una web app intuitiva y adaptada a las necesidades de CEL. Los componentes core incluyen un panel de resumen de pronósticos clave, un mapa interactivo con gráficos de pronósticos temporales, y filtros y toggles para interactuar con los diversos elementos de la interfaz.",
    actividades: [
      "Despliegue del modelo en ambiente piloto con scheduling diario en el silo de IA.",
      "Implementación del dashboard web (React + GIS) integrado al portal interno de CEL.",
      "Generación de mapas estáticos y capas cartográficas operativas.",
      "Sistema de alertas tempranas (correo / SMS) cuando los pronósticos exceden umbrales críticos.",
      "Pruebas integradas extremo a extremo, incluyendo escenarios de degradación de datos.",
    ],
    celAsk: {
      title: "Participación esperada de CEL",
      bullets: [
        "Identificación de puntos de interés: estaciones de aforo, áreas geográficas o umbrales críticos para la toma de decisiones.",
        "Especificación de la presentación de la información: cómo visualizar pronósticos (gráficos, tablas, indicadores), métricas prioritarias, representación de alertas y umbrales.",
        "Diseño de la interfaz: preferencias sobre disposición general, navegación y usabilidad.",
        "Requerimientos de interacción: opciones de visualización, filtrado, selección de períodos y exportación de datos.",
        "Validación de información: revisión de la web app para asegurar claridad, precisión y coherencia con el conocimiento del sistema hidrológico.",
        "Asignación de personal y recursos de infraestructura para asegurar el despliegue y funcionamiento del sistema automatizado.",
      ],
    },
    entregables: [
      "Web app operativa integrada al portal de CEL.",
      "Pipelines de ingesta y pronóstico automatizados en producción.",
      "Sistema de alertas tempranas configurado y probado.",
      "Reporte de pruebas integradas E2E.",
    ],
    roles: ["fullstack_dev", "infra_devops", "data_engineer", "hydrology_lead_cel"],
  },
  {
    id: "F4",
    number: "4",
    title: "Validación del piloto y transferencia de conocimiento",
    shortName: "Validación + Transferencia",
    weeks: "S24–S28",
    durationLabel: "5 semanas",
    objective:
      "Validar rigurosamente el piloto en operación supervisada y empoderar al equipo de CEL para operar y mantener la solución de manera autónoma.",
    narrative:
      "Esta fase se centra en la rigurosa validación del sistema de pronóstico piloto y en la transferencia efectiva del conocimiento necesario para que el equipo de CEL pueda operar y mantener la solución a largo plazo. El objetivo es doble: validar el sistema en un contexto operativo real y empoderar al equipo a través de la documentación y la capacitación.",
    actividades: [
      "Pruebas fuera de muestra con datos no usados en entrenamiento ni validación inicial.",
      "Elaboración del Informe Piloto, el Procedimiento Operacional Estándar (POE) y la documentación técnica completa (API, base de datos, web app).",
      "Sesiones de capacitación personalizadas para el equipo de CEL sobre modelo, web app, alertas y operación según el POE.",
      "Sesiones de retroalimentación con CEL sobre usabilidad y confianza en los pronósticos.",
      "Recomendaciones formales sobre escalamiento, ajuste o repetición del piloto.",
    ],
    celAsk: {
      title: "Participación esperada de CEL",
      bullets: [
        "Disponibilidad para pruebas fuera de muestra: identificación y acceso a datasets históricos relevantes y revisión de los resultados frente a su experiencia.",
        "Revisión del POE y del Informe Piloto para asegurar que reflejen fielmente los procesos operativos.",
        "Participación activa de miembros clave en las sesiones de capacitación.",
        "Disponibilidad para sesiones de retroalimentación honestas sobre la web app y los pronósticos.",
        "Identificación del personal de CEL que tomará el mantenimiento técnico futuro del sistema.",
      ],
    },
    entregables: [
      "Reporte de operación supervisada del piloto.",
      "Informe Piloto, POE y documentación técnica completa.",
      "Capacitación impartida al equipo de CEL.",
      "Recomendaciones formales de escalamiento.",
    ],
    roles: ["pm_lead", "qa_validation", "docs_training", "hydrology_lead_cel", "stakeholder_cel"],
  },
];

export const RUTA_RESUMEN = [
  {
    id: "F0",
    nombre: "Configuración de infraestructura y entorno",
    semanas: "1–4",
    duracion: "4 semanas",
    entregables: [
      "Certificación de Entorno Operacional del silo de IA.",
      "VPN y acceso remoto seguro.",
      "Entorno Mage + Git/GitLab operativo.",
    ],
  },
  {
    id: "F1",
    nombre: "Adquisición y preprocesamiento de datos",
    semanas: "5–9",
    duracion: "5 semanas",
    entregables: [
      "Dataset hidrometeorológico curado y versionado.",
      "Pipelines ETL en Mage en producción.",
      "Catálogo de features y reporte exploratorio.",
    ],
  },
  {
    id: "F2",
    nombre: "Configuración y entrenamiento del modelo",
    semanas: "10–18",
    duracion: "9 semanas",
    entregables: [
      "Modelo LSTM entrenado y versionado.",
      "Reporte de validación cruzada y comparativa vs. baseline.",
      "Bitácora de calibración con hidrología.",
    ],
  },
  {
    id: "F3",
    nombre: "Operacionalización y automatización",
    semanas: "19–23",
    duracion: "5 semanas",
    entregables: [
      "Web app operativa integrada al portal de CEL.",
      "Pipelines automatizados y sistema de alertas.",
      "Reporte de pruebas integradas E2E.",
    ],
  },
  {
    id: "F4",
    nombre: "Validación del piloto y transferencia",
    semanas: "24–28",
    duracion: "5 semanas",
    entregables: [
      "Informe Piloto, POE y documentación técnica.",
      "Capacitación impartida al equipo de CEL.",
      "Recomendaciones formales de escalamiento.",
    ],
  },
  {
    id: "CONT",
    nombre: "Contingencia",
    semanas: "29–30",
    duracion: "2 semanas",
    entregables: ["Buffer planificado para retrasos, retrabajos o validación adicional."],
  },
];

export type RutaDetalle = {
  id: string;
  nombre: string;
  semanas: string;
  duracion: string;
  proposito: string;
  tareas: string[];
  colaboracionCEL: string[];
  entregables: string[];
  cronogramaPhaseId: string | null;
  needsHumanReview?: boolean;
  reviewNote?: string;
};

export const RUTA_DETALLE: RutaDetalle[] = [
  {
    id: "F0",
    nombre: "Configuración de infraestructura y entorno",
    semanas: "1–4",
    duracion: "4 semanas",
    proposito:
      "Construir el silo de IA on-premise y dejarlo certificado para que las fases siguientes operen sobre una base estable y segura.",
    tareas: [
      "Comisionamiento HW del silo de IA (ML/Compute, Data/ETL, Backup NAS).",
      "Red y seguridad: VLANs, firewalls, políticas de acceso y VPN para acceso remoto.",
      "Instalación del stack: Ubuntu Server LTS, PostgreSQL/PostGIS, MongoDB, Mage y entornos Python.",
      "Validación y benchmark: GPU, E/S NVMe/SSD y conectividad entre nodos y fuentes externas.",
    ],
    colaboracionCEL: [
      "Administrador de Sistemas / DevOps de CEL lidera la implementación física con guía remota de la consultora.",
      "Equipo de seguridad de CEL configura y valida la VPN y las políticas de acceso al silo.",
      "Equipo de TI de CEL gestiona adquisición, racking y conexión eléctrica/red de los nodos.",
    ],
    entregables: [
      "Certificación de Entorno Operacional del silo de IA.",
      "VPN y acceso remoto seguro funcional para el equipo distribuido.",
      "Entorno Mage + Git/GitLab listo para el desarrollo de pipelines.",
    ],
    cronogramaPhaseId: "F0",
  },
  {
    id: "F1",
    nombre: "Adquisición y preprocesamiento de datos",
    semanas: "5–9",
    duracion: "5 semanas",
    proposito:
      "Replicar fielmente la metodología base con datos curados y establecer un nuevo baseline interpretado conjuntamente con CEL.",
    tareas: [
      "Integración hidrológica: ingesta de aforos, depuración y rellenado de lagunas históricas.",
      "Canal meteorológico: descarga y procesamiento de ERA5, GPM/IMERG y CHIRPS; cálculo de precipitación, temperatura y ET.",
      "Procesamiento geoespacial: MDE (SRTM), HydroATLAS y cobertura de suelos para delimitar cuenca y subcuencas.",
      "QC y documentación del dataset; pipelines de Mage conectados en solo lectura a PostgreSQL/MongoDB de CEL.",
    ],
    colaboracionCEL: [
      "Hidrología de CEL valida la información hidrológica descargada (aforos, lagunas) para asegurar fidelidad de la replicación.",
      "Operación de CEL revisa los productos ERA5/GPM/CHIRPS y el cálculo de ET contra su experiencia operativa.",
      "SIG / teledetección de CEL evalúa el MDE y valida las compilaciones de HydroATLAS y cobertura de suelos.",
    ],
    entregables: [
      "Dataset hidrometeorológico curado, versionado y reproducible.",
      "Pipelines ETL en Mage en producción, conectados a las fuentes de CEL.",
      "Catálogo de features y reporte exploratorio por subcuenca.",
    ],
    cronogramaPhaseId: "F1",
  },
  {
    id: "F2",
    nombre: "Configuración y entrenamiento del modelo",
    semanas: "10–18",
    duracion: "9 semanas",
    proposito:
      "Entrenar y validar el modelo LSTM de pronóstico a 7 días, calibrado con el conocimiento operativo de los hidrólogos de CEL.",
    tareas: [
      "Implementación del LSTM con NeuralHydrology/PyTorch sobre la GPU RTX 4090 del silo.",
      "Selección y justificación de variables de entrada según el contexto del Río Lempa.",
      "Optimización bayesiana de hiperparámetros (longitud de secuencia, unidades ocultas, tasa de aprendizaje).",
      "Validación cruzada con origen rodante (rolling-origin) y comparación contra el baseline operativo.",
      "Informe de desempeño y bitácora de calibración con hidrología.",
    ],
    colaboracionCEL: [
      "Hidrología de CEL valida los patrones aprendidos y aporta detección temprana de sesgos.",
      "Líder técnico de CEL participa en el ajuste de hiperparámetros aportando conocimiento del sistema.",
      "Equipo operativo evalúa la coherencia y confiabilidad de los pronósticos a 7 días.",
    ],
    entregables: [
      "Modelo LSTM versionado y reproducible, entrenado sobre el silo de IA.",
      "Reporte de validación cruzada y comparativa cuantitativa vs. baseline.",
      "Bitácora de calibración con hidrología.",
    ],
    cronogramaPhaseId: "F2",
  },
  {
    id: "F3",
    nombre: "Operacionalización y automatización",
    semanas: "19–23",
    duracion: "5 semanas",
    proposito:
      "Construir la web app operativa y automatizar las canalizaciones en tiempo real para la operación continua del modelo en CEL.",
    tareas: [
      "Canalización diaria automatizada de pronósticos sobre el silo de IA.",
      "Tableros web (React + GIS) integrados al portal interno de CEL.",
      "Generación de mapas estáticos y capas cartográficas operativas.",
      "Sistema de alertas tempranas (correo/SMS) configurable por umbral y punto de control.",
      "Integración con sistemas y APIs internas; pruebas E2E con escenarios de degradación de datos.",
    ],
    colaboracionCEL: [
      "CEL identifica puntos de interés, estaciones de aforo y umbrales críticos para la toma de decisiones.",
      "Hidrólogos y operadores especifican cómo visualizar pronósticos, alertas y métricas prioritarias.",
      "Equipo de UX/operación de CEL define disposición, navegación y requerimientos de interacción del dashboard.",
      "DevOps de CEL asegura despliegue, monitoreo y backup del sistema automatizado.",
    ],
    entregables: [
      "Web app operativa integrada al portal de CEL.",
      "Pipelines de ingesta y pronóstico automatizados en producción.",
      "Sistema de alertas tempranas configurado y probado.",
      "Reporte de pruebas integradas E2E.",
    ],
    cronogramaPhaseId: "F3",
  },
  {
    id: "F4",
    nombre: "Validación del piloto y transferencia",
    semanas: "24–28",
    duracion: "5 semanas",
    needsHumanReview: true,
    reviewNote:
      "El doc original no distingue claramente entre 'pruebas fuera de muestra' como tarea de QA del modelo (cercana a F2) o como tarea de validación operativa (F4). Aquí se asigna a F4 siguiendo la matriz RACI del cronograma.",
    proposito:
      "Validar rigurosamente el piloto en operación supervisada y empoderar a CEL para operar y mantener la solución de forma autónoma.",
    tareas: [
      "Pruebas fuera de muestra con datos no usados en entrenamiento ni validación inicial.",
      "Elaboración del Informe Piloto, POE y documentación técnica (API, BD, web app).",
      "Sesiones de capacitación personalizadas para el equipo de CEL.",
      "Sesiones de retroalimentación sobre usabilidad y confianza en los pronósticos.",
      "Recomendaciones formales sobre escalamiento, ajuste o repetición del piloto.",
    ],
    colaboracionCEL: [
      "CEL identifica y facilita acceso a datasets históricos relevantes para pruebas fuera de muestra.",
      "Equipo de CEL revisa el POE y el Informe Piloto para asegurar que reflejen sus procesos operativos.",
      "Miembros clave participan activamente en las sesiones de capacitación y retroalimentación.",
      "CEL identifica al personal que asumirá el mantenimiento técnico futuro del sistema.",
    ],
    entregables: [
      "Reporte de operación supervisada del piloto.",
      "Informe Piloto, POE y documentación técnica completa.",
      "Capacitación impartida al equipo de CEL.",
      "Recomendaciones formales de escalamiento.",
    ],
    cronogramaPhaseId: "F4",
  },
  {
    id: "CONT",
    nombre: "Contingencia",
    semanas: "29–30",
    duracion: "2 semanas",
    proposito:
      "Buffer planificado para absorber retrasos puntuales, retrabajos o validación adicional sin comprometer la fecha de cierre.",
    tareas: [
      "Reserva para reproceso de datos o reentrenamiento parcial si el desempeño lo requiere.",
      "Ventana adicional para sesiones de validación o capacitación remanentes con CEL.",
      "Espacio para ajustes finos al POE y a la documentación a partir del uso real del sistema.",
    ],
    colaboracionCEL: [
      "Disponibilidad puntual de hidrología y DevOps de CEL para cerrar pendientes detectados en fases previas.",
    ],
    entregables: ["Cierre formal de pendientes y handover final."],
    cronogramaPhaseId: null,
  },
];

export const SEGUIMIENTO = {
  intro:
    "El equipo opera con una cadencia semanal de revisión (avances, métricas, riesgos) y una revisión formal al cierre de cada fase frente al Product Owner y la línea hidrológica de CEL. Estas instancias se calendarizan automáticamente desde T0 en la pestaña Calendario; las decisiones técnicas formales se registran en la pestaña Decisiones y los entregables en Documentos.",
  bullets: [
    "Sync semanal del core team: avances, bloqueadores y próximos pasos.",
    "Cierre de fase: revisión formal de entregables contra criterios de aceptación con CEL.",
    "Presentaciones de avance por fase a la contraparte de CEL al cierre de cada fase.",
    "Bitácora técnica versionada para decisiones de modelado y datos (pestaña Decisiones).",
    "Reporte ejecutivo mensual al patrocinador del piloto.",
  ],
};
