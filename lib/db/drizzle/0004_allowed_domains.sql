-- Task #7: DB-backed institutional email allowlist.
-- Adds the `allowed_email_domains` table so admins can manage the list of
-- allowed signup domains from the portal instead of editing the
-- ALLOWED_EMAIL_DOMAINS environment variable. The seed script keeps the
-- two historical defaults (cel.gob.sv, c2labs.ai) in place idempotently
-- so existing environments do not lose access on first deploy.

CREATE TABLE IF NOT EXISTS "allowed_email_domains" (
  "domain" text PRIMARY KEY NOT NULL,
  "added_by" text,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "allowed_email_domains" ("domain", "added_by", "note")
VALUES
  ('cel.gob.sv', 'system', 'Dominio institucional CEL (default)'),
  ('c2labs.ai', 'system', 'Dominio institucional C2Labs (default)')
ON CONFLICT ("domain") DO NOTHING;
