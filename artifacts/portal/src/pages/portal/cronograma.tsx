import {
  useGetProjectConfig,
  useUpdateProjectConfig,
  getGetProjectConfigQueryKey,
  useGetTeamSummary,
  useListMilestones,
  useListDecisions,
} from "@workspace/api-client-react";
import type {
  ProjectConfig,
  Decision,
  Milestone,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { PHASES } from "@/lib/projectContent";
import { GANTT_PHASES, GANTT_TOTAL_WEEKS } from "@/lib/ganttContent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { addWeeks, format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { PhaseInvolvementCard } from "@/components/PhaseInvolvementCard";
import { PHASE_INVOLVEMENT } from "@/lib/phaseInvolvement";

const WEEK_COL_WIDTH = 28;
const LABEL_WIDTH = 320;

export default function Cronograma() {
  const { data: config, isLoading } = useGetProjectConfig();
  const { data: teamSummary } = useGetTeamSummary();
  const { data: milestones } = useListMilestones();
  const { data: decisions } = useListDecisions();

  const startDate = config?.startDate ? parseISO(config.startDate) : null;

  const roleAssignees = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of teamSummary?.coverage ?? []) {
      const list = c.assignees ?? [];
      if (list.length === 0 && c.tbd) {
        map.set(c.roleId, ["Por determinar (TBD)"]);
      } else {
        map.set(c.roleId, list);
      }
    }
    return map;
  }, [teamSummary]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cronograma del Piloto</h1>
          <p className="text-muted-foreground mt-1">
            Distribución semanal de fases y actividades a lo largo de {GANTT_TOTAL_WEEKS} semanas
            {startDate ? ` desde el ${format(startDate, "dd 'de' MMMM yyyy", { locale: es })}` : " (modo date-agnostic; fija T0 para ver fechas calendario)"}.
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
          <span className="text-xs text-muted-foreground/80">{GANTT_TOTAL_WEEKS} semanas planificadas (Fase 0–4 + Contingencia)</span>
        </CardContent>
      </Card>

      <WeeklyGantt
        startDate={startDate}
        milestones={milestones ?? []}
        decisions={decisions ?? []}
      />

      <BlockingDecisionsByMilestone
        milestones={milestones ?? []}
        decisions={decisions ?? []}
      />

      <div className="flex flex-wrap gap-3">
        {GANTT_PHASES.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            />
            <span>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Iterates ALL PHASES, including CONT (contingencia), so the buffer block
          is visible in Cronograma with the same drilldown affordance. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((phase) => {
          const involvement = PHASE_INVOLVEMENT.find((p) => p.phaseId === phase.id);
          return (
            <div
              key={phase.id}
              id={`fase-${phase.id.toLowerCase()}`}
              className="scroll-mt-24 rounded-lg transition-all"
            >
              <PhaseInvolvementCard
                phase={phase}
                involvement={involvement}
                roleAssignees={roleAssignees}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockingDecisionsByMilestone({
  milestones,
  decisions,
}: {
  milestones: Milestone[];
  decisions: Decision[];
}) {
  const groups = useMemo(() => {
    const byMilestone = new Map<
      string,
      { milestone: Milestone; decisions: Decision[] }
    >();
    for (const d of decisions) {
      if (!d.blocksMilestoneId) continue;
      if (d.status === "resolved" || d.status === "cancelled") continue;
      const m = milestones.find((x) => x.id === d.blocksMilestoneId);
      if (!m) continue;
      const entry = byMilestone.get(m.id) ?? { milestone: m, decisions: [] };
      entry.decisions.push(d);
      byMilestone.set(m.id, entry);
    }
    return Array.from(byMilestone.values()).sort(
      (a, b) => a.milestone.weekOffset - b.milestone.weekOffset,
    );
  }, [milestones, decisions]);

  if (groups.length === 0) return null;

  return (
    <Card
      className="border-destructive/30 bg-destructive/5"
      data-testid="card-blocking-decisions-by-milestone"
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Decisiones bloqueantes por hito
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estos hitos no pueden cerrarse hasta resolver las decisiones
              enlazadas formalmente.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {groups.map(({ milestone, decisions: ds }) => (
            <div
              key={milestone.id}
              className="rounded-md border border-destructive/20 bg-card p-3"
              data-testid={`milestone-blockers-${milestone.id}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {milestone.title}
                    </span>
                    {milestone.phaseId && (
                      <Badge variant="secondary" className="text-[10px]">
                        {milestone.phaseId}
                      </Badge>
                    )}
                    <Badge
                      className="bg-destructive text-destructive-foreground hover:bg-destructive text-[10px]"
                      data-testid={`badge-blocker-count-${milestone.id}`}
                    >
                      {ds.length} pendiente{ds.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Semana {milestone.weekOffset}
                  </p>
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {ds.map((d) => (
                  <li key={d.id} className="text-sm">
                    <Link
                      href="/portal/decisiones"
                      className="text-primary hover:underline"
                      data-testid={`link-blocker-decision-${d.id}`}
                    >
                      · {d.title}
                    </Link>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({d.status === "in_analysis" ? "en análisis" : "abierta"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyGantt({
  startDate,
  milestones,
  decisions,
}: {
  startDate: Date | null;
  milestones: Milestone[];
  decisions: Decision[];
}) {
  const totalWidth = LABEL_WIDTH + WEEK_COL_WIDTH * GANTT_TOTAL_WEEKS;

  const blockersByMilestone = useMemo(() => {
    const map = new Map<string, Decision[]>();
    for (const d of decisions) {
      if (!d.blocksMilestoneId) continue;
      if (d.status === "resolved" || d.status === "cancelled") continue;
      const list = map.get(d.blocksMilestoneId) ?? [];
      list.push(d);
      map.set(d.blocksMilestoneId, list);
    }
    return map;
  }, [decisions]);

  const milestonesByPhase = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of milestones) {
      if (m.kind !== "phase_milestone" && m.kind !== "presentation") continue;
      if (!m.phaseId) continue;
      if (m.weekOffset < 1 || m.weekOffset > GANTT_TOTAL_WEEKS) continue;
      const list = map.get(m.phaseId) ?? [];
      list.push(m);
      map.set(m.phaseId, list);
    }
    return map;
  }, [milestones]);

  // Compute current week index (1-based) when a real T0 is set, so the
  // "Hoy" marker only appears in calendar mode and within range.
  // Uses day-floor math (not calendar weeks) so it matches the
  // `weekOffset` semantics used by the milestone seed and `addWeeks(T0, n-1)`
  // elsewhere; otherwise a mid-week T0 would shift the marker by one week.
  const todayWeek = startDate
    ? Math.floor(differenceInDays(new Date(), startDate) / 7) + 1
    : null;
  const showToday = todayWeek !== null && todayWeek >= 1 && todayWeek <= GANTT_TOTAL_WEEKS;

  // Month bands above the week numbers, only when T0 is set.
  const monthBands: { label: string; startWeek: number; span: number }[] = [];
  if (startDate) {
    let cursorMonth = "";
    let cursorStart = 1;
    for (let i = 0; i < GANTT_TOTAL_WEEKS; i++) {
      const monthLabel = format(addWeeks(startDate, i), "MMM yy", { locale: es });
      if (i === 0) {
        cursorMonth = monthLabel;
        cursorStart = 1;
      } else if (monthLabel !== cursorMonth) {
        monthBands.push({ label: cursorMonth, startWeek: cursorStart, span: i + 1 - cursorStart });
        cursorMonth = monthLabel;
        cursorStart = i + 1;
      }
      if (i === GANTT_TOTAL_WEEKS - 1) {
        monthBands.push({ label: cursorMonth, startWeek: cursorStart, span: i + 2 - cursorStart });
      }
    }
  }

  return (
    <Card className="overflow-x-auto border-border bg-card">
      <div className="p-6" style={{ minWidth: `${totalWidth + 48}px` }}>
        {monthBands.length > 0 && (
          <div className="flex">
            <div style={{ width: LABEL_WIDTH }} className="shrink-0" />
            <div
              className="grid border-b border-border/40"
              style={{ gridTemplateColumns: `repeat(${GANTT_TOTAL_WEEKS}, ${WEEK_COL_WIDTH}px)` }}
            >
              {monthBands.map((b) => (
                <div
                  key={`${b.label}-${b.startWeek}`}
                  className="text-[10px] text-muted-foreground/80 capitalize text-center py-1 border-l border-border/30 first:border-l-0"
                  style={{ gridColumn: `${b.startWeek} / span ${b.span}` }}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex border-b border-border bg-muted/30 rounded-t-md">
          <div
            style={{ width: LABEL_WIDTH }}
            className="shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Entregable / Actividad
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${GANTT_TOTAL_WEEKS}, ${WEEK_COL_WIDTH}px)` }}
          >
            {Array.from({ length: GANTT_TOTAL_WEEKS }).map((_, i) => {
              const w = i + 1;
              return (
                <div
                  key={w}
                  className="flex flex-col items-center justify-end py-1.5 border-l border-border/40 first:border-l-0"
                >
                  <span className="text-[10px] font-semibold text-foreground">S{w}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          {showToday && (
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{
                left: `${LABEL_WIDTH + (todayWeek - 1) * WEEK_COL_WIDTH + WEEK_COL_WIDTH / 2}px`,
              }}
              aria-label={`Hoy (semana ${todayWeek})`}
            >
              <div className="h-full w-px bg-destructive/70" />
              <div className="absolute -top-2 -translate-x-1/2 text-[10px] font-semibold text-destructive bg-card px-1 rounded">
                Hoy
              </div>
            </div>
          )}

          {GANTT_PHASES.map((phase) => (
            <div key={phase.id}>
              <div className="flex items-center bg-muted/15 border-b border-border/60">
                <div
                  style={{ width: LABEL_WIDTH }}
                  className="shrink-0 px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  {phase.label}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · S{phase.startWeek}–S{phase.endWeek}
                  </span>
                </div>
                <div
                  className="grid relative"
                  style={{
                    gridTemplateColumns: `repeat(${GANTT_TOTAL_WEEKS}, ${WEEK_COL_WIDTH}px)`,
                  }}
                >
                  {Array.from({ length: GANTT_TOTAL_WEEKS }).map((_, i) => (
                    <div key={i} className="border-l border-border/30 first:border-l-0 h-9" />
                  ))}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-sm opacity-50"
                    style={{
                      left: `${(phase.startWeek - 1) * WEEK_COL_WIDTH + 2}px`,
                      width: `${(phase.endWeek - phase.startWeek + 1) * WEEK_COL_WIDTH - 4}px`,
                      height: 6,
                      backgroundColor: phase.color,
                    }}
                    aria-hidden="true"
                  />
                  {(milestonesByPhase.get(phase.id) ?? []).map((m) => {
                    const blockers = blockersByMilestone.get(m.id) ?? [];
                    const hasBlockers = blockers.length > 0;
                    const left =
                      (m.weekOffset - 1) * WEEK_COL_WIDTH + WEEK_COL_WIDTH / 2;
                    return (
                      <Tooltip key={m.id}>
                        <TooltipTrigger asChild>
                          <Link
                            href={
                              hasBlockers
                                ? "/portal/decisiones"
                                : "/portal/calendario"
                            }
                            className="absolute top-0 bottom-0 z-20 flex flex-col items-center -translate-x-1/2 group cursor-pointer"
                            style={{ left: `${left}px` }}
                            data-testid={`gantt-milestone-marker-${m.id}`}
                            aria-label={`Hito: ${m.title}${
                              hasBlockers
                                ? ` (${blockers.length} decisión${blockers.length === 1 ? "" : "es"} bloqueante${blockers.length === 1 ? "" : "s"})`
                                : ""
                            }`}
                          >
                            <div
                              className={`w-px h-full ${hasBlockers ? "bg-destructive/70" : "bg-foreground/40"} group-hover:bg-foreground/80`}
                            />
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 rotate-45 ${
                                hasBlockers
                                  ? "bg-destructive border-destructive"
                                  : "bg-card border-foreground/60"
                              } border-2 shadow-sm`}
                              style={{ width: 10, height: 10 }}
                            />
                            {hasBlockers && (
                              <span
                                className="absolute top-0 left-1/2 translate-x-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[14px] h-[14px] px-1 leading-[14px] text-center shadow"
                                data-testid={`gantt-milestone-blocker-badge-${m.id}`}
                              >
                                {blockers.length}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs bg-popover text-popover-foreground border border-border"
                        >
                          <div className="space-y-1.5">
                            <div className="font-semibold text-xs">
                              {m.title}
                            </div>
                            <div className="text-[10px] opacity-80">
                              Semana {m.weekOffset}
                              {m.kind === "presentation"
                                ? " · Presentación"
                                : " · Hito de fase"}
                            </div>
                            {hasBlockers ? (
                              <div className="pt-1 border-t border-border/60">
                                <div className="text-[10px] font-medium text-destructive mb-1">
                                  {blockers.length} decisión
                                  {blockers.length === 1 ? "" : "es"} bloqueante
                                  {blockers.length === 1 ? "" : "s"}:
                                </div>
                                <ul className="space-y-0.5">
                                  {blockers.map((d) => (
                                    <li
                                      key={d.id}
                                      className="text-[11px] leading-snug"
                                    >
                                      · {d.title}
                                    </li>
                                  ))}
                                </ul>
                                <div className="text-[10px] opacity-70 mt-1">
                                  Click para abrir Decisiones
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] opacity-70">
                                Sin decisiones bloqueantes
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {phase.tasks.map((task, idx) => {
                const span = task.endWeek - task.startWeek + 1;
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
                        gridTemplateColumns: `repeat(${GANTT_TOTAL_WEEKS}, ${WEEK_COL_WIDTH}px)`,
                      }}
                    >
                      {Array.from({ length: GANTT_TOTAL_WEEKS }).map((_, i) => (
                        <div key={i} className="border-l border-border/20 first:border-l-0 h-9" />
                      ))}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-sm shadow-sm"
                        style={{
                          left: `${(task.startWeek - 1) * WEEK_COL_WIDTH + 3}px`,
                          width: `${span * WEEK_COL_WIDTH - 6}px`,
                          height: 10,
                          backgroundColor: phase.color,
                        }}
                        aria-label={`${task.label} (S${task.startWeek}${
                          task.endWeek !== task.startWeek ? `–S${task.endWeek}` : ""
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
