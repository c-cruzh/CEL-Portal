import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectConfigTable } from "@workspace/db";
import {
  GetProjectConfigResponse,
  UpdateProjectConfigBody,
  UpdateProjectConfigResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";
import { logAdminActionAsync } from "../lib/audit";
import { ensureSystemWeeklies } from "../lib/weeklies";

const router: IRouter = Router();

async function ensureConfig() {
  const [existing] = await db
    .select()
    .from(projectConfigTable)
    .where(eq(projectConfigTable.id, 1))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(projectConfigTable)
    .values({ id: 1, startDate: null })
    .returning();
  return created!;
}

router.get(
  "/project/config",
  requireAuth,
  async (_req, res): Promise<void> => {
    const cfg = await ensureConfig();
    res.json(
      GetProjectConfigResponse.parse({
        startDate: cfg.startDate ?? null,
        updatedAt: cfg.updatedAt,
      }),
    );
  },
);

router.patch(
  "/project/config",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const parsed = UpdateProjectConfigBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await ensureConfig();
    const startDateStr = parsed.data.startDate
      ? parsed.data.startDate.toISOString().slice(0, 10)
      : null;
    const [updated] = await db
      .update(projectConfigTable)
      .set({
        startDate: startDateStr,
      })
      .where(eq(projectConfigTable.id, 1))
      .returning();
    try {
      await ensureSystemWeeklies(startDateStr);
    } catch (err) {
      req.log.error({ err }, "Failed to regenerate system weeklies after T0 change");
      res.status(500).json({
        error:
          "T0 se guardó, pero no se pudieron regenerar las sesiones semanales. Reintenta o usa 'Regenerar semanales' desde el calendario.",
        code: "weeklies_regen_failed",
      });
      return;
    }
    logAdminActionAsync({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "project_config.update",
      targetType: "project_config",
      targetId: "1",
      payload: { startDate: startDateStr },
    });
    res.json(
      UpdateProjectConfigResponse.parse({
        startDate: updated!.startDate ?? null,
        updatedAt: updated!.updatedAt,
      }),
    );
  },
);

export default router;
