# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.auth.spec.ts >> auth + test-mode bypass >> admin bypass resolves to /me with active status
- Location: tests/api.auth.spec.ts:10:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "pm_lead"
Received array: ["ml_engineer", "data_engineer", "infra_devops", "fullstack_dev", "qa_validation", "docs_training", "stakeholder_cel", "project_lead"]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { apiAs, ADMIN_EMAIL, uniqueTag } from "./helpers";
  3  | 
  4  | test.describe("auth + test-mode bypass", () => {
  5  |   test("anonymous request to /me returns 401", async ({ request }) => {
  6  |     const res = await request.get("/api/me");
  7  |     expect(res.status()).toBe(401);
  8  |   });
  9  | 
  10 |   test("admin bypass resolves to /me with active status", async () => {
  11 |     const api = await apiAs(ADMIN_EMAIL, { admin: true });
  12 |     const res = await api.get("/api/me");
  13 |     expect(res.ok()).toBeTruthy();
  14 |     const body = await res.json();
  15 |     expect(body.email).toBe(ADMIN_EMAIL);
  16 |     expect(body.isAdmin).toBe(true);
  17 |     expect(Array.isArray(body.roles)).toBe(true);
> 18 |     expect(body.roles).toContain("pm_lead");
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  19 |     await api.dispose();
  20 |   });
  21 | 
  22 |   test("non-admin user gets 403 on admin-only endpoint", async () => {
  23 |     const member = `member-${uniqueTag()}@cel.gob.sv`;
  24 |     const api = await apiAs(member);
  25 |     const res = await api.get("/api/admin/allowed-domains");
  26 |     expect(res.status()).toBe(403);
  27 |     const body = await res.json();
  28 |     expect(body.code).toBe("admin_only");
  29 |     await api.dispose();
  30 |   });
  31 | 
  32 |   test("bypass requires explicit user-email header (no headers → 401)", async ({
  33 |     request,
  34 |   }) => {
  35 |     const res = await request.get("/api/me", {
  36 |       headers: { "x-e2e-admin": "1" },
  37 |     });
  38 |     expect(res.status()).toBe(401);
  39 |   });
  40 | 
  41 |   test("bypass without matching secret is rejected (forged-header regression)", async ({
  42 |     request,
  43 |   }) => {
  44 |     // An attacker who knows the bypass headers but NOT the on-disk shared
  45 |     // secret must be denied. Validates the per-request secret check that
  46 |     // protects shared dev deployments where the proxy makes requests look
  47 |     // loopback to the API.
  48 |     const res = await request.get("/api/me", {
  49 |       headers: {
  50 |         "x-e2e-user-email": ADMIN_EMAIL,
  51 |         "x-e2e-admin": "1",
  52 |         "x-e2e-secret": "definitely-not-the-real-secret-1234567890abcdef",
  53 |       },
  54 |     });
  55 |     expect(res.status()).toBe(401);
  56 |   });
  57 | 
  58 |   test("bypass without any secret header is rejected", async ({ request }) => {
  59 |     const res = await request.get("/api/me", {
  60 |       headers: {
  61 |         "x-e2e-user-email": ADMIN_EMAIL,
  62 |         "x-e2e-admin": "1",
  63 |       },
  64 |     });
  65 |     expect(res.status()).toBe(401);
  66 |   });
  67 | });
  68 | 
```