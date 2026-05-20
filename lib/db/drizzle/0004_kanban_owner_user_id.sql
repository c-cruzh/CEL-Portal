-- Task #60: Kanban — explicit owner per card.
-- Adds an optional `owner_user_id` column to `kanban_cards` so reminders
-- and "a cargo: X" can point at the person actually working the card,
-- not whoever created it. Nullable + ON DELETE SET NULL keeps existing
-- rows valid and survives user deletions without losing the card.

ALTER TABLE "kanban_cards"
  ADD COLUMN IF NOT EXISTS "owner_user_id" text;
--> statement-breakpoint
ALTER TABLE "kanban_cards"
  DROP CONSTRAINT IF EXISTS "kanban_cards_owner_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "kanban_cards"
  ADD CONSTRAINT "kanban_cards_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL;
