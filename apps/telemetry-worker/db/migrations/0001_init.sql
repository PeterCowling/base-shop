-- Telemetry events table
CREATE TABLE telemetry_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'event',
  name TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  fingerprint TEXT,
  level TEXT,
  ts INTEGER NOT NULL,
  app TEXT,
  env TEXT,
  request_id TEXT,
  shop_id TEXT,
  url TEXT,
  payload_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for common queries
CREATE INDEX idx_ts ON telemetry_events(ts);
CREATE INDEX idx_fingerprint_ts ON telemetry_events(fingerprint, ts) WHERE fingerprint IS NOT NULL;
CREATE INDEX idx_kind_ts ON telemetry_events(kind, ts);
CREATE INDEX idx_app_ts ON telemetry_events(app, ts) WHERE app IS NOT NULL;
CREATE INDEX idx_level_ts ON telemetry_events(level, ts) WHERE level IS NOT NULL;

-- Apply migration
-- Run: wrangler d1 execute telemetry --file=./db/migrations/0001_init.sql
