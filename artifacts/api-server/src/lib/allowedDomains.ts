import { asc } from "drizzle-orm";
import { db, allowedEmailDomainsTable } from "@workspace/db";
import { logger } from "./logger";

// Historical defaults used as a hard fallback when the database is empty AND
// no override is provided via the ALLOWED_EMAIL_DOMAINS env var. The seed
// script also inserts these, so a healthy environment never relies on them.
const DEFAULT_ALLOWED_DOMAINS = ["cel.gob.sv", "c2labs.ai"];

// Short in-process cache so requireAuth doesn't hit the DB on every request.
// Admin mutations invalidate the cache via invalidateAllowedDomainsCache().
const CACHE_TTL_MS = 30_000;
let cachedDomains: string[] | null = null;
let cachedAt = 0;

function envOverride(): string[] | null {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!raw || raw.trim() === "") return null;
  if (raw.trim() === "*") return [];
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter((d) => d.length > 0);
}

export function invalidateAllowedDomainsCache(): void {
  cachedDomains = null;
  cachedAt = 0;
}

/**
 * Returns the effective list of allowed sign-up domains.
 *
 * Resolution order:
 *  1. `ALLOWED_EMAIL_DOMAINS` env var, if set (back-compat escape hatch and
 *     a way to force a wildcard via "*"). Returns [] for wildcard.
 *  2. The `allowed_email_domains` DB table (managed from the admin portal).
 *  3. The historical defaults (cel.gob.sv, c2labs.ai), if both the env var
 *     and the table are empty — keeps the portal usable if seeding failed.
 */
export async function getAllowedDomains(): Promise<string[]> {
  const override = envOverride();
  if (override !== null) return override;

  const now = Date.now();
  if (cachedDomains && now - cachedAt < CACHE_TTL_MS) {
    return cachedDomains;
  }

  try {
    const rows = await db
      .select({ domain: allowedEmailDomainsTable.domain })
      .from(allowedEmailDomainsTable)
      .orderBy(asc(allowedEmailDomainsTable.domain));
    const fromDb = rows
      .map((r) => r.domain.trim().toLowerCase())
      .filter((d) => d.length > 0);
    const effective = fromDb.length > 0 ? fromDb : DEFAULT_ALLOWED_DOMAINS;
    cachedDomains = effective;
    cachedAt = now;
    return effective;
  } catch (err) {
    logger.error(
      { err },
      "Failed to load allowed_email_domains from DB; using historical defaults",
    );
    return DEFAULT_ALLOWED_DOMAINS;
  }
}

export function isEmailAllowed(
  email: string,
  allowedDomains: string[],
): boolean {
  if (allowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

export function domainRejectionMessage(allowedDomains: string[]): string {
  if (allowedDomains.length === 0) {
    return "El registro está restringido. Contacta al administrador.";
  }
  const list = allowedDomains.map((d) => `@${d}`).join(", ");
  return `Solo se permiten cuentas con correo institucional (${list}). Solicita acceso al administrador del portal.`;
}

// Basic domain syntax validation. Accepts standard DNS labels separated by
// dots, length 1..253, no spaces, no leading/trailing dot, no protocol.
const DOMAIN_REGEX =
  /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeDomainInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/^@/, "");
  if (!trimmed) return null;
  if (!DOMAIN_REGEX.test(trimmed)) return null;
  return trimmed;
}
