-- Stage runs queue lookup index

CREATE INDEX IF NOT EXISTS idx_stage_runs_stage_status
  ON stage_runs(stage, status);
