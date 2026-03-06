-- Mailbox-level sync checkpoint state for Gmail incremental history sync.

CREATE TABLE IF NOT EXISTS inbox_sync_state (
  mailbox_key TEXT PRIMARY KEY,
  last_history_id TEXT,
  last_synced_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
