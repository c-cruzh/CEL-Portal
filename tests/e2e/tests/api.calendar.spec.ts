import { test, expect } from "@playwright/test";
import { adminApi } from "./helpers";

function parseIcs(text: string): { events: Record<string, string>[]; calendarName: string | null } {
  const lines = text.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
  const events: Record<string, string>[] = [];
  let inEvent = false;
  let current: Record<string, string> = {};
  let calendarName: string | null = null;
  for (const line of lines) {
    if (line.startsWith("X-WR-CALNAME:")) calendarName = line.slice(13);
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      events.push(current);
      continue;
    }
    if (!inEvent) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const keyRaw = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = keyRaw.split(";")[0];
    current[key] = value;
  }
  return { events, calendarName };
}

test.describe("calendar .ics export", () => {
  test("authenticated /calendar/export.ics returns valid parseable .ics", async () => {
    const api = await adminApi();
    const res = await api.get("/api/calendar/export.ics");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toMatch(/text\/calendar/);
    const body = await res.text();
    expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(body.trim().endsWith("END:VCALENDAR")).toBe(true);
    const parsed = parseIcs(body);
    // No T0 configured yet — events may be 0, but the calendar itself must
    // parse cleanly with a name set.
    expect(parsed.calendarName).toBeTruthy();
    for (const ev of parsed.events) {
      expect(ev.UID).toBeTruthy();
      expect(ev.SUMMARY).toBeTruthy();
      expect(ev.DTSTART).toMatch(/^\d{8}/);
    }
    await api.dispose();
  });

  test("public feed URL is reachable without auth via its token", async ({
    request,
  }) => {
    const api = await adminApi();
    const metaRes = await api.get("/api/calendar/feed-url");
    expect(metaRes.ok()).toBeTruthy();
    const meta = await metaRes.json();
    expect(meta.token).toBeTruthy();
    expect(meta.url).toContain(`/api/calendar/feed/${meta.token}.ics`);
    await api.dispose();

    const publicRes = await request.get(`/api/calendar/feed/${meta.token}.ics`);
    expect(publicRes.ok()).toBeTruthy();
    const body = await publicRes.text();
    expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });

  test("public feed with invalid token returns 404", async ({ request }) => {
    const res = await request.get("/api/calendar/feed/not-a-real-token.ics");
    expect(res.status()).toBe(404);
  });

  test("batch import validates payload shape and returns structured errors", async () => {
    const api = await adminApi();
    // Missing required `title` should yield a 400 with row-level errors,
    // without touching the milestones table. We don't assert "created" rows
    // because there is no public DELETE endpoint to clean those up.
    const res = await api.post("/api/admin/milestones/batch", {
      data: {
        sessions: [
          { kind: "session", weekOffset: 1 },
        ],
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.created).toBe(0);
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.errors[0]).toHaveProperty("row");
    expect(body.errors[0]).toHaveProperty("message");
    await api.dispose();
  });

  test("batch import rejects an empty body", async () => {
    const api = await adminApi();
    const res = await api.post("/api/admin/milestones/batch", {
      data: { sessions: [] },
    });
    expect(res.status()).toBe(400);
    await api.dispose();
  });
});
