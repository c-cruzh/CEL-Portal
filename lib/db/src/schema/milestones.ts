import { pgTable, text, timestamp, uuid, jsonb, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const milestonesTable = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    kind: text("kind").notNull(),
    weekOffset: integer("week_offset").notNull(),
    phaseId: text("phase_id"),
    ownersRoles: jsonb("owners_roles").$type<string[]>().notNull().default([]),
    source: text("source").notNull().default("manual"),
    seedKey: text("seed_key"),
    dateOverride: text("date_override"),
    durationMinutes: integer("duration_minutes"),
    location: text("location"),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    seedKeyIdx: uniqueIndex("milestones_seed_key_unique").on(t.seedKey),
  }),
);

export type MilestoneRow = typeof milestonesTable.$inferSelect;
