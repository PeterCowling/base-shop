-- Lead fingerprint overrides + duplicate candidate linkage

ALTER TABLE leads ADD COLUMN duplicate_of_candidate_id TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_reason TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_by TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_at TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_duplicate_of_candidate_id
  ON leads(duplicate_of_candidate_id);
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_override
  ON leads(fingerprint_override);

DROP TRIGGER IF EXISTS audit_leads_insert;
DROP TRIGGER IF EXISTS audit_leads_update;

CREATE TRIGGER IF NOT EXISTS audit_leads_insert
AFTER INSERT ON leads
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lead',
    NEW.id,
    'lead.created',
    json_object(
      'source', NEW.source,
      'status', NEW.status,
      'title', NEW.title,
      'url', NEW.url,
      'price_band', NEW.price_band,
      'fingerprint', NEW.fingerprint,
      'fingerprint_override', NEW.fingerprint_override,
      'fingerprint_override_reason', NEW.fingerprint_override_reason,
      'fingerprint_override_by', NEW.fingerprint_override_by,
      'fingerprint_override_at', NEW.fingerprint_override_at,
      'duplicate_of', NEW.duplicate_of,
      'duplicate_of_candidate_id', NEW.duplicate_of_candidate_id
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_leads_update
AFTER UPDATE ON leads
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lead',
    NEW.id,
    'lead.updated',
    json_object(
      'source', NEW.source,
      'status', NEW.status,
      'title', NEW.title,
      'url', NEW.url,
      'price_band', NEW.price_band,
      'triage_score', NEW.triage_score,
      'triage_band', NEW.triage_band,
      'triage_reasons', NEW.triage_reasons,
      'fingerprint', NEW.fingerprint,
      'fingerprint_override', NEW.fingerprint_override,
      'fingerprint_override_reason', NEW.fingerprint_override_reason,
      'fingerprint_override_by', NEW.fingerprint_override_by,
      'fingerprint_override_at', NEW.fingerprint_override_at,
      'duplicate_of', NEW.duplicate_of,
      'duplicate_of_candidate_id', NEW.duplicate_of_candidate_id
    ),
    datetime('now')
  );
END;