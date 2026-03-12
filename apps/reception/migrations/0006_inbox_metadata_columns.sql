-- Promote 20 metadata fields from metadata_json blob to dedicated columns.
-- Additive migration: old code ignores new columns; metadata_json retained.

-- 1. Add columns

ALTER TABLE threads ADD COLUMN latest_inbound_message_id TEXT;
ALTER TABLE threads ADD COLUMN latest_inbound_at TEXT;
ALTER TABLE threads ADD COLUMN latest_inbound_sender TEXT;
ALTER TABLE threads ADD COLUMN latest_admission_decision TEXT;
ALTER TABLE threads ADD COLUMN latest_admission_reason TEXT;
ALTER TABLE threads ADD COLUMN needs_manual_draft INTEGER;
ALTER TABLE threads ADD COLUMN draft_failure_code TEXT;
ALTER TABLE threads ADD COLUMN draft_failure_message TEXT;
ALTER TABLE threads ADD COLUMN last_processed_at TEXT;
ALTER TABLE threads ADD COLUMN last_draft_id TEXT;
ALTER TABLE threads ADD COLUMN last_draft_template_subject TEXT;
ALTER TABLE threads ADD COLUMN last_draft_quality_passed INTEGER;
ALTER TABLE threads ADD COLUMN guest_booking_ref TEXT;
ALTER TABLE threads ADD COLUMN guest_occupant_id TEXT;
ALTER TABLE threads ADD COLUMN guest_first_name TEXT;
ALTER TABLE threads ADD COLUMN guest_last_name TEXT;
ALTER TABLE threads ADD COLUMN guest_check_in TEXT;
ALTER TABLE threads ADD COLUMN guest_check_out TEXT;
ALTER TABLE threads ADD COLUMN guest_room_numbers_json TEXT;
ALTER TABLE threads ADD COLUMN recovery_attempts INTEGER;

-- 2. Backfill from existing metadata_json

UPDATE threads SET
  latest_inbound_message_id = json_extract(metadata_json, '$.latestInboundMessageId'),
  latest_inbound_at = json_extract(metadata_json, '$.latestInboundAt'),
  latest_inbound_sender = json_extract(metadata_json, '$.latestInboundSender'),
  latest_admission_decision = json_extract(metadata_json, '$.latestAdmissionDecision'),
  latest_admission_reason = json_extract(metadata_json, '$.latestAdmissionReason'),
  needs_manual_draft = json_extract(metadata_json, '$.needsManualDraft'),
  draft_failure_code = json_extract(metadata_json, '$.draftFailureCode'),
  draft_failure_message = json_extract(metadata_json, '$.draftFailureMessage'),
  last_processed_at = json_extract(metadata_json, '$.lastProcessedAt'),
  last_draft_id = json_extract(metadata_json, '$.lastDraftId'),
  last_draft_template_subject = json_extract(metadata_json, '$.lastDraftTemplateSubject'),
  last_draft_quality_passed = json_extract(metadata_json, '$.lastDraftQualityPassed'),
  guest_booking_ref = json_extract(metadata_json, '$.guestBookingRef'),
  guest_occupant_id = json_extract(metadata_json, '$.guestOccupantId'),
  guest_first_name = json_extract(metadata_json, '$.guestFirstName'),
  guest_last_name = json_extract(metadata_json, '$.guestLastName'),
  guest_check_in = json_extract(metadata_json, '$.guestCheckIn'),
  guest_check_out = json_extract(metadata_json, '$.guestCheckOut'),
  guest_room_numbers_json = json_extract(metadata_json, '$.guestRoomNumbers'),
  recovery_attempts = json_extract(metadata_json, '$.recoveryAttempts')
WHERE metadata_json IS NOT NULL;

-- 3. Index for the most-queried metadata field (replaces json_extract in findStaleAdmittedThreads)

CREATE INDEX IF NOT EXISTS idx_threads_needs_manual_draft ON threads(needs_manual_draft);
