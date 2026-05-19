import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, userRolesTable } from "@workspace/db";
import { notifyAsync } from "../lib/notifications";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

const DEFAULT_ALLOWED_DOMAINS = ["cel.gob.sv", "c2labs.ai"];

const AUTO_PM_EMAILS = new Set<string>([
  "camila@c2labs.ai",
  "kevin@c2labs.ai",
]);

function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!raw || raw.trim() === "") return DEFAULT_ALLOWED_DOMAINS;
  if (raw.trim() === "*") return [];
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter((d) => d.length > 0);
}

function isEmailAllowed(email: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

function domainRejectionMessage(allowedDomains: string[]): string {
  if (allowedDomains.length === 0) {
    return "El registro está restringido. Contacta al administrador.";
  }
  const list = allowedDomains.map((d) => `@${d}`).join(", ");
  return `Solo se permiten cuentas con correo institucional (${list}). Solicita acceso al administrador del portal.`;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const sessionClaims = auth?.sessionClaims as
    | { userId?: string; email?: string }
    | undefined;
  const clerkUserId = sessionClaims?.userId || auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const allowedDomains = getAllowedDomains();

  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, clerkUserId))
      .limit(1);

    let email = existing?.email;
    let displayName = existing?.displayName;

    if (!existing) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

      if (!primaryEmail) {
        res.status(400).json({ error: "User has no email" });
        return;
      }

      if (!isEmailAllowed(primaryEmail, allowedDomains)) {
        // Remove the just-created Clerk user so no orphan account remains
        // and so the visitor can try again with an allowed email.
        try {
          await clerkClient.users.deleteUser(clerkUserId);
        } catch (deleteErr) {
          req.log.warn(
            { err: deleteErr, clerkUserId },
            "Failed to delete Clerk user after domain rejection",
          );
        }
        res.status(403).json({
          error: domainRejectionMessage(allowedDomains),
          code: "email_domain_not_allowed",
          allowedDomains,
        });
        return;
      }

      email = primaryEmail;
      displayName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        primaryEmail.split("@")[0];

      const inserted = await db
        .insert(usersTable)
        .values({ id: clerkUserId, email, displayName })
        .onConflictDoNothing()
        .returning({ id: usersTable.id });

      if (inserted.length > 0) {
        // Auto-asignar rol pm_lead a los líderes conocidos de C2Labs
        // (Camila y Kevin) en su primer login. Idempotente.
        if (AUTO_PM_EMAILS.has(email!.toLowerCase())) {
          await db
            .insert(userRolesTable)
            .values({ userId: clerkUserId, roleId: "pm_lead" })
            .onConflictDoNothing();
        }

        notifyAsync({
          kind: "member_joined",
          actor: {
            id: clerkUserId,
            email: email!,
            displayName: displayName!,
          },
        });
      }
    } else if (email && !isEmailAllowed(email, allowedDomains)) {
      // Domain allowlist tightened after this user was provisioned: deny access.
      res.status(403).json({
        error: domainRejectionMessage(allowedDomains),
        code: "email_domain_not_allowed",
        allowedDomains,
      });
      return;
    }

    req.userId = clerkUserId;
    req.userEmail = email;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load/provision user");
    res.status(500).json({ error: "Internal server error" });
  }
}
