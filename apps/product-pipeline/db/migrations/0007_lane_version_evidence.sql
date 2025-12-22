-- Lane version evidence (quote attachments)

CREATE TABLE IF NOT EXISTS lane_version_evidence (
  id TEXT PRIMARY KEY,
  lane_version_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  uri TEXT NOT NULL,
  checksum TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lane_version_id) REFERENCES lane_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_lane_version_evidence_version
  ON lane_version_evidence(lane_version_id, created_at);

CREATE TRIGGER IF NOT EXISTS audit_lane_version_evidence_insert
AFTER INSERT ON lane_version_evidence
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lane_version_evidence',
    NEW.id,
    'lane_version_evidence.created',
    json_object(
      'lane_version_id', NEW.lane_version_id,
      'kind', NEW.kind,
      'uri', NEW.uri
    ),
    datetime('now')
  );
END;
