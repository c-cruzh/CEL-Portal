import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const kanbanColumnsTable = pgTable("kanban_columns", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type KanbanColumn = typeof kanbanColumnsTable.$inferSelect;

export const kanbanCardsTable = pgTable("kanban_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  columnKey: text("column_key")
    .notNull()
    .references(() => kanbanColumnsTable.key, { onDelete: "restrict" }),
  position: integer("position").notNull().default(0),
  phaseId: text("phase_id"),
  assignedRoles: jsonb("assigned_roles").$type<string[]>().notNull().default([]),
  priority: text("priority").notNull().default("media"),
  dueDate: date("due_date"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type KanbanCard = typeof kanbanCardsTable.$inferSelect;
