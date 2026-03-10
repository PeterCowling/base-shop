-- Prime messaging review-state extension
-- Separates operator inbox review status from automation takeover state.

ALTER TABLE message_threads
  ADD COLUMN review_status TEXT NOT NULL DEFAULT 'pending';

UPDATE message_threads
SET review_status = CASE
  WHEN takeover_state IN ('staff_active', 'suppressed') THEN 'review_later'
  ELSE 'pending'
END
WHERE review_status IS NULL OR review_status = '';
