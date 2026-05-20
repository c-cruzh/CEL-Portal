import { test, expect } from "@playwright/test";
import { apiAs, adminApi, ADMIN_EMAIL, uniqueTag } from "./helpers";

test.describe("kanban CRUD + assignment notification", () => {
  test("create → move → assign → delete + assignment logged", async () => {
    const api = await adminApi();
    // Use a non-admin actor so the pm_lead role notification path will
    // dispatch to camila (who holds pm_lead) — the code skips self-assigns.
    const memberEmail = `member-actor-${uniqueTag()}@cel.gob.sv`;
    const memberApi = await apiAs(memberEmail);
    // Warm the member so it exists in the users table.
    await memberApi.get("/api/me");

    const colsRes = await api.get("/api/kanban/columns");
    expect(colsRes.ok()).toBeTruthy();
    const cols = await colsRes.json();
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.length).toBeGreaterThanOrEqual(3);
    const firstCol = cols[0].key;
    const secondCol = cols[1].key;

    const tag = uniqueTag();
    const createRes = await memberApi.post("/api/kanban/cards", {
      data: {
        title: `E2E tarjeta ${tag}`,
        description: "creada por la suite E2E",
        columnKey: firstCol,
        priority: "media",
        category: "piloto",
        assignedRoles: [],
      },
    });
    expect(createRes.status()).toBe(201);
    const card = await createRes.json();
    expect(card.id).toBeTruthy();
    expect(card.columnKey).toBe(firstCol);

    // Move to the next column
    const moveRes = await memberApi.post(`/api/kanban/cards/${card.id}/move`, {
      data: { columnKey: secondCol, position: 0 },
    });
    expect(moveRes.ok()).toBeTruthy();

    // Assign roles — this fires the notification path to the admin
    // (camila holds pm_lead and is not the actor).
    const patchRes = await memberApi.patch(`/api/kanban/cards/${card.id}`, {
      data: { assignedRoles: ["pm_lead"] },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.assignedRoles).toContain("pm_lead");

    // Notification log should reflect the assignment (eventually consistent —
    // give the async writer a moment).
    let logged = false;
    for (let i = 0; i < 10 && !logged; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const logRes = await api.get("/api/admin/notification-log");
      expect(logRes.ok()).toBeTruthy();
      const log = await logRes.json();
      logged = log.some(
        (e: { eventKind?: string }) => e.eventKind === "kanban_card_assigned",
      );
    }
    expect(logged).toBe(true);

    // Cleanup (admin can delete any card)
    const delRes = await api.delete(`/api/kanban/cards/${card.id}`);
    expect(delRes.status()).toBe(204);

    await api.dispose();
    await memberApi.dispose();
  });

  test("non-admin member can create a card and gets it back from /cards", async () => {
    const memberEmail = `member-${uniqueTag()}@cel.gob.sv`;
    const member = await apiAs(memberEmail);
    const tag = uniqueTag();

    const createRes = await member.post("/api/kanban/cards", {
      data: {
        title: `Miembro tarjeta ${tag}`,
        columnKey: "backlog",
        priority: "media",
        category: "piloto",
        assignedRoles: [],
      },
    });
    expect([200, 201]).toContain(createRes.status());
    const card = await createRes.json();

    const listRes = await member.get("/api/kanban/cards");
    expect(listRes.ok()).toBeTruthy();
    const cards = await listRes.json();
    expect(cards.some((c: { id: string }) => c.id === card.id)).toBe(true);

    // Creator can delete their own card.
    const delRes = await member.delete(`/api/kanban/cards/${card.id}`);
    expect(delRes.status()).toBe(204);

    await member.dispose();
  });
});
