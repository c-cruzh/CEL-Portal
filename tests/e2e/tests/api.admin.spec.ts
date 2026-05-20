import { test, expect } from "@playwright/test";
import { adminApi, uniqueTag } from "./helpers";

test.describe("admin allowlist", () => {
  test("add → list → delete a new allowed domain", async () => {
    const api = await adminApi();
    const tag = uniqueTag();
    const domain = `e2e-${tag}.local`;

    const addRes = await api.post("/api/admin/allowed-domains", {
      data: { domain, note: "added by e2e" },
    });
    expect([200, 201]).toContain(addRes.status());

    const listRes = await api.get("/api/admin/allowed-domains");
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(
      list.some((d: { domain: string }) => d.domain === domain),
    ).toBe(true);

    const delRes = await api.delete(
      `/api/admin/allowed-domains/${encodeURIComponent(domain)}`,
    );
    expect(delRes.status()).toBe(204);

    const after = await (await api.get("/api/admin/allowed-domains")).json();
    expect(
      after.some((d: { domain: string }) => d.domain === domain),
    ).toBe(false);

    await api.dispose();
  });

  test("invalid domain shape is rejected with structured error", async () => {
    const api = await adminApi();
    const res = await api.post("/api/admin/allowed-domains", {
      data: { domain: "  @notadomain  " },
    });
    expect(res.status()).toBe(400);
    await api.dispose();
  });
});

test.describe("admin notification recipients", () => {
  test("add → list → test → delete a recipient", async () => {
    const api = await adminApi();
    const tag = uniqueTag();
    const email = `e2e-${tag}@example.com`;

    const addRes = await api.post("/api/admin/notification-recipients", {
      data: { email },
    });
    expect([200, 201]).toContain(addRes.status());

    const list = await (
      await api.get("/api/admin/notification-recipients")
    ).json();
    expect(list.some((r: { email: string }) => r.email === email)).toBe(true);

    const testRes = await api.post(
      "/api/admin/notification-recipients/test",
      { data: {} },
    );
    expect(testRes.ok()).toBeTruthy();
    const testBody = await testRes.json();
    expect(["sent", "no_provider", "no_recipients"]).toContain(testBody.status);

    const logRes = await api.get("/api/admin/notification-log");
    expect(logRes.ok()).toBeTruthy();
    const log = await logRes.json();
    expect(Array.isArray(log)).toBe(true);

    const delRes = await api.delete(
      `/api/admin/notification-recipients/${encodeURIComponent(email)}`,
    );
    expect(delRes.status()).toBe(204);

    await api.dispose();
  });
});
