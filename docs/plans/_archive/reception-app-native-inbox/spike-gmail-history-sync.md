---
Type: Spike
Status: Complete
Domain: Platform
Created: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-app-native-inbox
Task: TASK-11
---

# Gmail History Incremental-Sync Spike

## Verdict

Pass. Gmail history-based incremental sync is viable for reception, but it needs an explicit stale-checkpoint fallback instead of assuming `startHistoryId` will always remain valid.

## What Was Exercised

- Baseline profile read to capture the current mailbox `historyId`
- Incremental history read after sending a fresh test message
- Invalid/stale checkpoint behavior using `startHistoryId=1`

All validation used the hosted-runtime Gmail client surface introduced in TASK-01.

## Observed Results

### Validation run A: current checkpoint + incremental history

- Date: 2026-03-06
- Baseline mailbox `historyId`: `15678813`
- Action taken: sent a fresh test message, then queried Gmail history using the prior `historyId`
- Result:
  - `incrementalHistoryCount`: `4`
  - `incrementalNextHistoryId`: `15678856`

This proved the happy path: Gmail returns enough incremental history records to detect message/thread changes and advances the mailbox checkpoint.

### Validation run B: stale/invalid checkpoint

- Date: 2026-03-06
- Input: `startHistoryId=1`
- Result: request failed with `Gmail API request failed: Requested entity was not found.`

This is a usable failure mode for TASK-05. Reception can treat this as a stale-checkpoint signal and switch to the bounded rescan path.

## Chosen Contract For TASK-05

### Checkpoint shape

Persist one mailbox-level checkpoint:

- `last_history_id`
- `last_synced_at`

`last_history_id` is the primary incremental-sync cursor. `last_synced_at` exists only for operator visibility and bounded-rescan anchoring.

### Happy-path API call pattern

1. Read the stored `last_history_id`.
2. Call `GET /gmail/v1/users/me/history?startHistoryId=<stored>&maxResults=<bounded page size>`.
3. Page until complete.
4. Apply updates idempotently.
5. Persist the response `historyId` as the new `last_history_id` only after a successful sync run.

### Fallback trigger

Trigger bounded rescan when Gmail history fails with a stale/invalid checkpoint error equivalent to:

- `Requested entity was not found.`

TASK-05 should treat that as a recoverable sync-state failure, not as a fatal mailbox-auth failure.

### Bounded rescan path

Use a bounded Gmail thread rescan over the last 30 days, then rebuild the checkpoint from the mailbox's latest `historyId`.

Why 30 days:

- Brikette volume is low enough that a 30-day replay is operationally cheap.
- It is wide enough to survive long idle periods without silently dropping conversations.
- It avoids an unbounded full-mailbox import.

### Dedupe rule

Deduplicate on stable Gmail identifiers:

- thread uniqueness: Gmail `thread.id`
- message uniqueness within a thread: Gmail `message.id`

TASK-05 should upsert threads by `thread.id` and upsert messages by `message.id`. A bounded rescan is therefore safe even when it overlaps already-synced mail.

## Rejected Alternatives

- Timestamp-only checkpointing: rejected because Gmail incremental sync is natively keyed by `historyId`, not time.
- History-only with no fallback: rejected because stale checkpoints are a normal recoverable condition.
- Full mailbox replay on stale checkpoint: rejected because it is unnecessary and expands risk/privacy surface for no value.

## Decision

Proceed. TASK-05 should implement mailbox-level `historyId` checkpointing with a 30-day bounded-rescan fallback and strict dedupe by Gmail thread/message ids.
