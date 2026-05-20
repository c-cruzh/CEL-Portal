import { and, eq, sql } from "drizzle-orm";
import {
  ROLES,
  db,
  documentsTable,
  rolesTable,
  userRolesTable,
  usersTable,
} from "@workspace/db";
import { logger } from "./logger";

const CAMILA_EMAIL = "camila@c2labs.ai";
const KEVIN_EMAIL = "kevin@c2labs.ai";
const KEVIN_PLACEHOLDER_ID = "placeholder_kevin_c2labs_ai";

async function upsertRoles(): Promise<void> {
  for (const role of ROLES) {
    await db
      .insert(rolesTable)
      .values(role)
      .onConflictDoUpdate({
        target: rolesTable.id,
        set: {
          label: role.label,
          description: role.description,
          sortOrder: role.sortOrder,
        },
      });
  }
}

async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const [row] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  return row?.id ?? null;
}

async function reconcileProjectLeadSplit(): Promise<void> {
  const camilaId = await lookupUserIdByEmail(CAMILA_EMAIL);
  if (!camilaId) return;
  const [projectLeadRole] = await db
    .select({ titularUserId: rolesTable.titularUserId })
    .from(rolesTable)
    .where(eq(rolesTable.id, "project_lead"))
    .limit(1);
  if (!projectLeadRole) return;

  if (!projectLeadRole.titularUserId) {
    await db
      .update(rolesTable)
      .set({ titularUserId: camilaId })
      .where(
        and(eq(rolesTable.id, "project_lead"), sql`titular_user_id IS NULL`),
      );
  }

  await db
    .insert(userRolesTable)
    .values({ userId: camilaId, roleId: "project_lead" })
    .onConflictDoNothing();

  const kevinRealId = await lookupUserIdByEmail(KEVIN_EMAIL);
  const kevinId = kevinRealId ?? KEVIN_PLACEHOLDER_ID;

  // If pm_lead titular is still Camila, swap it to Kevin (real or placeholder)
  // and drop Camila's stale pm_lead user_role row.
  const [pmLeadRole] = await db
    .select({ titularUserId: rolesTable.titularUserId })
    .from(rolesTable)
    .where(eq(rolesTable.id, "pm_lead"))
    .limit(1);
  if (pmLeadRole && pmLeadRole.titularUserId === camilaId) {
    const [kevinExists] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, kevinId))
      .limit(1);
    if (kevinExists) {
      await db
        .update(rolesTable)
        .set({ titularUserId: kevinId })
        .where(eq(rolesTable.id, "pm_lead"));
    }
  }
  await db
    .delete(userRolesTable)
    .where(
      and(
        eq(userRolesTable.userId, camilaId),
        eq(userRolesTable.roleId, "pm_lead"),
      ),
    );
}

async function reassignSystemUserOwnedRows(): Promise<void> {
  const [systemUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, "system"))
    .limit(1);
  if (!systemUser) return;
  const newOwnerId = await lookupUserIdByEmail(CAMILA_EMAIL);
  if (!newOwnerId) {
    logger.warn(
      "[reconcileSeed] system user present but no fallback owner — leaving in place",
    );
    return;
  }
  await db
    .update(documentsTable)
    .set({ uploadedBy: newOwnerId })
    .where(eq(documentsTable.uploadedBy, "system"));
  await db.delete(usersTable).where(eq(usersTable.id, "system"));
  logger.info("[reconcileSeed] removed legacy synthetic system user");
}

export async function reconcileSeedData(): Promise<void> {
  try {
    await upsertRoles();
    await reconcileProjectLeadSplit();
    await reassignSystemUserOwnedRows();
    logger.info("[reconcileSeed] complete");
  } catch (err) {
    logger.error({ err }, "[reconcileSeed] failed");
  }
}
