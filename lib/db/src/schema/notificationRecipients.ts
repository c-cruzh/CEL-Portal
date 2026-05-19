import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const notificationRecipientsTable = pgTable("notification_recipients", {
  email: text("email").primaryKey(),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NotificationRecipient =
  typeof notificationRecipientsTable.$inferSelect;
