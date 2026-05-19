import { Router, type IRouter, type Request, type Response } from "express";
import { asc } from "drizzle-orm";
import { db, milestonesTable, projectConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  getCalendarFeedToken,
  getPublicBaseUrl,
  isValidCalendarFeedToken,
  renderIcs,
  type IcsEvent,
} from "../lib/icalendar";

const router: IRouter = Router();

const KIND_LABELS: Record<string, string> = {
  phase_milestone: "Hito de fase",
  deliverable: "Entregable",
  weekly_session: "Sesión semanal",
  presentation: "Presentación",
  workshop: "Taller",
  decision: "Decisión clave",
};

async function loadEvents(): Promise<{
  events: IcsEvent[];
  hasStartDate: boolean;
}> {
  const [cfg] = await db
    .select()
    .from(projectConfigTable)
    .where(eq(projectConfigTable.id, 1))
    .limit(1);
  const startDateStr = cfg?.startDate ?? null;
  // Parse YYYY-MM-DD as UTC midnight to avoid TZ drift.
  let start: Date | null = null;
  if (startDateStr) {
    const [y, m, d] = startDateStr.split("-").map((n) => Number.parseInt(n, 10));
    start = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  }
  const rows = await db
    .select()
    .from(milestonesTable)
    .orderBy(asc(milestonesTable.weekOffset), asc(milestonesTable.createdAt));
  const events: IcsEvent[] = [];
  for (const row of rows) {
    let date: Date | null = null;
    if (row.dateOverride) {
      const [oy, om, od] = row.dateOverride
        .split("-")
        .map((n) => Number.parseInt(n, 10));
      date = new Date(Date.UTC(oy!, (om ?? 1) - 1, od ?? 1));
    } else if (start) {
      date = new Date(start.getTime());
      date.setUTCDate(date.getUTCDate() + (row.weekOffset - 1) * 7);
    } else {
      // No T0 and no override: can't place this event on the calendar.
      continue;
    }
    const descParts: string[] = [];
    if (row.description) descParts.push(row.description);
    if (row.notes) descParts.push(row.notes);
    if (row.location) descParts.push(`Lugar: ${row.location}`);
    if (row.durationMinutes)
      descParts.push(`Duración estimada: ${row.durationMinutes} min`);
    events.push({
      uid: `${row.id}@cel-portal-calendar`,
      title: row.title,
      description: descParts.length > 0 ? descParts.join("\n") : null,
      date,
      updatedAt: row.updatedAt ?? row.createdAt,
      category: KIND_LABELS[row.kind] ?? row.kind,
    });
  }
  return { events, hasStartDate: start !== null };
}

function sendIcs(res: Response, body: string, filename: string): void {
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.setHeader("Cache-Control", "no-store");
  res.send(body);
}

// Authenticated one-shot download — used by the "Exportar (.ics)" button.
router.get(
  "/calendar/export.ics",
  requireAuth,
  async (_req, res): Promise<void> => {
    const { events } = await loadEvents();
    const ics = renderIcs({
      calendarName: "Calendario del Piloto — CEL",
      description:
        "Hitos, entregables y sesiones del piloto. Generado desde el Portal CEL.",
      events,
    });
    sendIcs(res, ics, "calendario-piloto-cel.ics");
  },
);

// Authenticated metadata endpoint: returns the public subscription URL so the
// portal can show it without needing to know how the token is derived.
router.get(
  "/calendar/feed-url",
  requireAuth,
  async (req, res): Promise<void> => {
    const token = getCalendarFeedToken();
    const base = getPublicBaseUrl(req);
    res.json({
      token,
      url: `${base}/api/calendar/feed/${token}.ics`,
    });
  },
);

// Public, token-protected feed used for "subscribe by URL" in Google Calendar
// or Outlook. The token is a static HMAC derived from a server secret.
router.get(
  "/calendar/feed/:token.ics",
  async (req: Request, res: Response): Promise<void> => {
    const tokenRaw = req.params.token;
    const token = Array.isArray(tokenRaw) ? tokenRaw[0]! : tokenRaw;
    if (!token || !isValidCalendarFeedToken(token)) {
      res.status(404).type("text/plain").send("Calendar feed not found");
      return;
    }
    const { events } = await loadEvents();
    const ics = renderIcs({
      calendarName: "Calendario del Piloto — CEL",
      description:
        "Suscripción al calendario del piloto. Se actualiza automáticamente cuando cambia T0 o los hitos.",
      events,
    });
    sendIcs(res, ics, "calendario-piloto-cel.ics");
  },
);

export default router;
