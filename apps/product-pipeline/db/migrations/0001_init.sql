-- Product Pipeline D1 schema (initial)

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_context TEXT,
  title TEXT,
  url TEXT,
  price_band TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  triage_score INTEGER,
  triage_band TEXT,
  triage_reasons TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  fingerprint TEXT,
  stage_status TEXT,
  decision TEXT,
  decision_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS stage_runs (
  id TEXT PRIMARY KEY,
  candidate_id TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  input_version TEXT,
  input_json TEXT,
  output_json TEXT,
  error_json TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  candidate_id TEXT,
  stage_run_id TEXT,
  kind TEXT NOT NULL,
  uri TEXT NOT NULL,
  checksum TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (stage_run_id) REFERENCES stage_runs(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  country TEXT,
  contact_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supplier_terms (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  incoterms TEXT,
  payment_terms TEXT,
  moq INTEGER,
  currency TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS cooldowns (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  severity TEXT NOT NULL,
  recheck_after TEXT,
  what_would_change TEXT,
  snapshot_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage_status);
CREATE INDEX IF NOT EXISTS idx_stage_runs_candidate ON stage_runs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_candidate ON artifacts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cooldowns_fingerprint ON cooldowns(fingerprint);
