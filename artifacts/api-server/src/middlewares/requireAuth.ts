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
import { isE2EBypassRequest } from "../lib/e2eTestMode";

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

const APPROVAL_PENDING_MESSAGE =
  "Tu cuenta está en espera de aprobación por un administrador del portal. Te avisaremos por correo cuando puedas acceder.";

const APPROVAL_REJECTED_MESSAGE =
  "Un administrador del portal denegó tu solicitud de acceso. Si crees que es un error, contáctalo directamente.";

// Bootstrap emails that bypass manual approval — admin principals and the
// PM leads are auto-approved on first login so the portal is never locked
// out of itself.
const AUTO_APPROVED_EMAILS = new Set<string>([
  "camila@c2labs.ai",
  "kevin@c2labs.ai",
]);

// E2E test-mode bypass. Gated by the env var so it is impossible to enable
// in production. When ON, requests with `x-e2e-user-email` header skip Clerk
// entirely and resolve to a deterministic local user (created on first hit,
// updated thereafter). Used by the Playwright suite in `tests/e2e/`.
async function tryE2ETestModeAuth(
  req: Request,
): Promise<{ userId: string; email: string } | null> {
  if (!isE2EBypassRequest(req)) return null;
  const headerEmail = req.header("x-e2e-user-email");
  if (!headerEmail) return null;
  const email = headerEmail.trim().toLowerCase();
  if (!email) return null;
  const displayName = req.header("x-e2e-user-name") ?? email;
  // Reuse the existing row if this email already has a Clerk-provisioned
  // user (e.g. the admin emails seeded on first real login). Otherwise
  // synthesize a deterministic id so the test suite stays self-contained.
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  const userId = existing?.id ?? `e2e_${email.replace(/[^a-z0-9]/g, "_")}`;
  if (existing) {
    await db
      .update(usersTable)
      .set({ status: "active", displayName })
      .where(eq(usersTable.id, userId));
  } else {
    await db
      .insert(usersTable)
      .values({
        id: userId,
        email,
        displayName,
        status: "active",
        statusChangedBy: "e2e-test-mode",
      })
      .onConflictDoNothing();
  }
  const adminEmail = AUTO_APPROVED_EMAILS.has(email);
  const requestedRoles = (req.header("x-e2e-user-roles") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const rolesToAssign = adminEmail
    ? Array.from(
        new Set([...(AUTO_MULTI_ROLES[email] ?? ["pm_lead"]), ...requestedRoles]),
      )
    : requestedRoles;
  for (const roleId of rolesToAssign) {
    await db
      .insert(userRolesTable)
      .values({ userId, roleId })
      .onConflictDoNothing();
  }
  return { userId, email };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const testModeUser = await tryE2ETestModeAuth(req);
  if (testModeUser) {
    req.userId = testModeUser.userId;
    req.userEmail = testModeUser.email;
    void touchLastActivity(testModeUser.userId);
    next();
    return;
  }
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

      const emailLower = email!.toLowerCase();

      // Decide initial approval status. Admins / PM bootstrap leads are
      // auto-approved (otherwise the first PM can never get in). Anyone
      // with a pending, non-expired invitation is also auto-approved
      // because an admin already vouched for them. Everyone else lands
      // in `pending` and has to wait for an admin to approve them.
      const [pendingInvLookup] = await db
        .select()
        .from(invitationsTable)
        .where(eq(invitationsTable.email, emailLower))
        .limit(1);
      const now = new Date();
      const hasUsableInvitation =
        !!pendingInvLookup &&
        pendingInvLookup.status === "pending" &&
        (pendingInvLookup.expiresAt === null ||
          pendingInvLookup.expiresAt.getTime() >= now.getTime());
      const isAutoApproved = AUTO_APPROVED_EMAILS.has(emailLower);
      const initialStatus =
        isAutoApproved || hasUsableInvitation ? "active" : "pending";

      const inserted = await db
        .insert(usersTable)
        .values({
          id: clerkUserId,
          email,
          displayName,
          status: initialStatus,
          statusChangedBy: isAutoApproved
            ? "bootstrap"
            : hasUsableInvitation
              ? "invitation"
              : null,
        })
        .onConflictDoNothing()
        .returning({ id: usersTable.id });

      if (inserted.length > 0) {
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

        // If this sign-up was covered by an invitation, mark the invitation
        // accepted (or expired) and apply the suggested roles.
        if (pendingInvLookup && pendingInvLookup.status === "pending") {
          if (!hasUsableInvitation) {
            // The invitation existed but had already expired.
            await db
              .update(invitationsTable)
              .set({ status: "expired" })
              .where(eq(invitationsTable.id, pendingInvLookup.id));
            logAdminActionAsync({
              actorId: clerkUserId,
              actorEmail: emailLower,
              action: "invitation.expired",
              targetType: "invitation",
              targetId: pendingInvLookup.id,
              payload: {
                email: emailLower,
                expiresAt: pendingInvLookup.expiresAt,
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
              .where(eq(invitationsTable.id, pendingInvLookup.id));
            for (const roleId of pendingInvLookup.suggestedRoles ?? []) {
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
              targetId: pendingInvLookup.id,
              payload: {
                email: emailLower,
                suggestedRoles: pendingInvLookup.suggestedRoles ?? [],
              },
            });
          }
        }

        if (initialStatus === "active") {
          // The new member is immediately part of the team — fire the
          // normal "member joined" announcement.
          notifyAsync({
            kind: "member_joined",
            actor: {
              id: clerkUserId,
              email: email!,
              displayName: displayName!,
            },
          });
        } else {
          // Pending sign-up: leave an audit trail so admins can see who
          // is waiting and when they signed up.
          logAdminActionAsync({
            actorId: clerkUserId,
            actorEmail: emailLower,
            action: "user.signup_pending",
            targetType: "user",
            targetId: clerkUserId,
            payload: { email: emailLower, displayName },
          });
        }
      }

      if (initialStatus === "pending") {
        res.status(403).json({
          error: APPROVAL_PENDING_MESSAGE,
          code: "approval_pending",
        });
        return;
      }
    } else if (email && !isEmailAllowed(email, allowedDomains)) {
      // Domain allowlist tightened after this user was provisioned: deny access.
      res.status(403).json({
        error: domainRejectionMessage(allowedDomains),
        code: "email_domain_not_allowed",
        allowedDomains,
      });
      return;
    } else if (existing && existing.status === "pending") {
      // Defensive bootstrap: if this pending user is one of the hard-coded
      // admin/PM leads (e.g. they were provisioned before AUTO_APPROVED_EMAILS
      // existed, or production has its own DB), promote them to active on
      // the fly so the portal can never lock itself out of its own admins.
      const emailLower = (existing.email ?? "").toLowerCase();
      if (AUTO_APPROVED_EMAILS.has(emailLower)) {
        await db
          .update(usersTable)
          .set({
            status: "active",
            statusChangedAt: new Date(),
            statusChangedBy: "bootstrap",
          })
          .where(eq(usersTable.id, existing.id));
        req.log.info(
          { userId: existing.id, email: emailLower },
          "Auto-approved bootstrap admin from pending status",
        );
        // Fall through to the success path below.
      } else {
        res.status(403).json({
          error: APPROVAL_PENDING_MESSAGE,
          code: "approval_pending",
        });
        return;
      }
    } else if (existing && existing.status === "rejected") {
      res.status(403).json({
        error: APPROVAL_REJECTED_MESSAGE,
        code: "approval_rejected",
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
