-- Task #43: Kanban categories (preproyecto vs piloto) + batch upload.
-- Adds a `category` column to `kanban_cards` to distinguish cards that
-- belong to the running pilot from preproject decisions, with a check
-- constraint to keep the domain closed. Existing rows are backfilled to
-- 'piloto' explicitly (also the default for new inserts).

ALTER TABLE "kanban_cards"
  ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT 'piloto';
--> statement-breakpoint
UPDATE "kanban_cards" SET "category" = 'piloto' WHERE "category" IS NULL;
--> statement-breakpoint
ALTER TABLE "kanban_cards" DROP CONSTRAINT IF EXISTS "kanban_cards_category_check";
--> statement-breakpoint
ALTER TABLE "kanban_cards"
  ADD CONSTRAINT "kanban_cards_category_check"
  CHECK ("category" IN ('preproyecto', 'piloto'));
