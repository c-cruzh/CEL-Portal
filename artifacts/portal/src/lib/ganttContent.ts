import { PHASES } from "@workspace/project-domain";

export interface GanttTask {
  label: string;
  startWeek: number;
  endWeek: number;
}

export interface GanttPhase {
  id: string;
  label: string;
  shortName: string;
  color: string;
  startWeek: number;
  endWeek: number;
  tasks: GanttTask[];
}

export const GANTT_TOTAL_WEEKS = PHASES.reduce(
  (max, p) => Math.max(max, p.startWeek + p.durationWeeks - 1),
  0,
);

export const GANTT_PHASES: GanttPhase[] = PHASES.map((p) => {
  const endWeek = p.startWeek + p.durationWeeks - 1;
  const n = Math.max(1, p.activities.length);
  const tasks: GanttTask[] = p.activities.map((label, i) => {
    const start = p.startWeek + Math.floor((i * p.durationWeeks) / n);
    const next = p.startWeek + Math.floor(((i + 1) * p.durationWeeks) / n) - 1;
    const end = i === n - 1 ? endWeek : Math.max(start, Math.min(endWeek, next));
    return { label, startWeek: start, endWeek: end };
  });
  return {
    id: p.id,
    label: p.label,
    shortName: p.shortName,
    color: p.colorVar,
    startWeek: p.startWeek,
    endWeek,
    tasks,
  };
});
