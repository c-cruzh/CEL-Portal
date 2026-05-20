import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListPendingUsersResponse,
  ApproveUserResponse,
  RejectUserResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { logAdminAction } from "../lib/audit";
import { notifyAsync } from "../lib/notifications";

const router: IRouter = Router();

function serializePending(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    status: u.status,
    createdAt: u.createdAt,
    statusChangedAt: u.statusChangedAt,
    statusChangedBy: u.statusChangedBy ?? null,
  };
}

router.get(
  "/admin/users/pending",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.status, "pending"))
      .orderBy(asc(usersTable.createdAt));
    res.json(ListPendingUsersResponse.parse(rows.map(serializePending)));
  },
);

router.post(
  "/admin/users/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    if (target.status === "active") {
      res.json(ApproveUserResponse.parse(serializePending(target)));
      return;
    }
    const actorLabel = req.userEmail ?? req.userId ?? "admin";
    const [updated] = await db
      .update(usersTable)
      .set({
        status: "active",
        statusChangedAt: new Date(),
        statusChangedBy: actorLabel,
      })
      .where(eq(usersTable.id, id))
      .returning();

    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "user.approve",
      targetType: "user",
      targetId: id,
      payload: {
        email: target.email,
        previousStatus: target.status,
      },
    });

    // Now that the user is part of the team, announce them through the
    // standard "member joined" notification stream.
    notifyAsync({
      kind: "member_joined",
      actor: {
        id: updated!.id,
        email: updated!.email,
        displayName: updated!.displayName,
      },
    });

    res.json(ApproveUserResponse.parse(serializePending(updated!)));
  },
);

router.post(
  "/admin/users/:id/reject",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    if (!id) {
      res.status(400).json({ error: "id requerido" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    if (target.status === "active") {
      res.status(409).json({
        error:
          "No se puede rechazar a un miembro que ya fue aprobado. Edita su acceso desde Miembros.",
        code: "user_already_active",
      });
      return;
    }
    const actorLabel = req.userEmail ?? req.userId ?? "admin";
    const [updated] = await db
      .update(usersTable)
      .set({
        status: "rejected",
        statusChangedAt: new Date(),
        statusChangedBy: actorLabel,
      })
      .where(eq(usersTable.id, id))
      .returning();

    await logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "user.reject",
      targetType: "user",
      targetId: id,
      payload: {
        email: target.email,
        previousStatus: target.status,
      },
    });

    res.json(RejectUserResponse.parse(serializePending(updated!)));
  },
);

export default router;
