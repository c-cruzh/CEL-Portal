import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ROLES } from "@/lib/projectContent";
import type {
  PhaseInvolvement,
  PhaseActivity,
  RoleId,
} from "@/lib/phaseInvolvement";
import type { Phase } from "@/lib/projectContent";

interface Props {
  phase: Phase;
  involvement?: PhaseInvolvement;
  roleAssignees: Map<string, string[]>;
}

const ROLE_BY_ID = new Map(ROLES.map((r) => [r.id, r]));

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function RolePeople({
  roleId,
  kind,
  assignees,
}: {
  roleId: RoleId;
  kind: "R" | "C" | "I";
  assignees: string[];
}) {
  const role = ROLE_BY_ID.get(roleId);
  const label = role?.label ?? roleId;
  const kindLabel =
    kind === "R" ? "Responsable" : kind === "C" ? "Consultado" : "Informado";
  const tone =
    kind === "R"
      ? "bg-primary/10 text-primary border-primary/30"
      : kind === "C"
        ? "bg-foreground/5 text-foreground border-border"
        : "bg-muted text-muted-foreground border-border";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${tone}`}
        title={`${label} · ${kindLabel}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {kind}
        </span>
        <span className="text-xs font-medium">{label}</span>
      </span>
      {assignees.length === 0 ? (
        <span className="text-[10px] text-muted-foreground italic">
          Sin asignar
        </span>
      ) : (
        assignees.map((name, i) => (
          <span
            key={`${roleId}-${kind}-${name}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background pl-0.5 pr-2 py-0.5"
            title={`${name} · ${kindLabel} · ${label}`}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-medium">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground">{name}</span>
          </span>
        ))
      )}
    </div>
  );
}

function ActivityRow({
  activity,
  roleAssignees,
  phaseId,
  phaseColor,
}: {
  activity: PhaseActivity;
  roleAssignees: Map<string, string[]>;
  phaseId: string;
  phaseColor: string;
}) {
  const r = activity.responsible ?? [];
  const c = activity.consulted ?? [];
  const i = activity.informed ?? [];
  return (
    <div className="border border-border rounded-md p-3 bg-background space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-foreground/80 border bg-muted/50"
              style={{ borderColor: phaseColor }}
              title={`Fase ${phaseId}`}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-sm"
                style={{ backgroundColor: phaseColor }}
                aria-hidden="true"
              />
              {phaseId}
            </span>
            <div className="text-sm font-medium text-foreground leading-snug">
              {activity.name}
            </div>
          </div>
          {activity.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activity.description}
            </p>
          )}
        </div>
        {activity.needsHumanReview && (
          <Badge variant="outline" className="shrink-0 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
            Por validar (Kevin)
          </Badge>
        )}
      </div>
      {(r.length > 0 || c.length > 0 || i.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {r.map((roleId) => (
            <RolePeople
              key={`r-${roleId}`}
              roleId={roleId}
              kind="R"
              assignees={roleAssignees.get(roleId) ?? []}
            />
          ))}
          {c.map((roleId) => (
            <RolePeople
              key={`c-${roleId}`}
              roleId={roleId}
              kind="C"
              assignees={roleAssignees.get(roleId) ?? []}
            />
          ))}
          {i.map((roleId) => (
            <RolePeople
              key={`i-${roleId}`}
              roleId={roleId}
              kind="I"
              assignees={roleAssignees.get(roleId) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PhaseInvolvementCard({ phase, involvement, roleAssignees }: Props) {
  const stages = involvement?.stages ?? [];
  const totalActivities = stages.reduce(
    (sum, s) => sum + s.deliverables.reduce((a, d) => a + d.activities.length, 0),
    0,
  );

  return (
    <Card className="border-border bg-card">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`phase-${phase.id}`} className="border-b-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex flex-col gap-1 text-left w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: phase.colorVar }}
                  aria-hidden="true"
                />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {phase.id}
                </span>
                <CardTitle className="text-base leading-tight">
                  {phase.shortName}
                </CardTitle>
                {involvement?.needsHumanReview && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                    Por validar (Kevin)
                  </Badge>
                )}
              </div>
              <CardDescription className="font-normal">
                {phase.label} · Semanas {phase.startWeek}–
                {phase.startWeek + phase.durationWeeks - 1} ·{" "}
                {phase.durationWeeks} sem · {totalActivities} actividad
                {totalActivities === 1 ? "" : "es"}
              </CardDescription>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {phase.objective}
            </p>
        {stages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Sin desglose de actividades disponible.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {stages.map((stage) => (
              <AccordionItem
                key={stage.id}
                value={stage.id}
                className="border-border last:border-b-0"
              >
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-start gap-2 text-left">
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {stage.name}
                    </span>
                    {stage.needsHumanReview && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                        Por validar (Kevin)
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {stage.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {stage.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {stage.deliverables.map((d) => (
                      <div key={d.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Entregable
                            </div>
                            <div className="text-sm font-medium text-foreground leading-snug">
                              {d.name}
                            </div>
                            {d.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                {d.description}
                              </p>
                            )}
                          </div>
                          {d.needsHumanReview && (
                            <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
                              Por validar (Kevin)
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 pl-4">
                          {d.activities.map((a) => (
                            <ActivityRow
                              key={a.id}
                              activity={a}
                              roleAssignees={roleAssignees}
                              phaseId={phase.id}
                              phaseColor={phase.colorVar}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
