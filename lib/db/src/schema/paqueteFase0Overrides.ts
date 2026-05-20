import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const paqueteFase0OverridesTable = pgTable(
  "paquete_fase0_overrides",
  {
    assetPath: text("asset_path").primaryKey(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    originalFilename: text("original_filename").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    replacedBy: text("replaced_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    replacedAt: timestamp("replaced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export type PaqueteFase0OverrideRow =
  typeof paqueteFase0OverridesTable.$inferSelect;
