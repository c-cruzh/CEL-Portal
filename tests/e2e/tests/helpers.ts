import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { request, type APIRequestContext } from "@playwright/test";

export const API_BASE_URL =
  process.env.E2E_API_URL ?? "http://localhost:8080";

export const ADMIN_EMAIL = "camila@c2labs.ai";

const SECRET_FILE = path.join(os.tmpdir(), "portal-cel-e2e-bypass-secret");

let cachedSecret: string | null = null;
export function getBypassSecret(): string {
  if (cachedSecret) return cachedSecret;
  try {
    cachedSecret = fs.readFileSync(SECRET_FILE, "utf8").trim();
  } catch (err) {
    throw new Error(
      `E2E bypass secret not found at ${SECRET_FILE}. The api-server ` +
        `must be running with E2E_TEST_MODE=1 in dev so it provisions the ` +
        `shared secret before tests run. Underlying error: ${(err as Error).message}`,
    );
  }
  if (!cachedSecret || cachedSecret.length < 32) {
    throw new Error("E2E bypass secret file is empty or malformed.");
  }
  return cachedSecret;
}

export async function apiAs(
  email: string,
  opts: { admin?: boolean; roles?: string[]; includeSecret?: boolean } = {},
): Promise<APIRequestContext> {
  const headers: Record<string, string> = {
    "x-e2e-user-email": email,
    "x-e2e-user-name": email.split("@")[0],
  };
  if (opts.includeSecret !== false) {
    headers["x-e2e-secret"] = getBypassSecret();
  }
  if (opts.admin) headers["x-e2e-admin"] = "1";
  if (opts.roles && opts.roles.length > 0) {
    headers["x-e2e-user-roles"] = opts.roles.join(",");
  }
  return request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: headers,
  });
}

export async function adminApi(): Promise<APIRequestContext> {
  return apiAs(ADMIN_EMAIL, { admin: true });
}

export function uniqueTag(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
