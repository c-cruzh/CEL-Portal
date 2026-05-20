-- Task #76: Role titular + member contact fields.
-- Adds org_position/phone to users and titular_user_id FK to roles, and
-- backfills the titular for any role that already has exactly one user
-- assigned via user_roles.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "org_position" text;
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "roles"
  ADD COLUMN IF NOT EXISTS "titular_user_id" text
  REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
UPDATE "roles" r
SET "titular_user_id" = sub."user_id"
FROM (
  SELECT "role_id", MIN("user_id") AS "user_id", COUNT(*) AS n
  FROM "user_roles"
  GROUP BY "role_id"
) sub
WHERE r."id" = sub."role_id"
  AND r."titular_user_id" IS NULL
  AND sub.n = 1;
