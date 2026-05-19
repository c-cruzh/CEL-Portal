import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlignLeft,
  Box,
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
  FLUJO_INTRO,
  FLUJO_STAGES,
  FLUJO_OUTRO,
  DATOS_INTRO,
  DATOS_CATEGORIES,
  ETL_INTRO,
  ETL_STAGES,
  MODEL_LSTM,
  MODEL_FLOOD,
  VALIDATION_ROLLING,
  VALIDATION_METRICS,
  VALIDATION_GOALS,
  DECISIONES_TECNICAS,
  OPERACION_DIARIA,
  RACI_INTRO,
  FTE_BREAKDOWN,
  TEAM_PROFILES,
  COMMITTEE_INTRO,
  COMMITTEE_MEMBERS,
  PHASE_TASKS,
  VISUALIZACION,
  RACI_ROLES,
  RACI_TASKS,
  RACI_LEGEND,
  INFRA_INTRO,
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
  { id: "datos", num: "2", shortLabel: "Datos de entrada", title: "Datos de entrada del sistema", Icon: Database, Component: DatosSection, toc: [{ id: "datos-meteo", label: "Meteorológicos" }, { id: "datos-hidro", label: "Hidrológicos" }, { id: "datos-geo", label: "Geoespaciales" }, { id: "datos-cuenca", label: "Características de la cuenca" }] },
  { id: "etl", num: "3", shortLabel: "ETL con Mage", title: "Pipelines ETL con Mage", Icon: Settings, Component: EtlSection, toc: [{ id: "etl-extraccion", label: "Extracción" }, { id: "etl-transformacion", label: "Transformación" }, { id: "etl-carga", label: "Carga" }, { id: "etl-qa", label: "QA / QC" }] },
  { id: "modelos", num: "4", shortLabel: "Modelos de predicción", title: "Modelos de predicción", Icon: Layers, Component: ModelosSection, toc: [{ id: "modelos-lstm", label: "Modelo LSTM" }, { id: "modelos-inundacion", label: "Modelo de inundación" }] },
  { id: "validacion", num: "5", shortLabel: "Validación y métricas", title: "Validación y métricas", Icon: Shield, Component: ValidacionSection, toc: [{ id: "validacion-rolling", label: "Origen rodante" }, { id: "validacion-metricas", label: "Métricas" }, { id: "validacion-goals", label: "Criterios de éxito" }] },
  { id: "decisiones", num: "6", shortLabel: "Decisiones técnicas", title: "Decisiones técnicas", Icon: FileText, Component: DecisionesSection, toc: [] },
  { id: "operacion", num: "7", shortLabel: "Operación diaria", title: "Operación diaria", Icon: Play, Component: OperacionSection, toc: [{ id: "operacion-scheduling", label: "Programación" }, { id: "operacion-flujo", label: "Flujo diario" }, { id: "operacion-monitoreo", label: "Monitoreo y errores" }] },
  { id: "visualizacion", num: "8", shortLabel: "Visualización y alertas", title: "Visualización y alertas", Icon: Activity, Component: VisualizacionSection, toc: [{ id: "visualizacion-features", label: "Funcionalidades" }, { id: "visualizacion-alertas", label: "Sistema de alertas" }] },
  { id: "raci", num: "9", shortLabel: "Equipo y Roles (RACI)", title: "Equipo, FTE y matriz RACI", Icon: AlignLeft, Component: RaciSection, toc: [{ id: "raci-fte", label: "Estructura operativa y FTE" }, { id: "raci-perfiles", label: "Perfiles del equipo" }, { id: "raci-comite", label: "Comité de Informática" }, { id: "raci-tareas", label: "Tareas por fase" }, { id: "raci-matriz", label: "Matriz RACI" }] },
  { id: "infraestructura", num: "10", shortLabel: "Infraestructura y BOM", title: "Infraestructura local — Silo de IA", Icon: Server, Component: InfraSection, toc: [{ id: "infra-arquitectura", label: "Arquitectura" }, { id: "infra-hardware", label: "BOM hardware" }, { id: "infra-software", label: "BOM software" }, { id: "infra-comisionamiento", label: "Comisionamiento" }, { id: "infra-respaldo", label: "Respaldo y seguridad" }] },
  { id: "anexo-lempa", num: "11", shortLabel: "Cuenca del Lempa", title: "Anexo — Cuenca del Río Lempa", Icon: MapIcon, Component: LempaSection, toc: [] },
];

const ANEXO_GROUPS: { id: string; title: string; chapters: ChapterId[] }[] = [
  {
    id: "decisiones-tecnicas",
    title: "Decisiones Técnicas",
    chapters: [
      "flujo",
      "datos",
      "etl",
      "modelos",
      "validacion",
      "decisiones",
      "operacion",
      "visualizacion",
    ],
  },
  {
    id: "silo-ia",
    title: "Silo de IA y BOM",
    chapters: ["infraestructura"],
  },
  {
    id: "equipo-roles",
    title: "Equipo y Roles (RACI)",
    chapters: ["raci"],
  },
  {
    id: "lempa",
    title: "Especificidades del Lempa (Anexo E)",
    chapters: ["anexo-lempa"],
  },
];

export default function Desarrollo() {
  const [activeId, setActiveId] = useState<ChapterId>("flujo");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "decisiones-tecnicas": true,
    "silo-ia": false,
    "equipo-roles": false,
    "lempa": false,
  });
  const [query, setQuery] = useState("");

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
      </div>
      <div id="flujo-etapas" className="space-y-4 scroll-mt-24">
        {FLUJO_STAGES.map((s) => (
          <Card key={s.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
                  {s.tag}
                </span>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card id="flujo-sintesis" className="mt-6 bg-primary/5 border-primary/20 scroll-mt-24">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed">{FLUJO_OUTRO}</p>
        </CardContent>
      </Card>
    </section>
  );
}

function DatosSection() {
  return (
    <section>
      <SectionHeader intro={DATOS_INTRO} />
      <div className="grid gap-4 md:grid-cols-2">
        {DATOS_CATEGORIES.map((c) => (
          <Card key={c.id} id={`datos-${c.id}`} className="border-border h-full scroll-mt-24">
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
    </section>
  );
}

function EtlSection() {
  return (
    <section>
      <SectionHeader intro={ETL_INTRO} />
      <div className="grid gap-4 md:grid-cols-2">
        {ETL_STAGES.map((s, idx) => (
          <Card
            key={s.title}
            id={["etl-extraccion", "etl-transformacion", "etl-carga", "etl-qa"][idx]}
            className="border-border scroll-mt-24"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {s.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
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

function DecisionesSection() {
  return (
    <section>
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
    </section>
  );
}

function RaciCell({ value }: { value: string }) {
  if (value === "I" || value === "—") {
    return <span className="text-xs font-mono text-muted-foreground">{value}</span>;
  }
  const isResponsible = value.includes("R");
  const isApprover = value.includes("A");
  let cls = "text-xs font-mono px-1.5 py-0.5 rounded ";
  if (isResponsible && isApprover) {
    cls += "bg-primary text-primary-foreground font-semibold";
  } else if (isResponsible) {
    cls += "bg-primary/15 text-primary font-semibold";
  } else if (isApprover) {
    cls += "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 font-semibold";
  } else {
    cls += "bg-secondary text-secondary-foreground";
  }
  return <span className={cls}>{value}</span>;
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

      {/* Estructura operativa y FTE */}
      <div id="raci-fte" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">Estructura operativa y asignación de esfuerzo (FTE)</h3>
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

      {/* Perfiles del equipo */}
      <div id="raci-perfiles" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">Perfiles del equipo</h3>
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

      {/* Comité de Informática */}
      <div id="raci-comite" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">
          Comité de Informática, Gobernanza y Seguridad (CEL)
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{COMMITTEE_INTRO}</p>
        <Card className="border-border">
          <CardContent className="p-0 divide-y divide-border">
            {COMMITTEE_MEMBERS.map((m) => (
              <div key={m.name} className="p-4 grid grid-cols-1 md:grid-cols-[180px_220px_1fr] gap-3 items-baseline">
                <div className="font-semibold text-foreground">{m.name}</div>
                <div className="text-sm text-primary">{m.area}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{m.responsibility}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tareas por fase */}
      <div id="raci-tareas" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">Detalle de tareas por fase</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Desglose detallado de tareas por fase del proyecto, con responsable principal y
          observaciones sobre apoyos requeridos.
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

      {/* Matriz RACI */}
      <div id="raci-matriz" className="space-y-4 scroll-mt-24">
        <h3 className="text-lg font-semibold text-foreground">Matriz RACI de roles y responsabilidades</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Resumen consolidado de responsabilidades por actividad. R/A en color primario indica
          ejecución y aprobación combinadas; R marca al responsable directo; A al aprobador final.
        </p>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3 sticky left-0 bg-muted/40 z-10 min-w-[260px]">
                    Actividad / Entregable
                  </th>
                  {RACI_ROLES.map((r) => (
                    <th key={r.short} className="text-center font-medium px-3 py-3 whitespace-nowrap">
                      <div className="text-xs">{r.short}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACI_TASKS.map((t) => (
                  <tr key={t.task} className="border-t border-border">
                    <td className="px-4 py-3 sticky left-0 bg-card">
                      <div className="font-medium text-foreground">{t.task}</div>
                      {t.note && (
                        <div className="text-xs text-muted-foreground mt-0.5">{t.note}</div>
                      )}
                    </td>
                    {t.values.map((v, i) => (
                      <td key={i} className="text-center px-3 py-3">
                        <RaciCell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {RACI_LEGEND.map((l) => (
            <div key={l.k} className="text-xs text-muted-foreground flex gap-2 items-start">
              <span className="inline-block h-5 w-5 rounded bg-primary/10 text-primary font-semibold text-center leading-5 shrink-0">
                {l.k}
              </span>
              <span className="leading-relaxed">{l.v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic mt-2">
          Roles del Comité: Lorena (Gobernanza/Autorizaciones), Nelson (DB y Redes), José Manuel
          (OS/Apps), Carlos Sánchez (DBA), Adrián (Redes/Infra), Miladis (Ciberseguridad).
        </p>
      </div>
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
  return (
    <section>
      <SectionHeader intro={LEMPA.intro} />
      <div className="space-y-6">
        <LempaGroup title={LEMPA.geo.title} items={LEMPA.geo.items} />
        <LempaGroup title={LEMPA.climate.title} items={LEMPA.climate.items} />
        <LempaGroup title={LEMPA.governance.title} items={LEMPA.governance.items} />
        <LempaGroup title={LEMPA.implications.title} items={LEMPA.implications.items} />
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <p className="text-sm text-foreground leading-relaxed">{LEMPA.conclusion}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LempaGroup({ title, items }: { title: string; items: { h: string; b: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.h} className="border-border">
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
