import { and, eq, sql } from "drizzle-orm";
import { db, milestonesTable } from "@workspace/db";

export const DEFAULT_WEEKLY_COUNT = 28;

function seedKeyFor(week: number): string {
  return `weekly_${week}`;
}

/**
 * Idempotent helper that keeps the system-managed weekly sync sessions in
 * lock-step with the configured T0.
 *
 * - When startDate is null we delete every `source='system'` weekly session
 *   (regardless of how many existed).
 * - When startDate is set we ensure exactly `count` weekly sessions exist,
 *   inserting missing ones and pruning system weeklies whose offset is > count.
 *   Existing rows have their title/description refreshed but their id is kept
 *   so subscribed calendars don't see them disappear/reappear.
 *
 * Sessions whose `source` is `manual` or `import` are never touched here.
 */
export async function ensureSystemWeeklies(
  startDate: string | null,
  count: number = DEFAULT_WEEKLY_COUNT,
): Promise<number> {
  if (!startDate) {
    await db
      .delete(milestonesTable)
      .where(
        and(
          eq(milestonesTable.source, "system"),
          eq(milestonesTable.kind, "weekly_session"),
        ),
      );
    return 0;
  }

  const keys = Array.from({ length: count }, (_, i) => seedKeyFor(i + 1));

  // Prune system weeklies past the desired horizon (or with unexpected keys).
  await db.execute(
    sql`DELETE FROM milestones
        WHERE source = 'system'
          AND kind = 'weekly_session'
          AND (seed_key IS NULL OR seed_key NOT IN (${sql.join(
            keys.map((k) => sql`${k}`),
            sql`, `,
          )}))`,
  );

  for (let week = 1; week <= count; week++) {
    const seedKey = seedKeyFor(week);
    const title = `Sesión semanal de avance — Semana ${week}`;
    const description =
      "Sync semanal del equipo: avances, bloqueadores y próximos pasos.";
    await db
      .insert(milestonesTable)
      .values({
        title,
        description,
        kind: "weekly_session",
        weekOffset: week,
        phaseId: null,
        ownersRoles: ["pm_lead", "pm_cel"],
        source: "system",
        seedKey,
      })
      .onConflictDoUpdate({
        target: milestonesTable.seedKey,
        set: {
          title,
          description,
          kind: "weekly_session",
          weekOffset: week,
          phaseId: null,
          ownersRoles: ["pm_lead", "pm_cel"],
          source: "system",
        },
      });
  }

  return count;
}

export async function countSystemWeeklies(): Promise<number> {
  const rows = await db
    .select({ id: milestonesTable.id })
    .from(milestonesTable)
    .where(
      and(
        eq(milestonesTable.source, "system"),
        eq(milestonesTable.kind, "weekly_session"),
      ),
    );
  return rows.length;
}
