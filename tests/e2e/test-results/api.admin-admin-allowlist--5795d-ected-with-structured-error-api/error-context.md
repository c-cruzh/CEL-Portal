# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.admin.spec.ts >> admin allowlist >> invalid domain shape is rejected with structured error
- Location: tests/api.admin.spec.ts:35:3

# Error details

```
Error: E2E bypass secret not found at /tmp/portal-cel-e2e-bypass-secret. The api-server must be running with E2E_TEST_MODE=1 in dev so it provisions the shared secret before tests run. Underlying error: ENOENT: no such file or directory, open '/tmp/portal-cel-e2e-bypass-secret'
```

# Test source

```ts
  1  | import fs from "node:fs";
  2  | import os from "node:os";
  3  | import path from "node:path";
  4  | import { request, type APIRequestContext } from "@playwright/test";
  5  | 
  6  | export const API_BASE_URL =
  7  |   process.env.E2E_API_URL ?? "http://localhost:8080";
  8  | 
  9  | export const ADMIN_EMAIL = "camila@c2labs.ai";
  10 | 
  11 | const SECRET_FILE = path.join(os.tmpdir(), "portal-cel-e2e-bypass-secret");
  12 | 
  13 | let cachedSecret: string | null = null;
  14 | export function getBypassSecret(): string {
  15 |   if (cachedSecret) return cachedSecret;
  16 |   try {
  17 |     cachedSecret = fs.readFileSync(SECRET_FILE, "utf8").trim();
  18 |   } catch (err) {
> 19 |     throw new Error(
     |           ^ Error: E2E bypass secret not found at /tmp/portal-cel-e2e-bypass-secret. The api-server must be running with E2E_TEST_MODE=1 in dev so it provisions the shared secret before tests run. Underlying error: ENOENT: no such file or directory, open '/tmp/portal-cel-e2e-bypass-secret'
  20 |       `E2E bypass secret not found at ${SECRET_FILE}. The api-server ` +
  21 |         `must be running with E2E_TEST_MODE=1 in dev so it provisions the ` +
  22 |         `shared secret before tests run. Underlying error: ${(err as Error).message}`,
  23 |     );
  24 |   }
  25 |   if (!cachedSecret || cachedSecret.length < 32) {
  26 |     throw new Error("E2E bypass secret file is empty or malformed.");
  27 |   }
  28 |   return cachedSecret;
  29 | }
  30 | 
  31 | export async function apiAs(
  32 |   email: string,
  33 |   opts: { admin?: boolean; roles?: string[]; includeSecret?: boolean } = {},
  34 | ): Promise<APIRequestContext> {
  35 |   const headers: Record<string, string> = {
  36 |     "x-e2e-user-email": email,
  37 |     "x-e2e-user-name": email.split("@")[0],
  38 |   };
  39 |   if (opts.includeSecret !== false) {
  40 |     headers["x-e2e-secret"] = getBypassSecret();
  41 |   }
  42 |   if (opts.admin) headers["x-e2e-admin"] = "1";
  43 |   if (opts.roles && opts.roles.length > 0) {
  44 |     headers["x-e2e-user-roles"] = opts.roles.join(",");
  45 |   }
  46 |   return request.newContext({
  47 |     baseURL: API_BASE_URL,
  48 |     extraHTTPHeaders: headers,
  49 |   });
  50 | }
  51 | 
  52 | export async function adminApi(): Promise<APIRequestContext> {
  53 |   return apiAs(ADMIN_EMAIL, { admin: true });
  54 | }
  55 | 
  56 | export function uniqueTag(): string {
  57 |   return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  58 | }
  59 | 
```