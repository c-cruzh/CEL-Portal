import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  decisionsTable,
  usersTable,
  userRolesTable,
} from "@workspace/db";
import {
  CreateDecisionBody,
  UpdateDecisionBody,
  ResolveDecisionBody,
  ReopenDecisionBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { notifyAsync, notifyDecisionAssignedAsync } from "../lib/notifications";

const router: IRouter = Router();

const PM_ROLE_IDS = new Set(["pm_lead", "pm_cel"]);

async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));
  return rows.map((r) => r.roleId);
}

function serialize(row: typeof decisionsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    context: row.context ?? "",
    optionsConsidered: row.optionsConsidered ?? "",
    phase: row.phase ?? null,
    ownerUserId: row.ownerUserId ?? null,
    ownerRole: row.ownerRole ?? null,
    requestedAt: row.requestedAt,
    dueDate: row.dueDate ?? null,
    status: row.status,
    resolution: row.resolution ?? null,
    resolvedAt: row.resolvedAt ?? null,
    resolvedBy: row.resolvedBy ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadActor(userId: string) {
  const [actor] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return actor ?? null;
}

router.get("/decisions", requireAuth, async (req, res): Promise<void> => {
  const conds = [];
  const status = typeof req.query.status === "string" ? req.query.status : null;
  const ownerUserId =
    typeof req.query.ownerUserId === "string" ? req.query.ownerUserId : null;
  const ownerRole =
    typeof req.query.ownerRole === "string" ? req.query.ownerRole : null;
  const phase = typeof req.query.phase === "string" ? req.query.phase : null;
  if (status) conds.push(eq(decisionsTable.status, status));
  if (ownerUserId) conds.push(eq(decisionsTable.ownerUserId, ownerUserId));
  if (ownerRole) conds.push(eq(decisionsTable.ownerRole, ownerRole));
  if (phase) conds.push(eq(decisionsTable.phase, phase));

  const rows = await db
    .select()
    .from(decisionsTable)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(decisionsTable.createdAt));

  res.json(rows.map(serialize));
});

router.post("/decisions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [inserted] = await db
    .insert(decisionsTable)
    .values({
      title: d.title.trim(),
      context: d.context ?? "",
      optionsConsidered: d.optionsConsidered ?? "",
      phase: d.phase ?? null,
      ownerUserId: d.ownerUserId ?? null,
      ownerRole: d.ownerRole ?? null,
      dueDate: d.dueDate ? d.dueDate.toISOString().slice(0, 10) : null,
      status: "open",
      createdBy: req.userId!,
    })
    .returning();

  const actor = await loadActor(req.userId!);
  if (actor && inserted) {
    let ownerLabel: string | null = inserted.ownerRole ?? null;
    if (inserted.ownerUserId) {
      const [owner] = await db
        .select({
          email: usersTable.email,
          displayName: usersTable.displayName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, inserted.ownerUserId))
        .limit(1);
      if (owner) ownerLabel = `${owner.displayName} <${owner.email}>`;
    }
    notifyAsync({
      kind: "decision_created",
      actor,
      title: inserted.title,
      ownerLabel,
      dueDate: inserted.dueDate ?? null,
    });

    if (inserted.ownerUserId) {
      notifyDecisionAssignedAsync({
        ownerUserId: inserted.ownerUserId,
        actor,
        title: inserted.title,
        decisionId: inserted.id,
        dueDate: inserted.dueDate ?? null,
        isReassignment: false,
        previousOwnerLabel: null,
      });
    }
  }

  res.status(201).json(serialize(inserted!));
});

function getIdParam(raw: unknown): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" ? v : "";
}

router.get("/decisions/:id", requireAuth, async (req, res): Promise<void> => {
  const id = getIdParam(req.params.id);
  const [row] = await db
    .select()
    .from(decisionsTable)
    .where(eq(decisionsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  res.json(serialize(row));
});

router.patch("/decisions/:id", requireAuth, async (req, res): Promise<void> => {
  const id = getIdParam(req.params.id);
  const parsed = UpdateDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(decisionsTable)
    .where(eq(decisionsTable.id, id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  if (existing.status === "resolved") {
    res.status(400).json({
      error:
        "Esta decisión ya está resuelta. Reabre o crea una nueva en su lugar.",
    });
    return;
  }

  const u = parsed.data;
  const patch: Partial<typeof decisionsTable.$inferInsert> = {};
  if (u.title !== undefined) patch.title = u.title.trim();
  if (u.context !== undefined) patch.context = u.context;
  if (u.optionsConsidered !== undefined)
    patch.optionsConsidered = u.optionsConsidered;
  if (u.phase !== undefined) patch.phase = u.phase ?? null;
  if (u.ownerUserId !== undefined) patch.ownerUserId = u.ownerUserId ?? null;
  if (u.ownerRole !== undefined) patch.ownerRole = u.ownerRole ?? null;
  if (u.dueDate !== undefined) {
    patch.dueDate = u.dueDate
      ? u.dueDate.toISOString().slice(0, 10)
      : null;
  }
  if (u.status !== undefined) patch.status = u.status;

  const [updated] = await db
    .update(decisionsTable)
    .set(patch)
    .where(eq(decisionsTable.id, id))
    .returning();

  if (updated) {
    const actor = await loadActor(req.userId!);

    if (
      u.status !== undefined &&
      u.status !== existing.status &&
      actor
    ) {
      notifyAsync({
        kind: "decision_status_changed",
        actor,
        title: updated.title,
        previousStatus: existing.status,
        newStatus: updated.status,
      });
    }

    const ownerChanged =
      u.ownerUserId !== undefined &&
      (updated.ownerUserId ?? null) !== (existing.ownerUserId ?? null);
    if (ownerChanged && updated.ownerUserId) {
      let previousOwnerLabel: string | null = existing.ownerRole ?? null;
      if (existing.ownerUserId) {
        const [prev] = await db
          .select({
            email: usersTable.email,
            displayName: usersTable.displayName,
          })
          .from(usersTable)
          .where(eq(usersTable.id, existing.ownerUserId))
          .limit(1);
        if (prev) previousOwnerLabel = `${prev.displayName} <${prev.email}>`;
      }
      notifyDecisionAssignedAsync({
        ownerUserId: updated.ownerUserId,
        actor,
        title: updated.title,
        decisionId: updated.id,
        dueDate: updated.dueDate ?? null,
        isReassignment: existing.ownerUserId !== null,
        previousOwnerLabel,
      });
    }
  }

  res.json(serialize(updated!));
});

router.post(
  "/decisions/:id/resolve",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = getIdParam(req.params.id);
    const parsed = ResolveDecisionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Decision not found" });
      return;
    }

    const actorRoles = await getUserRoles(req.userId!);
    const actorIsOwner =
      existing.ownerUserId !== null && existing.ownerUserId === req.userId;
    const actorIsRoleOwner =
      existing.ownerRole !== null && actorRoles.includes(existing.ownerRole);
    const actorIsPM = actorRoles.some((r) => PM_ROLE_IDS.has(r));
    if (!actorIsOwner && !actorIsRoleOwner && !actorIsPM) {
      res.status(403).json({
        error:
          "Solo el dueño asignado o un PM puede marcar la decisión como resuelta.",
        code: "decision_resolve_forbidden",
      });
      return;
    }

    const now = new Date();
    const [updated] = await db
      .update(decisionsTable)
      .set({
        status: "resolved",
        resolution: parsed.data.resolution,
        resolvedAt: now,
        resolvedBy: req.userId!,
      })
      .where(eq(decisionsTable.id, id))
      .returning();

    const actor = await loadActor(req.userId!);
    if (actor && updated) {
      notifyAsync({
        kind: "decision_resolved",
        actor,
        title: updated.title,
        resolution: updated.resolution ?? "",
      });
    }

    res.json(serialize(updated!));
  },
);

router.post(
  "/decisions/:id/reopen",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = getIdParam(req.params.id);
    const parsed = ReopenDecisionBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Decision not found" });
      return;
    }
    if (existing.status !== "resolved" && existing.status !== "cancelled") {
      res.status(400).json({
        error: "Solo se pueden reabrir decisiones resueltas o canceladas.",
        code: "decision_reopen_invalid_state",
      });
      return;
    }

    const actorRoles = await getUserRoles(req.userId!);
    const actorIsOwner =
      existing.ownerUserId !== null && existing.ownerUserId === req.userId;
    const actorIsRoleOwner =
      existing.ownerRole !== null && actorRoles.includes(existing.ownerRole);
    const actorIsPM = actorRoles.some((r) => PM_ROLE_IDS.has(r));
    if (!actorIsOwner && !actorIsRoleOwner && !actorIsPM) {
      res.status(403).json({
        error:
          "Solo el dueño asignado o un PM puede reabrir la decisión.",
        code: "decision_reopen_forbidden",
      });
      return;
    }

    const newStatus = parsed.data.status ?? "open";
    const [updated] = await db
      .update(decisionsTable)
      .set({
        status: newStatus,
        resolution: null,
        resolvedAt: null,
        resolvedBy: null,
      })
      .where(eq(decisionsTable.id, id))
      .returning();

    const actor = await loadActor(req.userId!);
    if (actor && updated) {
      notifyAsync({
        kind: "decision_reopened",
        actor,
        title: updated.title,
        previousStatus: existing.status,
        newStatus: updated.status,
      });
    }

    res.json(serialize(updated!));
  },
);

router.delete(
  "/decisions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = getIdParam(req.params.id);
    const [existing] = await db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Decision not found" });
      return;
    }
    const actorRoles = await getUserRoles(req.userId!);
    const actorIsPM = actorRoles.some((r) => PM_ROLE_IDS.has(r));
    const actorIsCreator = existing.createdBy === req.userId;
    if (!actorIsCreator && !actorIsPM) {
      res.status(403).json({
        error:
          "Solo quien creó la decisión o un PM puede eliminarla.",
        code: "decision_delete_forbidden",
      });
      return;
    }
    await db.delete(decisionsTable).where(eq(decisionsTable.id, id));
    res.status(204).end();
  },
);

export default router;
