import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  orgPosition: text("org_position"),
  phone: text("phone"),
  emailNotificationsOptOut: boolean("email_notifications_opt_out")
    .notNull()
    .default(false),
  status: text("status").notNull().default("pending"),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  statusChangedBy: text("status_changed_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
