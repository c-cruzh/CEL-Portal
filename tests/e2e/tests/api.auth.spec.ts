import { test, expect } from "@playwright/test";
import { apiAs, ADMIN_EMAIL, uniqueTag } from "./helpers";

test.describe("auth + test-mode bypass", () => {
  test("anonymous request to /me returns 401", async ({ request }) => {
    const res = await request.get("/api/me");
    expect(res.status()).toBe(401);
  });

  test("admin bypass resolves to /me with active status", async () => {
    const api = await apiAs(ADMIN_EMAIL, { admin: true });
    const res = await api.get("/api/me");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.email).toBe(ADMIN_EMAIL);
    expect(body.isAdmin).toBe(true);
    expect(Array.isArray(body.roles)).toBe(true);
    expect(body.roles).toContain("project_lead");
    await api.dispose();
  });

  test("non-admin user gets 403 on admin-only endpoint", async () => {
    const member = `member-${uniqueTag()}@cel.gob.sv`;
    const api = await apiAs(member);
    const res = await api.get("/api/admin/allowed-domains");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("admin_only");
    await api.dispose();
  });

  test("bypass requires explicit user-email header (no headers → 401)", async ({
    request,
  }) => {
    const res = await request.get("/api/me", {
      headers: { "x-e2e-admin": "1" },
    });
    expect(res.status()).toBe(401);
  });

  test("bypass without matching secret is rejected (forged-header regression)", async ({
    request,
  }) => {
    // An attacker who knows the bypass headers but NOT the on-disk shared
    // secret must be denied. Validates the per-request secret check that
    // protects shared dev deployments where the proxy makes requests look
    // loopback to the API.
    const res = await request.get("/api/me", {
      headers: {
        "x-e2e-user-email": ADMIN_EMAIL,
        "x-e2e-admin": "1",
        "x-e2e-secret": "definitely-not-the-real-secret-1234567890abcdef",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("bypass without any secret header is rejected", async ({ request }) => {
    const res = await request.get("/api/me", {
      headers: {
        "x-e2e-user-email": ADMIN_EMAIL,
        "x-e2e-admin": "1",
      },
    });
    expect(res.status()).toBe(401);
  });
});
