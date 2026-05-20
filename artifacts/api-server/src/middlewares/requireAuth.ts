import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, userRolesTable, invitationsTable } from "@workspace/db";
import { notifyAsync } from "../lib/notifications";
import { logAdminActionAsync } from "../lib/audit";
import {
  getAllowedDomains,
  isEmailAllowed,
  domainRejectionMessage,
} from "../lib/allowedDomains";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

const AUTO_PM_EMAILS = new Set<string>([
  "camila@c2labs.ai",
  "kevin@c2labs.ai",
]);

// Multi-role bootstrap for known C2Labs leads. Camila wears multiple hats on
// this pilot; Kevin is currently PM-only. Idempotent — applied on first login.
const AUTO_MULTI_ROLES: Record<string, string[]> = {
  "camila@c2labs.ai": ["pm_lead", "ml_engineer", "data_engineer"],
  "kevin@c2labs.ai": ["pm_lead"],
};

// Throttle "last activity" writes per user to once per minute to avoid
// hammering the database with one UPDATE per authenticated request.
const LAST_ACTIVITY_TTL_MS = 60_000;
const lastActivityCache = new Map<string, number>();
async function touchLastActivity(userId: string): Promise<void> {
  const now = Date.now();
  const last = lastActivityCache.get(userId);
  if (last && now - last < LAST_ACTIVITY_TTL_MS) return;
  lastActivityCache.set(userId, now);
  try {
    await db
      .update(usersTable)
      .set({ lastActivityAt: new Date(now) })
      .where(eq(usersTable.id, userId));
  } catch {
    lastActivityCache.delete(userId);
  }
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

  const allowedDomains = await getAllowedDomains();

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
        const emailLower = email!.toLowerCase();
        // Auto-asignar roles conocidos para los líderes de C2Labs
        // (Camila y Kevin) en su primer login. Idempotente.
        const bootstrapRoles = AUTO_MULTI_ROLES[emailLower];
        if (bootstrapRoles && bootstrapRoles.length > 0) {
          for (const roleId of bootstrapRoles) {
            await db
              .insert(userRolesTable)
              .values({ userId: clerkUserId, roleId })
              .onConflictDoNothing();
          }
        } else if (AUTO_PM_EMAILS.has(emailLower)) {
          await db
            .insert(userRolesTable)
            .values({ userId: clerkUserId, roleId: "pm_lead" })
            .onConflictDoNothing();
        }

        // Auto-accept a pending invitation for this email, if any, and apply
        // the suggested roles so the new member arrives pre-configured.
        const [pendingInv] = await db
          .select()
          .from(invitationsTable)
          .where(eq(invitationsTable.email, emailLower))
          .limit(1);
        if (pendingInv && pendingInv.status === "pending") {
          const now = new Date();
          const isExpired =
            pendingInv.expiresAt !== null &&
            pendingInv.expiresAt.getTime() < now.getTime();
          if (isExpired) {
            await db
              .update(invitationsTable)
              .set({ status: "expired" })
              .where(eq(invitationsTable.id, pendingInv.id));
            logAdminActionAsync({
              actorId: clerkUserId,
              actorEmail: emailLower,
              action: "invitation.expired",
              targetType: "invitation",
              targetId: pendingInv.id,
              payload: {
                email: emailLower,
                expiresAt: pendingInv.expiresAt,
              },
            });
          } else {
            await db
              .update(invitationsTable)
              .set({
                status: "accepted",
                acceptedAt: now,
                acceptedUserId: clerkUserId,
              })
              .where(eq(invitationsTable.id, pendingInv.id));
            for (const roleId of pendingInv.suggestedRoles ?? []) {
              await db
                .insert(userRolesTable)
                .values({ userId: clerkUserId, roleId })
                .onConflictDoNothing();
            }
            logAdminActionAsync({
              actorId: clerkUserId,
              actorEmail: emailLower,
              action: "invitation.accepted",
              targetType: "invitation",
              targetId: pendingInv.id,
              payload: {
                email: emailLower,
                suggestedRoles: pendingInv.suggestedRoles ?? [],
              },
            });
          }
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
    void touchLastActivity(clerkUserId);
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load/provision user");
    res.status(500).json({ error: "Internal server error" });
  }
}
