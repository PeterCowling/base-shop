-- Add unique constraint on (thread_id, classifier_version) to support upsert
-- and prevent duplicate admission outcomes from accumulating on every sync run.
-- Deduplicate existing rows first: keep only the latest row per (thread_id, classifier_version).

DELETE FROM admission_outcomes
WHERE id NOT IN (
  SELECT MAX(id)
  FROM admission_outcomes
  GROUP BY thread_id, COALESCE(classifier_version, '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admission_outcomes_thread_classifier
  ON admission_outcomes(thread_id, classifier_version);
