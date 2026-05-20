-- Add a formal link from a decision to the milestone it blocks. Nullable;
-- when the milestone is deleted, the link is cleared (decision is preserved).
ALTER TABLE "decisions"
  ADD COLUMN IF NOT EXISTS "blocks_milestone_id" uuid
  REFERENCES "milestones"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "decisions_blocks_milestone_id_idx"
  ON "decisions" ("blocks_milestone_id");
