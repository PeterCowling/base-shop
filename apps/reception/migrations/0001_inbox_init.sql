-- Reception inbox D1 schema (initial)
-- Stores inbox workflow state while Gmail remains canonical for raw transport data.

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,                     -- Gmail thread id
  status TEXT NOT NULL DEFAULT 'pending', -- pending|review_later|auto_archived|drafted|approved|sent|resolved
  subject TEXT,
  snippet TEXT,
  assigned_uid TEXT,
  latest_message_at TEXT,
  last_synced_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,                     -- Gmail message id
  thread_id TEXT NOT NULL,
  direction TEXT NOT NULL,                 -- inbound|outbound
  sender_email TEXT,
  recipient_emails_json TEXT,
  subject TEXT,
  snippet TEXT,
  sent_at TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  gmail_draft_id TEXT,
  status TEXT NOT NULL DEFAULT 'generated', -- generated|edited|approved|sent
  plain_text TEXT NOT NULL,
  html TEXT,
  template_used TEXT,
  quality_json TEXT,
  interpret_json TEXT,
  created_by_uid TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS thread_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_uid TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  metadata_json TEXT,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admission_outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  source TEXT NOT NULL,
  classifier_version TEXT,
  matched_rule TEXT,
  source_metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_threads_status_latest
  ON threads(status, latest_message_at, updated_at);

CREATE INDEX IF NOT EXISTS idx_threads_updated_at
  ON threads(updated_at);

CREATE INDEX IF NOT EXISTS idx_messages_thread_sent
  ON messages(thread_id, sent_at);

CREATE INDEX IF NOT EXISTS idx_drafts_thread_updated
  ON drafts(thread_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_thread_events_thread_time
  ON thread_events(thread_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_thread_events_time
  ON thread_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_admission_outcomes_thread_created
  ON admission_outcomes(thread_id, created_at);
