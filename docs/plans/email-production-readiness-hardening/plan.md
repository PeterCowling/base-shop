---
Type: Plan
Status: Complete
Domain: STRATEGY
Workstream: Code
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02 (TASK-07 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-production-readiness-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 94%
Confidence-Method: Existing deterministic/parity foundation + bounded P0 hardening scope
---

# Email Production Readiness Hardening

## Summary

Harden the email refinement system for production by introducing P0 testing/verification gates that prove fail-safe behavior on semantic failures and non-regressive deterministic repair-chain behavior under combined failure conditions.

## Active tasks
- [x] TASK-01: Add P0 semantic-failure fallback tests for `contradicts_thread` and `missing_policy_mandatory_content`
- [x] TASK-02: Add deterministic repair-chain matrix + idempotency tests
- [x] TASK-03: Strengthen `draft_signal_stats` health with fallback-rate thresholding and tests
- [x] TASK-04: Implement and run shadow replay harness/report generation contract
- [x] TASK-05: Add fail-closed acceptance threshold enforcement + JSON summary output for replay automation
- [x] TASK-06: Integrate deterministic replay acceptance gate into Core CI and artifact uploads
- [x] TASK-07: Add path-based conditional execution so replay gate runs only for email-system changes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add fail-safe fallback tests for semantic/policy mandatory failures | 89% | S | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add combined-failure repair matrix and idempotency assertions | 84% | M | Complete (2026-03-02) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add fallback-rate-aware deterministic health policy in signal stats | 85% | S | Complete (2026-03-02) | TASK-02 | - |
| TASK-04 | IMPLEMENT | Add offline shadow replay script and report artifact contract for parity verification | 90% | S | Complete (2026-03-02) | TASK-03 | - |
| TASK-05 | IMPLEMENT | Add replay acceptance gate thresholds + machine-readable JSON summary for CI/ops automation | 91% | S | Complete (2026-03-02) | TASK-04 | - |
| TASK-06 | IMPLEMENT | Add Core CI job to execute deterministic replay gate against a non-sensitive fixture corpus and publish artifacts | 90% | S | Complete (2026-03-02) | TASK-05 | - |
| TASK-07 | IMPLEMENT | Add classifier-backed path gating so Core CI replay job executes only when email-relevant files change | 92% | S | Complete (2026-03-02) | TASK-06 | - |

### TASK-01: Semantic and policy fail-safe fallback tests
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/__tests__/draft-refine.semantic-fallback.test.ts`
- **Build evidence:**
  - Added explicit non-repair fallback tests asserting baseline fallback for `contradicts_thread` and `missing_policy_mandatory_content`.

### TASK-02: Repair-chain matrix and idempotency tests
- **Type:** IMPLEMENT
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/__tests__/draft-refine.repair-matrix.test.ts`
- **Build evidence:**
  - Added combined-failure matrix fixture (`missing_signature`, `missing_required_link`, `unanswered_questions`, `prohibited_claims`) with deterministic repair-chain assertions.
  - Added repeated-run stability assertion proving output determinism for same input pair.

### TASK-03: Fallback-rate-aware health policy
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/src/tools/draft-signal-stats.ts`, `packages/mcp-server/src/__tests__/draft-signal-stats.test.ts`
- **Build evidence:**
- Added fallback-rate input computation to health policy.
- Added threshold branch: `watch` when deterministic fallback rate exceeds `0.35`, even with high pass rate.
- Added regression test for high-fallback-rate watch classification.

### TASK-04: Shadow replay harness and report contract
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/scripts/shadow-replay-refinement.ts`, `packages/mcp-server/package.json`, `docs/plans/email-production-readiness-hardening/shadow-replay-report.user.md`
- **Build evidence:**
  - Added offline shadow replay harness script that runs:
    - `draft_interpret` -> `draft_generate` -> baseline `draft_refine(external identity)` -> deterministic `draft_refine(deterministic_only)`.
  - Added corpus parser support for:
    - JSON arrays,
    - JSONL,
    - staged email sample text format (`EMAIL_DETAILS` blocks).
  - Added report generator with acceptance checks:
    - regressions count,
    - protected-category mutation check,
    - processing error count.
  - Added npm script: `pnpm --filter @acme/mcp-server shadow-replay:refine`.
  - Smoke run executed and report emitted at `docs/plans/email-production-readiness-hardening/shadow-replay-report.user.md`.

#### Real-corpus execution command
```bash
pnpm --filter @acme/mcp-server exec tsx scripts/shadow-replay-refinement.ts \
  --input .agents/private/email-sample-stage-1.txt \
  --output docs/plans/email-production-readiness-hardening/shadow-replay-report.user.md \
  --limit 500
```

#### Real-corpus run result (2026-03-02)
- Input corpus: `.agents/private/email-sample-stage-1.txt` (88 customer emails collected from `hostelpositano@gmail.com` inbox window `after:2025/11/01 before:2026/03/03`)
- Replay summary:
  - rows loaded: `88`
  - rows processed: `88`
  - regressions: `0`
  - hard-rule protected-category violations: `0`
  - processing errors: `0`
- Follow-up fix applied:
  - `draft_refine` protected-category guard now enforces fail-safe baseline text instead of returning error when external refined text differs for protected categories.
  - Regression tests updated to assert fail-safe enforcement behavior for `prepayment` and `cancellation`.

### TASK-05: Replay acceptance gate enforcement
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `packages/mcp-server/scripts/shadow-replay-refinement.ts`, `docs/plans/email-production-readiness-hardening/shadow-replay-report.summary.json`
- **Build evidence:**
  - Added fail-closed threshold arguments:
    - `--max-regressions` (default `0`)
    - `--max-hard-rule-violations` (default `0`)
    - `--max-errors` (default `0`)
  - Script now exits non-zero when thresholds are breached (automation gate behavior).
  - Added optional `--json-output` to emit machine-readable summary for CI/monitoring integrations.
  - Verified run:
    - rows=`30`, regressions=`0`, hard_rule_violations=`0`, errors=`0`

### TASK-06: Core CI integration for replay gate
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `.github/workflows/ci.yml`, `packages/mcp-server/scripts/fixtures/shadow-replay-fixture.json`, `packages/mcp-server/package.json`
- **Build evidence:**
  - Added non-sensitive deterministic fixture corpus for replay validation at:
    - `packages/mcp-server/scripts/fixtures/shadow-replay-fixture.json`
  - Added package script:
    - `shadow-replay:refine:ci`
  - Added new Core CI job:
    - `email-shadow-replay-gate`
  - Job runs fail-closed replay command and uploads generated Markdown + JSON artifacts.
  - Build dependency graph updated so `build` requires `email-shadow-replay-gate`.
  - Local verification run:
    - rows=`5`, regressions=`0`, hard_rule_violations=`0`, errors=`0`

### TASK-07: Path-based conditional execution
- **Type:** IMPLEMENT
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, `scripts/__tests__/ci/path-classifier.test.ts`, `.github/workflows/ci.yml`
- **Build evidence:**
  - Added `ci_filter.email_shadow_replay` classifier with email-system path scope:
    - `packages/mcp-server/src/tools/draft-*.ts`
    - `packages/mcp-server/src/utils/signal-events.ts`
    - `packages/mcp-server/src/__tests__/draft-*.test.ts`
    - `packages/mcp-server/scripts/shadow-replay-refinement.ts`
    - `packages/mcp-server/scripts/fixtures/shadow-replay-fixture.json`
    - `packages/mcp-server/package.json`
    - `.github/workflows/ci.yml`
  - Updated `email-shadow-replay-gate` job to require `needs: [changes]` and run only when:
    - `needs.changes.outputs.email_shadow_replay == 'true'`
  - Added classifier unit tests for positive/negative `email_shadow_replay` matching.
