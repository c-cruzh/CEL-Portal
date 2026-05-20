import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  rolesTable,
  userRolesTable,
  userCvsTable,
  GOVERNANCE_BY_ROLE,
} from "@workspace/db";
import {
  ListTeamMembersResponse,
  ListAvailableRolesResponse,
  GetTeamSummaryResponse,
  AdminUpdateMemberBody,
  AdminUpdateMemberResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { notifyAsync } from "../lib/notifications";
import { logAdminAction } from "../lib/audit";

const router: IRouter = Router();

// Basic phone validation: 6-30 chars, digits / spaces / + - ( ) only.
const PHONE_REGEX = /^[\d+()\-\s]{6,30}$/;

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
        orgPosition: u.orgPosition ?? null,
        phone: u.phone ?? null,
        roles: rolesByUser.get(u.id) ?? [],
        joinedAt: u.createdAt,
        lastActivityAt: u.lastActivityAt,
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

    const titularIds = Array.from(
      new Set(
        rows
          .map((r) => r.titularUserId)
          .filter((v): v is string => typeof v === "string" && v.length > 0),
      ),
    );
    const titularUsers = titularIds.length
      ? await db.select().from(usersTable)
      : [];
    const userById = new Map(
      titularUsers
        .filter((u) => titularIds.includes(u.id))
        .map((u) => [u.id, u]),
    );
    const cvByUser = titularIds.length
      ? new Map(
          (await db.select().from(userCvsTable))
            .filter((c) => titularIds.includes(c.userId))
            .map((c) => [c.userId, c]),
        )
      : new Map();

    res.json(
      ListAvailableRolesResponse.parse(
        rows.map((r) => {
          const u = r.titularUserId ? userById.get(r.titularUserId) : undefined;
          const cv = r.titularUserId ? cvByUser.get(r.titularUserId) : undefined;
          return {
            id: r.id,
            label: r.label,
            description: r.description,
            titular: u
              ? {
                  id: u.id,
                  displayName: u.displayName,
                  email: u.email,
                  orgPosition: u.orgPosition ?? null,
                  phone: u.phone ?? null,
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
                }
              : null,
          };
        }),
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

    const coverage = roles.map((r) => {
      const dbAssignees = assigneesByRole.get(r.id) ?? [];
      const governance = GOVERNANCE_BY_ROLE.get(r.id);
      const seen = new Set<string>();
      const merged: string[] = [];
      for (const name of [...dbAssignees, ...(governance?.assignees ?? [])]) {
        if (!seen.has(name)) {
          seen.add(name);
          merged.push(name);
        }
      }
      return {
        roleId: r.id,
        label: r.label,
        count: merged.length,
        assignees: merged,
        tbd: !!governance?.tbd && merged.length === 0,
        pendingOnCommittee: !!governance?.pendingOnCommittee,
        pendingPerPhase: !!governance?.pendingPerPhase,
      };
    });

    const assignedRoles = roles.filter((r) => !!r.titularUserId).length;
    const vacantRoles = roles.length - assignedRoles;

    res.json(
      GetTeamSummaryResponse.parse({
        memberCount: users.length,
        cvCount: cvs.length,
        rolesFilled: assignedRoles,
        totalRoles: roles.length,
        assignedRoles,
        vacantRoles,
        coverage,
      }),
    );
  },
);

router.patch(
  "/team/members/:userId",
  requireAuth,
  requireAdmin,
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

    if (parsed.data.phone !== undefined && parsed.data.phone !== null) {
      const v = parsed.data.phone.trim();
      if (v && !PHONE_REGEX.test(v)) {
        res.status(400).json({
          error:
            "Teléfono inválido. Usa solo dígitos, espacios y los símbolos + - ( ).",
        });
        return;
      }
    }

    await db.transaction(async (tx) => {
      const userUpdate: Partial<typeof usersTable.$inferInsert> = {};
      if (parsed.data.displayName !== undefined) {
        userUpdate.displayName = parsed.data.displayName.trim();
      }
      if (parsed.data.orgPosition !== undefined) {
        const v = parsed.data.orgPosition?.trim() ?? null;
        userUpdate.orgPosition = v && v.length > 0 ? v : null;
      }
      if (parsed.data.phone !== undefined) {
        const v = parsed.data.phone?.trim() ?? null;
        userUpdate.phone = v && v.length > 0 ? v : null;
      }
      if (Object.keys(userUpdate).length > 0) {
        await tx
          .update(usersTable)
          .set(userUpdate)
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
      if (parsed.data.clearCv === true) {
        await tx
          .delete(userCvsTable)
          .where(eq(userCvsTable.userId, userId));
      }
    });

    void logAdminAction({
      actorId: req.userId ?? null,
      actorEmail: req.userEmail ?? null,
      action: "member.update",
      targetType: "user",
      targetId: userId,
      payload: {
        displayName: parsed.data.displayName,
        orgPosition: parsed.data.orgPosition,
        phone: parsed.data.phone,
        roles: parsed.data.roles,
        previousRoles,
        clearCv: parsed.data.clearCv === true ? true : undefined,
      },
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
        orgPosition: user!.orgPosition ?? null,
        phone: user!.phone ?? null,
        roles: roleRows.map((r) => r.roleId),
        joinedAt: user!.createdAt,
        lastActivityAt: user!.lastActivityAt,
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
