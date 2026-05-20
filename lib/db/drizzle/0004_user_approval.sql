-- Task #8: Require admin approval before new sign-ups can access the portal.
-- Adds a status column on users (pending/active/rejected) plus audit fields
-- to record who approved/rejected the user and when. Existing users are
-- back-filled as 'active' so this migration is non-disruptive.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status_changed_at" timestamp with time zone
  DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status_changed_by" text;
--> statement-breakpoint
UPDATE "users" SET "status" = 'active' WHERE "status" = 'pending';
