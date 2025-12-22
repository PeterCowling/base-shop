-- Lane actuals (pilot feedback loop)

CREATE TABLE IF NOT EXISTS lane_actuals (
  id TEXT PRIMARY KEY,
  lane_version_id TEXT NOT NULL,
  lane_id TEXT NOT NULL,
  source TEXT,
  actual_cost_amount REAL,
  actual_lead_time_days INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lane_version_id) REFERENCES lane_versions(id),
  FOREIGN KEY (lane_id) REFERENCES logistics_lanes(id)
);

CREATE INDEX IF NOT EXISTS idx_lane_actuals_lane_version
  ON lane_actuals(lane_version_id);
CREATE INDEX IF NOT EXISTS idx_lane_actuals_lane
  ON lane_actuals(lane_id);

CREATE TRIGGER IF NOT EXISTS audit_lane_actuals_insert
AFTER INSERT ON lane_actuals
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lane_actuals',
    NEW.id,
    'lane_actuals.created',
    json_object(
      'lane_id', NEW.lane_id,
      'lane_version_id', NEW.lane_version_id,
      'source', NEW.source,
      'actual_cost_amount', NEW.actual_cost_amount,
      'actual_lead_time_days', NEW.actual_lead_time_days
    ),
    datetime('now')
  );
END;
