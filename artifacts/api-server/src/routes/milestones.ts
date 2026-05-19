import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, milestonesTable } from "@workspace/db";
import {
  ListMilestonesResponse,
  ListMilestonesResponseItem,
  CreateMilestoneBody,
  UpdateMilestoneBody,
  UpdateMilestoneResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";

const router: IRouter = Router();

export function serialize(row: typeof milestonesTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    kind: row.kind,
    weekOffset: row.weekOffset,
    phaseId: row.phaseId ?? null,
    ownersRoles: row.ownersRoles ?? [],
    source: row.source,
    dateOverride: row.dateOverride ?? null,
    durationMinutes: row.durationMinutes ?? null,
    location: row.location ?? null,
    notes: row.notes ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/milestones", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(milestonesTable)
    .orderBy(asc(milestonesTable.weekOffset), asc(milestonesTable.createdAt));
  res.json(ListMilestonesResponse.parse(rows.map(serialize)));
});

router.post(
  "/milestones",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const parsed = CreateMilestoneBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    const [row] = await db
      .insert(milestonesTable)
      .values({
        title: data.title,
        description: data.description ?? null,
        kind: data.kind,
        weekOffset: data.weekOffset,
        phaseId: data.phaseId ?? null,
        ownersRoles: data.ownersRoles ?? [],
        dateOverride: data.dateOverride ?? null,
        durationMinutes: data.durationMinutes ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
        source: "manual",
        createdBy: req.userEmail ?? req.userId ?? null,
      })
      .returning();
    res.status(201).json(ListMilestonesResponseItem.parse(serialize(row!)));
  },
);

router.patch(
  "/milestones/:id",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0]! : idRaw;
    const parsed = UpdateMilestoneBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(milestonesTable)
      .where(eq(milestonesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Hito no encontrado" });
      return;
    }
    if (existing.source === "system") {
      res.status(403).json({
        error: "Los hitos del sistema no pueden modificarse.",
        code: "system_milestone",
      });
      return;
    }
    const data = parsed.data;
    const [row] = await db
      .update(milestonesTable)
      .set({
        title: data.title,
        description: data.description ?? null,
        kind: data.kind,
        weekOffset: data.weekOffset,
        phaseId: data.phaseId ?? null,
        ownersRoles: data.ownersRoles ?? [],
        dateOverride: data.dateOverride ?? null,
        durationMinutes: data.durationMinutes ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
      })
      .where(eq(milestonesTable.id, id))
      .returning();
    res.json(UpdateMilestoneResponse.parse(serialize(row!)));
  },
);

router.delete(
  "/milestones/:id",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0]! : idRaw;
    const [existing] = await db
      .select()
      .from(milestonesTable)
      .where(eq(milestonesTable.id, id))
      .limit(1);
    if (!existing) {
      res.sendStatus(204);
      return;
    }
    if (existing.source === "system") {
      res.status(403).json({
        error: "Los hitos del sistema no pueden eliminarse.",
        code: "system_milestone",
      });
      return;
    }
    await db.delete(milestonesTable).where(eq(milestonesTable.id, id));
    res.sendStatus(204);
  },
);

export default router;
