import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  invitationsTable,
  adminAuditLogTable,
  rolesTable,
  userRolesTable,
  usersTable,
} from "@workspace/db";
import {
  ListInvitationsResponse,
  ListInvitationsResponseItem as InvitationResponse,
  CreateInvitationBody,
  ListAdminAuditLogResponse,
  ListAdminRolesResponse,
  ListAdminRolesResponseItem as AdminRoleResponse,
  UpdateRoleBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { logAdminAction } from "../lib/audit";
import { sendInvitationEmail } from "../lib/notifications";

const router: IRouter = Router();

function serializeInvitation(inv: typeof invitationsTable.$inferSelect) {
  return {
    id: inv.id,
    email: inv.email,
    invitedBy: inv.invitedBy ?? null,
    suggestedRoles: inv.suggestedRoles ?? [],
    status: inv.status,
    expiresAt: inv.expiresAt ?? null,
    createdAt: inv.createdAt,
    acceptedAt: inv.acceptedAt ?? null,
    acceptedUserId: inv.acceptedUserId ?? null,
    revokedAt: inv.revokedAt ?? null,
    lastSentAt: inv.lastSentAt ?? null,
  };
}

function actorLabel(req: { userEmail?: string }): string {
  return req.userEmail ?? "PM";
}

function signupUrl(): string {
  return (
    process.env.PORTAL_SIGNUP_URL ??
    process.env.PORTAL_BASE_URL ??
    "https://portal.cel"
  );
}

router.get(
  "/admin/invitations",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(invitationsTable)
      .orderBy(desc(invitationsTable.createdAt));
    res.json(ListInvitationsResponse.parse(rows.map(serializeInvitation)));
  },
);

router.post(
  "/admin/invitations",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateInvitationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const suggestedRoles = Array.from(new Set(parsed.data.suggestedRoles ?? []));

    // If a user already exists, reject — they don't need an invitation.
    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existingUser) {
      res.status(409).json({
        error: "Ese correo ya tiene una cuenta en el portal.",
        code: "user_already_exists",
      });
      return;
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const invitedBy = actorLabel(req);

    const [existing] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.email, email))
      .limit(1);

    let invitation;
    if (existing) {
      // Reuse the same row; re-open if it was revoked/expired.
      const [updated] = await db
        .update(invitationsTable)
        .set({
          invitedBy,
          suggestedRoles,
          status: "pending",
          expiresAt,
          revokedAt: null,
          acceptedAt: null,
          acceptedUserId: null,
          lastSentAt: new Date(),
        })
        .where(eq(invitationsTable.id, existing.id))
        .returning();
      invitation = updated!;
    } else {
      const [inserted] = await db
        .insert(invitationsTable)
        .values({
          email,
          invitedBy,
          suggestedRoles,
          status: "pending",
          expiresAt,
          lastSentAt: new Date(),
        })
        .returning();
      invitation = inserted!;
    }

    const sendResult = await sendInvitationEmail({
      email,
      invitedByLabel: invitedBy,
      suggestedRoles,
      signupUrl: signupUrl(),
    });

    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "invitation.create",
      targetType: "invitation",
      targetId: invitation.id,
      payload: { email, suggestedRoles, sendResult },
    });

    res.status(201).json(
      InvitationResponse.parse(serializeInvitation(invitation)),
    );
  },
);

router.post(
  "/admin/invitations/:id/resend",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const [inv] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.id, id))
      .limit(1);
    if (!inv) {
      res.status(404).json({ error: "Invitación no encontrada" });
      return;
    }
    if (inv.status !== "pending") {
      res.status(400).json({
        error: "Solo las invitaciones pendientes pueden reenviarse.",
        code: "invitation_not_pending",
      });
      return;
    }
    const invitedBy = actorLabel(req);
    const sendResult = await sendInvitationEmail({
      email: inv.email,
      invitedByLabel: invitedBy,
      suggestedRoles: inv.suggestedRoles ?? [],
      signupUrl: signupUrl(),
    });
    const [updated] = await db
      .update(invitationsTable)
      .set({ lastSentAt: new Date() })
      .where(eq(invitationsTable.id, id))
      .returning();

    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "invitation.resend",
      targetType: "invitation",
      targetId: id,
      payload: { email: inv.email, sendResult },
    });

    res.json(InvitationResponse.parse(serializeInvitation(updated!)));
  },
);

router.delete(
  "/admin/invitations/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const [inv] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.id, id))
      .limit(1);
    if (!inv) {
      res.status(404).json({ error: "Invitación no encontrada" });
      return;
    }
    if (inv.status !== "pending") {
      res.status(409).json({
        error: `Solo se pueden revocar invitaciones pendientes (estado actual: ${inv.status}).`,
        code: "invitation_not_pending",
        status: inv.status,
      });
      return;
    }
    await db
      .update(invitationsTable)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(invitationsTable.id, id));
    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "invitation.revoke",
      targetType: "invitation",
      targetId: id,
      payload: { email: inv.email },
    });
    res.sendStatus(204);
  },
);

router.get(
  "/admin/audit-log",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const action =
      typeof req.query.action === "string" ? req.query.action : null;
    const actor =
      typeof req.query.actor === "string" ? req.query.actor : null;

    const conditions = [] as ReturnType<typeof eq>[];
    if (action) conditions.push(eq(adminAuditLogTable.action, action));
    if (actor) conditions.push(eq(adminAuditLogTable.actorEmail, actor));
    const whereExpr =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const baseQ = db
      .select()
      .from(adminAuditLogTable)
      .orderBy(desc(adminAuditLogTable.at))
      .limit(200);
    const rows = whereExpr ? await baseQ.where(whereExpr) : await baseQ;

    res.json(
      ListAdminAuditLogResponse.parse(
        rows.map((r) => ({
          id: r.id,
          at: r.at,
          actorId: r.actorId ?? null,
          actorEmail: r.actorEmail ?? null,
          action: r.action,
          targetType: r.targetType ?? null,
          targetId: r.targetId ?? null,
          payload: (r.payload ?? {}) as Record<string, unknown>,
        })),
      ),
    );
  },
);

router.patch(
  "/admin/roles/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const parsed = UpdateRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Rol no encontrado" });
      return;
    }
    const update: Partial<typeof rolesTable.$inferInsert> = {};
    if (parsed.data.description !== undefined)
      update.description = parsed.data.description;
    if (parsed.data.sortOrder !== undefined)
      update.sortOrder = parsed.data.sortOrder;
    if (parsed.data.label !== undefined) update.label = parsed.data.label;

    const [updated] = await db
      .update(rolesTable)
      .set(update)
      .where(eq(rolesTable.id, id))
      .returning();

    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "role.update",
      targetType: "role",
      targetId: id,
      payload: { before: existing, after: updated },
    });

    const memberCount = await db
      .select({ id: userRolesTable.userId })
      .from(userRolesTable)
      .where(eq(userRolesTable.roleId, id));
    res.json(
      AdminRoleResponse.parse({
        id: updated!.id,
        label: updated!.label,
        description: updated!.description,
        sortOrder: updated!.sortOrder,
        memberCount: memberCount.length,
      }),
    );
  },
);

// Lightweight roles catalog with assignment counts, useful for the admin UI.
router.get(
  "/admin/roles",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const roles = await db
      .select()
      .from(rolesTable)
      .orderBy(asc(rolesTable.sortOrder));
    const assignments = await db
      .select({ roleId: userRolesTable.roleId })
      .from(userRolesTable);
    const counts = new Map<string, number>();
    for (const a of assignments)
      counts.set(a.roleId, (counts.get(a.roleId) ?? 0) + 1);
    res.json(
      ListAdminRolesResponse.parse(
        roles.map((r) => ({
          id: r.id,
          label: r.label,
          description: r.description,
          sortOrder: r.sortOrder,
          memberCount: counts.get(r.id) ?? 0,
        })),
      ),
    );
  },
);

export default router;
