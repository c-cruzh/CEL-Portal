-- Task #40: Admin portal foundation.
-- Incremental migration: only the two new tables required by this change.
-- The rest of the schema is managed via `drizzle-kit push` and is assumed to
-- already exist in every environment where this migration runs.

CREATE TABLE IF NOT EXISTS "invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "invited_by" text,
  "suggested_roles" text[] DEFAULT '{}'::text[] NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "accepted_at" timestamp with time zone,
  "accepted_user_id" text,
  "revoked_at" timestamp with time zone,
  "last_sent_at" timestamp with time zone,
  CONSTRAINT "invitations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  "actor_id" text,
  "actor_email" text,
  "action" text NOT NULL,
  "target_type" text,
  "target_id" text,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_log_at_idx"
  ON "admin_audit_log" ("at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_audit_log_action_idx"
  ON "admin_audit_log" ("action");
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp with time zone
  DEFAULT now() NOT NULL;
