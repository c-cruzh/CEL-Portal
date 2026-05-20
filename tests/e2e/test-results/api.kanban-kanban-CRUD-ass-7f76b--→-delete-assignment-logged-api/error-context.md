# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.kanban.spec.ts >> kanban CRUD + assignment notification >> create → move → assign → delete + assignment logged
- Location: tests/api.kanban.spec.ts:5:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { apiAs, adminApi, ADMIN_EMAIL, uniqueTag } from "./helpers";
  3   | 
  4   | test.describe("kanban CRUD + assignment notification", () => {
  5   |   test("create → move → assign → delete + assignment logged", async () => {
  6   |     const api = await adminApi();
  7   |     // Use a non-admin actor so the pm_lead role notification path will
  8   |     // dispatch to camila (who holds pm_lead) — the code skips self-assigns.
  9   |     const memberEmail = `member-actor-${uniqueTag()}@cel.gob.sv`;
  10  |     const memberApi = await apiAs(memberEmail);
  11  |     // Warm the member so it exists in the users table.
  12  |     await memberApi.get("/api/me");
  13  | 
  14  |     const colsRes = await api.get("/api/kanban/columns");
> 15  |     expect(colsRes.ok()).toBeTruthy();
      |                          ^ Error: expect(received).toBeTruthy()
  16  |     const cols = await colsRes.json();
  17  |     expect(Array.isArray(cols)).toBe(true);
  18  |     expect(cols.length).toBeGreaterThanOrEqual(3);
  19  |     const firstCol = cols[0].key;
  20  |     const secondCol = cols[1].key;
  21  | 
  22  |     const tag = uniqueTag();
  23  |     const createRes = await memberApi.post("/api/kanban/cards", {
  24  |       data: {
  25  |         title: `E2E tarjeta ${tag}`,
  26  |         description: "creada por la suite E2E",
  27  |         columnKey: firstCol,
  28  |         priority: "media",
  29  |         category: "piloto",
  30  |         assignedRoles: [],
  31  |       },
  32  |     });
  33  |     expect(createRes.status()).toBe(201);
  34  |     const card = await createRes.json();
  35  |     expect(card.id).toBeTruthy();
  36  |     expect(card.columnKey).toBe(firstCol);
  37  | 
  38  |     // Move to the next column
  39  |     const moveRes = await memberApi.post(`/api/kanban/cards/${card.id}/move`, {
  40  |       data: { columnKey: secondCol, position: 0 },
  41  |     });
  42  |     expect(moveRes.ok()).toBeTruthy();
  43  | 
  44  |     // Assign roles — this fires the notification path to the admin
  45  |     // (camila holds pm_lead and is not the actor).
  46  |     const patchRes = await memberApi.patch(`/api/kanban/cards/${card.id}`, {
  47  |       data: { assignedRoles: ["pm_lead"] },
  48  |     });
  49  |     expect(patchRes.ok()).toBeTruthy();
  50  |     const updated = await patchRes.json();
  51  |     expect(updated.assignedRoles).toContain("pm_lead");
  52  | 
  53  |     // Notification log should reflect the assignment (eventually consistent —
  54  |     // give the async writer a moment).
  55  |     let logged = false;
  56  |     for (let i = 0; i < 10 && !logged; i++) {
  57  |       await new Promise((r) => setTimeout(r, 200));
  58  |       const logRes = await api.get("/api/admin/notification-log");
  59  |       expect(logRes.ok()).toBeTruthy();
  60  |       const log = await logRes.json();
  61  |       logged = log.some(
  62  |         (e: { eventKind?: string }) => e.eventKind === "kanban_card_assigned",
  63  |       );
  64  |     }
  65  |     expect(logged).toBe(true);
  66  | 
  67  |     // Cleanup (admin can delete any card)
  68  |     const delRes = await api.delete(`/api/kanban/cards/${card.id}`);
  69  |     expect(delRes.status()).toBe(204);
  70  | 
  71  |     await api.dispose();
  72  |     await memberApi.dispose();
  73  |   });
  74  | 
  75  |   test("non-admin member can create a card and gets it back from /cards", async () => {
  76  |     const memberEmail = `member-${uniqueTag()}@cel.gob.sv`;
  77  |     const member = await apiAs(memberEmail);
  78  |     const tag = uniqueTag();
  79  | 
  80  |     const createRes = await member.post("/api/kanban/cards", {
  81  |       data: {
  82  |         title: `Miembro tarjeta ${tag}`,
  83  |         columnKey: "backlog",
  84  |         priority: "media",
  85  |         category: "piloto",
  86  |         assignedRoles: [],
  87  |       },
  88  |     });
  89  |     expect([200, 201]).toContain(createRes.status());
  90  |     const card = await createRes.json();
  91  | 
  92  |     const listRes = await member.get("/api/kanban/cards");
  93  |     expect(listRes.ok()).toBeTruthy();
  94  |     const cards = await listRes.json();
  95  |     expect(cards.some((c: { id: string }) => c.id === card.id)).toBe(true);
  96  | 
  97  |     // Creator can delete their own card.
  98  |     const delRes = await member.delete(`/api/kanban/cards/${card.id}`);
  99  |     expect(delRes.status()).toBe(204);
  100 | 
  101 |     await member.dispose();
  102 |   });
  103 | });
  104 | 
```