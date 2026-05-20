import { and, eq, sql } from "drizzle-orm";
import {
  ROLES,
  SEED_PLACEHOLDER_USERS,
  buildSeedMilestones,
  db,
  documentsTable,
  milestonesTable,
  placeholderIdFor,
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

// Upsert canonical milestones by seedKey. Stale `source='system'` milestones
// whose seedKey is no longer in the canonical set are deleted, but we
// deliberately preserve `weekly_*` rows owned by ensureSystemWeeklies().
async function reconcileMilestones(): Promise<number> {
  const items = buildSeedMilestones();
  const validKeys = items.map((i) => i.seedKey);

  await db.execute(
    sql`DELETE FROM milestones
        WHERE source = 'system'
          AND (seed_key IS NULL OR seed_key NOT IN (${sql.join(
            validKeys.map((k) => sql`${k}`),
            sql`, `,
          )}))
          AND (seed_key IS NULL OR seed_key NOT LIKE 'weekly_%')`,
  );

  for (const m of items) {
    await db
      .insert(milestonesTable)
      .values({
        title: m.title,
        description: m.description,
        kind: m.kind,
        weekOffset: m.weekOffset,
        phaseId: m.phaseId,
        ownersRoles: m.ownersRoles,
        source: "system",
        seedKey: m.seedKey,
      })
      .onConflictDoUpdate({
        target: milestonesTable.seedKey,
        set: {
          title: m.title,
          description: m.description,
          kind: m.kind,
          weekOffset: m.weekOffset,
          phaseId: m.phaseId,
          ownersRoles: m.ownersRoles,
        },
      });
  }

  return items.length;
}

// Upsert the canonical placeholder titulares. Skips emails already owned by
// a real (non-placeholder) user. Keeps display_name / org_position fresh.
// Fills role titular slot only when still NULL — never steals from a real user.
async function reconcilePlaceholderUsers(): Promise<number> {
  let upserted = 0;
  for (const u of SEED_PLACEHOLDER_USERS) {
    const emailLower = u.email.toLowerCase();
    const existing = await db.execute(
      sql`SELECT id FROM users WHERE lower(email) = ${emailLower} LIMIT 1`,
    );
    const existingId = (existing.rows[0] as { id?: string } | undefined)?.id;
    if (existingId && !existingId.startsWith("placeholder_")) {
      continue;
    }
    const id = placeholderIdFor(u.email);
    await db
      .insert(usersTable)
      .values({
        id,
        email: emailLower,
        displayName: u.displayName,
        orgPosition: u.orgPosition,
        status: "active",
        statusChangedBy: "seed-placeholder",
      })
      .onConflictDoNothing();
    await db.execute(
      sql`UPDATE users SET display_name = ${u.displayName},
                            org_position = ${u.orgPosition},
                            status = 'active'
          WHERE id = ${id}`,
    );
    for (const roleId of u.roles) {
      await db
        .insert(userRolesTable)
        .values({ userId: id, roleId })
        .onConflictDoNothing();
      await db.execute(
        sql`UPDATE roles SET titular_user_id = ${id}
            WHERE id = ${roleId} AND titular_user_id IS NULL`,
      );
    }
    upserted += 1;
  }
  return upserted;
}

export async function reconcileSeedData(): Promise<void> {
  try {
    await upsertRoles();
    await reconcileProjectLeadSplit();
    await reassignSystemUserOwnedRows();
    const milestoneCount = await reconcileMilestones();
    logger.info(
      { milestoneCount },
      "[reconcileSeed] canonical milestones upserted",
    );
    const placeholderCount = await reconcilePlaceholderUsers();
    logger.info(
      { placeholderCount },
      "[reconcileSeed] placeholder titulares upserted",
    );
    logger.info("[reconcileSeed] complete");
  } catch (err) {
    logger.error({ err }, "[reconcileSeed] failed");
  }
}
