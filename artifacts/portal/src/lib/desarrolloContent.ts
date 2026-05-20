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

export const AI_SILO_LOGICAL_DIAGRAM = `flowchart TB
    %% ============================================================
    %% AI SILO — LOGICAL ARCHITECTURE
    %% Logical / functional view, not physical infrastructure view.
    %% ============================================================

    %% -------------------------------
    %% 1. External and Internal Inputs
    %% -------------------------------
    subgraph INPUTS["1. Data Sources / Inputs"]
        METEO["Meteorological Inputs<br/>ECMWF / ERA5<br/>GPM / IMERG<br/>CHIRPS<br/>temperature, rainfall, forecast variables"]
        HYDRO["Hydrological Inputs<br/>CEL gauges / aforos<br/>reservoir levels<br/>plant records<br/>historical inflows / outflows"]
        GEO["Geospatial Inputs<br/>DEM / MDE<br/>HydroATLAS / HydroSHEDS<br/>soil, land cover, basin attributes<br/>Sentinel-1 flood extents"]
        OPSDATA["Operational Inputs<br/>CEL Excel workbooks / macros<br/>operator thresholds<br/>plant-specific operating logic<br/>critical points of interest"]
    end

    %% -------------------------------
    %% 2. Access / Security Boundary
    %% -------------------------------
    subgraph ACCESS["2. Access, Security & Data Boundary"]
        READONLY["Read-only connectors / replicas<br/>No direct modification of CEL production systems"]
        VPN["Secure access layer<br/>VPN / bastion / firewall rules<br/>CEL-approved credentials"]
        POLICY["Data governance rules<br/>source registry<br/>access controls<br/>data ownership / audit trail"]
    end

    %% -------------------------------
    %% 3. AI Silo Logical Core
    %% -------------------------------
    subgraph SILO["AI Silo Logical Core"]

        %% Orchestration Layer
        subgraph ORCH["3. Orchestration Layer"]
            MAGE["Mage<br/>central orchestration layer<br/>schedules, DAGs, retries, logs,<br/>pipeline state, operational monitoring"]
            GIT["Git Repository<br/>pipeline code<br/>model code<br/>configs<br/>documentation"]
        end

        %% Data Engineering Layer
        subgraph DATAENG["4. Data Engineering / ETL Layer"]
            INGEST["Ingestion Pipelines<br/>API pulls<br/>file ingestion<br/>database connectors<br/>satellite/geospatial downloads"]
            STAGING["Raw / Staging Zone<br/>raw files<br/>unvalidated tables<br/>source-level snapshots"]
            QAQC["QA/QC + Validation<br/>schema checks<br/>missing data checks<br/>range checks<br/>temporal alignment<br/>unit normalization"]
            FEATURES["Feature Engineering<br/>basin aggregation<br/>rainfall over sub-basins<br/>time-series windows<br/>static catchment attributes<br/>model-ready tensors"]
        end

        %% Storage Layer
        subgraph STORAGE["5. Logical Data Storage Layer"]
            PG["PostgreSQL + PostGIS<br/>historical datasets<br/>geospatial layers<br/>sub-basins<br/>flood maps<br/>model outputs archive"]
            MONGO["MongoDB<br/>operational / near-real-time data<br/>latest forecasts<br/>dashboard state<br/>alert state"]
            ARTIFACTS["Model & Data Artifacts<br/>trained weights<br/>checkpoints<br/>validation outputs<br/>benchmark reports<br/>run metadata"]
        end

        %% Modeling Layer
        subgraph MODELING["6. Modeling & Analytics Layer"]
            TRAIN["Training Workflow<br/>NeuralHydrology / PyTorch<br/>LSTM training<br/>hyperparameter search<br/>rolling-origin validation"]
            INFER["Inference Workflow<br/>daily forecast execution<br/>7-day hydrological forecast<br/>virtual gauges / control points"]
            FLOOD["Flood / Impact Modeling<br/>threshold model<br/>inundation layers<br/>flood extent estimation<br/>risk zones"]
            METRICS["Model Evaluation<br/>NSE, RMSE, MAE<br/>skill vs persistence<br/>POD / FAR<br/>spatial validation"]
        end

        %% Decision Layer
        subgraph DECISION["7. Decision Products Layer"]
            FORECASTS["Forecast Products<br/>hydrographs<br/>inflow forecasts<br/>risk levels<br/>lead-time windows"]
            MAPS["Spatial Products<br/>dynamic flood layers<br/>critical zones<br/>affected areas<br/>basin/sub-basin views"]
            ALERTLOGIC["Alert Logic<br/>threshold crossing<br/>severity levels<br/>anti-spam / deduplication<br/>event audit trail"]
        end

        %% Interface Layer
        subgraph INTERFACE["8. Interface & Delivery Layer"]
            API["Backend / API Layer<br/>serves forecasts<br/>serves map layers<br/>serves alert state<br/>exports data to dashboard"]
            DASH["Web Dashboard<br/>React / Leaflet or Mapbox<br/>maps, charts, filters, toggles<br/>single operational view"]
            ALERTS["Notifications<br/>email via CEL SMTP<br/>SMS gateway if enabled<br/>distribution lists<br/>alert history"]
            DOCS["Operational Documentation<br/>POE / SOP<br/>technical docs<br/>handoff materials<br/>training guides"]
        end
    end

    %% -------------------------------
    %% 4. Users and Operational Consumers
    %% -------------------------------
    subgraph USERS["9. Users / Operational Consumers"]
        HYDROTEAM["CEL Hydrology Team<br/>validates patterns, thresholds,<br/>forecast reasonableness"]
        PLANTS["Plant Operators<br/>Cerrón Grande<br/>5 de Noviembre / G9<br/>Guajoyo<br/>15 de Septiembre"]
        SIG["SIG / Teledetection Team<br/>validates geospatial layers<br/>DEM, flood extents, Sentinel-1"]
        MANAGEMENT["CEL Leadership / Decision Makers<br/>situational awareness<br/>risk and operations visibility"]
    end

    %% -------------------------------
    %% 5. Flow Connections
    %% -------------------------------

    %% Inputs into access layer
    METEO --> VPN
    HYDRO --> READONLY
    GEO --> VPN
    OPSDATA --> READONLY

    READONLY --> POLICY
    VPN --> POLICY
    POLICY --> MAGE

    %% Orchestration controls ETL
    GIT --> MAGE
    MAGE --> INGEST
    INGEST --> STAGING
    STAGING --> QAQC
    QAQC --> FEATURES

    %% ETL to storage
    STAGING --> PG
    QAQC --> PG
    QAQC --> MONGO
    FEATURES --> PG
    FEATURES --> ARTIFACTS

    %% Storage to modeling
    PG --> TRAIN
    PG --> INFER
    MONGO --> INFER
    ARTIFACTS --> TRAIN
    TRAIN --> ARTIFACTS
    TRAIN --> METRICS

    %% Forecast and flood modeling
    INFER --> FORECASTS
    INFER --> FLOOD
    FLOOD --> MAPS
    FLOOD --> ALERTLOGIC
    METRICS --> ARTIFACTS

    %% Store outputs
    FORECASTS --> MONGO
    FORECASTS --> PG
    MAPS --> PG
    ALERTLOGIC --> MONGO

    %% Delivery layer
    PG --> API
    MONGO --> API
    API --> DASH
    ALERTLOGIC --> ALERTS
    API --> DOCS

    %% Users consume and validate
    DASH --> HYDROTEAM
    DASH --> PLANTS
    DASH --> SIG
    DASH --> MANAGEMENT
    ALERTS --> HYDROTEAM
    ALERTS --> PLANTS
    DOCS --> HYDROTEAM
    DOCS --> PLANTS
    DOCS --> SIG

    %% Feedback loops
    HYDROTEAM -. validation feedback .-> METRICS
    HYDROTEAM -. threshold calibration .-> ALERTLOGIC
    PLANTS -. operational feedback .-> OPSDATA
    SIG -. geospatial validation .-> MAPS
    MANAGEMENT -. decision requirements .-> DASH

    %% -------------------------------
    %% Styling
    %% -------------------------------
    classDef input fill:#FFF8E6,stroke:#B38B00,stroke-width:1px,color:#111;
    classDef boundary fill:#FCEEEE,stroke:#B85C5C,stroke-width:1px,color:#111;
    classDef orchestration fill:#EEF4FF,stroke:#4C6FB3,stroke-width:1px,color:#111;
    classDef data fill:#F2FFF5,stroke:#4D9A63,stroke-width:1px,color:#111;
    classDef storage fill:#F4F0FF,stroke:#7A5CB8,stroke-width:1px,color:#111;
    classDef model fill:#EFFFFF,stroke:#3C9EA3,stroke-width:1px,color:#111;
    classDef decision fill:#FFF2E8,stroke:#C97932,stroke-width:1px,color:#111;
    classDef interface fill:#F7F7F7,stroke:#555,stroke-width:1px,color:#111;
    classDef users fill:#EAF7FF,stroke:#4B8BBE,stroke-width:1px,color:#111;

    class METEO,HYDRO,GEO,OPSDATA input;
    class READONLY,VPN,POLICY boundary;
    class MAGE,GIT orchestration;
    class INGEST,STAGING,QAQC,FEATURES data;
    class PG,MONGO,ARTIFACTS storage;
    class TRAIN,INFER,FLOOD,METRICS model;
    class FORECASTS,MAPS,ALERTLOGIC decision;
    class API,DASH,ALERTS,DOCS interface;
    class HYDROTEAM,PLANTS,SIG,MANAGEMENT users;
`;

export const DC_PHYSICAL_TOPOLOGY_DIAGRAM = `flowchart TB
    %% ============================================================
    %% AI SILO — DATA CENTER / PHYSICAL TOPOLOGY ARCHITECTURE
    %% Vista del data center en sí, no de la lógica de datos/modelo.
    %% ============================================================

    %% -------------------------------
    %% External / Enterprise Edge
    %% -------------------------------
    subgraph EXT["External / Enterprise Edge"]
        INTERNET["Internet / External Data Sources<br/>ECMWF, Copernicus, NASA, Sentinel, CHIRPS<br/>egress controlled by CEL"]
        REMOTE["Authorized Remote Access<br/>Consultora / technical support<br/>via VPN or bastion approved by CEL"]
        CEL_LAN["CEL Enterprise LAN / Users<br/>operators, hydrology, SIG, leadership"]
        DELL_CLOUD["Dell / NVIDIA Support Cloud<br/>ProSupport, TechDirect, MyService360,<br/>Dell AIOps, Secure Connect Gateway"]
    end

    %% -------------------------------
    %% Security Boundary
    %% -------------------------------
    subgraph EDGE["CEL Security Boundary"]
        FW["Firewall / VPN / Bastion / NAT<br/>ACLs, egress allowlist, access policies<br/>owned by CEL / TI"]
        CORE["CEL Core Network / WAN<br/>routing to institutional systems<br/>and corporate services"]
    end

    %% -------------------------------
    %% Data Center Footprint
    %% -------------------------------
    subgraph DC["AI Silo Data Center Footprint — On-Prem CEL"]

        FAC["Facility Layer<br/>rack space, power circuits, grounding,<br/>PDU / UPS / cooling / physical access<br/>to be confirmed and operated by CEL / provider"]

        %% ---------------------------
        %% Network Fabric
        %% ---------------------------
        subgraph NET["Data Center Network Fabric"]
            TOR["Dell PowerSwitch S5224F-ON<br/>Top-of-Rack Switch — 1RU<br/>24 x 25GbE SFP28<br/>4 x 100GbE QSFP28<br/>Dell SmartFabric OS10<br/>L2/L3, VLAN, ACL, OSPF/BGP capable"]

            MGMT_VLAN["Management VLAN<br/>iDRAC, switch admin,<br/>support telemetry"]
            AI_VLAN["AI Compute VLAN<br/>GPU workloads, model training,<br/>inference runtime"]
            VIRT_VLAN["Virtualization / Services VLAN<br/>VMs, internal services,<br/>platform services as defined by CEL"]
            STORAGE_VLAN["Storage VLAN<br/>SMB / NFS, datasets,<br/>model artifacts, backups"]
            USER_VLAN["User / Access VLAN<br/>dashboard access,<br/>operator workstations,<br/>management endpoints"]
        end

        %% ---------------------------
        %% Management and Support Plane
        %% ---------------------------
        subgraph MGMT["Out-of-Band Management & Support Plane"]
            IDRAC["iDRAC Enterprise<br/>remote administration for Dell servers<br/>firmware, health, power, diagnostics"]
            SCG["Secure Connect Gateway<br/>Dell AIOps / TechDirect / MyService360<br/>support telemetry and incident workflow"]
            PROSUPPORT["Dell ProSupport Plus Mission Critical<br/>24x7 support<br/>critical parts replacement<br/>severity escalation"]
            TECHCIRCLE["TechCircle Advisory Support<br/>30h remote specialized support<br/>architecture review, growth recommendations,<br/>GPU/container/data best practices"]
        end

        %% ---------------------------
        %% Server and Storage Layer
        %% ---------------------------
        subgraph SERVERS["Server & Storage Layer"]

            R770_AI["Dell PowerEdge R770 — ML / IA Server<br/>2 x Intel Xeon 6515P<br/>256GB DDR5<br/>NVIDIA GPU installed by provider<br/>H100 NVL 94GB HBM3 listed in accepted offer<br/>final effective GPU to validate on delivery<br/>Ubuntu Server 24.04 LTS<br/>Docker Engine + Docker Compose<br/>NVIDIA AI Enterprise per offer<br/>High-speed NVMe workspace"]

            R770_VIRT["Dell PowerEdge R770 — Virtualization Server<br/>2 x Intel Xeon 6515P<br/>256GB DDR5<br/>enterprise SSD RAID storage<br/>institutional VM / services layer<br/>hypervisor and final VM topology<br/>to be defined by CEL / provider"]

            R570_NAS["Dell PowerEdge R570 — NAS / File Server<br/>Intel Xeon 6511P<br/>64GB DDR5<br/>Windows Server 2025 Standard<br/>BOSS-N1 RAID1 for OS<br/>6 x 14TB HDD configured RAID6<br/>SMB / NFS file sharing<br/>central repository for institutional data,<br/>AI datasets, artifacts and historical files"]
        end

        %% ---------------------------
        %% Platform Management Endpoints
        %% ---------------------------
        subgraph ENDPOINTS["Platform Management & Visualization Endpoints"]
            WS1["Dell Pro Max 16 Plus — Workstation 01<br/>NVIDIA RTX PRO 3000 Blackwell<br/>64GB RAM<br/>Thunderbolt dock<br/>dual 32in 4K monitors"]
            WS2["Dell Pro Max 16 Plus — Workstation 02<br/>NVIDIA RTX PRO 3000 Blackwell<br/>64GB RAM<br/>Thunderbolt dock<br/>dual 32in 4K monitors"]
        end

        %% ---------------------------
        %% AI Workload Landing Zone
        %% ---------------------------
        subgraph LANDING["AI Silo Workload Landing Zone — consumed by the pilot"]
            LANDING_NOTE["Pilot runtime placement to be confirmed by CEL / TI<br/>Mage, PostgreSQL/PostGIS, MongoDB, API/backend,<br/>model runtime and dashboard services<br/>must be mapped to the final host topology"]
            VALIDATION["Fase 0 Readiness Validation<br/>GPU visibility<br/>storage mounts<br/>network throughput<br/>remote access<br/>database/runtime availability<br/>benchmark GPU / IO / Red"]
        end

        %% ---------------------------
        %% Explicit Scope Boundary
        %% ---------------------------
        SCOPE_NOTE["Scope Boundary<br/>CEL / Martinexsa / Dell: procurement, delivery, racking, power,<br/>base cabling, base VLAN/switch config, iDRAC, firmware,<br/>base OS, storage sharing, support, warranties, platform administration.<br/><br/>Consultora: consumes the enabled environment,<br/>defines pilot requirements, deploys/configures pilot stack as applicable,<br/>and validates readiness for the hydrological AI pilot.<br/><br/>Excluded unless expressly added:<br/>Kubernetes/OpenShift, AD/LDAP integration, SIEM/NAC,<br/>advanced hardening, HA/DR, microsegmentation,<br/>WAN/provider integration, continuous platform administration."]
    end

    %% -------------------------------
    %% External connections
    %% -------------------------------
    INTERNET -->|controlled outbound data pulls| FW
    REMOTE -->|VPN / bastion| FW
    CEL_LAN --> CORE
    CORE --> FW
    DELL_CLOUD -->|support telemetry / outbound support path<br/>if enabled by CEL| FW
    FW -->|uplink to AI Silo network| TOR

    %% -------------------------------
    %% Facility hosting
    %% -------------------------------
    FAC -. hosts / powers / cools .-> TOR
    FAC -. hosts / powers / cools .-> R770_AI
    FAC -. hosts / powers / cools .-> R770_VIRT
    FAC -. hosts / powers / cools .-> R570_NAS
    FAC -. houses endpoints as applicable .-> WS1
    FAC -. houses endpoints as applicable .-> WS2

    %% -------------------------------
    %% Network segmentation
    %% -------------------------------
    TOR --> MGMT_VLAN
    TOR --> AI_VLAN
    TOR --> VIRT_VLAN
    TOR --> STORAGE_VLAN
    TOR --> USER_VLAN

    %% -------------------------------
    %% Server connections
    %% -------------------------------
    AI_VLAN <-->|25GbE / 100GbE as configured| R770_AI
    VIRT_VLAN <-->|25GbE as configured| R770_VIRT
    STORAGE_VLAN <-->|25GbE as configured| R570_NAS
    USER_VLAN <-->|client / admin access| WS1
    USER_VLAN <-->|client / admin access| WS2

    %% -------------------------------
    %% Storage flows
    %% -------------------------------
    R770_AI <-->|datasets, checkpoints,<br/>model artifacts| R570_NAS
    R770_VIRT <-->|VM data / service data<br/>as defined by CEL| R570_NAS
    WS1 <-->|admin / visualization access| R570_NAS
    WS2 <-->|admin / visualization access| R570_NAS

    %% -------------------------------
    %% Management and support
    %% -------------------------------
    MGMT_VLAN <--> IDRAC
    IDRAC -. manages .-> R770_AI
    IDRAC -. manages .-> R770_VIRT
    IDRAC -. manages .-> R570_NAS
    SCG -. telemetry / support path .-> IDRAC
    PROSUPPORT -. escalation / warranty .-> SCG
    TECHCIRCLE -. advisory support .-> R770_AI
    TECHCIRCLE -. advisory support .-> R770_VIRT
    TECHCIRCLE -. advisory support .-> R570_NAS

    %% -------------------------------
    %% AI workload landing zone
    %% -------------------------------
    R770_AI -. GPU runtime target .-> LANDING_NOTE
    R770_VIRT -. possible service host .-> LANDING_NOTE
    R570_NAS -. storage dependency .-> LANDING_NOTE
    TOR -. network dependency .-> LANDING_NOTE
    LANDING_NOTE --> VALIDATION

    %% -------------------------------
    %% Scope note
    %% -------------------------------
    SCOPE_NOTE -. applies to .-> FAC
    SCOPE_NOTE -. applies to .-> NET
    SCOPE_NOTE -. applies to .-> SERVERS
    SCOPE_NOTE -. applies to .-> LANDING

    %% -------------------------------
    %% Styling
    %% -------------------------------
    classDef external fill:#FFF8E6,stroke:#B38B00,stroke-width:1px,color:#111;
    classDef security fill:#FCEEEE,stroke:#B85C5C,stroke-width:1px,color:#111;
    classDef facility fill:#F7F7F7,stroke:#555,stroke-width:1px,color:#111;
    classDef network fill:#EEF4FF,stroke:#4C6FB3,stroke-width:1px,color:#111;
    classDef mgmt fill:#F4F0FF,stroke:#7A5CB8,stroke-width:1px,color:#111;
    classDef server fill:#F2FFF5,stroke:#4D9A63,stroke-width:1px,color:#111;
    classDef endpoint fill:#EFFFFF,stroke:#3C9EA3,stroke-width:1px,color:#111;
    classDef landing fill:#FFF2E8,stroke:#C97932,stroke-width:1px,color:#111;
    classDef scope fill:#FFECEC,stroke:#A33,stroke-width:1px,color:#111;

    class INTERNET,REMOTE,CEL_LAN,DELL_CLOUD external;
    class FW,CORE security;
    class FAC facility;
    class TOR,MGMT_VLAN,AI_VLAN,VIRT_VLAN,STORAGE_VLAN,USER_VLAN network;
    class IDRAC,SCG,PROSUPPORT,TECHCIRCLE mgmt;
    class R770_AI,R770_VIRT,R570_NAS server;
    class WS1,WS2 endpoint;
    class LANDING_NOTE,VALIDATION landing;
    class SCOPE_NOTE scope;
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
  "Para convertir los datos brutos en insumos listos para modelar, se implementará una canalización moderna basada en Python orquestada por Mage, que actúa como capa central de orquestación y observabilidad operacional del piloto conforme al Paquete Maestro §6.4. La capa de datos se ejecuta dentro del silo de IA on-premise adquirido por CEL (Anexo Complementario §8.2): consume las bases productivas PostgreSQL y MongoDB de CEL en modo solo-lectura, mantiene los pipelines como código en Git y aísla todo el procesamiento intensivo del piloto sin impactar los sistemas operativos del negocio.";

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
    decision: "Observabilidad operacional del piloto (Mage) y backup institucional",
    detail:
      "Mage es la capa de orquestación y observabilidad operacional del piloto conforme al Paquete Maestro §6.4 — sustituye a Pentaho y a Grafana en el plano del flujo de datos/IA. Queda por confirmar con CEL la integración (si aplica) con herramientas corporativas de monitoreo de infraestructura (Dell AI Ops, Secure Connect, SIEM/NOC) y la política de backup institucional sobre el NAS R570, que son responsabilidad de CEL/proveedor (§6.5).",
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
      "Mantener el monitoreo de hardware, GPU y servicios base mediante las herramientas Dell ProSupport (Dell AI Ops, Secure Connect Gateway, TechDirect, MyService360) y la observabilidad operacional del flujo del piloto en Mage.",
      "Ejecutar respaldos al NAS R570 y verificar restauraciones periódicas según la política institucional de CEL.",
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
      "Capacitación al DevOps de enlace sobre el stack del piloto (Mage como orquestador y observabilidad operacional, Git como repositorio de pipelines).",
      "Ejercicios con eventos históricos (p. ej. Stan, evento 2011) para validar respuesta del sistema y de los protocolos.",
      "Retroalimentación estructurada del usuario operativo durante los primeros meses (operación semi-supervisada).",
    ],
  },
};

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
    label: "Comité Consultivo de TI (5 roles)",
    fte: "0.35 compartido",
    scope:
      "Lorena Pineda, Nelson Flores, Carlos Sánchez, Adrián Miranda y Miladis (Unidad de Informática de CEL). José Manuel Guardado no se cuenta aquí: figura embebido como DevOps operativo.",
    detail:
      "No tiene rol operativo diario. Funciona como comité que autoriza, informa y dicta cómo proceder en ciberseguridad, acceso a datos, infraestructura, redes y aprobaciones formales.",
    tone: "committee",
  },
  {
    label: "Ingeniero DevOps / Enlace operativo",
    fte: "1.0",
    scope: "José Manuel Guardado (jmguardado@cel.gob.sv) — recurso 100% operativo durante la fase de ejecución.",
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
    id: "pm-cel",
    role: "PM CEL + Contrato",
    person: "Ing. José Mauricio Herrera Mercado (jmherreram@cel.gob.sv)",
    scope: "Interno CEL",
    responsibilities: [
      "Gerente de Proyecto por parte de CEL y dueño de la administración del contrato con la consultora.",
      "Supervisión integral de la ejecución: cronogramas, comunicación interinstitucional y asignación de recursos.",
      "Punto de escalación primario entre la consultora y el liderazgo interno de CEL.",
    ],
  },
  {
    id: "lider-hidrologia",
    role: "Líder Técnico en Hidrología",
    person: "Ing. Víctor Alabí (vialabi@cel.gob.sv)",
    scope: "Interno CEL",
    responsibilities: [
      "Orientación experta y conocimiento empírico del río Lempa.",
      "Interpretación de la dinámica hidrológica y validación de coherencia operativa de las predicciones.",
      "Validador final de modelo, variables y utilidad operativa de los resultados; usuario principal del sistema.",
    ],
  },
  {
    id: "devops",
    role: "Administrador de Sistemas / Ingeniero DevOps",
    person: "Ing. José Manuel Guardado (jmguardado@cel.gob.sv)",
    scope: "Interno CEL",
    responsibilities: [
      "Enlace directo entre el Comité de Informática y el equipo del piloto.",
      "Liderazgo de la implementación física y configuración del AI Silo, ejecutando estrictamente los lineamientos del Comité.",
      "Instalación de Mage y configuración del repositorio Git/GitLab; bases para CI/CD y mantenibilidad.",
    ],
  },
  {
    id: "datos",
    role: "Ingeniero de Datos y Backend",
    person: "Ing. William Juárez (wjuarez@cel.gob.sv)",
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
    id: "direccion",
    role: "Equipo de Dirección del Piloto (CEL)",
    person: "Ing. Guillermo Colorado · Ing. Gerardo Ávalos · Ing. Mauricio Herrera Landaverde · Ing. Rigoberto Ávila (ravila@cel.gob.sv)",
    scope: "Interno CEL",
    responsibilities: [
      "Lineamiento ejecutivo del piloto a nivel CEL; rol e involucramiento específico pendiente por definir por etapa, conforme al DSP.",
      "Persona distinta al PM José Mauricio Herrera Mercado: Mauricio Herrera Landaverde participa aquí únicamente como integrante de Dirección.",
    ],
  },
];

export interface CommitteeMember {
  name: string;
  email?: string;
  area: string;
  responsibility: string;
}

export const COMMITTEE_INTRO =
  "Comité multidisciplinario de la Unidad de Informática de CEL. No ejecuta desarrollo diario: actúa como ente rector que autoriza, dicta lineamientos y define cómo la solución residirá y se integrará de manera segura en la infraestructura de CEL.";

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    name: "Lic. Lorena Pineda",
    email: "alpineda@cel.gob.sv",
    area: "Jefa de Unidad de Informática — Gobernanza y Autorizaciones",
    responsibility:
      "Lidera el Comité de Informática. Autoridad final: aprueba o no aprueba, autoriza o no autoriza y permanece informada. Owner de infraestructura y continuidad del piloto como producto interno de CEL.",
  },
  {
    name: "Nelson Flores",
    email: "nfloresc@cel.gob.sv",
    area: "Jefe de Área de Administración de Redes e Informática",
    responsibility:
      "Reporta a Lorena Pineda. Puede aprobar, autorizar, delegar y manejar recursos. Facilitador core del enlace DevOps y mecanismo operativo de escalamiento dentro del Comité.",
  },
  {
    name: "Ing. José Manuel Guardado",
    email: "jmguardado@cel.gob.sv",
    area: "Administrador de Sistemas / Ingeniero DevOps (enlace operativo)",
    responsibility:
      "Embebido operativamente en el Core Pilot Team. Enlace directo entre el piloto y el Comité de Informática: ejecuta la implementación técnica siguiendo los lineamientos del Comité.",
  },
  {
    name: "Carlos Sánchez",
    area: "Administrador de Base de Datos (DBA)",
    responsibility:
      "Rol delegado / consultado por Nelson. Define la gobernanza de las bases de datos del piloto (topografía, DEMs, GIS) y entrega recursos al enlace DevOps. Interdependencia crítica con los Ingenieros de Datos para replicación y accesos al ground truth.",
  },
  {
    name: "Adrián Miranda",
    area: "Administrador de Sistemas y Redes",
    responsibility:
      "Rol delegado / consultado por Nelson. Configura entornos (VLANs, túneles VPN, listas blancas de IPs) y entrega recursos al enlace DevOps. Realiza pre-auditorías de red antes del pase a producción.",
  },
  {
    name: "Miladis",
    area: "Especialista de Ciberseguridad",
    responsibility:
      "Rol delegado / consultado por Nelson. Lineamientos de seguridad y pre-auditorías de ciberseguridad de la solución antes del pase a producción. Entrega recursos al enlace DevOps.",
  },
];

export const GOVERNANCE_DIAGRAM = `%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Inter, Arial", "lineColor": "#9CA3AF"}}}%%

flowchart TB

%% =========================
%% C2 PROJECT LEADERSHIP
%% =========================

subgraph C2Group["C² Labs Project Leadership"]
direction TB

Camila["\`**Líder de Proyecto**

Camila Cruz
CEO & Founder
Correo: camila@c2labs.ai

Orquesta, gobierna y delega.
Owner de la relación completa.\`"]:::c2Lead

Kevin["\`**Project Manager PM**

Kevin Centeno
Área: Operaciones
Correo: kevin@c2labs.ai

Coordina ejecución, seguimiento
y operación PM del piloto.\`"]:::c2

Camila <-->|dirección, PM execution y coordinación interna| Kevin

end


%% =========================
%% CEL CORE PILOT TEAM
%% =========================

subgraph CELCore["CEL Core Pilot Team"]
direction TB

Mauricio["\`**PM / Líder de Proyecto CEL**
**Administración del Contrato**

Ing. José Mauricio Herrera Mercado
Área: Gerencia de Producción
Correo: jmherreram@cel.gob.sv

Responsable CEL de coordinación,
contrato y relación operativa.\`"]:::celLead

Victor["\`**Líder Técnico en Hidrología**

Ing. Víctor Alabí
Área: Gerencia de Producción
Correo: vialabi@cel.gob.sv

Lidera análisis hidrológico.
Liaison técnico directo con centrales.\`"]:::cel

Fernando["\`**Especialista SIG / Teledetección**

Ing. Fernando Garay
Área: Departamento de Catastro GIS
Correo: fgaray@cel.gob.sv

Apoya validación espacial,
SIG y teledetección.\`"]:::cel

William["\`**Ingeniero de Datos y Backend**

Ing. William Juárez
Área: Gerencia Comercial
Correo: wjuarez@cel.gob.sv

Apoya datos, backend,
integraciones y estructura técnica.\`"]:::cel

JoseDevOps["\`**Administrador de Sistemas / Ingeniero DevOps**

Ing. José Manuel Guardado
Área: Unidad de Informática
Correo: jmguardado@cel.gob.sv

Embebido operativamente en el piloto.
Link entre Core Pilot Team
y Comité de Informática.\`"]:::cel

end


%% =========================
%% TOP COORDINATION
%% =========================

Camila <-->|owner relación global / alineación estratégica| Mauricio
Kevin <-->|cadencia PM / seguimiento operativo| Mauricio

Camila --> GovHub

GovHub["\`**Gobernanza global del proyecto**

Camila mantiene relación con todos los frentes:
CEL PM, equipo técnico, validación,
DevOps y Comité de Informática.

Orquesta, gobierna, delega
y escala cuando corresponde.\`"]:::governance

GovHub -.-> Kevin
GovHub -.-> Mauricio
GovHub -.-> Victor
GovHub -.-> Fernando
GovHub -.-> William
GovHub -.-> JoseDevOps


%% =========================
%% CEL INTERNAL OPERATING MODEL
%% =========================

Mauricio <-->|trabajan de la mano| Victor

Mauricio -->|coordina operatividad del piloto| William
Mauricio -->|coordina operatividad del piloto| Fernando
Mauricio -->|coordina necesidades infra / deployment| JoseDevOps

Victor <-->|requerimientos hidrológicos y validación técnica| William
Victor <-->|validación espacial / SIG / teledetección| Fernando
JoseDevOps <-->|infraestructura, despliegue y continuidad técnica| William


%% =========================
%% HYDRO PLANTS / VALIDATION
%% =========================

HydroLiaison["\`**Leads analysis and liaises with centrales**

Víctor lidera la relación técnica directa
con las cinco centrales para análisis,
validación y alineación hidrológica.\`"]:::hub

Victor --> HydroLiaison

subgraph PlantsGroup["Centrales Hidroeléctricas"]
direction LR

P15["\`**Central Hidroeléctrica**
15 de Septiembre\`"]:::plant

P5N["\`**Central Hidroeléctrica**
5 de Noviembre\`"]:::plant

PCG["\`**Central Hidroeléctrica**
Cerrón Grande\`"]:::plant

P3F["\`**Central Hidroeléctrica**
3 de Febrero\`"]:::plant

PGU["\`**Central Hidroeléctrica**
Guajoyo\`"]:::plant

end

HydroLiaison --> P15
HydroLiaison --> P5N
HydroLiaison --> PCG
HydroLiaison --> P3F
HydroLiaison --> PGU

ValidationInput["\`**Input de validación de centrales**

Las centrales son consultadas
para proveer criterio operativo,
validación y alineación en fases core.\`"]:::note

P15 --> ValidationInput
P5N --> ValidationInput
PCG --> ValidationInput
P3F --> ValidationInput
PGU --> ValidationInput

ValidationInput -->|input para validación| Camila
ValidationInput -->|input para seguimiento PM| Kevin
ValidationInput -->|input para contrato / coordinación CEL| Mauricio
ValidationInput -->|input técnico hidrológico| Victor
ValidationInput -->|input SIG / teledetección| Fernando


%% =========================
%% COMITÉ DE INFORMÁTICA
%% =========================

subgraph ITCommittee["Comité de Informática"]
direction TB

Lorena["\`**Jefe de Unidad de Informática**

Lic. Lorena Pineda
Área: Unidad de Informática
Correo: alpineda@cel.gob.sv

Lidera el Comité de Informática.
Rol de autoridad.

Aprueba o no aprueba.
Autoriza o no autoriza.
Permanece informada siempre.

Owner de infraestructura
y continuidad del piloto
como producto interno de CEL.\`"]:::itLead

Nelson["\`**Jefe de Área de Administración de Redes e Informática**

Nelson Flores
Área: Unidad de Informática
Correo: nfloresc@cel.gob.sv

Managed by Lorena Pineda.

Puede aprobar, autorizar,
delegar y manejar recursos.

Facilitador core para DevOps.
Mecanismo operativo de escalamiento.\`"]:::it

Adrian["\`**Administrador de Sistemas y Redes**

Adrián Miranda

Rol delegado / consultado.
Ejecuta y entrega recursos
para necesidades DevOps.\`"]:::delegated

Carlos["\`**Administrador de Base de Datos**

Carlos Sánchez

Rol delegado / consultado.
Ejecuta y entrega recursos
para necesidades DevOps.\`"]:::delegated

Miladis["\`**Especialista de Ciberseguridad**

Miladis

Rol delegado / consultado.
Ejecuta y entrega recursos
para necesidades DevOps.\`"]:::delegated

end


%% =========================
%% DEVOPS / IT COMMITTEE DYNAMICS
%% =========================

GovHub -.-> Lorena
GovHub -.-> Nelson
GovHub -.-> Adrian
GovHub -.-> Carlos
GovHub -.-> Miladis

JoseDevOps <-->|liaison operativo Core Pilot Team / Comité| Lorena
JoseDevOps <-->|se aboca, coordina y escala operativamente| Nelson

Lorena -->|lidera comité / autoridad final / manages| Nelson

Nelson -->|delegates / manages / obtains resources| Adrian
Nelson -->|delegates / manages / obtains resources| Carlos
Nelson -->|delegates / manages / obtains resources| Miladis

Adrian -->|executes and delivers resources to DevOps| JoseDevOps
Carlos -->|executes and delivers resources to DevOps| JoseDevOps
Miladis -->|executes and delivers resources to DevOps| JoseDevOps


%% =========================
%% STYLES
%% =========================

classDef c2Lead fill:#FF8F95,stroke:#D85C63,stroke-width:1.5px,color:#111827;
classDef c2 fill:#FFA8AD,stroke:#D85C63,stroke-width:1px,color:#111827;

classDef celLead fill:#FFF176,stroke:#D6C945,stroke-width:1.5px,color:#111827;
classDef cel fill:#FFF59D,stroke:#D6C945,stroke-width:1px,color:#111827;

classDef plant fill:#61D987,stroke:#40B96B,stroke-width:1px,color:#111827;

classDef itLead fill:#6FE1DA,stroke:#30AAA4,stroke-width:1.5px,color:#111827;
classDef it fill:#8BE6E0,stroke:#30AAA4,stroke-width:1px,color:#111827;
classDef delegated fill:#B9F3EF,stroke:#30AAA4,stroke-width:1px,color:#111827;

classDef governance fill:#FFFFFF,stroke:#111827,stroke-width:1.5px,color:#111827;
classDef hub fill:#FFFFFF,stroke:#9CA3AF,stroke-width:1px,stroke-dasharray:5 5,color:#374151;
classDef note fill:#FFFFFF,stroke:#D1D5DB,stroke-width:1px,color:#374151;

style C2Group fill:#FFF5F5,stroke:#FF8F95,stroke-width:1px;
style CELCore fill:#FFFDE7,stroke:#D6C945,stroke-width:1px;
style PlantsGroup fill:#F0FFF4,stroke:#40B96B,stroke-width:1px;
style ITCommittee fill:#ECFEFF,stroke:#30AAA4,stroke-width:1px;`;

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
  { short: "PM CEL", full: "José Mauricio Herrera Mercado — PM CEL + Contrato" },
  { short: "Comité TI", full: "Comité de Informática — Autorización y Gobernanza" },
  { short: "DevOps", full: "José Manuel Guardado — DevOps / Enlace operativo" },
  { short: "Datos", full: "William Juárez — Ingeniería de Datos" },
  { short: "SIG", full: "Fernando Garay — SIG / Teledetección" },
  { short: "Líder Hidrología", full: "Víctor Alabí — Líder Técnico Hidrología" },
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

export interface HardwareItem {
  domain: string;
  model: string;
  qty: string;
  config: string;
  use: string;
}

export interface SoftwareItem {
  bucket: "Base provista por plataforma" | "Stack funcional del piloto";
  component: string;
  purpose: string;
  responsable: string;
  faseImplication: string;
}

export interface DefensibleClause {
  id: string;
  title: string;
  body: string;
}

export const INFRA_INTRO =
  "La infraestructura física vigente del piloto es la plataforma efectivamente adquirida por CEL a través de Martinexsa/Dell Technologies y formalizada en el Anexo Complementario No. 1 del Paquete Maestro (§8.2). El BOM original del DSP queda reemplazado en lo relativo a infraestructura física: la arquitectura de tres nodos genéricos, la GPU NVIDIA RTX 4090, el NAS ZFS/OpenZFS, el switch 10GbE y los stacks de Grafana y Pentaho ya no aplican. La Consultora consume esta plataforma como entorno habilitante del piloto; la administración, soporte y garantías de la infraestructura corresponden a CEL, Martinexsa y Dell conforme a la cláusula §6.5 de ownership de infraestructura.";

export const INFRA_BOM_DISCLAIMER =
  "Reemplaza el BOM original del DSP. Mage sustituye a Pentaho y a Grafana como capa de orquestación y observabilidad operacional del piloto (§6.4). La GPU contemplada es NVIDIA H100 NVL PCIe (94 GB HBM3) — la certificación funcional debe validarse contra la unidad efectivamente instalada y habilitada por CEL/proveedor. La ubicación final de Mage, PostgreSQL/PostGIS, MongoDB, dashboard/API y repositorios la define CEL/TI y/o el proveedor antes de certificar el inicio efectivo de Fase 0 (§6.3).";

export const INFRA_HARDWARE: HardwareItem[] = [
  {
    domain: "Servidor IA / ML",
    model: "Dell PowerEdge R770",
    qty: "1",
    config: "2× Intel Xeon 6 Performance 6515P; 256 GB DDR5; GPU NVIDIA H100 NVL PCIe 94 GB HBM3; 2× SSD SATA 480 GB (sistema); 2× NVMe 1.92 TB (workspace); NIC NVIDIA ConnectX-6 Dx dual port 100GbE; interfaces 25GbE SFP28; iDRAC Enterprise.",
    use: "Entrenamiento, inferencia, analítica avanzada, procesamiento intensivo y uso funcional de GPU para el piloto.",
  },
  {
    domain: "Servidor virtualización",
    model: "Dell PowerEdge R770",
    qty: "1",
    config: "2× Intel Xeon 6 Performance 6515P; 256 GB DDR5; almacenamiento SSD empresarial; adaptador 25GbE SFP28; iDRAC Enterprise; configuración base sujeta al diseño de CEL/TI.",
    use: "Hospedaje de VMs, servicios institucionales, middleware y potencial alojamiento de Mage/BDs si CEL/TI así lo define.",
  },
  {
    domain: "NAS / File Server",
    model: "Dell PowerEdge R570",
    qty: "1",
    config: "Intel Xeon 6 Performance 6511P; 64 GB DDR5; Windows Server 2025 Standard; BOSS-N1 2× M.2 480 GB en RAID 1 (sistema); 6× HDD empresariales 4 TB en RAID 6; 25GbE SFP28; iDRAC Enterprise.",
    use: "Repositorio de datasets de IA, almacenamiento centralizado, histórico documental y compartición SMB/NFS para el piloto.",
  },
  {
    domain: "Switch Data Center",
    model: "Dell PowerSwitch S5224F-ON",
    qty: "1",
    config: "24× puertos 25GbE SFP28; 4× puertos 100GbE QSFP28; Dell SmartFabric OS10; L2/L3 (VLAN/ACL/OSPF/BGP); fuentes redundantes; ópticos y DAC según oferta.",
    use: "Conectividad ToR de alta velocidad entre servidores, NAS y data center.",
  },
  {
    domain: "Estaciones de gestión",
    model: "Dell Pro Max 16 Plus Laptop",
    qty: "2",
    config: "Intel Core Ultra 9; GPU NVIDIA RTX PRO 3000 Blackwell 12 GB GDDR7; 64 GB DDR5; SSD NVMe 1 TB; Windows 11 Pro; Thunderbolt; Wi-Fi 7.",
    use: "Gestión, análisis técnico, visualización y administración de plataforma para usuarios designados por CEL.",
  },
  {
    domain: "Docking",
    model: "Dell Pro Thunderbolt 4 — WD25TB4",
    qty: "2",
    config: "Docking station para centralizar periféricos, energía y conectividad.",
    use: "Soporte de las estaciones de gestión.",
  },
  {
    domain: "Monitores",
    model: "Dell 32 Plus 4K Monitor — S3225QS",
    qty: "4",
    config: "Monitores 32\" 4K UHD; dos por estación de trabajo.",
    use: "Visualización extendida para operación, análisis y gestión.",
  },
  {
    domain: "Accesorios",
    model: "Brazos duales MDA20 + teclado/mouse KM332W",
    qty: "2 sets",
    config: "Brazos duales para monitores y periféricos Dell.",
    use: "Ergonomía y productividad de estaciones.",
  },
  {
    domain: "Soporte fabricante",
    model: "Dell ProSupport Plus Mission Critical",
    qty: "3 años",
    config: "Soporte técnico 24×7, diagnóstico remoto, SLA, reemplazo de partes críticas; herramientas Dell AI Ops, Secure Connect Gateway, TechDirect y MyService360.",
    use: "Continuidad y soporte de infraestructura — responsabilidad de CEL/Dell/Martinexsa.",
  },
  {
    domain: "Soporte / licencia GPU",
    model: "NVIDIA AI Enterprise",
    qty: "3 años por GPU",
    config: "Subscription y soporte 24×7 por GPU; frameworks optimizados, contenedores certificados, bibliotecas aceleradas y soporte especializado NVIDIA.",
    use: "Habilitador del entorno acelerado NVIDIA — administración y licenciamiento bajo CEL/proveedor.",
  },
  {
    domain: "Acompañamiento técnico",
    model: "TechCircle",
    qty: "30 horas remotas",
    config: "Asistencia especializada para evolución, revisión de arquitectura, recomendaciones de crecimiento, desempeño inicial, ajustes de red/almacenamiento/virtualización y buenas prácticas de IA/datos.",
    use: "Recurso de soporte de CEL/proveedor; no sustituye ni amplía las obligaciones de la Consultora.",
  },
];

export const INFRA_SOFTWARE: SoftwareItem[] = [
  {
    bucket: "Base provista por plataforma",
    component: "Ubuntu Server 24.04 LTS",
    purpose: "Sistema operativo base de los servidores Linux del silo.",
    responsable: "CEL / Martinexsa / Dell",
    faseImplication: "Debe estar instalado, actualizado, accesible y documentado antes de la certificación funcional de Fase 0 (§6.3).",
  },
  {
    bucket: "Base provista por plataforma",
    component: "Docker Engine + Docker Compose",
    purpose: "Runtime de contenedores instalado en el servidor ML/IA y/o host designado.",
    responsable: "CEL / Martinexsa / Dell",
    faseImplication: "La Consultora puede desplegar Mage y servicios del piloto sobre este runtime; la administración base queda fuera de su alcance.",
  },
  {
    bucket: "Base provista por plataforma",
    component: "Windows Server 2025 Standard",
    purpose: "Sistema operativo del NAS / File Server R570.",
    responsable: "CEL / Martinexsa / Dell",
    faseImplication: "Habilita SMB/NFS y servicios de archivo; su administración no corresponde a la Consultora.",
  },
  {
    bucket: "Base provista por plataforma",
    component: "Dell SmartFabric OS10",
    purpose: "Sistema operativo del switch S5224F-ON.",
    responsable: "CEL / Martinexsa / Dell",
    faseImplication: "Configuración de red, VLANs, ACLs y routing bajo CEL/proveedor.",
  },
  {
    bucket: "Base provista por plataforma",
    component: "iDRAC Enterprise",
    purpose: "Administración remota de los servidores Dell.",
    responsable: "CEL / Martinexsa / Dell",
    faseImplication: "Credenciales y uso restringidos a TI/proveedor salvo que CEL otorgue acceso específico.",
  },
  {
    bucket: "Base provista por plataforma",
    component: "NVIDIA AI Enterprise (subscription + soporte 24×7)",
    purpose: "Licencia y soporte por GPU para uso enterprise de aceleración NVIDIA.",
    responsable: "CEL / Martinexsa / Dell / NVIDIA",
    faseImplication: "Debe confirmarse activación, drivers, CUDA, container runtime y acceso a NGC si aplica.",
  },
  {
    bucket: "Base provista por plataforma",
    component: "Dell AI Ops, Secure Connect Gateway, TechDirect, MyService360",
    purpose: "Herramientas de soporte y telemetría asociadas a Dell ProSupport.",
    responsable: "CEL / Dell / Martinexsa",
    faseImplication: "Monitoreo y soporte de fabricante; no constituye monitoreo operativo del pipeline del piloto (§6.4).",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "Mage",
    purpose: "Orquestación de pipelines, ejecución diaria, dependencias, logs, retries y observabilidad operacional del flujo del piloto.",
    responsable: "Consultora configura y desarrolla; CEL/TI provee host y accesos.",
    faseImplication: "Sustituye a Pentaho y a Grafana en el plano operativo del piloto (§6.4).",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "Python + librerías científicas",
    purpose: "Pandas, NumPy, GeoPandas, Rasterio/GDAL, scikit-learn, requests, psycopg2, pymongo y similares.",
    responsable: "Consultora",
    faseImplication: "ETL, QA/QC, features, procesamiento geoespacial y conectividad de datos del piloto.",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "PyTorch + NeuralHydrology + Optuna",
    purpose: "Framework de modelado LSTM, entrenamiento, validación, inferencia y optimización bayesiana de hiperparámetros.",
    responsable: "Consultora",
    faseImplication: "Utiliza la GPU H100 NVL del servidor R770 IA para entrenamiento e inferencia.",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "PostgreSQL + PostGIS",
    purpose: "Series históricas depuradas, geometrías de cuenca y mapas de inundación.",
    responsable: "Consultora opera para el piloto; CEL/TI define hospedaje y administración base.",
    faseImplication: "La ubicación final (servidor IA, virtualización o NAS) la define CEL/TI antes de certificar Fase 0.",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "MongoDB",
    purpose: "Datos operativos del piloto en tiempo real consumidos por el dashboard.",
    responsable: "Consultora opera para el piloto; CEL/TI define hospedaje.",
    faseImplication: "La ubicación final queda sujeta a la decisión de CEL/TI/proveedor.",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "Git / repositorio de pipelines",
    purpose: "Fuente única de verdad para pipelines, código del modelo y configuración como código.",
    responsable: "Consultora; CEL/TI define si vive en silo, GitLab corporativo u otra instancia.",
    faseImplication: "Decisión de hospedaje (ver OD-12) requerida antes de Fase 0.",
  },
  {
    bucket: "Stack funcional del piloto",
    component: "Node.js + React + Leaflet (dashboard/API)",
    purpose: "API y dashboard interactivo del portal interno de CEL.",
    responsable: "Consultora",
    faseImplication: "Servido desde el silo y expuesto en la intranet de CEL.",
  },
];

export const INFRA_DEFENSIBLE_CLAUSES: DefensibleClause[] = [
  {
    id: "6.1",
    title: "Cláusula de alineación técnica",
    body: "Para efectos de ejecución del piloto, las referencias técnicas contenidas en el DSP, Anexo Técnico B y Anexo Técnico C relativas a una arquitectura física específica de tres nodos, GPU NVIDIA RTX 4090, NAS basado en ZFS/OpenZFS, switch 10GbE, Grafana, Pentaho o CAPEX/OPEX de infraestructura original deberán entenderse sustituidas, únicamente en lo relativo a infraestructura física efectivamente provista, por la arquitectura que CEL adquiera y ponga a disposición a través de su proveedor. Las referencias metodológicas, entregables, fases, lógica funcional del sistema, uso de Mage, bases de datos, pipelines, modelo hidrológico, dashboard, alertas, documentación y transferencia se mantienen conforme al alcance del DSP, salvo modificación expresa.",
  },
  {
    id: "6.2",
    title: "Cláusula de no ampliación de alcance",
    body: "La adquisición, disponibilidad o inclusión de componentes adicionales por parte de CEL no ampliará tácitamente el alcance, las obligaciones, el precio, el plazo ni las responsabilidades de la Consultora. Cualquier servicio adicional relativo a administración de infraestructura, soporte, operación continua, monitoreo 24/7, hardening corporativo, alta disponibilidad, recuperación ante desastres, integración de identidad, SIEM, backup corporativo, virtualización institucional, configuración avanzada de red, estaciones de trabajo o cualquier servicio explícitamente excluido por el proveedor requerirá formalización expresa mediante instrumento contractual, orden de cambio o contratación independiente.",
  },
  {
    id: "6.3",
    title: "Cláusula de inicio efectivo de Fase 0",
    body: "La ejecución técnica plena de Fase 0 quedará condicionada a que CEL entregue a la Consultora un entorno mínimo operacional, accesible y verificable, incluyendo como mínimo: equipos instalados y energizados, red base funcional, acceso remoto seguro, credenciales, sistema operativo base, GPU y drivers verificables, almacenamiento disponible, rutas y permisos, responsables técnicos identificados de CEL/proveedor y documentación de soporte. Los atrasos, fallas, limitaciones o pendientes asociados a adquisición, instalación, garantía, licenciamiento, red corporativa, soporte del proveedor o acceso institucional no serán imputables a la Consultora.",
  },
  {
    id: "6.4",
    title: "Cláusula Mage / observabilidad operacional",
    body: "La orquestación, trazabilidad, programación, monitoreo operacional de pipelines, logs, retries y gestión de errores del sistema de pronóstico se realizará mediante Mage. Esta observabilidad se limita al flujo de datos, IA y automatización del piloto, y no sustituye herramientas corporativas de monitoreo de infraestructura, SIEM, NOC, observabilidad de data center, administración 24/7 ni plataformas como Grafana, salvo decisión y alcance adicional formalmente acordados con CEL.",
  },
  {
    id: "6.5",
    title: "Cláusula de ownership de infraestructura",
    body: "CEL, su área de Informática/Seguridad y el proveedor de infraestructura conservarán la responsabilidad primaria sobre la plataforma física, la red, la seguridad institucional, las garantías, el soporte, la administración continua, los parches corporativos, los usuarios, las credenciales, los backups institucionales, las licencias y la operación de los componentes Dell/NVIDIA/Martinexsa. La Consultora documentará las dependencias técnicas del piloto y validará funcionalmente el entorno para los fines del proyecto, sin asumir titularidad operacional sobre la infraestructura institucional.",
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
