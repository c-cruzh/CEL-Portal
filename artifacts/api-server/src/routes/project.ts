import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectConfigTable } from "@workspace/db";
import {
  GetProjectConfigResponse,
  UpdateProjectConfigBody,
  UpdateProjectConfigResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

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
  async (req, res): Promise<void> => {
    const parsed = UpdateProjectConfigBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await ensureConfig();
    const [updated] = await db
      .update(projectConfigTable)
      .set({
        startDate: parsed.data.startDate ?? null,
        updatedAt: new Date(),
      })
      .where(eq(projectConfigTable.id, 1))
      .returning();
    res.json(
      UpdateProjectConfigResponse.parse({
        startDate: updated!.startDate ?? null,
        updatedAt: updated!.updatedAt,
      }),
    );
  },
);

export default router;
