import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  titularUserId: text("titular_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export type Role = typeof rolesTable.$inferSelect;
