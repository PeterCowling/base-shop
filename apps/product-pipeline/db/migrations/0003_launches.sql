-- Launch plans + pilot actuals (Stage L)

CREATE TABLE IF NOT EXISTS launch_plans (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  status TEXT NOT NULL,
  planned_units INTEGER,
  planned_units_per_day REAL,
  plan_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS launch_actuals (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  source TEXT,
  rows_json TEXT,
  units_sold_total INTEGER,
  max_day INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (launch_id) REFERENCES launch_plans(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE INDEX IF NOT EXISTS idx_launch_plans_candidate ON launch_plans(candidate_id);
CREATE INDEX IF NOT EXISTS idx_launch_actuals_launch ON launch_actuals(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_actuals_candidate ON launch_actuals(candidate_id);
