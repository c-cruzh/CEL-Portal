import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
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
  UpdateMyNotificationPrefsBody,
  UpdateMyNotificationPrefsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { isAdminEmail } from "../middlewares/requireAdmin";
import { notifyAsync } from "../lib/notifications";

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
    emailNotificationsOptOut: user.emailNotificationsOptOut,
    isAdmin: isAdminEmail(user.email),
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

  const previousRows = await db
    .select({ roleId: userRolesTable.roleId })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, req.userId!));
  const previousRoles = previousRows.map((r) => r.roleId).sort();

  const PRIVILEGED_ROLES = new Set(["pm_lead", "pm_cel"]);
  const previousSet = new Set(previousRoles);
  const candidateAdds = desired.filter(
    (r) => PRIVILEGED_ROLES.has(r) && !previousSet.has(r),
  );
  if (candidateAdds.length > 0) {
    // Bootstrap: si todavía nadie en el sistema tiene un rol de PM, el primer
    // usuario que lo pida puede auto-asignárselo. Una vez asignado, vuelve a
    // estar protegido (solo otro PM puede otorgarlo).
    const existingPMs = await db
      .select({ userId: userRolesTable.userId, roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(inArray(userRolesTable.roleId, Array.from(PRIVILEGED_ROLES)));
    const rolesAlreadyHeldBySomeone = new Set(
      existingPMs.map((r) => r.roleId),
    );
    const illegallyAdded = candidateAdds.filter((r) =>
      rolesAlreadyHeldBySomeone.has(r),
    );
    if (illegallyAdded.length > 0) {
      res.status(403).json({
        error:
          "Los roles de PM no se pueden auto-asignar. Pide a un PM actual que te los otorgue.",
        code: "privileged_role_self_assignment",
        roles: illegallyAdded,
      });
      return;
    }
  }
  const newRoles = [...desired].sort();
  const changed =
    previousRoles.length !== newRoles.length ||
    previousRoles.some((r, i) => r !== newRoles[i]);

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

  if (changed) {
    const [actor] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);
    if (actor) {
      notifyAsync({
        kind: "roles_changed",
        actor,
        previousRoles,
        newRoles,
      });
    }
  }

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

  const [actor] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);
  if (actor) {
    notifyAsync({
      kind: "cv_uploaded",
      actor,
      fileName: cv!.fileName,
    });
  }

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

router.patch(
  "/me/notifications",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = UpdateMyNotificationPrefsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    await db
      .update(usersTable)
      .set({ emailNotificationsOptOut: parsed.data.emailNotificationsOptOut })
      .where(eq(usersTable.id, req.userId!));
    const me = await buildMe(req.userId!);
    res.json(UpdateMyNotificationPrefsResponse.parse(me));
  },
);

router.delete("/me/cv", requireAuth, async (req, res): Promise<void> => {
  await db.delete(userCvsTable).where(eq(userCvsTable.userId, req.userId!));
  res.sendStatus(204);
});

export default router;
