import { useGetProjectConfig, useUpdateProjectConfig, getGetProjectConfigQueryKey } from "@workspace/api-client-react";
import type { ProjectConfig } from "@workspace/api-client-react";
import { PHASES, type Phase } from "@/lib/projectContent";
import { GANTT_PHASES, GANTT_TOTAL_MONTHS } from "@/lib/ganttContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const MONTH_COL_WIDTH = 56;
const LABEL_WIDTH = 320;

export default function Cronograma() {
  const { data: config, isLoading } = useGetProjectConfig();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const startDate = config?.startDate ? parseISO(config.startDate) : null;

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-primary/50", "ring-offset-2");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary/50", "ring-offset-2");
        }, 2000);
      });
    }
  }, [isLoading]);

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
            Distribución mensual de fases y actividades a lo largo de 12 meses
            {startDate ? ` desde ${format(startDate, "MMMM yyyy", { locale: es })}` : ""}.
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
          <span className="text-xs text-muted-foreground/80">12 meses planificados</span>
        </CardContent>
      </Card>

      <MonthlyGantt startDate={startDate} />

      <div className="flex flex-wrap gap-3">
        {GANTT_PHASES.map((p) => (
          <div key={p.num} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            />
            <span>
              <span className="font-semibold text-foreground">{p.num}.</span> {p.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((phase) => (
          <Card
            key={phase.id}
            id={`fase-${phase.id.toLowerCase()}`}
            className="border-border hover-elevate cursor-pointer transition-all scroll-mt-24"
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

function MonthlyGantt({ startDate }: { startDate: Date | null }) {
  const totalWidth = LABEL_WIDTH + MONTH_COL_WIDTH * GANTT_TOTAL_MONTHS;
  return (
    <Card className="overflow-x-auto border-border bg-card">
      <div className="p-6" style={{ minWidth: `${totalWidth + 48}px` }}>
        <div className="flex border-b border-border bg-muted/30 rounded-t-md">
          <div
            style={{ width: LABEL_WIDTH }}
            className="shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Entregable / Actividad
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${GANTT_TOTAL_MONTHS}, ${MONTH_COL_WIDTH}px)` }}
          >
            {Array.from({ length: GANTT_TOTAL_MONTHS }).map((_, i) => {
              const m = i + 1;
              const dateLabel = startDate
                ? format(addMonths(startDate, i), "MMM yy", { locale: es })
                : null;
              return (
                <div
                  key={m}
                  className="flex flex-col items-center justify-end py-2 border-l border-border/40 first:border-l-0"
                >
                  {dateLabel && (
                    <span className="text-[10px] text-muted-foreground/70 capitalize">
                      {dateLabel}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-foreground">M{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {GANTT_PHASES.map((phase) => (
            <div key={phase.num}>
              <div className="flex items-center bg-muted/15 border-b border-border/60">
                <div
                  style={{ width: LABEL_WIDTH }}
                  className="shrink-0 px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  {phase.num}. {phase.label}
                </div>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${GANTT_TOTAL_MONTHS}, ${MONTH_COL_WIDTH}px)`,
                  }}
                >
                  {Array.from({ length: GANTT_TOTAL_MONTHS }).map((_, i) => (
                    <div key={i} className="border-l border-border/30 first:border-l-0 h-full" />
                  ))}
                </div>
              </div>

              {phase.tasks.map((task, idx) => {
                const span = task.endMonth - task.startMonth + 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center border-b border-border/30 ${
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <div
                      style={{ width: LABEL_WIDTH }}
                      className="shrink-0 px-4 py-2 pl-8 text-[13px] text-muted-foreground leading-snug"
                    >
                      {task.label}
                    </div>
                    <div
                      className="grid relative"
                      style={{
                        gridTemplateColumns: `repeat(${GANTT_TOTAL_MONTHS}, ${MONTH_COL_WIDTH}px)`,
                      }}
                    >
                      {Array.from({ length: GANTT_TOTAL_MONTHS }).map((_, i) => (
                        <div
                          key={i}
                          className="border-l border-border/20 first:border-l-0 h-9"
                        />
                      ))}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-sm shadow-sm"
                        style={{
                          left: `${(task.startMonth - 1) * MONTH_COL_WIDTH + 6}px`,
                          width: `${span * MONTH_COL_WIDTH - 12}px`,
                          height: 12,
                          backgroundColor: phase.color,
                        }}
                        aria-label={`${task.label} (M${task.startMonth}${
                          task.endMonth !== task.startMonth ? `–M${task.endMonth}` : ""
                        })`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
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
