-- Task #44: Decisions — extended lifecycle.
-- Adds the four audit / outcome columns to `decisions` that persist who
-- decided, what was decided (outcome + optional chosen option), and when.
-- All columns are nullable so existing rows remain valid; the resolve
-- endpoint enforces population on new resolutions. `decided_by_user_id`
-- references `users.id` with ON DELETE SET NULL so removing a user does
-- not destroy the decision audit trail.

ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "decided_option_id" text;
--> statement-breakpoint
ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "decided_outcome" text;
--> statement-breakpoint
ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "decided_by_user_id" text;
--> statement-breakpoint
ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "decided_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "decisions"
  DROP CONSTRAINT IF EXISTS "decisions_decided_by_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "decisions"
  ADD CONSTRAINT "decisions_decided_by_user_id_fkey"
  FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL;
