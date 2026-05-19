import { type Request, type Response, type NextFunction } from "express";
import { requirePM } from "./requirePM";

// Hard-coded admin principals for the pilot (task #40). Only these two
// people can reach the /api/admin/* surface, regardless of which roles
// they hold. This is intentionally an email allowlist (not a role check)
// so the admin surface cannot be widened by granting `pm_lead` to a
// third user.
const ADMIN_EMAILS = new Set<string>([
  "camila@c2labs.ai",
  "kevin@c2labs.ai",
]);

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void | Promise<void> {
  const email = (req.userEmail ?? "").trim().toLowerCase();
  if (!email || !ADMIN_EMAILS.has(email)) {
    res.status(403).json({
      error:
        "El Portal de Administración está restringido a los PM del piloto (Camila y Kevin).",
      code: "admin_only",
    });
    return;
  }
  // We still require the underlying PM role so audit logs and existing
  // PM-only routes share the same authorization story.
  return requirePM(req, res, next);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.trim().toLowerCase());
}
