import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { milestonesTable } from "./milestones";

export const decisionsTable = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  context: text("context").notNull().default(""),
  optionsConsidered: text("options_considered").notNull().default(""),
  phase: text("phase"),
  ownerUserId: text("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  ownerRole: text("owner_role"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dueDate: date("due_date"),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  decidedOptionId: text("decided_option_id"),
  decidedOutcome: text("decided_outcome"),
  decidedByUserId: text("decided_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  blocksMilestoneId: uuid("blocks_milestone_id").references(
    () => milestonesTable.id,
    { onDelete: "set null" },
  ),
  createdBy: text("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DecisionRow = typeof decisionsTable.$inferSelect;
export type DecisionStatus =
  | "open"
  | "in_analysis"
  | "resolved"
  | "cancelled";
