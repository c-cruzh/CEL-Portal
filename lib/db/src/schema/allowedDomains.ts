import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const allowedEmailDomainsTable = pgTable("allowed_email_domains", {
  domain: text("domain").primaryKey(),
  addedBy: text("added_by"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AllowedEmailDomain =
  typeof allowedEmailDomainsTable.$inferSelect;
