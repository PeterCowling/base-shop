-- Launch velocity priors + decisions

CREATE TABLE IF NOT EXISTS velocity_priors (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  source TEXT NOT NULL,
  velocity_per_day REAL NOT NULL,
  units_sold_total INTEGER,
  max_day INTEGER,
  notes TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE INDEX IF NOT EXISTS idx_velocity_priors_candidate
  ON velocity_priors(candidate_id, created_at);

CREATE TABLE IF NOT EXISTS launch_decisions (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  notes TEXT,
  decided_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (launch_id) REFERENCES launch_plans(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE INDEX IF NOT EXISTS idx_launch_decisions_launch
  ON launch_decisions(launch_id, created_at);

CREATE INDEX IF NOT EXISTS idx_launch_decisions_candidate
  ON launch_decisions(candidate_id, created_at);

CREATE TRIGGER IF NOT EXISTS audit_velocity_priors_insert
AFTER INSERT ON velocity_priors
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'velocity_prior',
    NEW.id,
    'velocity_prior.created',
    json_object(
      'candidate_id', NEW.candidate_id,
      'source', NEW.source,
      'velocity_per_day', NEW.velocity_per_day,
      'units_sold_total', NEW.units_sold_total,
      'max_day', NEW.max_day,
      'expires_at', NEW.expires_at
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_launch_decisions_insert
AFTER INSERT ON launch_decisions
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'launch_decision',
    NEW.id,
    'launch_decision.created',
    json_object(
      'launch_id', NEW.launch_id,
      'candidate_id', NEW.candidate_id,
      'decision', NEW.decision,
      'decided_by', NEW.decided_by
    ),
    datetime('now')
  );
END;
