import { pgTable, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const projectConfigTable = pgTable("project_config", {
  id: integer("id").primaryKey().default(1),
  startDate: date("start_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ProjectConfigRow = typeof projectConfigTable.$inferSelect;
