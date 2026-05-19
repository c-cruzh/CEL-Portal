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
  if (!startDateStr) {
    return { events: [], hasStartDate: false };
  }
  // Parse YYYY-MM-DD as UTC midnight to avoid TZ drift.
  const [y, m, d] = startDateStr.split("-").map((n) => Number.parseInt(n, 10));
  const start = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const rows = await db
    .select()
    .from(milestonesTable)
    .orderBy(asc(milestonesTable.weekOffset), asc(milestonesTable.createdAt));
  const events: IcsEvent[] = rows.map((row) => {
    const date = new Date(start.getTime());
    date.setUTCDate(date.getUTCDate() + (row.weekOffset - 1) * 7);
    return {
      uid: `${row.id}@cel-portal-calendar`,
      title: row.title,
      description: row.description,
      date,
      updatedAt: row.updatedAt ?? row.createdAt,
      category: KIND_LABELS[row.kind] ?? row.kind,
    };
  });
  return { events, hasStartDate: true };
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
