ALTER TABLE candidates ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'EUR';

DROP TRIGGER IF EXISTS audit_candidates_insert;
DROP TRIGGER IF EXISTS audit_candidates_update;

CREATE TRIGGER IF NOT EXISTS audit_candidates_insert
AFTER INSERT ON candidates
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'candidate',
    NEW.id,
    'candidate.created',
    json_object(
      'lead_id', NEW.lead_id,
      'fingerprint', NEW.fingerprint,
      'stage_status', NEW.stage_status,
      'base_currency', NEW.base_currency
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_candidates_update
AFTER UPDATE ON candidates
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'candidate',
    NEW.id,
    'candidate.updated',
    json_object(
      'lead_id', NEW.lead_id,
      'fingerprint', NEW.fingerprint,
      'stage_status', NEW.stage_status,
      'decision', NEW.decision,
      'decision_reason', NEW.decision_reason,
      'base_currency', NEW.base_currency
    ),
    datetime('now')
  );
END;
