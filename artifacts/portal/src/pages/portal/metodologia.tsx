import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
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
  Check,
  Database,
  BrainCircuit,
  Activity,
  ArrowRight,
  HardDrive,
  Calendar as CalendarIcon,
  Handshake,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { ROLES } from "@/lib/projectContent";
import {
  METODOLOGIA_INTRO,
  METODOLOGIA_HIGH_LEVEL,
  INFRA_AI_SILO,
  INFRA_FASES_OPERATIVAS,
  METODOLOGIA_PHASES,
  RUTA_DETALLE,
  SEGUIMIENTO,
  type MetodologiaPhase,
  type HighLevelPhase,
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
      { id: "infra-overview", label: "Infraestructura del piloto" },
      { id: "infra-fisica", label: "Infra física / cómputo" },
      { id: "infra-f1", label: "F1 — Infraestructura de datos" },
      { id: "infra-f2", label: "F2 — Infraestructura de modelado" },
      { id: "infra-f3", label: "F3 — Infraestructura de servicio" },
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
    toc: [
      { id: "ruta-intro", label: "Vista complementaria al Cronograma" },
      ...RUTA_DETALLE.map((r) => ({ id: `ruta-${r.id.toLowerCase()}`, label: `${r.id} · ${r.nombre}` })),
    ],
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
        <HighLevelTimeline phases={METODOLOGIA_HIGH_LEVEL} />
      </section>
    </>
  );
}

const HIGH_LEVEL_ICON: Record<HighLevelPhase["icon"], typeof Database> = {
  data: Database,
  model: BrainCircuit,
  ops: Activity,
};

function HighLevelTimeline({ phases }: { phases: HighLevelPhase[] }) {
  const reduce = useReducedMotion();
  const enter = reduce
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
      };

  return (
    <div
      className="relative grid gap-4 md:grid-cols-3 md:gap-2"
      role="list"
      aria-label="Pilares de la metodología"
    >
      <div
        aria-hidden
        className="hidden md:block absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      {phases.map((p, i) => {
        const Icon = HIGH_LEVEL_ICON[p.icon];
        return (
          <motion.div
            key={p.id}
            role="listitem"
            {...enter}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.5, delay: i * 0.18, ease: "easeOut" }
            }
            className="relative"
          >
            <Card className="relative h-full border-border bg-card overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={false}
                    animate={
                      reduce
                        ? { scale: 1 }
                        : { scale: [1, 1.06, 1] }
                    }
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.4,
                          }
                    }
                    className="shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-4 ring-background"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                      Fase {p.number}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug">
                      {p.title}
                    </h4>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  {p.purpose}
                </p>
              </CardContent>
            </Card>
            {i < phases.length - 1 && (
              <motion.div
                aria-hidden
                {...enter}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.4, delay: i * 0.18 + 0.25 }
                }
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-background border border-primary/30 text-primary"
              >
                <ArrowRight className="h-3 w-3" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

const INFRA_SUB_LABELS: Record<string, { eyebrow: string; icon: typeof HardDrive }> = {
  fisica: { eyebrow: "Infra física / cómputo", icon: HardDrive },
  F1: { eyebrow: "F1 · Infraestructura de datos", icon: Database },
  F2: { eyebrow: "F2 · Infraestructura de modelado", icon: BrainCircuit },
  F3: { eyebrow: "F3 · Infraestructura de servicio", icon: Activity },
};

function InfraSubsectionHeader({
  eyebrow,
  Icon,
  needsHumanReview,
}: {
  eyebrow: string;
  Icon: typeof HardDrive;
  needsHumanReview?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </div>
      {needsHumanReview && <NeedsReviewBadge />}
    </div>
  );
}

function NeedsReviewBadge({ note }: { note?: string } = {}) {
  return (
    <span
      title={note}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
    >
      <AlertCircle className="h-3 w-3" />
      Por validar (Kevin)
    </span>
  );
}

function extractInfraRoleLabel(source: string): string {
  const colon = source.indexOf(":");
  if (colon > 0) return source.slice(0, colon).trim();
  const m = source.match(/^(.+?\bde CEL\b)/i);
  if (m) return m[1].trim();
  return source.split(/[.,]/)[0].trim();
}

function InfraStackDiagram() {
  const faseById = new Map(INFRA_FASES_OPERATIVAS.map((f) => [f.id, f]));
  const layers = [
    {
      id: "F3",
      anchor: "infra-f3",
      label: "F3 · Servicio",
      sub: "API + dashboard al usuario CEL",
      icon: Activity,
      role: extractInfraRoleLabel(faseById.get("F3")?.rolCEL ?? ""),
      roleSource: faseById.get("F3")?.rolCEL ?? "",
    },
    {
      id: "F2",
      anchor: "infra-f2",
      label: "F2 · Modelado",
      sub: "Pronósticos hidrológicos con IA",
      icon: BrainCircuit,
      role: extractInfraRoleLabel(faseById.get("F2")?.rolCEL ?? ""),
      roleSource: faseById.get("F2")?.rolCEL ?? "",
    },
    {
      id: "F1",
      anchor: "infra-f1",
      label: "F1 · Datos",
      sub: "Ingesta, limpieza y almacenamiento",
      icon: Database,
      role: extractInfraRoleLabel(faseById.get("F1")?.rolCEL ?? ""),
      roleSource: faseById.get("F1")?.rolCEL ?? "",
    },
    {
      id: "fisica",
      anchor: "infra-fisica",
      label: "Infra física / cómputo",
      sub: "Silo on-premise: servidores, GPU y red",
      icon: HardDrive,
      role: extractInfraRoleLabel(INFRA_AI_SILO.rolesCEL[0] ?? ""),
      roleSource: INFRA_AI_SILO.rolesCEL[0] ?? "",
    },
  ];
  return (
    <figure
      className="flex gap-3 sm:gap-4 m-0"
      aria-labelledby="infra-stack-caption"
    >
      <figcaption id="infra-stack-caption" className="sr-only">
        Diagrama de capas de la infraestructura del piloto: usuario CEL en la cima, luego F3
        servicio, F2 modelado, F1 datos, y la infraestructura física on-premise como base. Cada
        capa es un enlace a su subsección.
      </figcaption>
      <div
        aria-hidden="true"
        className="flex flex-col items-center pt-1 pb-1 shrink-0"
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary text-center leading-tight">
          Usuario
          <br />
          CEL
        </div>
        <div className="my-1 flex flex-col items-center">
          <Users className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="relative w-0 flex-1 border-l-2 border-dashed border-primary/40 min-h-[80px]">
          <span className="absolute -left-2 -top-1 block h-0 w-0 border-x-[6px] border-x-transparent border-b-[7px] border-b-primary/60" />
        </div>
        <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground writing-mode-vertical hidden sm:block [writing-mode:vertical-rl] rotate-180">
          flujo de datos
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center leading-tight">
          On-
          <br />
          premise
        </div>
      </div>

      <ol className="flex-1 space-y-1.5 list-none">
        {layers.map((l, i) => {
          const Icon = l.icon;
          const isBase = l.id === "fisica";
          return (
            <li key={l.id}>
              <a
                href={`#${l.anchor}`}
                aria-label={`Ir a ${l.label}: ${l.sub}. Responsable: ${l.role}`}
                className={[
                  "group flex items-center gap-3 rounded-md border px-3 py-2.5 sm:py-3",
                  "bg-background/70 border-primary/25 hover:bg-primary/10 hover:border-primary/50",
                  "motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isBase ? "border-primary/40 bg-primary/[0.06]" : "",
                ].join(" ")}
                style={{
                  marginLeft: `${i * 6}px`,
                  marginRight: `${(layers.length - 1 - i) * 6}px`,
                }}
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-semibold text-foreground leading-tight">
                      {l.label}
                    </div>
                    <span
                      title={l.roleSource}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 text-[10px] font-medium leading-none max-w-full"
                    >
                      <Users className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{l.role}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {l.sub}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-primary/60 shrink-0 motion-safe:transition-transform group-hover:translate-x-0.5" />
              </a>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

function InfraestructuraChapter() {
  return (
    <>
      <section id="infra-overview" className="scroll-mt-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
              Categoría
            </div>
            <CardTitle className="text-base">Infraestructura del piloto</CardTitle>
            <CardDescription>
              Cuatro capas que se construyen secuencialmente sobre el mismo silo on-premise: la
              base física, la capa de datos (F1), la capa de modelado (F2) y la capa de servicio
              al usuario (F3).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InfraStackDiagram />
            <div className="mt-4 rounded-md border border-border bg-background/60 p-3 text-sm">
              <p className="text-foreground leading-relaxed">
                <span className="font-medium">Topología física completa: </span>
                este diagrama de capas es una vista resumen. La topología canónica del data
                center (rack, switch, VLANs, servidores R770/R570, workstations y scope
                boundary) vive en{" "}
                <Link href="/portal/desarrollo?cap=infraestructura#infra-topologia-fisica">
                  <a className="text-primary font-medium hover:underline">
                    Desarrollo Técnico → Cap. 9 "BOM final aprobado por CEL"
                  </a>
                </Link>
                {" "}— frozen del Paquete Maestro §7.4.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="infra-fisica" className="scroll-mt-24">
        <InfraSubsectionHeader
          eyebrow={INFRA_SUB_LABELS.fisica.eyebrow}
          Icon={INFRA_SUB_LABELS.fisica.icon}
        />
        <Card className="border-border">
          <CardContent className="p-5 space-y-5">
            <p className="text-sm text-foreground leading-relaxed">{INFRA_AI_SILO.intro}</p>

            <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                Objetivo
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {INFRA_AI_SILO.objective}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Actividades clave
              </h4>
              <ul className="space-y-3">
                {INFRA_AI_SILO.actividades.map((a, i) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground leading-snug">{a.title}</p>
                      <p className="text-muted-foreground leading-relaxed mt-0.5">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md bg-primary/[0.04] border border-primary/15 p-3">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                    Participación esperada de CEL
                  </p>
                  <ul className="space-y-1.5">
                    {INFRA_AI_SILO.rolesCEL.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Entregable principal
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{INFRA_AI_SILO.entregable}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {INFRA_FASES_OPERATIVAS.map((f) => {
        const meta = INFRA_SUB_LABELS[f.id];
        return (
          <section
            key={f.id}
            id={`infra-${f.id.toLowerCase()}`}
            className="scroll-mt-24"
          >
            <InfraSubsectionHeader
              eyebrow={meta.eyebrow}
              Icon={meta.icon}
              needsHumanReview={f.needsHumanReview}
            />
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.titulo}</CardTitle>
                <CardDescription>{f.resumen}</CardDescription>
                {f.needsHumanReview && f.reviewNote && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mt-2">
                    <span className="font-semibold">Nota:</span> {f.reviewNote}
                  </p>
                )}
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
        );
      })}
    </>
  );
}

function RutaChapter() {
  return (
    <>
      <section id="ruta-intro" className="scroll-mt-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Vista complementaria al Cronograma
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Aquí se ve <span className="text-foreground font-medium">qué se entrega</span> y{" "}
                  <span className="text-foreground font-medium">con quién se colabora</span> en
                  cada fase, con el detalle de tareas del documento original. Para ver{" "}
                  <span className="text-foreground font-medium">cuándo</span> ocurren las fases en
                  el calendario, consulta la pestaña Cronograma. Cinco fases + dos semanas de
                  contingencia, 30 semanas en total.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {RUTA_DETALLE.map((r) => (
        <section
          key={r.id}
          id={`ruta-${r.id.toLowerCase()}`}
          className="scroll-mt-24"
        >
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {r.id}
                </span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  Semanas {r.semanas} ({r.duracion})
                </span>
              </div>
              <div className="flex items-start gap-2 flex-wrap">
                <CardTitle className="text-base">{r.nombre}</CardTitle>
                {r.needsHumanReview && <NeedsReviewBadge note={r.reviewNote} />}
              </div>
              <CardDescription className="leading-relaxed">{r.proposito}</CardDescription>
              {r.needsHumanReview && r.reviewNote && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mt-1">
                  <span className="font-semibold">Nota:</span> {r.reviewNote}
                </p>
              )}
              {r.cronogramaPhaseId && (
                <div className="pt-2">
                  <Link
                    href={`/portal/cronograma#fase-${r.cronogramaPhaseId.toLowerCase()}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Ver en Cronograma
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tareas
                  </h4>
                </div>
                <ul className="space-y-2">
                  {r.tareas.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {r.colaboracionCEL.length > 0 && (
                <div className="rounded-md bg-primary/[0.04] border border-primary/15 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Handshake className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Colaboración con CEL
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {r.colaboracionCEL.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PackageCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Entregables
                  </h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {r.entregables.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-border bg-card p-3"
                    >
                      <span className="shrink-0 h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-foreground leading-relaxed">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ))}
    </>
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
              <span className="shrink-0 h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-center mt-0.5">
                <Check className="h-3 w-3" strokeWidth={3} />
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
