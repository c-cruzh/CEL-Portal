# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.decisions.spec.ts >> decisions lifecycle + milestone link >> create blocking decision → resolve → reopen
- Location: tests/api.decisions.spec.ts:5:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { adminApi, uniqueTag } from "./helpers";
  3   | 
  4   | test.describe("decisions lifecycle + milestone link", () => {
  5   |   test("create blocking decision → resolve → reopen", async () => {
  6   |     const api = await adminApi();
  7   | 
  8   |     const milestonesRes = await api.get("/api/milestones");
> 9   |     expect(milestonesRes.ok()).toBeTruthy();
      |                                ^ Error: expect(received).toBeTruthy()
  10  |     const milestones = await milestonesRes.json();
  11  |     const milestone = milestones[0];
  12  |     expect(milestone).toBeTruthy();
  13  |     expect(typeof milestone.id).toBe("string");
  14  | 
  15  |     const tag = uniqueTag();
  16  |     const createRes = await api.post("/api/decisions", {
  17  |       data: {
  18  |         title: `E2E decisión bloqueante ${tag}`,
  19  |         context: "Creada por la suite E2E para validar el ciclo de vida.",
  20  |         optionsConsidered: "A vs B",
  21  |         blocksMilestoneId: milestone.id,
  22  |       },
  23  |     });
  24  |     expect(createRes.status()).toBe(201);
  25  |     const decision = await createRes.json();
  26  |     expect(decision.status).toBe("open");
  27  |     expect(decision.blocksMilestoneId).toBe(milestone.id);
  28  | 
  29  |     // Listing milestone-blocking decisions includes ours.
  30  |     const listRes = await api.get("/api/decisions?status=open");
  31  |     const all = await listRes.json();
  32  |     expect(
  33  |       all.some(
  34  |         (d: { id: string; blocksMilestoneId?: string | null }) =>
  35  |           d.id === decision.id && d.blocksMilestoneId === milestone.id,
  36  |       ),
  37  |     ).toBe(true);
  38  | 
  39  |     // Resolve it
  40  |     const resolveRes = await api.post(
  41  |       `/api/decisions/${decision.id}/resolve`,
  42  |       {
  43  |         data: {
  44  |           decidedOutcome: "Opción A acordada por el equipo del piloto",
  45  |           decidedAt: new Date().toISOString().slice(0, 10),
  46  |         },
  47  |       },
  48  |     );
  49  |     expect(resolveRes.ok()).toBeTruthy();
  50  |     const resolved = await resolveRes.json();
  51  |     expect(resolved.status).toBe("resolved");
  52  |     expect(resolved.decidedAt).toBeTruthy();
  53  | 
  54  |     // PATCH on a resolved decision must be refused
  55  |     const patchAttempt = await api.patch(`/api/decisions/${decision.id}`, {
  56  |       data: { title: "intento ilegal" },
  57  |     });
  58  |     expect(patchAttempt.status()).toBe(400);
  59  | 
  60  |     // Reopen by direct status change isn't exposed; use the dedicated endpoint
  61  |     // path. Decisions module supports re-opening via PATCH after explicit
  62  |     // /reopen — verify via the JSON shape.
  63  |     const reopenRes = await api.post(
  64  |       `/api/decisions/${decision.id}/reopen`,
  65  |       { data: {} },
  66  |     );
  67  |     // If the route doesn't exist (older codebase), allow PATCH fallback to
  68  |     // work after manually clearing resolved state via DELETE. Either way we
  69  |     // require *some* path back to "open".
  70  |     if (reopenRes.status() === 404) {
  71  |       const delRes = await api.delete(`/api/decisions/${decision.id}`);
  72  |       expect([200, 204]).toContain(delRes.status());
  73  |     } else {
  74  |       expect(reopenRes.ok()).toBeTruthy();
  75  |       const reopened = await reopenRes.json();
  76  |       expect(["open", "in_analysis"]).toContain(reopened.status);
  77  |       // Cleanup
  78  |       const delRes = await api.delete(`/api/decisions/${decision.id}`);
  79  |       expect([200, 204]).toContain(delRes.status());
  80  |     }
  81  | 
  82  |     await api.dispose();
  83  |   });
  84  | 
  85  |   test("resolve without required fields returns explicit error", async () => {
  86  |     const api = await adminApi();
  87  |     const tag = uniqueTag();
  88  |     const createRes = await api.post("/api/decisions", {
  89  |       data: {
  90  |         title: `E2E decisión inválida ${tag}`,
  91  |         context: "",
  92  |       },
  93  |     });
  94  |     expect(createRes.status()).toBe(201);
  95  |     const d = await createRes.json();
  96  | 
  97  |     const badResolve = await api.post(`/api/decisions/${d.id}/resolve`, {
  98  |       data: {},
  99  |     });
  100 |     expect(badResolve.status()).toBe(400);
  101 |     const body = await badResolve.json();
  102 |     expect(body.code).toBe("decision_resolve_invalid");
  103 | 
  104 |     await api.delete(`/api/decisions/${d.id}`);
  105 |     await api.dispose();
  106 |   });
  107 | });
  108 | 
```