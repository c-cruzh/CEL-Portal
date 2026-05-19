import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  userRolesTable,
  userCvsTable,
} from "@workspace/db";
import {
  GetMeResponse,
  UpdateMyDisplayNameBody,
  UpdateMyDisplayNameResponse,
  SetMyRolesBody,
  SetMyRolesResponse,
  GetMyRolesResponse,
  SetMyCvBody,
  SetMyCvResponse,
  GetMyCvResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function buildMe(userId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;

  const roles = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId));

  const [cv] = await db
    .select()
    .from(userCvsTable)
    .where(eq(userCvsTable.userId, userId))
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: roles.map((r) => r.roleId),
    joinedAt: user.createdAt,
    hasCv: !!cv,
    cv: cv
      ? {
          fileName: cv.fileName,
          contentType: cv.contentType,
          objectPath: cv.objectPath,
          sizeBytes: cv.sizeBytes,
          uploadedAt: cv.uploadedAt,
        }
      : null,
  };
}

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const me = await buildMe(req.userId!);
  if (!me) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse(me));
});

router.patch(
  "/me/display-name",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = UpdateMyDisplayNameBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await db
      .update(usersTable)
      .set({ displayName: parsed.data.displayName.trim() })
      .where(eq(usersTable.id, req.userId!));

    const me = await buildMe(req.userId!);
    res.json(UpdateMyDisplayNameResponse.parse(me));
  },
);

router.get("/me/roles", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, req.userId!));
  res.json(GetMyRolesResponse.parse(rows.map((r) => r.roleId)));
});

router.put("/me/roles", requireAuth, async (req, res): Promise<void> => {
  const parsed = SetMyRolesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const desired = Array.from(new Set(parsed.data.roles));

  await db.transaction(async (tx) => {
    await tx
      .delete(userRolesTable)
      .where(eq(userRolesTable.userId, req.userId!));
    if (desired.length > 0) {
      await tx
        .insert(userRolesTable)
        .values(desired.map((roleId) => ({ userId: req.userId!, roleId })))
        .onConflictDoNothing();
    }
  });

  res.json(SetMyRolesResponse.parse(desired));
});

router.get("/me/cv", requireAuth, async (req, res): Promise<void> => {
  const [cv] = await db
    .select()
    .from(userCvsTable)
    .where(eq(userCvsTable.userId, req.userId!))
    .limit(1);
  if (!cv) {
    res.status(404).json({ error: "No CV uploaded" });
    return;
  }
  res.json(
    GetMyCvResponse.parse({
      fileName: cv.fileName,
      contentType: cv.contentType,
      objectPath: cv.objectPath,
      sizeBytes: cv.sizeBytes,
      uploadedAt: cv.uploadedAt,
    }),
  );
});

router.put("/me/cv", requireAuth, async (req, res): Promise<void> => {
  const parsed = SetMyCvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fileName, contentType, objectPath, sizeBytes } = parsed.data;

  await db
    .insert(userCvsTable)
    .values({
      userId: req.userId!,
      fileName,
      contentType,
      objectPath,
      sizeBytes,
      uploadedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userCvsTable.userId,
      set: {
        fileName,
        contentType,
        objectPath,
        sizeBytes,
        uploadedAt: new Date(),
      },
    });

  const [cv] = await db
    .select()
    .from(userCvsTable)
    .where(eq(userCvsTable.userId, req.userId!))
    .limit(1);

  res.json(
    SetMyCvResponse.parse({
      fileName: cv!.fileName,
      contentType: cv!.contentType,
      objectPath: cv!.objectPath,
      sizeBytes: cv!.sizeBytes,
      uploadedAt: cv!.uploadedAt,
    }),
  );
});

router.delete("/me/cv", requireAuth, async (req, res): Promise<void> => {
  await db.delete(userCvsTable).where(eq(userCvsTable.userId, req.userId!));
  res.sendStatus(204);
});

export default router;
