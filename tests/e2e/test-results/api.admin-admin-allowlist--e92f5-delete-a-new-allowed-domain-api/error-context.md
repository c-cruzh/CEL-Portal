# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.admin.spec.ts >> admin allowlist >> add → list → delete a new allowed domain
- Location: tests/api.admin.spec.ts:5:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 500
Received array: [200, 201]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { adminApi, uniqueTag } from "./helpers";
  3  | 
  4  | test.describe("admin allowlist", () => {
  5  |   test("add → list → delete a new allowed domain", async () => {
  6  |     const api = await adminApi();
  7  |     const tag = uniqueTag();
  8  |     const domain = `e2e-${tag}.local`;
  9  | 
  10 |     const addRes = await api.post("/api/admin/allowed-domains", {
  11 |       data: { domain, note: "added by e2e" },
  12 |     });
> 13 |     expect([200, 201]).toContain(addRes.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  14 | 
  15 |     const listRes = await api.get("/api/admin/allowed-domains");
  16 |     expect(listRes.ok()).toBeTruthy();
  17 |     const list = await listRes.json();
  18 |     expect(
  19 |       list.some((d: { domain: string }) => d.domain === domain),
  20 |     ).toBe(true);
  21 | 
  22 |     const delRes = await api.delete(
  23 |       `/api/admin/allowed-domains/${encodeURIComponent(domain)}`,
  24 |     );
  25 |     expect(delRes.status()).toBe(204);
  26 | 
  27 |     const after = await (await api.get("/api/admin/allowed-domains")).json();
  28 |     expect(
  29 |       after.some((d: { domain: string }) => d.domain === domain),
  30 |     ).toBe(false);
  31 | 
  32 |     await api.dispose();
  33 |   });
  34 | 
  35 |   test("invalid domain shape is rejected with structured error", async () => {
  36 |     const api = await adminApi();
  37 |     const res = await api.post("/api/admin/allowed-domains", {
  38 |       data: { domain: "  @notadomain  " },
  39 |     });
  40 |     expect(res.status()).toBe(400);
  41 |     await api.dispose();
  42 |   });
  43 | });
  44 | 
  45 | test.describe("admin notification recipients", () => {
  46 |   test("add → list → test → delete a recipient", async () => {
  47 |     const api = await adminApi();
  48 |     const tag = uniqueTag();
  49 |     const email = `e2e-${tag}@example.com`;
  50 | 
  51 |     const addRes = await api.post("/api/admin/notification-recipients", {
  52 |       data: { email },
  53 |     });
  54 |     expect([200, 201]).toContain(addRes.status());
  55 | 
  56 |     const list = await (
  57 |       await api.get("/api/admin/notification-recipients")
  58 |     ).json();
  59 |     expect(list.some((r: { email: string }) => r.email === email)).toBe(true);
  60 | 
  61 |     const testRes = await api.post(
  62 |       "/api/admin/notification-recipients/test",
  63 |       { data: {} },
  64 |     );
  65 |     expect(testRes.ok()).toBeTruthy();
  66 |     const testBody = await testRes.json();
  67 |     expect(["sent", "no_provider", "no_recipients"]).toContain(testBody.status);
  68 | 
  69 |     const logRes = await api.get("/api/admin/notification-log");
  70 |     expect(logRes.ok()).toBeTruthy();
  71 |     const log = await logRes.json();
  72 |     expect(Array.isArray(log)).toBe(true);
  73 | 
  74 |     const delRes = await api.delete(
  75 |       `/api/admin/notification-recipients/${encodeURIComponent(email)}`,
  76 |     );
  77 |     expect(delRes.status()).toBe(204);
  78 | 
  79 |     await api.dispose();
  80 |   });
  81 | });
  82 | 
```