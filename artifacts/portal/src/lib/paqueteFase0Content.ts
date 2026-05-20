export interface PaqueteDoc {
  id: string;
  title: string;
  description: string;
  pdf: string;
  docx: string;
}

const BASE = "paquete-fase0";

export const PAQUETE_DOCS: PaqueteDoc[] = [
  {
    id: "carta",
    title: "1. Carta Formal de Remisión",
    description:
      "Carta institucional que acompaña el paquete y formaliza la alineación AI Silo / Fase 0 ante CEL.",
    pdf: `${BASE}/documentos/01_Carta_Formal_Remision_Alineacion_AI_Silo_Fase0.pdf`,
    docx: `${BASE}/documentos/01_Carta_Formal_Remision_Alineacion_AI_Silo_Fase0.docx`,
  },
  {
    id: "anexo",
    title: "2. Anexo Técnico Consolidado",
    description:
      "Anexo técnico que consolida arquitectura, alcance funcional del piloto y dependencias de Fase 0.",
    pdf: `${BASE}/documentos/02_Anexo_Tecnico_Consolidado_AI_Silo_Fase0.pdf`,
    docx: `${BASE}/documentos/02_Anexo_Tecnico_Consolidado_AI_Silo_Fase0.docx`,
  },
  {
    id: "bom",
    title: "3. BOM HW/SW Actualizado",
    description:
      "Inventario de hardware y software readecuado contra la infraestructura adquirida por CEL vía Martinexsa/Dell.",
    pdf: `${BASE}/documentos/03_BOM_HW_SW_Actualizado_AI_Silo_Fase0.pdf`,
    docx: `${BASE}/documentos/03_BOM_HW_SW_Actualizado_AI_Silo_Fase0.docx`,
  },
  {
    id: "handoff",
    title: "4. Handoff Técnico CEL / TI / Martinexsa",
    description:
      "Protocolo de entrega del entorno habilitante: red, accesos, storage, GPU, runtime y administración de plataforma.",
    pdf: `${BASE}/documentos/04_Handoff_Tecnico_CEL_TI_Martinexsa_Fase0.pdf`,
    docx: `${BASE}/documentos/04_Handoff_Tecnico_CEL_TI_Martinexsa_Fase0.docx`,
  },
  {
    id: "brief",
    title: "5. One-Page Brief de Reunión",
    description:
      "Brief de una página para la sesión de coordinación con CEL: contexto, decisiones y próximos pasos.",
    pdf: `${BASE}/documentos/05_One_Page_Brief_Reunion_Fase0.pdf`,
    docx: `${BASE}/documentos/05_One_Page_Brief_Reunion_Fase0.docx`,
  },
  {
    id: "minuta",
    title: "6. Minuta Formal de Sesión",
    description:
      "Minuta formal de la sesión de coordinación y gobernanza de Fase 0 — acuerdos, responsables y plazos.",
    pdf: `${BASE}/documentos/06_Minuta_Formal_Sesion_Coordinacion_Gobernanza_Fase0.pdf`,
    docx: `${BASE}/documentos/06_Minuta_Formal_Sesion_Coordinacion_Gobernanza_Fase0.docx`,
  },
];

export const DECK = {
  title: "Deck Ejecutivo AI Silo / Fase 0",
  description:
    "Presentación ejecutiva para la sesión de alineación con CEL: postura, alcance, entorno habilitante y ruta de certificación de Fase 0.",
  pptx: `${BASE}/deck/06_Deck_Ejecutivo_AI_Silo_Fase0.pptx`,
  pdf: `${BASE}/deck/06_Deck_Ejecutivo_AI_Silo_Fase0.pdf`,
};

export interface PaqueteDiagram {
  id: string;
  title: string;
  description: string;
  chart: string;
  mmd: string;
  png: string;
}

export const DIAGRAM_01_TOPOLOGIA = `flowchart LR
    EXT["Fuentes externas<br/>ECMWF / Copernicus / NASA / CHIRPS"] --> FW
    REM["Acceso remoto autorizado<br/>Consultora / soporte<br/>VPN o bastion CEL"] --> FW
    LAN["Usuarios CEL<br/>Operación / Hidrología / SIG / Dirección"] --> FW
    FW["Perímetro de seguridad CEL<br/>Firewall / VPN / Bastion / ACL / DNS"] --> SW
    SW["Dell PowerSwitch S5224F-ON<br/>Top-of-Rack 25/100GbE"] --> AI
    SW --> VIRT
    SW --> NAS
    SW --> WS
    SUP["Dell / NVIDIA / TechCircle<br/>soporte, garantía, telemetría"] -.-> FW
    AI["Dell PowerEdge R770 - ML/IA<br/>GPU NVIDIA efectiva<br/>Ubuntu + Docker<br/>runtime IA"] --> LAND
    VIRT["Dell PowerEdge R770 - Virtualización<br/>VMs / servicios institucionales<br/>host final a confirmar por CEL/TI"] --> LAND
    NAS["Dell PowerEdge R570 - NAS/File Server<br/>Windows Server 2025<br/>SMB/NFS / datasets / artefactos"] --> LAND
    WS["Estaciones Dell Pro Max<br/>gestión / visualización"]
    LAND["Landing Zone del piloto<br/>Mage + BDs + API + dashboard<br/>ubicación final a confirmar formalmente por CEL/TI"]
    NOTE["Frontera de alcance:<br/>CEL/proveedor = infraestructura, red, soporte, administración.<br/>Consultora = stack funcional, validación y piloto."] -.-> LAND`;

export const DIAGRAM_02_FUNCIONAL = `flowchart TB
    INPUTS["Insumos<br/>Meteorología + hidrología + geoespacial + Excel/macros CEL"] --> ACCESS
    ACCESS["Acceso y seguridad<br/>read-only / réplicas / VPN / políticas CEL"] --> MAGE
    MAGE["Mage<br/>orquestación central: DAGs, logs, retries, scheduling"] --> ETL
    ETL["Python ETL + QA/QC<br/>normalización, features, geoprocesamiento"] --> STORES
    STORES["PostgreSQL/PostGIS + MongoDB<br/>histórico/geoespacial + operativo/latest state"] --> MODEL
    MODEL["Modelo IA hidrológico<br/>PyTorch / NeuralHydrology / LSTM"] --> FLOOD
    FLOOD["Modelo de inundación<br/>umbrales, escenarios, capas"] --> DELIVERY
    DELIVERY["API + Dashboard + Alertas<br/>React/Leaflet-Mapbox + SMTP/SMS si habilitado"] --> USERS
    USERS["Usuarios CEL<br/>operadores, hidrología, SIG, dirección"] -. feedback operativo .-> MODEL`;

export const DIAGRAM_03_GATES = `flowchart LR
    G0["G0<br/>Alineación documental"] --> G1["G1<br/>Handoff proveedor"] --> G2["G2<br/>Acceso seguro"] --> G3["G3<br/>GPU + runtime"] --> G4["G4<br/>Storage + BDs"] --> G5["G5<br/>Mage operativo"] --> G6["G6<br/>Certificación Fase 0"] --> P1["Fase 1<br/>Datos y preprocesamiento"]
    NOTE["Regla operativa: Fase 0 técnica plena empieza cuando el entorno está instalado, accesible, documentado y verificable."] -.-> G1`;

export const DIAGRAM_04_GOBERNANZA = `flowchart TB
    C2["C² Labs<br/>Camila Cruz - Líder de Proyecto<br/>Kevin Centeno - PM"] --> CORE
    CORE["CEL Core Pilot Team<br/>José Mauricio Herrera - PM/Contrato<br/>Víctor Alabí - Hidrología<br/>Fernando Garay - SIG<br/>William Juárez - Datos/Backend<br/>José Manuel Guardado - DevOps"] --> IT
    CORE --> PLANTS
    IT["Comité de Informática CEL<br/>Lorena Pineda - autoridad final<br/>Nelson Flores - redes/recursos<br/>Adrián/Carlos/Miladis - ejecución técnica"] --> PROVIDER
    PLANTS["Centrales hidroeléctricas<br/>15 Sept / 5 Nov-G9 / Cerrón Grande / 3 Feb / Guajoyo"]
    PROVIDER["Martinexsa / Dell / NVIDIA<br/>entrega, soporte, garantías, plataforma base"]`;

export const DIAGRAM_05_ARQUITECTURA = `flowchart TB
    subgraph EXT["Fuera del Silo / Insumos"]
        MET["Fuentes meteorologicas y satelitales: ECMWF/ERA5, GPM/IMERG, CHIRPS, Sentinel-1"]
        GEO["Fuentes geoespaciales: HydroATLAS/HydroSHEDS, DEM/MDE, suelos, OSM"]
        CELDATA["Fuentes internas CEL: hidrologia, aforos, embalses, Excel/macros, BD (read-only o replica)"]
        CONSULTORA["Consultora: acceso remoto autorizado"]
        OPS["Usuarios CEL: operacion, hidrologia, SIG, gerencia"]
    end
    subgraph CEL["Perimetro CEL / Data Center"]
        FW["Firewall / VPN / Bastion / Politicas TI: VLAN, ACL, egress allowlist, credenciales"]
        SW["Dell PowerSwitch S5224F-ON: Top-of-Rack 25/100GbE"]
        subgraph HW["Infraestructura fisica provista por CEL + Martinexsa/Dell"]
            ML["Servidor ML/IA: Dell PowerEdge R770, Ubuntu Server 24.04 LTS + Docker, NVIDIA GPU efectiva (H100 NVL segun oferta; validar contra entrega), NVIDIA AI Enterprise"]
            VIRT["Servidor de Virtualizacion: Dell PowerEdge R770, VMs/servicios institucionales, host final definido por CEL/TI"]
            NAS["NAS/File Server: Dell PowerEdge R570, Windows Server 2025, SMB/NFS, RAID, datasets, artefactos, respaldos"]
            WS["Estaciones de Gestion: Dell Pro Max + monitores, visualizacion/administracion"]
        end
        subgraph PILOTO["AI Silo funcional del piloto - scope tecnico de la Consultora"]
            GIT["Git/repositorio: versionamiento de codigo, configs y documentacion"]
            MAGE["Mage: orquestacion central, scheduling, DAGs, retries, logs, monitoreo operativo"]
            ETL["Pipelines Python ETL/QA-QC: normalizacion, limpieza, features, geoprocesamiento"]
            PG["PostgreSQL + PostGIS: historico, capas geoespaciales, subcuencas, mapas"]
            MDB["MongoDB: datos operacionales, pronosticos recientes, estado del dashboard"]
            MODEL["Modelo hidrologico IA: PyTorch/NeuralHydrology/LSTM, entrenamiento + inferencia"]
            FLOOD["Modelo de inundacion: umbrales, escenarios, capas de anegacion"]
            API["API/Backend del piloto: servicio de resultados y consultas"]
            DASH["Dashboard web: React + Leaflet/Mapbox GL JS, mapas, hidrogramas, alertas"]
            ALERTS["Alertas operativas: SMTP CEL + gateway SMS si CEL lo habilita"]
        end
        DEC["Gate de definicion CEL/TI: host final de Mage/BDs/API, IPs/DNS/VLANs, credenciales, storage mounts, politica de backup, politicas de seguridad y acceso"]
    end
    MET -->|descarga programada| FW
    GEO -->|descarga/ingesta| FW
    CELDATA -->|consulta read-only o replica| FW
    CONSULTORA -->|VPN o bastion aprobado| FW
    OPS -->|uso/validacion operacional| DASH
    FW --> SW
    SW <--> ML
    SW <--> VIRT
    SW <--> NAS
    SW <--> WS
    DEC -. habilita .-> MAGE
    DEC -. define host final .-> PG
    DEC -. define host final .-> MDB
    DEC -. define host final .-> API
    ML -. computo GPU .-> MODEL
    ML -. runtime posible .-> MAGE
    VIRT -. host posible .-> MAGE
    VIRT -. host posible .-> API
    NAS -. datasets/artefactos .-> ETL
    NAS -. storage/respaldos .-> PG
    NAS -. storage/respaldos .-> MDB
    NAS -. checkpoints/modelos .-> MODEL
    GIT --> MAGE
    MAGE --> ETL
    ETL --> PG
    ETL --> MDB
    PG --> MODEL
    MDB --> MODEL
    MODEL --> FLOOD
    FLOOD --> PG
    FLOOD --> MDB
    PG --> API
    MDB --> API
    API --> DASH
    API --> ALERTS
    ALERTS --> OPS
    NOTE["Nota de alcance: Mage sustituye Pentaho/Grafana para orquestacion y observabilidad operativa del piloto. Racking, red fisica, garantias, administracion continua, backups corporativos, hardening avanzado, SIEM, AD/LDAP, HA/DR y soporte de plataforma quedan en CEL/Martinexsa/Dell salvo adenda expresa."]
    NOTE -.-> MAGE
    NOTE -.-> DEC`;

export const DIAGRAM_06_HANDOFF = `flowchart LR
    subgraph CEL_PROVIDER["CEL / TI / Martinexsa / Dell"]
        H0["Handoff de infraestructura"]
        H1["Equipos instalados y energizados"]
        H2["Red / VLAN / Firewall / VPN"]
        H3["OS base, drivers, GPU y storage"]
        H4["Soporte, garantías y administración de plataforma"]
    end

    subgraph CONSULTORA["Consultora / C² Labs"]
        C0["Consumo del entorno habilitado"]
        C1["Mage + pipelines + repositorio"]
        C2["PostgreSQL/PostGIS + MongoDB funcionales"]
        C3["Modelo IA, dashboard, alertas y documentación"]
        C4["Validación funcional y certificación Fase 0"]
    end

    H0 --> H1 --> H2 --> H3 --> C0
    H4 -. responsabilidad institucional .-> H0
    C0 --> C1 --> C2 --> C3 --> C4

    GATE["Gate de inicio técnico de Fase 0:<br/>entorno instalado, accesible, documentado y verificable"]
    H3 --> GATE --> C0

    NOTE["Frontera de responsabilidad:<br/>la infraestructura adquirida por CEL habilita el piloto,<br/>pero no amplía tácitamente el alcance de la Consultora."]
    NOTE -.-> H0
    NOTE -.-> C0`;

export const PAQUETE_DIAGRAMS: PaqueteDiagram[] = [
  {
    id: "topologia",
    title: "1. Topología Física del Data Center",
    description:
      "Vista física de la infraestructura adquirida por CEL: perímetro de seguridad, switch top-of-rack, servidores, NAS y landing zone del piloto.",
    chart: DIAGRAM_01_TOPOLOGIA,
    mmd: `${BASE}/mermaid/01_Topologia_Fisica_Data_Center.mmd`,
    png: `${BASE}/diagramas/01_Topologia_Fisica_Data_Center.png`,
  },
  {
    id: "funcional",
    title: "2. Arquitectura Funcional del AI Silo",
    description:
      "Flujo funcional end-to-end: insumos → Mage → ETL/QA → almacenamiento → modelos IA → entrega y usuarios CEL.",
    chart: DIAGRAM_02_FUNCIONAL,
    mmd: `${BASE}/mermaid/02_Arquitectura_Funcional_AI_Silo.mmd`,
    png: `${BASE}/diagramas/02_Arquitectura_Funcional_AI_Silo.png`,
  },
  {
    id: "gates",
    title: "3. Gates de Fase 0 y Handoff",
    description:
      "Secuencia de gates G0 → G6 para certificar el entorno habilitante antes de iniciar Fase 1.",
    chart: DIAGRAM_03_GATES,
    mmd: `${BASE}/mermaid/03_Gates_Fase0_Handoff.mmd`,
    png: `${BASE}/diagramas/03_Gates_Fase0_Handoff.png`,
  },
  {
    id: "gobernanza",
    title: "4. Gobernanza Organizacional",
    description:
      "Estructura de gobernanza: C² Labs, CEL Core Pilot Team, Comité de Informática, centrales y proveedor Martinexsa/Dell/NVIDIA.",
    chart: DIAGRAM_04_GOBERNANZA,
    mmd: `${BASE}/mermaid/04_Gobernanza_Organizacional.mmd`,
    png: `${BASE}/diagramas/04_Gobernanza_Organizacional.png`,
  },
  {
    id: "arquitectura",
    title: "5. Arquitectura AI Silo y Frontera de Alcance",
    description:
      "Vista consolidada del Silo con la frontera explícita entre infraestructura CEL/proveedor y stack funcional de la Consultora.",
    chart: DIAGRAM_05_ARQUITECTURA,
    mmd: `${BASE}/mermaid/05_Arquitectura_AI_Silo_y_Frontera_Alcance.mmd`,
    png: `${BASE}/diagramas/05_Arquitectura_AI_Silo_y_Frontera_Alcance.png`,
  },
  {
    id: "handoff",
    title: "6. Handoff y Frontera de Responsabilidades",
    description:
      "Frontera operativa entre CEL/TI/Martinexsa/Dell y la Consultora, con el gate de inicio técnico de Fase 0.",
    chart: DIAGRAM_06_HANDOFF,
    mmd: `${BASE}/mermaid/06_Handoff_Frontera_Responsabilidades.mmd`,
    png: `${BASE}/diagramas/06_Handoff_Frontera_Responsabilidades.png`,
  },
];

export const INDICE_DOCS = {
  pdf: `${BASE}/indice/00_Indice_del_Paquete_Final_CEL_AI_Silo_Fase0.pdf`,
  docx: `${BASE}/indice/00_Indice_del_Paquete_Final_CEL_AI_Silo_Fase0.docx`,
};

export const CORREO_REMISION = {
  pdf: `${BASE}/indice/07_Correo_de_Remision_Paquete_Final.pdf`,
  docx: `${BASE}/indice/07_Correo_de_Remision_Paquete_Final.docx`,
  txt: `${BASE}/indice/07_Correo_de_Remision_Paquete_Final.txt`,
  asunto:
    "Remisión de paquete final all-in-one de alineación técnica - AI Silo / Fase 0 | CEL-CFU 02/26",
  cuerpo: `Estimados Ing. José Mauricio, Lic. Lorena, Nelson y equipo CEL,

Espero que se encuentren bien.

Por este medio remito el paquete final all-in-one de alineación técnica y operativa correspondiente al AI Silo y la Fase 0 del proceso CEL-CFU 02/26. El paquete consolida la readecuación de la documentación técnica frente a la infraestructura física adquirida por CEL mediante la plataforma Martinexsa/Dell, manteniendo como fuente contractual el DSP firmado y sus entregables.

El objetivo es dejar una base común, formal y ejecutable para iniciar y certificar la Fase 0 sin ambigüedad de alcance. En particular, los documentos separan: (i) el alcance funcional del piloto a cargo de la Consultora; (ii) la infraestructura, red, soporte, garantías, accesos, seguridad y administración continua a cargo de CEL/TI/proveedor; y (iii) la información mínima que debe confirmarse para ejecutar y cerrar el entorno operacional del piloto.

El paquete incluye: carta formal, anexo técnico consolidado, BOM HW/SW actualizado, handoff técnico CEL/TI/Martinexsa, one-page brief, minuta formal de sesión, deck ejecutivo, correo de remisión, seis diagramas en PNG y los archivos Mermaid editables correspondientes.

Solicito que podamos usar este material como base de la próxima sesión de alineación para cerrar, de forma concreta, los puntos habilitantes de Fase 0: inventario final, GPU efectiva, hosts de Mage/BD/API/dashboard, accesos VPN o bastion, IPs/VLANs/DNS, rutas NAS/SMB/NFS, política de backups, egress a fuentes externas, acceso read-only a fuentes internas, canales SMTP/SMS y responsables técnicos por dominio.

La postura central del paquete es que la infraestructura adquirida por CEL constituye el entorno habilitante del piloto, pero no una ampliación tácita del alcance de la Consultora. La ejecución técnica plena de Fase 0 debe iniciar cuando el entorno esté instalado, accesible, documentado y verificable, o cuando CEL emita una aceptación formal sobre cualquier dependencia pendiente.

Quedo atenta a sus comentarios y a la confirmación de la ruta de revisión formal.

Atentamente,

Camila Alejandra Cruz Hernández
C² Labs
camila@c2labs.ai`,
};
