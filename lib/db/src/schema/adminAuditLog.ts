import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const adminAuditLogTable = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actorId: text("actor_id"),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
});

export type AdminAuditLogRow = typeof adminAuditLogTable.$inferSelect;
