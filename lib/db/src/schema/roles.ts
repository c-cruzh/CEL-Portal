import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Role = typeof rolesTable.$inferSelect;
