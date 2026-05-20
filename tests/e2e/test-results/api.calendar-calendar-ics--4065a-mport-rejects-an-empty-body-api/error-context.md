# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.calendar.spec.ts >> calendar .ics export >> batch import rejects an empty body
- Location: tests/api.calendar.spec.ts:98:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

# Test source

```ts
  3   | 
  4   | function parseIcs(text: string): { events: Record<string, string>[]; calendarName: string | null } {
  5   |   const lines = text.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
  6   |   const events: Record<string, string>[] = [];
  7   |   let inEvent = false;
  8   |   let current: Record<string, string> = {};
  9   |   let calendarName: string | null = null;
  10  |   for (const line of lines) {
  11  |     if (line.startsWith("X-WR-CALNAME:")) calendarName = line.slice(13);
  12  |     if (line === "BEGIN:VEVENT") {
  13  |       inEvent = true;
  14  |       current = {};
  15  |       continue;
  16  |     }
  17  |     if (line === "END:VEVENT") {
  18  |       inEvent = false;
  19  |       events.push(current);
  20  |       continue;
  21  |     }
  22  |     if (!inEvent) continue;
  23  |     const idx = line.indexOf(":");
  24  |     if (idx < 0) continue;
  25  |     const keyRaw = line.slice(0, idx);
  26  |     const value = line.slice(idx + 1);
  27  |     const key = keyRaw.split(";")[0];
  28  |     current[key] = value;
  29  |   }
  30  |   return { events, calendarName };
  31  | }
  32  | 
  33  | test.describe("calendar .ics export", () => {
  34  |   test("authenticated /calendar/export.ics returns valid parseable .ics", async () => {
  35  |     const api = await adminApi();
  36  |     const res = await api.get("/api/calendar/export.ics");
  37  |     expect(res.ok()).toBeTruthy();
  38  |     expect(res.headers()["content-type"]).toMatch(/text\/calendar/);
  39  |     const body = await res.text();
  40  |     expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
  41  |     expect(body.trim().endsWith("END:VCALENDAR")).toBe(true);
  42  |     const parsed = parseIcs(body);
  43  |     // No T0 configured yet — events may be 0, but the calendar itself must
  44  |     // parse cleanly with a name set.
  45  |     expect(parsed.calendarName).toBeTruthy();
  46  |     for (const ev of parsed.events) {
  47  |       expect(ev.UID).toBeTruthy();
  48  |       expect(ev.SUMMARY).toBeTruthy();
  49  |       expect(ev.DTSTART).toMatch(/^\d{8}/);
  50  |     }
  51  |     await api.dispose();
  52  |   });
  53  | 
  54  |   test("public feed URL is reachable without auth via its token", async ({
  55  |     request,
  56  |   }) => {
  57  |     const api = await adminApi();
  58  |     const metaRes = await api.get("/api/calendar/feed-url");
  59  |     expect(metaRes.ok()).toBeTruthy();
  60  |     const meta = await metaRes.json();
  61  |     expect(meta.token).toBeTruthy();
  62  |     expect(meta.url).toContain(`/api/calendar/feed/${meta.token}.ics`);
  63  |     await api.dispose();
  64  | 
  65  |     const publicRes = await request.get(`/api/calendar/feed/${meta.token}.ics`);
  66  |     expect(publicRes.ok()).toBeTruthy();
  67  |     const body = await publicRes.text();
  68  |     expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
  69  |   });
  70  | 
  71  |   test("public feed with invalid token returns 404", async ({ request }) => {
  72  |     const res = await request.get("/api/calendar/feed/not-a-real-token.ics");
  73  |     expect(res.status()).toBe(404);
  74  |   });
  75  | 
  76  |   test("batch import validates payload shape and returns structured errors", async () => {
  77  |     const api = await adminApi();
  78  |     // Missing required `title` should yield a 400 with row-level errors,
  79  |     // without touching the milestones table. We don't assert "created" rows
  80  |     // because there is no public DELETE endpoint to clean those up.
  81  |     const res = await api.post("/api/admin/milestones/batch", {
  82  |       data: {
  83  |         sessions: [
  84  |           { kind: "session", weekOffset: 1 },
  85  |         ],
  86  |       },
  87  |     });
  88  |     expect(res.status()).toBe(400);
  89  |     const body = await res.json();
  90  |     expect(body.created).toBe(0);
  91  |     expect(Array.isArray(body.errors)).toBe(true);
  92  |     expect(body.errors.length).toBeGreaterThan(0);
  93  |     expect(body.errors[0]).toHaveProperty("row");
  94  |     expect(body.errors[0]).toHaveProperty("message");
  95  |     await api.dispose();
  96  |   });
  97  | 
  98  |   test("batch import rejects an empty body", async () => {
  99  |     const api = await adminApi();
  100 |     const res = await api.post("/api/admin/milestones/batch", {
  101 |       data: { sessions: [] },
  102 |     });
> 103 |     expect(res.status()).toBe(400);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  104 |     await api.dispose();
  105 |   });
  106 | });
  107 | 
```