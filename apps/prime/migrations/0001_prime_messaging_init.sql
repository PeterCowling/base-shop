-- Prime messaging D1 schema (initial)
-- D1 is the canonical operational store for Prime threads, messages, drafts,
-- admissions, and Firebase projection replay metadata.

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  channel_type TEXT NOT NULL,              -- direct|broadcast
  audience TEXT NOT NULL DEFAULT 'thread', -- thread|booking|room|whole_hostel
  member_uids_json TEXT,
  title TEXT,
  latest_message_at INTEGER,
  latest_inbound_message_at INTEGER,
  last_staff_reply_at INTEGER,
  takeover_state TEXT NOT NULL DEFAULT 'automated', -- automated|staff_active|suppressed
  suppression_reason TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS message_records (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'support',      -- support|promotion|draft|system
  audience TEXT NOT NULL DEFAULT 'thread',   -- thread|booking|room|whole_hostel
  links_json TEXT,
  attachments_json TEXT,
  cards_json TEXT,
  campaign_id TEXT,
  draft_id TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_drafts (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  status TEXT NOT NULL,                     -- suggested|under_review|approved|sent|dismissed
  source TEXT NOT NULL,                     -- agent|staff
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'draft',       -- support|promotion|draft|system
  audience TEXT NOT NULL DEFAULT 'thread',  -- thread|booking|room|whole_hostel
  links_json TEXT,
  attachments_json TEXT,
  cards_json TEXT,
  quality_json TEXT,
  interpret_json TEXT,
  created_by_uid TEXT,
  reviewer_uid TEXT,
  suppression_reason TEXT,
  sent_message_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_admissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  draft_id TEXT,
  decision TEXT NOT NULL,                   -- draft_created|suppressed|manual_takeover|dismissed|sent
  reason TEXT,
  source TEXT NOT NULL,
  classifier_version TEXT,
  source_metadata_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (draft_id) REFERENCES message_drafts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS message_projection_jobs (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,                -- message|draft
  entity_id TEXT NOT NULL,
  projection_target TEXT NOT NULL DEFAULT 'firebase',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|projected|failed
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_threads_booking_updated
  ON message_threads(booking_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_message_threads_channel_audience
  ON message_threads(channel_type, audience, updated_at);

CREATE INDEX IF NOT EXISTS idx_message_records_thread_created
  ON message_records(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_records_draft
  ON message_records(draft_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_drafts_thread_updated
  ON message_drafts(thread_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_message_drafts_status_updated
  ON message_drafts(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_message_admissions_thread_created
  ON message_admissions(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_projection_jobs_status_updated
  ON message_projection_jobs(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_message_projection_jobs_thread_created
  ON message_projection_jobs(thread_id, created_at);
