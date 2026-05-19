import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  rolesTable,
  userRolesTable,
  userCvsTable,
} from "@workspace/db";
import {
  ListTeamMembersResponse,
  ListAvailableRolesResponse,
  GetTeamSummaryResponse,
  AdminUpdateMemberBody,
  AdminUpdateMemberResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePM } from "../middlewares/requirePM";
import { notifyAsync } from "../lib/notifications";

const router: IRouter = Router();

router.get(
  "/team/members",
  requireAuth,
  async (_req, res): Promise<void> => {
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(asc(usersTable.createdAt));

    const roles = await db
      .select({
        userId: userRolesTable.userId,
        roleId: userRolesTable.roleId,
      })
      .from(userRolesTable);

    const cvs = await db.select().from(userCvsTable);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles) {
      const arr = rolesByUser.get(r.userId) ?? [];
      arr.push(r.roleId);
      rolesByUser.set(r.userId, arr);
    }
    const cvByUser = new Map(cvs.map((c) => [c.userId, c]));

    const members = users.map((u) => {
      const cv = cvByUser.get(u.id);
      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        roles: rolesByUser.get(u.id) ?? [],
        joinedAt: u.createdAt,
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
    });

    res.json(ListTeamMembersResponse.parse(members));
  },
);

router.get(
  "/team/roles",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(rolesTable)
      .orderBy(asc(rolesTable.sortOrder));
    res.json(
      ListAvailableRolesResponse.parse(
        rows.map((r) => ({
          id: r.id,
          label: r.label,
          description: r.description,
        })),
      ),
    );
  },
);

router.get(
  "/team/summary",
  requireAuth,
  async (_req, res): Promise<void> => {
    const users = await db.select().from(usersTable);
    const roles = await db
      .select()
      .from(rolesTable)
      .orderBy(asc(rolesTable.sortOrder));
    const assignments = await db
      .select({
        userId: userRolesTable.userId,
        roleId: userRolesTable.roleId,
      })
      .from(userRolesTable);
    const cvs = await db.select({ userId: userCvsTable.userId }).from(userCvsTable);

    const displayNameById = new Map(users.map((u) => [u.id, u.displayName]));
    const assigneesByRole = new Map<string, string[]>();
    for (const a of assignments) {
      const arr = assigneesByRole.get(a.roleId) ?? [];
      const name = displayNameById.get(a.userId);
      if (name) arr.push(name);
      assigneesByRole.set(a.roleId, arr);
    }

    const coverage = roles.map((r) => ({
      roleId: r.id,
      label: r.label,
      count: assigneesByRole.get(r.id)?.length ?? 0,
      assignees: assigneesByRole.get(r.id) ?? [],
    }));

    const rolesFilled = coverage.filter((c) => c.count > 0).length;

    res.json(
      GetTeamSummaryResponse.parse({
        memberCount: users.length,
        cvCount: cvs.length,
        rolesFilled,
        totalRoles: roles.length,
        coverage,
      }),
    );
  },
);

router.patch(
  "/team/members/:userId",
  requireAuth,
  requirePM,
  async (req, res): Promise<void> => {
    const parsed = AdminUpdateMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userIdRaw = req.params.userId;
    const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }

    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const previousRoleRows = await db
      .select({ roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId));
    const previousRoles = previousRoleRows.map((r) => r.roleId).sort();

    await db.transaction(async (tx) => {
      if (parsed.data.displayName !== undefined) {
        await tx
          .update(usersTable)
          .set({ displayName: parsed.data.displayName.trim() })
          .where(eq(usersTable.id, userId));
      }
      if (parsed.data.roles !== undefined) {
        const desired = Array.from(new Set(parsed.data.roles));
        await tx
          .delete(userRolesTable)
          .where(eq(userRolesTable.userId, userId));
        if (desired.length > 0) {
          await tx
            .insert(userRolesTable)
            .values(desired.map((roleId) => ({ userId, roleId })))
            .onConflictDoNothing();
        }
      }
    });

    if (parsed.data.roles !== undefined) {
      const newRoles = [...new Set(parsed.data.roles)].sort();
      const changed =
        previousRoles.length !== newRoles.length ||
        previousRoles.some((r, i) => r !== newRoles[i]);
      if (changed) {
        const [updated] = await db
          .select({
            id: usersTable.id,
            email: usersTable.email,
            displayName: usersTable.displayName,
          })
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);
        if (updated) {
          notifyAsync({
            kind: "roles_changed",
            actor: updated,
            previousRoles,
            newRoles,
          });
        }
      }
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const roleRows = await db
      .select({ roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId));
    const [cv] = await db
      .select()
      .from(userCvsTable)
      .where(eq(userCvsTable.userId, userId))
      .limit(1);

    res.json(
      AdminUpdateMemberResponse.parse({
        id: user!.id,
        email: user!.email,
        displayName: user!.displayName,
        roles: roleRows.map((r) => r.roleId),
        joinedAt: user!.createdAt,
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
      }),
    );
  },
);

export default router;
