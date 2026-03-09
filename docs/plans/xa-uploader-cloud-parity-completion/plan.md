---
Type: Plan
Status: Active
Domain: Products
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-cloud-parity-completion
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by dependency-critical path risk
Auto-Build-Intent: plan-only
---

# XA Uploader Cloud Parity Completion Plan

## Summary

Finish the remaining hosted/cloud parity work in xa-uploader without reopening already-complete replatform tranches. The repo evidence now shows that product draft CRUD, bulk ingest, sync publish, submission export, and storefront freshness are already cloud-capable. The next bounded gap is hosted currency-rate persistence, followed by a deliberate checkpoint on whether local-FS default branching should remain as a dev-only lane or be removed in a later cleanup pass.

## Inherited Outcome Contract
- **Why:** The hosted XA uploader path is mostly cloud-native now, but one remaining local-only operator flow still breaks parity and keeps the overall replatform state ambiguous.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA uploader hosted mode no longer depends on repo-local currency-rate state for routine operator flows, and the remaining local-FS cleanup question is reduced to an explicit follow-up decision.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-cloud-parity-completion/fact-find.md`
- Key findings used:
  - The earlier cloud replatform, upload-to-display, and xa-b runtime plans are complete.
  - Currency-rate editing is the remaining confirmed hosted/local parity gap.
  - Local-FS branch removal should be treated as a separate decision after hosted parity exists.

## Active tasks
- [x] TASK-01: Capture canonical hosted-vs-local parity matrix and narrow the next slice
- [ ] TASK-02: Move currency-rate persistence off repo-local JSON for hosted mode
- [ ] TASK-03: Run hosted parity checkpoint and decide local-FS cleanup follow-up

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Persist canonical parity matrix and confirm the next bounded replatform slice | 94% | S | Complete (2026-03-09) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Add cloud-backed currency-rate persistence and consume it in hosted uploader flows | 83% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | CHECKPOINT | Verify hosted parity after TASK-02 and decide whether local-FS cleanup becomes a new tranche | 88% | S | Pending | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock the actual remaining scope before touching runtime code |
| 2 | TASK-02 | TASK-01 | Single bounded implementation slice |
| 3 | TASK-03 | TASK-02 | Decision checkpoint after hosted parity lands |

## Tasks

### TASK-01: Capture canonical hosted-vs-local parity matrix and narrow the next slice
- **Type:** INVESTIGATE
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:**
  - `docs/plans/xa-uploader-cloud-parity-completion/fact-find.md`
  - `docs/plans/xa-uploader-cloud-parity-completion/cloud-parity-matrix.md`
  - `docs/plans/xa-uploader-cloud-parity-completion/plan.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 94%
  - Implementation: 95% - required evidence already exists in code and prior plans.
  - Approach: 94% - parity-matrix-first avoids reopening solved tranches.
  - Impact: 92% - removes ambiguity about what is actually left to replatform.
- **Acceptance:**
  - A canonical parity matrix exists under this plan directory.
  - The matrix distinguishes completed cloud-capable flows from the remaining hosted gap.
  - The next build slice is narrowed to one bounded implementation objective.
- **Validation contract (TC-01):**
  - `rg -n "currency_rates_local_fs_required" apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
  - `rg -n "local-FS constrained|Currency-rates API is repo-local FS only|Hosted uploader can list/save/delete product drafts in cloud mode" docs/plans/xa-two-lane-free-tier-hardening/fact-find.md docs/plans/xa-uploader-free-tier-hardening/plan.md docs/plans/xa-uploader-cloud-free-tier-replatform/plan.md`
  - `rg -n "catalog-public/xa-b|no longer depends on rebuilds for ordinary catalog freshness" docs/plans/xa-b-live-catalog-client-runtime/plan.md`
- **Build completion evidence:**
  - Added `docs/plans/xa-uploader-cloud-parity-completion/cloud-parity-matrix.md` to record the real post-replatform hosted/local state.
  - Confirmed the remaining hosted parity gap is currency-rate persistence, not core draft/sync/submission/storefront freshness.
  - Narrowed the next implementation task to one bounded hosted-safe slice.

### TASK-02: Move currency-rate persistence off repo-local JSON for hosted mode
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - `apps/xa-drop-worker/src/index.ts`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/CurrencyRatesPanel.test.tsx`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 83%
  - Implementation: 82% - contract-worker storage and uploader route patterns already exist.
  - Approach: 85% - reuse the existing Cloudflare contract boundary instead of introducing new storage paths.
  - Impact: 83% - removes the last confirmed hosted parity break in routine operator flows.
- **Acceptance:**
  - Hosted mode no longer returns `currency_rates_local_fs_required` for GET/PUT currency-rate operations.
  - Sync reads the same canonical currency-rate source in hosted mode as the editor writes.
  - Existing local/dev behavior remains deterministic until a separate cleanup decision is made.

### TASK-03: Run hosted parity checkpoint and decide local-FS cleanup follow-up
- **Type:** CHECKPOINT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/xa-uploader-cloud-parity-completion/plan.md`
  - `docs/plans/xa-uploader-cloud-parity-completion/build-record.user.md`
  - `docs/plans/xa-uploader-cloud-parity-completion/results-review.user.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 88% - checkpoint criteria are now explicit and bounded.
  - Approach: 89% - separates parity verification from a larger local-FS removal decision.
  - Impact: 86% - prevents the next tranche from drifting into accidental scope expansion.
- **Acceptance:**
  - Hosted parity is re-checked against the canonical matrix.
  - The plan records whether local-FS default branching stays as dev-only support or becomes a separate cleanup feature.
  - No new local-only hosted blocker remains undocumented.

## Risks & Mitigations
- Risk: TASK-02 drifts into full local-FS removal.
  - Mitigation: keep acceptance scoped to currency-rate persistence only.
- Risk: hosted rate storage forks from sync consumption.
  - Mitigation: route both read/write and sync consumption through one canonical source.
- Risk: current dirty xa-uploader worktree complicates implementation timing.
  - Mitigation: this tranche starts with evidence capture; code implementation should proceed as a bounded follow-up cycle with current file state reviewed first.

## Decision Log
- 2026-03-09: Chose parity-matrix-first scope control rather than pretending the remaining cloud replatform was still a broad architectural migration.
- 2026-03-09: Chose currency-rate persistence as the next bounded slice because it is the clearest remaining hosted/local parity break in current repo state.
