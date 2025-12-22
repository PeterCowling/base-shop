-- Audit logs (create/update trails)

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

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
      'price_band', NEW.price_band
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
      'triage_reasons', NEW.triage_reasons
    ),
    datetime('now')
  );
END;

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
      'stage_status', NEW.stage_status
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
      'decision_reason', NEW.decision_reason
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_stage_runs_insert
AFTER INSERT ON stage_runs
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'stage_run',
    NEW.id,
    'stage_run.created',
    json_object(
      'candidate_id', NEW.candidate_id,
      'stage', NEW.stage,
      'status', NEW.status,
      'input_version', NEW.input_version
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_stage_runs_update
AFTER UPDATE ON stage_runs
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'stage_run',
    NEW.id,
    'stage_run.updated',
    json_object(
      'candidate_id', NEW.candidate_id,
      'stage', NEW.stage,
      'status', NEW.status,
      'input_version', NEW.input_version
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_artifacts_insert
AFTER INSERT ON artifacts
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'artifact',
    NEW.id,
    'artifact.created',
    json_object(
      'candidate_id', NEW.candidate_id,
      'stage_run_id', NEW.stage_run_id,
      'kind', NEW.kind,
      'uri', NEW.uri
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_suppliers_insert
AFTER INSERT ON suppliers
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'supplier',
    NEW.id,
    'supplier.created',
    json_object(
      'name', NEW.name,
      'status', NEW.status,
      'country', NEW.country
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_suppliers_update
AFTER UPDATE ON suppliers
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'supplier',
    NEW.id,
    'supplier.updated',
    json_object(
      'name', NEW.name,
      'status', NEW.status,
      'country', NEW.country
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_supplier_terms_insert
AFTER INSERT ON supplier_terms
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'supplier_terms',
    NEW.id,
    'supplier_terms.created',
    json_object(
      'supplier_id', NEW.supplier_id,
      'incoterms', NEW.incoterms,
      'payment_terms', NEW.payment_terms,
      'moq', NEW.moq,
      'currency', NEW.currency
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_supplier_terms_update
AFTER UPDATE ON supplier_terms
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'supplier_terms',
    NEW.id,
    'supplier_terms.updated',
    json_object(
      'supplier_id', NEW.supplier_id,
      'incoterms', NEW.incoterms,
      'payment_terms', NEW.payment_terms,
      'moq', NEW.moq,
      'currency', NEW.currency
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_launch_plans_insert
AFTER INSERT ON launch_plans
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'launch_plan',
    NEW.id,
    'launch_plan.created',
    json_object(
      'candidate_id', NEW.candidate_id,
      'status', NEW.status,
      'planned_units', NEW.planned_units
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_launch_plans_update
AFTER UPDATE ON launch_plans
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'launch_plan',
    NEW.id,
    'launch_plan.updated',
    json_object(
      'candidate_id', NEW.candidate_id,
      'status', NEW.status,
      'planned_units', NEW.planned_units
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_launch_actuals_insert
AFTER INSERT ON launch_actuals
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'launch_actuals',
    NEW.id,
    'launch_actuals.created',
    json_object(
      'candidate_id', NEW.candidate_id,
      'launch_id', NEW.launch_id,
      'units_sold_total', NEW.units_sold_total,
      'max_day', NEW.max_day
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_cooldowns_insert
AFTER INSERT ON cooldowns
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'cooldown',
    NEW.id,
    'cooldown.created',
    json_object(
      'fingerprint', NEW.fingerprint,
      'reason_code', NEW.reason_code,
      'severity', NEW.severity,
      'recheck_after', NEW.recheck_after
    ),
    datetime('now')
  );
END;
