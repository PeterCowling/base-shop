-- Leads fingerprint + duplicate linkage

ALTER TABLE leads ADD COLUMN fingerprint TEXT;
ALTER TABLE leads ADD COLUMN duplicate_of TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_fingerprint ON leads(fingerprint);
CREATE INDEX IF NOT EXISTS idx_leads_duplicate_of ON leads(duplicate_of);

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
      'duplicate_of', NEW.duplicate_of
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
      'duplicate_of', NEW.duplicate_of
    ),
    datetime('now')
  );
END;
