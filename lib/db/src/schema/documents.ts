import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const documentFoldersTable = pgTable("document_folders", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type DocumentFolder = typeof documentFoldersTable.$inferSelect;

export const documentsTable = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    folder: text("folder")
      .notNull()
      .references(() => documentFoldersTable.key, { onDelete: "restrict" }),
    phaseId: text("phase_id"),
    version: integer("version").notNull().default(1),
    objectKey: text("object_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("documents_folder_idx").on(t.folder),
    index("documents_active_idx").on(t.isActive),
    index("documents_name_idx").on(t.name),
  ],
);

export type DocumentRow = typeof documentsTable.$inferSelect;
