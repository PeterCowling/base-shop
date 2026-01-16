-- Leads fingerprint overrides + candidate duplicates

ALTER TABLE leads ADD COLUMN fingerprint_market_id TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_url TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_title TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_reason TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_by TEXT;
ALTER TABLE leads ADD COLUMN fingerprint_override_at TEXT;
ALTER TABLE leads ADD COLUMN duplicate_of_candidate_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_market_id ON leads(fingerprint_market_id);
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_url ON leads(fingerprint_url);
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_title ON leads(fingerprint_title);
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_override ON leads(fingerprint_override);
CREATE INDEX IF NOT EXISTS idx_leads_duplicate_of_candidate ON leads(duplicate_of_candidate_id);

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
      'source_context', NEW.source_context,
      'status', NEW.status,
      'title', NEW.title,
      'url', NEW.url,
      'price_band', NEW.price_band,
      'fingerprint', NEW.fingerprint,
      'fingerprint_market_id', NEW.fingerprint_market_id,
      'fingerprint_url', NEW.fingerprint_url,
      'fingerprint_title', NEW.fingerprint_title,
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
      'source_context', NEW.source_context,
      'status', NEW.status,
      'title', NEW.title,
      'url', NEW.url,
      'price_band', NEW.price_band,
      'triage_score', NEW.triage_score,
      'triage_band', NEW.triage_band,
      'triage_reasons', NEW.triage_reasons,
      'fingerprint', NEW.fingerprint,
      'fingerprint_market_id', NEW.fingerprint_market_id,
      'fingerprint_url', NEW.fingerprint_url,
      'fingerprint_title', NEW.fingerprint_title,
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
