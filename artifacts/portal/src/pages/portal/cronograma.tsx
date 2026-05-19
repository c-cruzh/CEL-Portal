import { useGetProjectConfig, useUpdateProjectConfig, getGetProjectConfigQueryKey } from "@workspace/api-client-react";
import type { ProjectConfig } from "@workspace/api-client-react";
import { PHASES, type Phase } from "@/lib/projectContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addWeeks, differenceInWeeks, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const TOTAL_WEEKS = 30;
const COL_WIDTH = 36;
const LABEL_WIDTH = 200;

export default function Cronograma() {
  const { data: config, isLoading } = useGetProjectConfig();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const startDate = config?.startDate ? parseISO(config.startDate) : null;

  const currentWeekIndex = useMemo(() => {
    if (!startDate) return null;
    const diff = differenceInWeeks(new Date(), startDate);
    if (diff < 0 || diff >= TOTAL_WEEKS) return null;
    return diff;
  }, [startDate]);

  const monthGroups = useMemo(() => {
    if (!startDate) return [];
    const groups: { label: string; span: number }[] = [];
    for (let i = 0; i < TOTAL_WEEKS; i++) {
      const d = addWeeks(startDate, i);
      const label = format(d, "LLLL yyyy", { locale: es });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.span += 1;
      else groups.push({ label, span: 1 });
    }
    return groups;
  }, [startDate]);

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  const phaseData = selectedPhase ? PHASES.find((p) => p.id === selectedPhase) ?? null : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cronograma del Piloto</h1>
          <p className="text-muted-foreground mt-1">
            Planificación a {TOTAL_WEEKS} semanas. Modo {startDate ? "calendario" : "T0 + n semanas"}.
          </p>
        </div>
        <ConfigDate config={config} />
      </div>

      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            <span className="font-medium text-foreground">Disponibilidad CEL:</span> el cronograma asume jornada laboral
            del equipo CEL y respeta los feriados nacionales. Confirma fechas críticas con Gerencia de Proyecto antes de
            comprometer entregables externos.
          </span>
          <span className="text-xs text-muted-foreground/80">28 semanas planificadas + 2 de contingencia</span>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto border-border bg-card">
        <div
          className="p-6"
          style={{ minWidth: `${LABEL_WIDTH + COL_WIDTH * TOTAL_WEEKS + 48}px` }}
        >
          {monthGroups.length > 0 && (
            <div className="flex border-b border-border/30 pb-1 mb-1">
              <div style={{ width: LABEL_WIDTH }} className="shrink-0" />
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, ${COL_WIDTH}px)` }}>
                {monthGroups.map((g, i) => (
                  <div
                    key={i}
                    className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium text-center border-l border-border/40 first:border-l-0 py-1"
                    style={{ gridColumn: `span ${g.span}` }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex border-b border-border/50 pb-2 mb-4">
            <div
              style={{ width: LABEL_WIDTH }}
              className="shrink-0 font-medium text-sm text-muted-foreground flex items-end"
            >
              Fases
            </div>
            <div
              className="flex-1 grid gap-0"
              style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, ${COL_WIDTH}px)` }}
            >
              {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                const weekNum = i + 1;
                const dateStr = startDate ? format(addWeeks(startDate, i), "d MMM", { locale: es }) : "";
                const isCurrent = currentWeekIndex === i;
                return (
                  <div key={i} className="flex flex-col items-center justify-end">
                    {startDate && (
                      <span className="text-[10px] text-muted-foreground/70 mb-1 whitespace-nowrap">{dateStr}</span>
                    )}
                    <span
                      className={`text-xs font-medium w-full text-center ${
                        isCurrent ? "text-primary" : "text-foreground"
                      }`}
                    >
                      S{weekNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative space-y-3">
            {currentWeekIndex !== null && (
              <div
                className="pointer-events-none absolute top-[-8px] bottom-0 z-10"
                style={{
                  left: `${LABEL_WIDTH + currentWeekIndex * COL_WIDTH + COL_WIDTH / 2}px`,
                  width: 0,
                  borderLeft: "2px dashed var(--primary)",
                }}
                aria-hidden="true"
              >
                <span className="absolute -top-3 -translate-x-1/2 text-[10px] font-semibold text-primary bg-background px-1.5 py-0.5 rounded border border-primary/40">
                  Hoy
                </span>
              </div>
            )}

            {PHASES.map((phase) => {
              return (
                <div key={phase.id} className="flex items-center group">
                  <div style={{ width: LABEL_WIDTH }} className="shrink-0 py-2 pr-4 text-sm font-medium leading-tight">
                    {phase.label}
                  </div>
                  <div
                    className="flex-1 grid gap-0 py-1"
                    style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, ${COL_WIDTH}px)` }}
                  >
                    <div
                      className="rounded-md border cursor-pointer hover:brightness-110 transition-all relative flex items-center justify-center"
                      style={{
                        gridColumn: `${phase.startWeek} / span ${phase.durationWeeks}`,
                        backgroundColor: phase.colorVar,
                        borderColor: phase.colorVar,
                        minHeight: 28,
                      }}
                      onClick={() => setSelectedPhase(phase.id)}
                      role="button"
                      aria-label={`Ver detalles de ${phase.label}`}
                    >
                      <span className="text-[11px] font-semibold text-background/90 px-2 truncate">
                        {phase.shortName} · {phase.durationWeeks}s
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((phase) => (
          <Card
            key={phase.id}
            className="border-border hover-elevate cursor-pointer transition-all"
            onClick={() => setSelectedPhase(phase.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: phase.colorVar }}
                  aria-hidden="true"
                />
                <CardTitle className="text-base leading-tight">{phase.label}</CardTitle>
              </div>
              <CardDescription>
                Semanas {phase.startWeek}–{phase.startWeek + phase.durationWeeks - 1} · {phase.durationWeeks} sem
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">{phase.objective}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedPhase} onOpenChange={(open) => !open && setSelectedPhase(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {phaseData && <PhaseDetail phase={phaseData} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PhaseDetail({ phase }: { phase: Phase }) {
  return (
    <>
      <SheetHeader className="mb-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm shrink-0"
            style={{ backgroundColor: phase.colorVar }}
            aria-hidden="true"
          />
          <SheetTitle className="text-xl">{phase.label}</SheetTitle>
        </div>
        <SheetDescription>
          Semanas {phase.startWeek} a {phase.startWeek + phase.durationWeeks - 1} ({phase.durationWeeks} semanas)
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Objetivo</h3>
          <p className="text-sm text-foreground leading-relaxed">{phase.objective}</p>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descripción</h3>
          <p className="text-sm text-foreground leading-relaxed">{phase.narrative}</p>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actividades</h3>
          <ul className="space-y-2">
            {phase.activities.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                <span className="text-foreground leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Entregables</h3>
          <ul className="space-y-2">
            {phase.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                <span className="text-foreground leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function ConfigDate({ config }: { config: ProjectConfig | undefined }) {
  const [date, setDate] = useState(config?.startDate ? config.startDate.split("T")[0] : "");
  const [isEditing, setIsEditing] = useState(false);
  const updateConfig = useUpdateProjectConfig();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    await updateConfig.mutateAsync({ data: { startDate: date || null } });
    queryClient.invalidateQueries({ queryKey: getGetProjectConfigQueryKey() });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
        <div className="text-sm">
          <span className="text-muted-foreground mr-2">Fecha de inicio (T0):</span>
          <span className="font-medium text-foreground">
            {config?.startDate
              ? format(parseISO(config.startDate), "dd 'de' MMMM, yyyy", { locale: es })
              : "No definida"}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border shadow-sm">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm w-auto" />
      <Button size="sm" className="h-8" onClick={handleSave}>
        Guardar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => {
          setDate(config?.startDate ? config.startDate.split("T")[0] : "");
          setIsEditing(false);
        }}
      >
        Cancelar
      </Button>
    </div>
  );
}
