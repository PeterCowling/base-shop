-- Add first-class priority to ideas for deterministic triage ordering.
-- Existing records default to P3.

ALTER TABLE business_os_ideas
ADD COLUMN priority TEXT NOT NULL DEFAULT 'P3';

CREATE INDEX IF NOT EXISTS idx_ideas_priority_created
  ON business_os_ideas(priority, created_at);
