import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

export const notificationLogTable = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventKind: text("event_kind").notNull(),
  recipients: jsonb("recipients").$type<string[]>().notNull().default([]),
  recipientCount: integer("recipient_count").notNull().default(0),
  status: text("status").notNull(),
  providerMessage: text("provider_message"),
  triggeredBy: text("triggered_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NotificationLogRow = typeof notificationLogTable.$inferSelect;
