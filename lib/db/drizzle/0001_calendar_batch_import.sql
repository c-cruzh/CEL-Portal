-- Task #42: Calendario — autogen T0 + batch import.
-- Adds the new milestone fields needed for curated batch imports and date
-- overrides, and migrates any legacy `source='custom'` rows to the new
-- `manual` value so existing data keeps validating after the enum widened.

ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "date_override" text;
--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "duration_minutes" integer;
--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "location" text;
--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "notes" text;
--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "source" SET DEFAULT 'manual';
--> statement-breakpoint
UPDATE "milestones" SET "source" = 'manual' WHERE "source" = 'custom';
