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
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

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

export default router;
