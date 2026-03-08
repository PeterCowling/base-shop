-- Prime messaging campaign authority
-- Adds canonical campaign rows for reusable broadcast lanes, starting with
-- whole-hostel campaign review/send state on top of the existing shared thread.

CREATE TABLE IF NOT EXISTS message_campaigns (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'broadcast',
  audience TEXT NOT NULL DEFAULT 'whole_hostel',
  status TEXT NOT NULL DEFAULT 'drafting', -- drafting|under_review|sent|resolved|archived
  title TEXT,
  metadata_json TEXT,
  latest_draft_id TEXT,
  sent_message_id TEXT,
  created_by_uid TEXT,
  reviewer_uid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (latest_draft_id) REFERENCES message_drafts(id) ON DELETE SET NULL,
  FOREIGN KEY (sent_message_id) REFERENCES message_records(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_message_campaigns_thread_updated
  ON message_campaigns(thread_id, updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_campaigns_status_updated
  ON message_campaigns(status, updated_at DESC, created_at DESC);
