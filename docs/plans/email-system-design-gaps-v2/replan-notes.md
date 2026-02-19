---
Type: Notes
Status: Active
Domain: API
Last-reviewed: 2026-02-19
Relates-to: docs/plans/email-system-design-gaps-v2/plan.md
---

# Email System Design Gaps V2 Replan Notes

## Invocation

- Skill: `/lp-replan` (standard mode)
- Date: 2026-02-19
- Scope: low-confidence `IMPLEMENT` tasks (`TASK-03`, `TASK-04`, `TASK-05`, `TASK-07`, `TASK-08`, `TASK-10`) and direct dependents.

## Gate Outcomes

- Promotion Gate: not met for `TASK-03/04/05/07/08/10`; unresolved unknowns remain non-trivial.
- Validation Gate: met for all affected tasks (TC contracts present); precursor tasks added for unresolved design unknowns.
- Precursor Gate: applied via `TASK-12`, `TASK-13`, `TASK-14`, `TASK-15`.
- Sequencing Gate: topology changed; plan resequenced with stable task IDs.
- Escalation Gate: no user decision required; D1/D2/D3 already locked.

## Evidence (E2/E1)

### E2 executable checks

- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts --maxWorkers=2`
  - Result: `1/1` suite passed, `4/4` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts packages/mcp-server/src/__tests__/draft-quality-check.test.ts packages/mcp-server/src/__tests__/draft-interpret.test.ts packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts packages/mcp-server/src/__tests__/startup-loop-octorate-bookings.test.ts --maxWorkers=2`
  - Result: `5/5` suites passed, `102/102` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/booking-email.test.ts packages/mcp-server/src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
  - Result: `2/2` suites passed, `8/8` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
  - Result: `2/2` suites passed, `27/27` tests passed.
  - Harness output (`draft-pipeline.integration`): `10/10` fixtures passed quality checks; average question coverage `100%`.

### E1 static audit highlights

- Link requirement remains booking-monitor scoped:
  - `packages/mcp-server/src/tools/draft-quality-check.ts:306`
- Draft generation emits deterministic diagnostics but no cross-path telemetry contract yet:
  - `packages/mcp-server/src/tools/draft-generate.ts:1201`
  - `packages/mcp-server/src/tools/draft-generate.ts:1230`
- Reception booking/guest activity tools create drafts without unified outcome labeling calls:
  - `packages/mcp-server/src/tools/booking-email.ts:93`
  - `packages/mcp-server/src/tools/guest-email-activity.ts:213`
  - Label application seam exists in `gmail_mark_processed`:
    - `packages/mcp-server/src/tools/gmail.ts:2453`
- Octorate parser has tested paths but still pattern-sensitive and sample-capped:
  - `packages/mcp-server/src/tools/gmail.ts:248`
  - `packages/mcp-server/src/tools/gmail.ts:1934`
- Template inventory baseline remains `53` total / `24` no-url by `https?://` criterion:
  - `packages/mcp-server/data/email-templates.json`

## Replan Decisions

- Added `TASK-12` before `TASK-03` to resolve telemetry event taxonomy + rollup sink ambiguity.
- Added `TASK-13` before `TASK-04` to produce full template reference-scope matrix and avoid false-fail rollout.
- Added `TASK-14` before `TASK-07/08` as an explicit spike for reviewed-ledger state/idempotency contract.
- Added `TASK-15` before `TASK-10` to establish a 90-day Octorate subject baseline and fixture backlog.
- Kept existing low-confidence implementation tasks at `75%`; promotion deferred until precursor evidence is complete.

## TASK-12 Output (Build, 2026-02-19)

### Telemetry Contract Decision

Stable event keys selected for TASK-03 implementation:

| Event key | Purpose | Required fields |
|---|---|---|
| `email_draft_created` | Draft successfully created | `ts`, `event_key`, `source_path`, `tool_name`, `message_id`, `draft_id`, `actor` |
| `email_draft_deferred` | Flow deferred without draft | `ts`, `event_key`, `source_path`, `tool_name`, `message_id`, `actor`, `reason` |
| `email_outcome_labeled` | Queue outcome label applied | `ts`, `event_key`, `source_path`, `message_id`, `actor`, `action` |
| `email_queue_transition` | Queue label-state transition | `ts`, `event_key`, `source_path`, `message_id`, `actor`, `queue_from`, `queue_to` |
| `email_fallback_detected` | Fallback/unknown path taken | `ts`, `event_key`, `source_path`, `tool_name`, `actor`, `reason`, `classification` |

### Source-Path Taxonomy + Mandatory Metadata

- `queue`:
  - Requires `message_id`, `actor`, `action`, `queue_from`, `queue_to`.
  - Derived from queue handling and outcome labeling seams (`gmail_get_email`, `gmail_mark_processed`).
- `reception`:
  - Requires `tool_name`, `booking_ref` (when available), `activity_code` (when available), `draft_id`, `message_id`.
  - Derived from `booking-email` / `guest-email-activity` draft creation responses.
- `outbound`:
  - Requires `tool_name`, `message_id`, `draft_id`, `recipient_count`.
  - Derived from `gmail_create_draft` / outbound draft creation paths.

Backward-compatible defaults when metadata is missing:

- `source_path`: `"unknown"`
- `actor`: `"system"`
- `tool_name`: `"unknown_tool"`
- `draft_id`, `message_id`, `queue_from`, `queue_to`: `null`
- `reason`: `"unspecified"`

### Daily Rollup Sink Decision

- **Chosen sink for v1 rollups:** existing append-only audit-log JSONL at `packages/mcp-server/data/email-audit-log.jsonl` (read + aggregate).
- **Rationale:** this sink is already implemented and test-validated for append-only writes and parseability.
- **Fallback behavior:** if audit-log write/read fails, telemetry emission must remain non-fatal and rollups fall back to on-demand recomputation from surviving entries; no draft path is blocked.

### Evidence Anchors (call-site map)

- Audit schema + append-only sink:
  - `packages/mcp-server/src/tools/gmail.ts:173`
  - `packages/mcp-server/src/tools/gmail.ts:220`
  - `packages/mcp-server/src/tools/gmail.ts:2578`
- Queue lock/outcome flow:
  - `packages/mcp-server/src/tools/gmail.ts:2172`
  - `packages/mcp-server/src/tools/gmail.ts:2242`
- Draft diagnostics seam:
  - `packages/mcp-server/src/tools/draft-generate.ts:1201`
  - `packages/mcp-server/src/tools/draft-generate.ts:1230`
- Reception draft creation seams:
  - `packages/mcp-server/src/tools/booking-email.ts:93`
  - `packages/mcp-server/src/tools/guest-email-activity.ts:213`

## Next Build Order

1. `TASK-12` (`INVESTIGATE`)
2. `TASK-13` (`INVESTIGATE`)
3. Re-run `/lp-build` for `TASK-03` / `TASK-04` after precursors complete (or run `/lp-replan` again if confidence remains below threshold).
