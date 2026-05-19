import { type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, userRolesTable } from "@workspace/db";

const PM_ROLE_IDS = new Set(["pm_lead", "pm_cel"]);

export async function requirePM(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db
      .select({ roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, req.userId));
    const isPM = rows.some((r) => PM_ROLE_IDS.has(r.roleId));
    if (!isPM) {
      res.status(403).json({
        error:
          "Solo los PM del piloto pueden modificar esta configuración.",
        code: "pm_only",
      });
      return;
    }
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to check PM role");
    res.status(500).json({ error: "Internal server error" });
  }
}
