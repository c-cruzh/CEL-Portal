import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  paqueteFase0OverridesTable,
  usersTable,
  userRolesTable,
} from "@workspace/db";
import {
  ListPaqueteFase0OverridesResponseItem,
  UpsertPaqueteFase0OverrideBody,
  UpsertPaqueteFase0OverrideResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

const PM_ROLE_IDS = new Set(["project_lead", "pm_lead", "pm_cel"]);
const DOWNLOAD_TTL_SEC = 300;

const ALLOWED_ASSET_PREFIX = "paquete-fase0/";

async function isUserPM(userId: string): Promise<boolean> {
  const rows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));
  return rows.some((r) => PM_ROLE_IDS.has(r.roleId));
}

async function serializeOverride(
  row: typeof paqueteFase0OverridesTable.$inferSelect,
  replacedByName: string,
): Promise<ReturnType<typeof ListPaqueteFase0OverridesResponseItem.parse>> {
  const downloadUrl = await objectStorage.getObjectEntityDownloadURL(
    row.objectKey,
    { ttlSec: DOWNLOAD_TTL_SEC },
  );
  return ListPaqueteFase0OverridesResponseItem.parse({
    assetPath: row.assetPath,
    originalFilename: row.originalFilename,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    replacedBy: row.replacedBy,
    replacedByName,
    replacedAt: row.replacedAt,
    downloadUrl,
    downloadUrlExpiresAt: new Date(Date.now() + DOWNLOAD_TTL_SEC * 1000),
  });
}

router.get(
  "/paquete-fase0/overrides",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db.select().from(paqueteFase0OverridesTable);
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const ids = Array.from(new Set(rows.map((r) => r.replacedBy)));
    const users = await db
      .select({ id: usersTable.id, displayName: usersTable.displayName })
      .from(usersTable)
      .where(inArray(usersTable.id, ids));
    const nameById = new Map(users.map((u) => [u.id, u.displayName]));
    const out = await Promise.all(
      rows.map((r) =>
        serializeOverride(r, nameById.get(r.replacedBy) ?? r.replacedBy),
      ),
    );
    res.json(out);
  },
);

router.put(
  "/paquete-fase0/overrides",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = (req as { userId?: string }).userId;
    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!(await isUserPM(userId))) {
      res.status(403).json({
        error: "Solo el PM puede reemplazar documentos del Paquete Fase 0.",
      });
      return;
    }
    const parsed = UpsertPaqueteFase0OverrideBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { assetPath, objectPath, contentType, fileName, sizeBytes } =
      parsed.data;

    if (!assetPath.startsWith(ALLOWED_ASSET_PREFIX) || assetPath.includes("..")) {
      res.status(400).json({
        error: `assetPath inválido: debe comenzar con "${ALLOWED_ASSET_PREFIX}".`,
      });
      return;
    }
    if (!/^\/objects\/uploads\/[A-Za-z0-9_-]+$/.test(objectPath)) {
      res.status(400).json({
        error: "objectPath inválido: debe provenir del flujo de subida.",
      });
      return;
    }
    try {
      await objectStorage.getObjectEntityFile(objectPath);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res
          .status(400)
          .json({ error: "El archivo subido no se encontró en el almacenamiento." });
        return;
      }
      throw err;
    }

    const [row] = await db
      .insert(paqueteFase0OverridesTable)
      .values({
        assetPath,
        objectKey: objectPath,
        contentType,
        originalFilename: fileName,
        sizeBytes,
        replacedBy: userId,
      })
      .onConflictDoUpdate({
        target: paqueteFase0OverridesTable.assetPath,
        set: {
          objectKey: objectPath,
          contentType,
          originalFilename: fileName,
          sizeBytes,
          replacedBy: userId,
          replacedAt: new Date(),
        },
      })
      .returning();

    const [uploader] = await db
      .select({ displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const serialized = await serializeOverride(
      row!,
      uploader?.displayName ?? userId,
    );
    res.json(UpsertPaqueteFase0OverrideResponse.parse(serialized));
  },
);

router.delete(
  "/paquete-fase0/overrides/by-asset",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = (req as { userId?: string }).userId;
    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!(await isUserPM(userId))) {
      res.status(403).json({
        error: "Solo el PM puede revertir documentos del Paquete Fase 0.",
      });
      return;
    }
    const rawAsset = req.query.assetPath;
    const assetPath = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
    if (typeof assetPath !== "string" || !assetPath) {
      res.status(400).json({ error: "assetPath es obligatorio." });
      return;
    }
    if (!assetPath.startsWith(ALLOWED_ASSET_PREFIX) || assetPath.includes("..")) {
      res.status(400).json({
        error: `assetPath inválido: debe comenzar con "${ALLOWED_ASSET_PREFIX}".`,
      });
      return;
    }
    const deleted = await db
      .delete(paqueteFase0OverridesTable)
      .where(eq(paqueteFase0OverridesTable.assetPath, assetPath))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "No existe un reemplazo para ese asset." });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
