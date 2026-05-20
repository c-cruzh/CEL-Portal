import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlertCircle,
  AlignLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Layers,
  Map as MapIcon,
  Play,
  Server,
  Settings,
  Shield,
  Search as SearchIcon,
} from "lucide-react";
import { Mermaid } from "@/components/Mermaid";
import {
  FLUJO_DIAGRAM,
  AI_SILO_LOGICAL_DIAGRAM,
  DC_PHYSICAL_TOPOLOGY_DIAGRAM,
  FLUJO_INTRO,
  FLUJO_STAGES,
  FLUJO_OUTRO,
  FLUJO_CROSS_LINKS,
  DATOS_INTRO,
  DATOS_CATEGORIES,
  DATA_REGISTRY,
  type DataRegistryStatus,
  ETL_INTRO,
  ETL_DIAGRAM,
  ETL_STAGES_ORDERED,
  MODEL_LSTM,
  MODEL_FLOOD,
  VALIDATION_ROLLING,
  VALIDATION_METRICS,
  VALIDATION_GOALS,
  OPEN_DECISIONS,
  OPEN_DECISIONS_INTRO,
  type OpenDecisionStatus,
  DECISIONES_CONFIRMADAS_INTRO,
  DECISIONES_TECNICAS,
  OPERACION_DIARIA,
  CEL_DAILY_RESPONSIBILITIES,
  CEL_DAILY_RESPONSIBILITIES_INTRO,
  RACI_INTRO,
  FTE_BREAKDOWN,
  TEAM_PROFILES,
  COMMITTEE_INTRO,
  COMMITTEE_MEMBERS,
  GOVERNANCE_DIAGRAM,
  PHASE_TASKS,
  VISUALIZACION,
  RACI_ROLES,
  RACI_TASKS,
  RACI_LEGEND,
  INFRA_INTRO,
  INFRA_BOM_DISCLAIMER,
  INFRA_ARCHITECTURE,
  INFRA_HARDWARE,
  INFRA_SOFTWARE,
  INFRA_COMMISSIONING,
  INFRA_BACKUP_POLICIES,
  LEMPA,
  type InfraStatus,
} from "@/lib/desarrolloContent";

type ChapterId =
  | "flujo"
  | "datos"
  | "etl"
  | "modelos"
  | "validacion"
  | "decisiones"
  | "operacion"
  | "visualizacion"
  | "raci"
  | "infraestructura"
  | "anexo-lempa";

interface ChapterDef {
  id: ChapterId;
  num: string;
  shortLabel: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType;
  toc: { id: string; label: string }[];
}

const CHAPTERS: ChapterDef[] = [
  { id: "flujo", num: "1", shortLabel: "Flujo del sistema", title: "Flujo completo del sistema", Icon: Activity, Component: FlujoSection, toc: [{ id: "flujo-diagrama", label: "Diagrama del sistema" }, { id: "flujo-etapas", label: "Etapas del pipeline" }, { id: "flujo-sintesis", label: "Síntesis" }] },
  { id: "datos", num: "2", shortLabel: "Datos de entrada", title: "Datos de entrada del sistema", Icon: Database, Component: DatosSection, toc: [{ id: "datos-categorias", label: "Categorías" }, { id: "datos-registry", label: "Registro de fuentes" }] },
  { id: "etl", num: "3", shortLabel: "ETL con Mage", title: "Pipelines ETL con Mage", Icon: Settings, Component: EtlSection, toc: [{ id: "etl-diagrama", label: "Diagrama" }, { id: "etl-stage-1", label: "1. Extracción" }, { id: "etl-stage-2", label: "2. Staging" }, { id: "etl-stage-3", label: "3. Transformación" }, { id: "etl-stage-4", label: "4. Carga" }, { id: "etl-stage-5", label: "5. Orquestación" }] },
  { id: "modelos", num: "4", shortLabel: "Modelos de predicción", title: "Modelos de predicción", Icon: Layers, Component: ModelosSection, toc: [{ id: "modelos-lstm", label: "Modelo LSTM" }, { id: "modelos-inundacion", label: "Modelo de inundación" }] },
  { id: "validacion", num: "5", shortLabel: "Validación y métricas", title: "Validación y métricas", Icon: Shield, Component: ValidacionSection, toc: [{ id: "validacion-rolling", label: "Origen rodante" }, { id: "validacion-metricas", label: "Métricas" }, { id: "validacion-goals", label: "Criterios de éxito" }] },
  { id: "decisiones", num: "6", shortLabel: "Decisiones abiertas y dependencias CEL", title: "Decisiones abiertas y dependencias con CEL", Icon: FileText, Component: DecisionesSection, toc: [{ id: "decisiones-abiertas", label: "Decisiones abiertas" }, { id: "decisiones-confirmadas", label: "Decisiones confirmadas" }] },
  { id: "operacion", num: "7", shortLabel: "Operación diaria", title: "Operación diaria", Icon: Play, Component: OperacionSection, toc: [{ id: "operacion-scheduling", label: "Programación" }, { id: "operacion-flujo", label: "Flujo diario" }, { id: "operacion-monitoreo", label: "Monitoreo y errores" }, { id: "operacion-cel", label: "Responsabilidades CEL" }] },
  { id: "visualizacion", num: "8", shortLabel: "Visualización y alertas", title: "Visualización y alertas", Icon: Activity, Component: VisualizacionSection, toc: [{ id: "visualizacion-features", label: "Funcionalidades" }, { id: "visualizacion-alertas", label: "Sistema de alertas" }, { id: "visualizacion-integracion", label: "Integración con el portal" }, { id: "visualizacion-capacitacion", label: "Capacitación y ejercicios" }] },
  { id: "infraestructura", num: "9", shortLabel: "BOM final aprobado por CEL", title: "BOM final aprobado por CEL — Silo de IA", Icon: Server, Component: InfraSection, toc: [{ id: "infra-topologia-fisica", label: "Topología física DC" }, { id: "infra-disclaimer", label: "Estado del BOM" }, { id: "infra-arquitectura", label: "Arquitectura" }, { id: "infra-hardware", label: "Hardware" }, { id: "infra-software", label: "Software" }, { id: "infra-comisionamiento", label: "Comisionamiento" }, { id: "infra-respaldo", label: "Respaldo y seguridad" }] },
  { id: "anexo-lempa", num: "10", shortLabel: "Anexo Lempa", title: "Anexo — Dinámicas hidrológicas y gobernanza trinacional del Lempa", Icon: MapIcon, Component: LempaSection, toc: [{ id: "lempa-geo", label: "Características geográficas" }, { id: "lempa-climate", label: "Cambio climático" }, { id: "lempa-governance", label: "Gobernanza trinacional" }, { id: "lempa-implications", label: "Implicaciones para la IA" }] },
  { id: "raci", num: "11", shortLabel: "Equipo y RACI", title: "Equipo, FTE y matriz RACI", Icon: AlignLeft, Component: RaciSection, toc: [{ id: "raci-estructura", label: "Cómo está organizado el capítulo" }, { id: "raci-gobernanza", label: "Estructura de gobernanza del piloto" }, { id: "raci-fte", label: "A.1 Estructura operativa y FTE" }, { id: "raci-comite", label: "A.2 Comité de Informática (CEL)" }, { id: "raci-perfiles", label: "A.3 Perfiles del equipo" }, { id: "raci-matriz", label: "B.1 Matriz RACI consolidada" }, { id: "raci-tareas", label: "B.2 Detalle de tareas por fase" }] },
];

const ANEXO_GROUPS: { id: string; title: string; chapters: ChapterId[] }[] = [
  {
    id: "tecnico",
    title: "Capítulos técnicos (1-9)",
    chapters: [
      "flujo",
      "datos",
      "etl",
      "modelos",
      "validacion",
      "decisiones",
      "operacion",
      "visualizacion",
      "infraestructura",
    ],
  },
  {
    id: "lempa",
    title: "Anexo Lempa",
    chapters: ["anexo-lempa"],
  },
  {
    id: "equipo-roles",
    title: "Equipo y RACI",
    chapters: ["raci"],
  },
];

const CHAPTER_IDS: ChapterId[] = [
  "flujo",
  "datos",
  "etl",
  "modelos",
  "validacion",
  "decisiones",
  "operacion",
  "visualizacion",
  "infraestructura",
  "anexo-lempa",
  "raci",
];

function parseDeepLink(): { chapter: ChapterId | null; anchor: string | null } {
  if (typeof window === "undefined") return { chapter: null, anchor: null };
  const params = new URLSearchParams(window.location.search);
  const capParam = params.get("cap") ?? params.get("chapter");
  const hash = window.location.hash.replace(/^#/, "") || null;
  let chapter: ChapterId | null = null;
  if (capParam && (CHAPTER_IDS as string[]).includes(capParam)) {
    chapter = capParam as ChapterId;
  } else if (hash) {
    if ((CHAPTER_IDS as string[]).includes(hash)) {
      chapter = hash as ChapterId;
    } else {
      const match = CHAPTERS.find((c) => c.toc.some((t) => t.id === hash));
      if (match) chapter = match.id;
    }
  }
  return { chapter, anchor: hash };
}

export default function Desarrollo() {
  const initial = typeof window !== "undefined" ? parseDeepLink() : { chapter: null, anchor: null };
  const [activeId, setActiveId] = useState<ChapterId>(initial.chapter ?? "flujo");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "tecnico": true,
    "lempa": false,
    "equipo-roles": false,
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const { chapter, anchor } = parseDeepLink();
    if (chapter) {
      setActiveId(chapter);
      const anexo = ANEXO_GROUPS.find((g) => g.chapters.includes(chapter));
      if (anexo) setExpanded((prev) => ({ ...prev, [anexo.id]: true }));
    }
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
    const onHashChange = () => {
      const dl = parseDeepLink();
      if (dl.chapter) {
        setActiveId(dl.chapter);
        const anexo = ANEXO_GROUPS.find((g) => g.chapters.includes(dl.chapter!));
        if (anexo) setExpanded((prev) => ({ ...prev, [anexo.id]: true }));
      }
      if (dl.anchor) {
        setTimeout(() => {
          const el = document.getElementById(dl.anchor!);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const activeIdx = CHAPTERS.findIndex((c) => c.id === activeId);
  const active = CHAPTERS[activeIdx];
  const prev = activeIdx > 0 ? CHAPTERS[activeIdx - 1] : null;
  const next = activeIdx < CHAPTERS.length - 1 ? CHAPTERS[activeIdx + 1] : null;
  const activeAnexo = useMemo(
    () => ANEXO_GROUPS.find((g) => g.chapters.includes(activeId))!,
    [activeId],
  );

  const goTo = (id: ChapterId) => {
    setActiveId(id);
    const anexo = ANEXO_GROUPS.find((g) => g.chapters.includes(id));
    if (anexo) setExpanded((prev) => ({ ...prev, [anexo.id]: true }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleGroup = (gid: string) =>
    setExpanded((prev) => ({ ...prev, [gid]: !prev[gid] }));

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ANEXO_GROUPS;
    return ANEXO_GROUPS.map((g) => ({
      ...g,
      chapters: g.chapters.filter((cid) => {
        const ch = CHAPTERS.find((c) => c.id === cid)!;
        return (
          ch.shortLabel.toLowerCase().includes(q) ||
          ch.title.toLowerCase().includes(q) ||
          ch.num.toLowerCase().includes(q)
        );
      }),
    })).filter((g) => g.chapters.length > 0);
  }, [query]);

  const ActiveComponent = active.Component;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)_200px] lg:gap-8">
        {/* Sidebar izquierdo */}
        <aside className="hidden lg:flex flex-col border-r border-border pr-4 -ml-2">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
            <div className="relative mb-3">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar capítulo"
                className="w-full bg-muted/60 border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
            </div>
            <ScrollArea className="flex-1 pr-1">
              <nav className="space-y-3 pb-6">
                {filteredGroups.map((g) => {
                  const isOpen = expanded[g.id] ?? false;
                  return (
                    <div key={g.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>{g.title}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="space-y-0.5">
                          {g.chapters.map((cid) => {
                            const ch = CHAPTERS.find((c) => c.id === cid)!;
                            const isActive = ch.id === activeId;
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => goTo(ch.id)}
                                className={`flex items-center w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                                  isActive
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                <ch.Icon className="w-4 h-4 mr-2 shrink-0" />
                                <span className="truncate">
                                  {ch.num}. {ch.shortLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Sin resultados para "{query}".
                  </p>
                )}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="min-w-0">
          <div className="max-w-[760px] mx-auto">
            <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
              <span>Desarrollo Técnico</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{activeAnexo.title.replace(/ — .*$/, "")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">
                {active.num}. {active.shortLabel}
              </span>
            </nav>

            <header className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Capítulo {active.num}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {active.title}
              </h1>
            </header>

            {/* Selector móvil */}
            <div className="lg:hidden mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Capítulo
              </label>
              <select
                value={activeId}
                onChange={(e) => goTo(e.target.value as ChapterId)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ANEXO_GROUPS.map((g) => (
                  <optgroup key={g.id} label={g.title}>
                    {g.chapters.map((cid) => {
                      const ch = CHAPTERS.find((c) => c.id === cid)!;
                      return (
                        <option key={ch.id} value={ch.id}>
                          {ch.num}. {ch.shortLabel}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            <ActiveComponent />

            {/* Navegación inferior */}
            <div className="mt-12 pt-6 border-t border-border flex items-center justify-between gap-3">
              {prev ? (
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground gap-2 h-auto py-2 px-3 text-left flex-col items-start"
                  onClick={() => goTo(prev.id)}
                >
                  <span className="text-xs flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </span>
                  <span className="text-sm font-medium">
                    {prev.num}. {prev.shortLabel}
                  </span>
                </Button>
              ) : (
                <span />
              )}
              {next ? (
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 hover:text-primary gap-2 h-auto py-2 px-3 text-right flex-col items-end"
                  onClick={() => goTo(next.id)}
                >
                  <span className="text-xs flex items-center gap-1">
                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm font-medium">
                    {next.num}. {next.shortLabel}
                  </span>
                </Button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </main>

        {/* TOC derecho — "En esta página" */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {active.toc.length > 0 ? (
              <>
                <h4 className="font-semibold text-sm mb-3 text-foreground">En esta página</h4>
                <nav className="flex flex-col space-y-2 text-sm border-l border-border">
                  {active.toc.map((t) => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className="text-muted-foreground hover:text-foreground pl-3 -ml-px border-l-2 border-transparent hover:border-border transition-colors"
                    >
                      {t.label}
                    </a>
                  ))}
                </nav>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ intro }: { id?: string; eyebrow?: string; title?: string; intro?: string }) {
  if (!intro) return null;
  return (
    <header className="mb-6">
      <p className="text-base text-muted-foreground leading-relaxed">{intro}</p>
    </header>
  );
}

function FlujoSection() {
  return (
    <section>
      <SectionHeader intro={FLUJO_INTRO} />
      <div id="flujo-diagrama" className="scroll-mt-24 mb-6">
        <Mermaid
          chart={FLUJO_DIAGRAM}
          caption="Flujo propuesto del sistema desde la adquisición de datos hasta la emisión de alertas."
        />
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Vista lógica por capas (Paquete Maestro)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Vista complementaria al flujo de arriba: el mismo sistema visto como nueve capas
            funcionales (Inputs → Access → Orchestration → Data Eng → Storage → Modeling →
            Decision → Interface → Users), con loops de retroalimentación desde los equipos de
            CEL hacia métricas, umbrales y datos operativos. Mientras el diagrama anterior
            muestra "de qué fuente a qué destino", éste muestra "qué función cumple cada pieza"
            dentro del silo de IA.
          </p>
          <p className="text-xs text-muted-foreground italic mb-2">
            Frozen — fuente: Paquete Maestro §7.3. Labels conservados en inglés según el
            fuente del Paquete (la traducción permanece como asunto abierto).
          </p>
          <Mermaid
            chart={AI_SILO_LOGICAL_DIAGRAM}
            caption="AI Silo — arquitectura lógica/funcional por capas (Paquete Maestro §7.3)."
          />
        </div>
      </div>
      <div id="flujo-etapas" className="space-y-3 scroll-mt-24">
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          Resumen de las etapas. El detalle de cada subsistema vive en su capítulo dedicado
          (enlace al final de cada etapa) — esta vista no repite ese contenido.
        </p>
        {FLUJO_STAGES.map((s) => (
          <Card key={s.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
                  {s.tag}
                </span>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">{s.summary}</p>
              {s.detailChapter && (
                <p className="text-xs">
                  <span className="text-muted-foreground">Detalle en </span>
                  <span className="text-primary font-medium">{s.detailChapter.label}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card id="flujo-sintesis" className="mt-6 bg-primary/5 border-primary/20 scroll-mt-24">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed">{FLUJO_OUTRO}</p>
        </CardContent>
      </Card>
      <div className="mt-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Ver también en otros tabs del portal
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {FLUJO_CROSS_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <a className="block rounded-md border border-border hover:border-primary hover:bg-primary/5 p-3 transition-colors">
                <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                  {l.label}
                  <ChevronRight className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{l.description}</p>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const DATA_REGISTRY_STATUS_STYLE: Record<DataRegistryStatus, string> = {
  "confirmado": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800",
  "por-confirmar": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
  "por-validar-kevin": "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
};

const DATA_REGISTRY_STATUS_LABEL: Record<DataRegistryStatus, string> = {
  "confirmado": "Confirmado",
  "por-confirmar": "Por confirmar con CEL",
  "por-validar-kevin": "Por validar (Kevin)",
};

function DataStatusBadge({ status }: { status: DataRegistryStatus }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${DATA_REGISTRY_STATUS_STYLE[status]}`}>
      {DATA_REGISTRY_STATUS_LABEL[status]}
    </span>
  );
}

function DatosSection() {
  return (
    <section>
      <SectionHeader intro={DATOS_INTRO} />
      <div id="datos-categorias" className="grid gap-4 md:grid-cols-2 scroll-mt-24">
        {DATOS_CATEGORIES.map((c) => (
          <Card key={c.id} className="border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {c.sources.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="datos-registry" className="mt-10 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground mb-2">Registro de fuentes de datos</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Catálogo consolidado de las fuentes que alimentan el sistema, con tipo de acceso, frecuencia,
          cobertura espacial, dueño/propietario y estado. Las fuentes marcadas como
          <span className="font-medium"> “Por validar (Kevin)”</span> requieren confirmación del Líder
          Hidrología/PM antes del cierre del piloto.
        </p>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2 whitespace-nowrap">ID</th>
                  <th className="text-left font-medium px-3 py-2">Categoría</th>
                  <th className="text-left font-medium px-3 py-2">Fuente</th>
                  <th className="text-left font-medium px-3 py-2">Formato</th>
                  <th className="text-left font-medium px-3 py-2">Proveedor</th>
                  <th className="text-left font-medium px-3 py-2">Frecuencia</th>
                  <th className="text-left font-medium px-3 py-2">Tamaño aprox.</th>
                  <th className="text-left font-medium px-3 py-2">Dueño</th>
                  <th className="text-left font-medium px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {DATA_REGISTRY.map((d) => (
                  <tr key={d.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">{d.id}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{d.category}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">{d.name}</div>
                      {d.note && <div className="text-xs text-muted-foreground mt-0.5">{d.note}</div>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{d.format}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.provider}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.frequency}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.approxSize}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.owner}</td>
                    <td className="px-3 py-2"><DataStatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}

function EtlSection() {
  return (
    <section>
      <SectionHeader intro={ETL_INTRO} />
      <div id="etl-diagrama" className="scroll-mt-24 mb-8">
        <Mermaid
          chart={ETL_DIAGRAM}
          caption="Pipeline ETL en cinco pasos ordenados: Extracción → Staging → Transformación → Carga, coordinados por Mage."
        />
      </div>
      <div className="space-y-5">
        {ETL_STAGES_ORDERED.map((s) => (
          <Card
            key={s.num}
            id={`etl-stage-${s.num}`}
            className="border-border scroll-mt-24"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  {s.num}
                </span>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              <ul className="space-y-1.5 pt-1">
                {s.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span className="leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ModelosSection() {
  return (
    <section>
      <div className="space-y-6">
        <Card id="modelos-lstm" className="border-border scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg">{MODEL_LSTM.title}</CardTitle>
            <CardDescription className="leading-relaxed pt-2">{MODEL_LSTM.body}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {MODEL_LSTM.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card id="modelos-inundacion" className="border-border scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg">{MODEL_FLOOD.title}</CardTitle>
            <CardDescription className="pt-2">{MODEL_FLOOD.body}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODEL_FLOOD.approaches.map((a) => (
              <div key={a.name} className="border-l-2 border-primary/40 pl-4">
                <h4 className="text-sm font-semibold text-foreground mb-1">{a.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            ))}
            <div className="mt-2 p-4 rounded-md bg-muted/50 border border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Integración LSTM ↔ Inundación
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{MODEL_FLOOD.integration}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ValidacionSection() {
  return (
    <section>
      <div className="space-y-6">
        <Card id="validacion-rolling" className="border-border scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">{VALIDATION_ROLLING.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{VALIDATION_ROLLING.body}</p>
          </CardContent>
        </Card>

        <div id="validacion-metricas" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Métricas</h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-56">Métrica</th>
                    <th className="text-left font-medium px-4 py-3">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {VALIDATION_METRICS.map((m) => (
                    <tr key={m.metric} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-medium text-foreground">{m.metric}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card id="validacion-goals" className="bg-primary/5 border-primary/20 scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">Criterios de éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {VALIDATION_GOALS.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const OPEN_DECISION_STATUS_STYLE: Record<OpenDecisionStatus, string> = {
  "abierta": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
  "en-discusion": "bg-sky-100 dark:bg-sky-900/30 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800",
  "bloqueada-cel": "bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800",
  "cerrada": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800",
  "por-validar-kevin": "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
};

const OPEN_DECISION_STATUS_LABEL: Record<OpenDecisionStatus, string> = {
  "abierta": "Abierta",
  "en-discusion": "En discusión",
  "bloqueada-cel": "Bloqueada (CEL)",
  "cerrada": "Cerrada",
  "por-validar-kevin": "Por validar (Kevin)",
};

function OpenDecisionStatusBadge({ status }: { status: OpenDecisionStatus }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${OPEN_DECISION_STATUS_STYLE[status]}`}>
      {OPEN_DECISION_STATUS_LABEL[status]}
    </span>
  );
}

function DecisionesSection() {
  const areas = useMemo(() => Array.from(new Set(OPEN_DECISIONS.map((d) => d.area))), []);
  const [areaFilter, setAreaFilter] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const filtered = useMemo(
    () =>
      OPEN_DECISIONS.filter(
        (d) =>
          (areaFilter === "Todas" || d.area === areaFilter) &&
          (statusFilter === "Todas" || d.status === statusFilter),
      ),
    [areaFilter, statusFilter],
  );

  return (
    <section className="space-y-10">
      <SectionHeader intro={OPEN_DECISIONS_INTRO} />

      <div id="decisiones-abiertas" className="scroll-mt-24">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Área
            </label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Todas">Todas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Todas">Todos</option>
              {Object.entries(OPEN_DECISION_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground ml-auto">
            {filtered.length} de {OPEN_DECISIONS.length} decisiones
          </p>
        </div>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2 whitespace-nowrap">ID</th>
                  <th className="text-left font-medium px-3 py-2">Área</th>
                  <th className="text-left font-medium px-3 py-2">Decisión</th>
                  <th className="text-left font-medium px-3 py-2">Responsable</th>
                  <th className="text-left font-medium px-3 py-2">Contraparte CEL</th>
                  <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Fecha objetivo</th>
                  <th className="text-left font-medium px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-border align-top">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{d.id}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{d.area}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground">{d.decision}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed mt-1">{d.detail}</div>
                      {d.decisionLink && (
                        <Link href="/portal/decisiones">
                          <a
                            className="text-[11px] text-primary hover:text-primary/80 hover:underline mt-1.5 inline-flex items-center gap-1"
                            title="Abrir en el módulo de Decisiones"
                          >
                            <FileText className="w-3 h-3" />
                            Decisión formal: {d.decisionLink}
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.responsable}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{d.contraparteCel}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{d.fechaObjetivo}</td>
                    <td className="px-3 py-2.5"><OpenDecisionStatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div id="decisiones-confirmadas" className="scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground mb-2">Decisiones técnicas confirmadas</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{DECISIONES_CONFIRMADAS_INTRO}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {DECISIONES_TECNICAS.map((d) => (
            <Card key={d.title} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{d.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperacionSection() {
  return (
    <section>
      <div className="space-y-6">
        <Card id="operacion-scheduling" className="border-border scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">Programación de ejecuciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.scheduling}</p>
          </CardContent>
        </Card>

        <Card id="operacion-flujo" className="border-border scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">Flujo diario de ingesta y pronóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {OPERACION_DIARIA.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-relaxed pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div id="operacion-monitoreo" className="grid gap-4 md:grid-cols-2 scroll-mt-24">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monitoreo y errores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.monitoring}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operación continua y re-entrenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{OPERACION_DIARIA.retraining}</p>
            </CardContent>
          </Card>
        </div>

        <div id="operacion-cel" className="scroll-mt-24 pt-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">Responsabilidades diarias de CEL</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{CEL_DAILY_RESPONSIBILITIES_INTRO}</p>
          <div className="space-y-4">
            {CEL_DAILY_RESPONSIBILITIES.map((r) => (
              <Card key={r.area} className="border-border border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <CardTitle className="text-base">{r.area}</CardTitle>
                    <span className="text-xs text-muted-foreground">{r.role}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Responsabilidades</h4>
                    <ul className="space-y-1.5">
                      {r.responsibilities.map((it, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="leading-relaxed">{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Accesos</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {r.accesos.map((a, i) => (
                          <li key={i} className="leading-relaxed">• {a}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Inputs al sistema</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {r.inputs.map((a, i) => (
                          <li key={i} className="leading-relaxed">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/50 border border-border p-3">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SLA: </span>{r.sla}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualizacionSection() {
  return (
    <section>
      <SectionHeader intro={VISUALIZACION.intro} />
      <div id="visualizacion-features" className="grid gap-4 md:grid-cols-2 mb-6 scroll-mt-24">
        {VISUALIZACION.features.map((f) => (
          <Card key={f.title} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card id="visualizacion-alertas" className="border-border scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">{VISUALIZACION.alerts.title}</CardTitle>
          <CardDescription className="pt-2">{VISUALIZACION.alerts.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {VISUALIZACION.alerts.samples.map((s, i) => (
              <li key={i} className="text-sm text-foreground leading-relaxed font-mono bg-muted/50 border border-border rounded p-3">
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="visualizacion-integracion" className="border-border scroll-mt-24 mt-6">
        <CardHeader>
          <CardTitle className="text-base">{VISUALIZACION.integration.title}</CardTitle>
          <CardDescription className="pt-2 leading-relaxed">{VISUALIZACION.integration.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {VISUALIZACION.integration.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="visualizacion-capacitacion" className="border-border scroll-mt-24 mt-6">
        <CardHeader>
          <CardTitle className="text-base">{VISUALIZACION.training.title}</CardTitle>
          <CardDescription className="pt-2 leading-relaxed">{VISUALIZACION.training.body}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {VISUALIZACION.training.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

const RACI_COLORS: Record<string, string> = {
  R: "bg-rose-500 text-white",
  A: "bg-sky-500 text-white",
  C: "bg-amber-500 text-white",
  I: "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-100",
};

const RACI_LABEL: Record<string, string> = {
  R: "Responsable",
  A: "Aprobador",
  C: "Consultado",
  I: "Informado",
};

function raciAriaLabel(letters: string[]) {
  return letters.map((l) => RACI_LABEL[l] ?? l).join(" / ");
}

function RaciBadge({ letter, className = "" }: { letter: string; className?: string }) {
  const color = RACI_COLORS[letter] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-bold shadow-sm ${color} ${className}`}
      role="img"
      aria-label={RACI_LABEL[letter] ?? letter}
      title={RACI_LABEL[letter] ?? letter}
    >
      {letter}
    </span>
  );
}

function RaciCell({ value }: { value: string }) {
  if (!value || value === "—") {
    return (
      <span className="text-xs font-mono text-muted-foreground" aria-label="Sin asignación">
        —
      </span>
    );
  }
  const letters = value
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (letters.length === 0) {
    return (
      <span className="text-xs font-mono text-muted-foreground" aria-label="Sin asignación">
        —
      </span>
    );
  }
  if (letters.length === 1) {
    return <RaciBadge letter={letters[0]} />;
  }
  if (letters.length === 2) {
    const [a, b] = letters;
    const colorA = RACI_COLORS[a] ?? "bg-muted text-muted-foreground";
    const colorB = RACI_COLORS[b] ?? "bg-muted text-muted-foreground";
    const ariaLabel = raciAriaLabel(letters);
    return (
      <span
        className="relative inline-flex items-center justify-center h-7 w-7 rounded-full overflow-hidden shadow-sm"
        role="img"
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <span
          className={`absolute inset-y-0 left-0 w-1/2 flex items-center justify-end pr-0.5 text-[10px] font-bold ${colorA}`}
        >
          {a}
        </span>
        <span
          className={`absolute inset-y-0 right-0 w-1/2 flex items-center justify-start pl-0.5 text-[10px] font-bold ${colorB}`}
        >
          {b}
        </span>
      </span>
    );
  }
  // 3+ letters: render compact pill stack so nothing is silently dropped
  const ariaLabel = raciAriaLabel(letters);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {letters.map((l, i) => (
        <span
          key={`${l}-${i}`}
          className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold shadow-sm ${
            RACI_COLORS[l] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {l}
        </span>
      ))}
    </span>
  );
}

function FteCard({ item }: { item: (typeof FTE_BREAKDOWN)[number] }) {
  const toneCls =
    item.tone === "external"
      ? "border-l-4 border-l-blue-500"
      : item.tone === "committee"
      ? "border-l-4 border-l-amber-500"
      : "border-l-4 border-l-emerald-500";
  return (
    <Card className={`border-border h-full ${toneCls}`}>
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <CardTitle className="text-base leading-tight">{item.label}</CardTitle>
          <span className="text-2xl font-bold tabular-nums text-primary">{item.fte}</span>
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">FTE</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium text-foreground">{item.scope}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
      </CardContent>
    </Card>
  );
}

function RaciSection() {
  return (
    <section className="space-y-10">
      <SectionHeader intro={RACI_INTRO} />

      {/* Estructura del capítulo */}
      <div id="raci-estructura" className="scroll-mt-24">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Cómo está organizado este capítulo
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              El capítulo se reorganizó en dos bloques. El bloque <b>A — Quién lleva el piloto</b>
              presenta el "cast" del proyecto (esfuerzo, gobernanza CEL y perfiles). El bloque
              <b> B — Cómo se asignan las responsabilidades</b> aterriza ese cast en la matriz
              RACI consolidada y luego en el detalle de tareas por fase.
            </p>
            <div className="grid gap-3 md:grid-cols-2 text-xs">
              <div className="rounded border border-primary/20 bg-card p-3">
                <div className="font-semibold text-primary">A. Quién lleva el piloto</div>
                <ul className="mt-1.5 space-y-0.5 text-muted-foreground list-disc pl-4">
                  <li>A.1 Estructura operativa y FTE</li>
                  <li>A.2 Comité de Informática (CEL)</li>
                  <li>A.3 Perfiles del equipo</li>
                </ul>
              </div>
              <div className="rounded border border-primary/20 bg-card p-3">
                <div className="font-semibold text-primary">B. Cómo se asignan las responsabilidades</div>
                <ul className="mt-1.5 space-y-0.5 text-muted-foreground list-disc pl-4">
                  <li>B.1 Matriz RACI consolidada (vista única)</li>
                  <li>B.2 Detalle de tareas por fase (drill-down)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagrama de gobernanza */}
      <div id="raci-gobernanza" className="scroll-mt-24 space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Estructura de gobernanza del piloto</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mapa visual de las personas y áreas que conforman el piloto: liderazgo C² Labs, Core
          Pilot Team de CEL, validación operativa con las cinco centrales y Comité de Informática.
          Cada caja muestra rol, persona, área y correo institucional.
        </p>
        <Mermaid chart={GOVERNANCE_DIAGRAM} caption="Estructura de gobernanza del piloto" />
      </div>

      <div className="space-y-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary border-b border-primary/20 pb-2">
          Bloque A — Quién lleva el piloto
        </h3>

        {/* A.1 Estructura operativa y FTE */}
        <div id="raci-fte" className="space-y-4 scroll-mt-24">
          <h3 className="text-lg font-semibold text-foreground">A.1 Estructura operativa y asignación de esfuerzo (FTE)</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Distribución de tiempos y roles acordada para la ejecución del piloto. Centraliza la
            operación diaria en un único Ingeniero DevOps de enlace, mientras la Unidad de
            Informática actúa como Comité Consultivo de gobernanza.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {FTE_BREAKDOWN.map((item) => (
              <FteCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* A.2 Comité de Informática */}
        <div id="raci-comite" className="space-y-4 scroll-mt-24">
          <h3 className="text-lg font-semibold text-foreground">
            A.2 Comité de Informática, Gobernanza y Seguridad (CEL)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{COMMITTEE_INTRO}</p>
          <Card className="border-border">
            <CardContent className="p-0 divide-y divide-border">
              {COMMITTEE_MEMBERS.map((m) => (
                <div key={m.name} className="p-4 grid grid-cols-1 md:grid-cols-[200px_220px_1fr] gap-3 items-baseline">
                  <div>
                    <div className="font-semibold text-foreground">{m.name}</div>
                    {m.email && (
                      <div className="text-xs text-muted-foreground mt-0.5 break-all">{m.email}</div>
                    )}
                  </div>
                  <div className="text-sm text-primary">{m.area}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{m.responsibility}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      {/* A.3 Perfiles del equipo */}
      <div id="raci-perfiles" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">A.3 Perfiles del equipo</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Perfiles clave del piloto, organizados según su rol estratégico y operativo. Combina el
          liderazgo de la consultora externa con el talento técnico, el conocimiento local y la
          infraestructura institucional de CEL.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {TEAM_PROFILES.map((p) => (
            <Card key={p.id} className="border-border h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base leading-tight">{p.role}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{p.person}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${
                      p.scope === "Externo"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200"
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200"
                    }`}
                  >
                    {p.scope}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed">
                  {p.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>{/* /Bloque A */}

      <div className="space-y-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary border-b border-primary/20 pb-2">
          Bloque B — Cómo se asignan las responsabilidades
        </h3>

      {/* B.1 Matriz RACI consolidada */}
      <div id="raci-matriz" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">B.1 Matriz RACI consolidada</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vista única de responsabilidades por actividad. R/A en color primario indica ejecución y
          aprobación combinadas; R marca al responsable directo; A al aprobador final.
        </p>
        <div className="flex flex-wrap gap-4 mb-2">
          {RACI_LEGEND.map((l) => (
            <div key={l.k} className="flex items-center gap-2">
              <RaciBadge letter={l.k} />
              <span className="text-xs text-muted-foreground leading-tight">{l.v}</span>
            </div>
          ))}
        </div>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 sticky left-0 bg-muted/40 z-10 min-w-[280px] align-bottom">
                    Actividad / Entregable
                  </th>
                  {RACI_ROLES.map((r) => (
                    <th
                      key={r.short}
                      className="px-2 py-3 text-center align-bottom"
                      style={{ minWidth: "60px" }}
                    >
                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mx-auto whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          minHeight: "120px",
                        }}
                        title={r.full}
                      >
                        {r.short}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACI_TASKS.map((t, idx) => (
                  <tr
                    key={t.task}
                    className={`border-t border-border ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                    }`}
                  >
                    <td
                      className={`px-4 py-3 sticky left-0 z-10 ${
                        idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <div className="font-medium text-foreground text-sm">{t.task}</div>
                      {t.note && (
                        <div className="text-xs text-muted-foreground mt-0.5">{t.note}</div>
                      )}
                    </td>
                    {t.values.map((v, i) => (
                      <td key={i} className="text-center px-2 py-3">
                        <RaciCell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground italic mt-2">
          Roles del Comité: Lorena (Gobernanza/Autorizaciones), Nelson (DB y Redes), José Manuel
          (OS/Apps), Carlos Sánchez (DBA), Adrián (Redes/Infra), Miladis (Ciberseguridad).
        </p>
      </div>

      {/* B.2 Detalle de tareas por fase */}
      <div id="raci-tareas" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">B.2 Detalle de tareas por fase</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Desglose detallado de tareas por fase del proyecto, con responsable principal y
          observaciones sobre apoyos requeridos. Esta sección es el <i>drill-down</i> de la matriz
          B.1: cada fila de la matriz se descompone aquí por fase y entregable.
        </p>
        <div className="space-y-4">
          {PHASE_TASKS.map((phase) => (
            <Card key={phase.phaseId} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
                    {phase.phaseId}
                  </span>
                  <CardTitle className="text-base">{phase.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left font-medium px-4 py-2">Tarea principal</th>
                        <th className="text-left font-medium px-4 py-2 whitespace-nowrap">Responsable</th>
                        <th className="text-left font-medium px-4 py-2">Apoyo / Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase.tasks.map((t, i) => (
                        <tr key={i} className="border-t border-border align-top">
                          <td className="px-4 py-3 font-medium text-foreground">{t.task}</td>
                          <td className="px-4 py-3 text-foreground whitespace-nowrap">{t.responsible}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>{/* /Bloque B */}
    </section>
  );
}

function StatusBadge({ status }: { status: InfraStatus }) {
  if (status === "confirmado") {
    return (
      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
        Confirmado
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 whitespace-nowrap">
      Por confirmar con CEL
    </span>
  );
}

function InfraSection() {
  const layerStyles: Record<string, string> = {
    Compute: "border-primary/40 bg-primary/5",
    "Data & ETL": "border-blue-500/40 bg-blue-500/5",
    Backup: "border-emerald-500/40 bg-emerald-500/5",
    Red: "border-violet-500/40 bg-violet-500/5",
    Energía: "border-amber-500/40 bg-amber-500/5",
  };

  return (
    <section>
      <SectionHeader intro={INFRA_INTRO} />

      <div id="infra-topologia-fisica" className="scroll-mt-24 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Topología física del data center (Paquete Maestro)
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Vista canónica de la infraestructura del silo: External Edge → Security Boundary →
          Facility → Network Fabric con 5 VLANs (Management, AI Compute, Virtualization,
          Storage, User) → Servidores R770 (ML/IA y Virtualización) y R570 (NAS) +
          Workstations → AI Silo Workload Landing Zone → Scope Boundary explícito entre
          CEL/Martinexsa/Dell y la Consultora.
        </p>
        <p className="text-xs text-muted-foreground italic mb-2">
          Frozen — fuente: Paquete Maestro §7.4. Labels conservados en inglés según el
          fuente del Paquete (la traducción permanece como asunto abierto).
        </p>
        <Mermaid
          chart={DC_PHYSICAL_TOPOLOGY_DIAGRAM}
          caption="AI Silo — topología física del data center on-premise (Paquete Maestro §7.4)."
        />
      </div>

      <div id="infra-disclaimer" className="scroll-mt-24 mb-8">
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-900/15">
          <CardContent className="p-5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Estado del BOM
              </h4>
              <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                {INFRA_BOM_DISCLAIMER}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <div id="infra-arquitectura" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Diagrama de arquitectura final
          </h3>
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {INFRA_ARCHITECTURE.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-md border-2 p-3 ${layerStyles[n.layer] ?? "border-border bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {n.layer}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{n.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.role}</p>
                    <ul className="mt-2 space-y-1">
                      {n.specs.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                          <span className="mt-1 h-1 w-1 rounded-full bg-foreground/50 shrink-0" />
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Flujo lógico: <strong>Datos & ETL</strong> ingiere y normaliza, alimenta a <strong>ML / Compute</strong> para entrenamiento e inferencia, los resultados se publican vía <strong>Aplicación</strong>, y todo se respalda al <strong>NAS</strong>. La <strong>Red</strong> conecta el silo a las DBs productivas de CEL en solo-lectura y al consultor por VPN; la <strong>Energía</strong> protegida garantiza continuidad operativa.
              </p>
            </CardContent>
          </Card>
        </div>

        <div id="infra-hardware" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            BOM de hardware
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Categoría</th>
                    <th className="text-left font-medium px-4 py-3">Ítem</th>
                    <th className="text-left font-medium px-4 py-3 w-16">Cant.</th>
                    <th className="text-left font-medium px-4 py-3">Especificaciones</th>
                    <th className="text-left font-medium px-4 py-3">Rol</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_HARDWARE.map((h, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{h.category}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{h.item}</td>
                      <td className="px-4 py-3 text-foreground">{h.qty}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{h.specs}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{h.role}</td>
                      <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div id="infra-software" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            BOM de software
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Capa</th>
                    <th className="text-left font-medium px-4 py-3">Producto</th>
                    <th className="text-left font-medium px-4 py-3">Versión</th>
                    <th className="text-left font-medium px-4 py-3">Propósito</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_SOFTWARE.map((s, i) => (
                    <tr key={i} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.layer}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.product}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.version}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{s.purpose}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div id="infra-comisionamiento" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Plan de comisionamiento y pruebas de aceptación
          </h3>
          <Card className="border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-12">ID</th>
                    <th className="text-left font-medium px-4 py-3">Área</th>
                    <th className="text-left font-medium px-4 py-3">Prueba</th>
                    <th className="text-left font-medium px-4 py-3">Criterio de aceptación</th>
                    <th className="text-left font-medium px-4 py-3 w-40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {INFRA_COMMISSIONING.map((c) => (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-mono text-foreground">{c.id}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.area}</td>
                      <td className="px-4 py-3 font-medium text-foreground leading-relaxed">{c.test}</td>
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{c.criteria}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div id="infra-respaldo" className="scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Plan de respaldo, recuperación y políticas de seguridad
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {INFRA_BACKUP_POLICIES.map((p) => (
              <Card key={p.title} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <StatusBadge status={p.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LempaSection() {
  const groups: { id: string; eyebrow: string; data: { title: string; items: { h: string; b: string }[] } }[] = [
    { id: "lempa-geo", eyebrow: "Anexo E · 1", data: LEMPA.geo },
    { id: "lempa-climate", eyebrow: "Anexo E · 2", data: LEMPA.climate },
    { id: "lempa-governance", eyebrow: "Anexo E · 3", data: LEMPA.governance },
    { id: "lempa-implications", eyebrow: "Anexo E · 4", data: LEMPA.implications },
  ];
  return (
    <section>
      <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 p-6">
        <div className="flex items-start gap-3">
          <MapIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
              Anexo Técnico E — Cuenca del Río Lempa
            </p>
            <p className="text-sm text-foreground leading-relaxed">{LEMPA.intro}</p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {groups.map((g) => (
          <LempaGroup key={g.id} id={g.id} eyebrow={g.eyebrow} title={g.data.title} items={g.data.items} />
        ))}

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
              Conclusión del Anexo E
            </p>
            <p className="text-sm text-foreground leading-relaxed">{LEMPA.conclusion}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LempaGroup({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: { h: string; b: string }[] }) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="mb-4 pb-2 border-b border-border">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h3 className="text-lg font-semibold text-foreground mt-0.5">{title}</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.h} className="border-border border-l-2 border-l-primary/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{it.h}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.b}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
