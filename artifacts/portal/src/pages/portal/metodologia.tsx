import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Layers,
  ServerCog,
  Route,
  ListChecks,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { ROLES } from "@/lib/projectContent";
import {
  METODOLOGIA_INTRO,
  METODOLOGIA_PILARES,
  INFRA_AI_SILO,
  INFRA_FASES_OPERATIVAS,
  METODOLOGIA_PHASES,
  RUTA_RESUMEN,
  SEGUIMIENTO,
  type MetodologiaPhase,
} from "@/lib/metodologiaContent";

type Chapter = {
  id: string;
  group: string;
  eyebrow: string;
  title: string;
  shortLabel: string;
  icon: typeof Layers;
  toc: { id: string; label: string }[];
  render: () => ReactNode;
};

const CHAPTERS: Chapter[] = [
  {
    id: "resumen",
    group: "General",
    eyebrow: "Introducción",
    title: "Metodología híbrida del piloto",
    shortLabel: "Resumen",
    icon: Sparkles,
    toc: [
      { id: "resumen-intro", label: "Visión general" },
      { id: "resumen-pilares", label: "Pilares de la metodología" },
    ],
    render: () => <ResumenChapter />,
  },
  {
    id: "infraestructura",
    group: "Infraestructura",
    eyebrow: "Fases 0–3",
    title: "Configuración de Infraestructura (Fases 0–3)",
    shortLabel: "Infraestructura (F0–F3)",
    icon: ServerCog,
    toc: [
      { id: "infra-intro", label: "Contexto" },
      { id: "infra-objetivo", label: "Objetivo de Fase 0" },
      { id: "infra-actividades", label: "Actividades clave (F0)" },
      { id: "infra-cel", label: "Participación de CEL (F0)" },
      { id: "infra-entregable", label: "Entregable principal (F0)" },
      { id: "infra-f1", label: "F1 — Infraestructura de datos" },
      { id: "infra-f2", label: "F2 — Infraestructura de entrenamiento" },
      { id: "infra-f3", label: "F3 — Infraestructura operativa" },
    ],
    render: () => <InfraestructuraChapter />,
  },
  {
    id: "ruta",
    group: "Ruta",
    eyebrow: "Plan",
    title: "Ruta de implementación y entregables",
    shortLabel: "Ruta y entregables",
    icon: Route,
    toc: [{ id: "ruta-tabla", label: "Resumen por fase" }],
    render: () => <RutaChapter />,
  },
  ...METODOLOGIA_PHASES.map<Chapter>((phase) => ({
    id: `fase-${phase.id.toLowerCase()}`,
    group: "Detalle por fase",
    eyebrow: `Fase ${phase.number}`,
    title: phase.title,
    shortLabel: `F${phase.number} · ${phase.shortName}`,
    icon: ListChecks,
    toc: [
      { id: "fase-objetivo", label: "Objetivo" },
      { id: "fase-narrativa", label: "Descripción" },
      { id: "fase-actividades", label: "Actividades" },
      ...(phase.celAsk ? [{ id: "fase-cel", label: "Participación de CEL" }] : []),
      { id: "fase-entregables", label: "Entregables" },
      { id: "fase-roles", label: "Roles involucrados" },
    ],
    render: () => <PhaseChapter phase={phase} />,
  })),
  {
    id: "seguimiento",
    group: "Operación",
    eyebrow: "Comunicación",
    title: "Seguimiento y comunicación",
    shortLabel: "Seguimiento",
    icon: Radio,
    toc: [{ id: "seguimiento-cadencia", label: "Cadencia y reuniones" }],
    render: () => <SeguimientoChapter />,
  },
];

const GROUP_ORDER = ["General", "Infraestructura", "Ruta", "Detalle por fase", "Operación"];

export default function Metodologia() {
  const [activeId, setActiveId] = useState<string>(CHAPTERS[0].id);
  const [query, setQuery] = useState("");

  const active = useMemo(
    () => CHAPTERS.find((c) => c.id === activeId) ?? CHAPTERS[0],
    [activeId],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? CHAPTERS.filter(
          (c) =>
            c.shortLabel.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.eyebrow.toLowerCase().includes(q),
        )
      : CHAPTERS;
    const byGroup = new Map<string, Chapter[]>();
    for (const c of filtered) {
      const arr = byGroup.get(c.group) ?? [];
      arr.push(c);
      byGroup.set(c.group, arr);
    }
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      name: g,
      items: byGroup.get(g)!,
    }));
  }, [query]);

  const flatIndex = CHAPTERS.findIndex((c) => c.id === active.id);
  const prev = flatIndex > 0 ? CHAPTERS[flatIndex - 1] : null;
  const next = flatIndex < CHAPTERS.length - 1 ? CHAPTERS[flatIndex + 1] : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [active.id]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Metodología</h1>
        <p className="text-muted-foreground mt-1">
          Estrategia técnica, configuración del silo de IA, ruta de implementación y detalle por fase
          para el pronóstico hidrológico del Río Lempa.
        </p>
      </div>

      <div className="lg:hidden mb-4">
        <select
          value={active.id}
          onChange={(e) => setActiveId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          aria-label="Seleccionar capítulo"
        >
          {GROUP_ORDER.map((g) => {
            const items = CHAPTERS.filter((c) => c.group === g);
            if (items.length === 0) return null;
            return (
              <optgroup key={g} label={g}>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortLabel}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)_200px] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar capítulo..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
              <nav className="space-y-5">
                {groups.map((g) => (
                  <div key={g.name}>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                      {g.name}
                    </h3>
                    <ul className="space-y-0.5">
                      {g.items.map((c) => {
                        const Icon = c.icon;
                        const isActive = c.id === active.id;
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setActiveId(c.id)}
                              className={`w-full text-left flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground/80 hover:bg-muted/60"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 mt-0.5 shrink-0 ${
                                  isActive ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                              <span className="leading-snug">{c.shortLabel}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2">Sin coincidencias.</p>
                )}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="max-w-[760px] mx-auto">
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <span>Metodología</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{active.group}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">{active.shortLabel}</span>
            </div>

            <header className="mb-8 pb-6 border-b border-border">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {active.eyebrow}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                {active.title}
              </h2>
            </header>

            <div className="space-y-8">{active.render()}</div>

            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-between">
              {prev ? (
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => setActiveId(prev.id)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Anterior
                    </div>
                    <div className="text-sm font-medium truncate">{prev.shortLabel}</div>
                  </div>
                </Button>
              ) : (
                <div />
              )}
              {next ? (
                <Button
                  variant="outline"
                  className="justify-end h-auto py-3 px-4 text-right"
                  onClick={() => setActiveId(next.id)}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Siguiente
                    </div>
                    <div className="text-sm font-medium truncate">{next.shortLabel}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>

        {active.toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                En esta página
              </h4>
              <ul className="space-y-1.5 border-l border-border">
                {active.toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block pl-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-l-2 hover:border-primary hover:-ml-px transition-colors leading-snug"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ResumenChapter() {
  return (
    <>
      <section id="resumen-intro" className="scroll-mt-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed font-medium text-foreground">
              {METODOLOGIA_INTRO}
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="resumen-pilares" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Pilares de la metodología
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {METODOLOGIA_PILARES.map((p) => (
            <Card key={p.id} className="border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function InfraestructuraChapter() {
  return (
    <>
      <section id="infra-intro" className="scroll-mt-24">
        <p className="text-base text-foreground leading-relaxed">{INFRA_AI_SILO.intro}</p>
      </section>

      <section id="infra-objetivo" className="scroll-mt-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Objetivo de la fase</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{INFRA_AI_SILO.objective}</p>
          </CardContent>
        </Card>
      </section>

      <section id="infra-actividades" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Actividades clave
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {INFRA_AI_SILO.actividades.map((a, i) => (
            <Card key={a.id} className="border-border h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="infra-cel" className="scroll-mt-24">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Participación esperada de CEL</CardTitle>
            </div>
            <CardDescription>
              Roles del equipo CEL con responsabilidad directa en la Fase 0.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {INFRA_AI_SILO.rolesCEL.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="infra-entregable" className="scroll-mt-24">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Entregable principal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{INFRA_AI_SILO.entregable}</p>
          </CardContent>
        </Card>
      </section>

      <div className="pt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Continuidad en las fases siguientes
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Sobre el silo certificado en la Fase 0 se montan progresivamente las capas de datos
          (Fase 1), entrenamiento (Fase 2) y operación (Fase 3) del piloto.
        </p>
      </div>

      {INFRA_FASES_OPERATIVAS.map((f) => (
        <section
          key={f.id}
          id={`infra-${f.id.toLowerCase()}`}
          className="scroll-mt-24"
        >
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                {f.id}
              </div>
              <CardTitle className="text-base">{f.titulo}</CardTitle>
              <CardDescription>{f.resumen}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Componentes
                </h4>
                <ul className="space-y-2">
                  {f.componentes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-primary/[0.04] border border-primary/15 p-3">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                      Rol del equipo de CEL
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{f.rolCEL}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ))}
    </>
  );
}

function RutaChapter() {
  return (
    <section id="ruta-tabla" className="scroll-mt-24">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Resumen de la ruta de implementación: cinco fases más una contingencia explícita de dos
        semanas, totalizando 30 semanas planificadas. Las fechas absolutas dependen de la fecha T0
        configurada en la pestaña Cronograma.
      </p>
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-16">Fase</th>
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3 w-28">Semanas</th>
                <th className="text-left font-medium px-4 py-3 w-28">Duración</th>
                <th className="text-left font-medium px-4 py-3">Entregables principales</th>
              </tr>
            </thead>
            <tbody>
              {RUTA_RESUMEN.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-semibold text-foreground">{r.id}</td>
                  <td className="px-4 py-3 text-foreground">{r.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.semanas}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.duracion}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <ul className="space-y-1">
                      {r.entregables.map((e, i) => (
                        <li key={i} className="leading-snug">
                          · {e}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function PhaseChapter({ phase }: { phase: MetodologiaPhase }) {
  const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;
  const roleDesc = (id: string) => ROLES.find((r) => r.id === id)?.description ?? "";

  return (
    <>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          <Layers className="h-3 w-3" />
          {phase.weeks}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {phase.durationLabel}
        </span>
      </div>

      <section id="fase-objetivo" className="scroll-mt-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{phase.objective}</p>
          </CardContent>
        </Card>
      </section>

      <section id="fase-narrativa" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Descripción
        </h3>
        <p className="text-base text-foreground leading-relaxed">{phase.narrative}</p>
      </section>

      <section id="fase-actividades" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Actividades
        </h3>
        <Card className="border-border">
          <CardContent className="p-5">
            <ul className="space-y-2.5">
              {phase.actividades.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-relaxed pt-0.5">{a}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {phase.celAsk && (
        <section id="fase-cel" className="scroll-mt-24">
          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{phase.celAsk.title}</CardTitle>
              </div>
              <CardDescription>
                Colaboración esperada del equipo de CEL en esta fase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {phase.celAsk.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-foreground leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <section id="fase-entregables" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Entregables
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {phase.entregables.map((e, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-md border border-border bg-card"
            >
              <span className="shrink-0 h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center justify-center mt-0.5">
                ✓
              </span>
              <span className="text-sm text-foreground leading-relaxed">{e}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="fase-roles" className="scroll-mt-24">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Roles involucrados
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {phase.roles.map((r) => (
            <Card key={r} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {roleLabel(r)}
                    </p>
                    {roleDesc(r) && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {roleDesc(r)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function SeguimientoChapter() {
  return (
    <section id="seguimiento-cadencia" className="scroll-mt-24">
      <p className="text-base text-foreground leading-relaxed mb-4">{SEGUIMIENTO.intro}</p>
      <Card className="border-border">
        <CardContent className="p-5">
          <ul className="space-y-2">
            {SEGUIMIENTO.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
