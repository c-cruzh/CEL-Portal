import { pgTable, text, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { rolesTable } from "./roles";

export const userRolesTable = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => rolesTable.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export type UserRole = typeof userRolesTable.$inferSelect;
