-- Prime messaging flexible campaign groundwork
-- Adds target snapshots and per-target delivery ledgers so future campaign
-- types can reuse canonical D1 authority instead of thread-specific fan-out.

ALTER TABLE message_campaigns
  ADD COLUMN target_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE message_campaigns
  ADD COLUMN sent_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE message_campaigns
  ADD COLUMN projected_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE message_campaigns
  ADD COLUMN failed_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE message_campaigns
  ADD COLUMN last_error TEXT;

CREATE TABLE IF NOT EXISTS message_campaign_target_snapshots (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  target_kind TEXT NOT NULL, -- whole_hostel|booking|room|guest|external_contact|segment
  target_key TEXT NOT NULL,
  thread_id TEXT,
  booking_id TEXT,
  room_key TEXT,
  guest_uuid TEXT,
  external_contact_key TEXT,
  target_metadata_json TEXT,
  eligibility_context_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES message_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_campaign_target_snapshots_unique
  ON message_campaign_target_snapshots(campaign_id, target_kind, target_key);

CREATE INDEX IF NOT EXISTS idx_message_campaign_target_snapshots_campaign_updated
  ON message_campaign_target_snapshots(campaign_id, updated_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS message_campaign_deliveries (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  target_snapshot_id TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- pending|ready|sent|projected|failed|cancelled
  thread_id TEXT,
  draft_id TEXT,
  message_id TEXT,
  projection_job_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  last_error TEXT,
  sent_at INTEGER,
  projected_at INTEGER,
  delivery_metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES message_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (target_snapshot_id) REFERENCES message_campaign_target_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE SET NULL,
  FOREIGN KEY (draft_id) REFERENCES message_drafts(id) ON DELETE SET NULL,
  FOREIGN KEY (message_id) REFERENCES message_records(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_campaign_deliveries_unique_target
  ON message_campaign_deliveries(campaign_id, target_snapshot_id);

CREATE INDEX IF NOT EXISTS idx_message_campaign_deliveries_campaign_status_updated
  ON message_campaign_deliveries(campaign_id, delivery_status, updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_campaign_deliveries_projection_job
  ON message_campaign_deliveries(projection_job_id);
