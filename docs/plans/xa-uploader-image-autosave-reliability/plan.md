---
Type: Plan
Status: Draft
Domain: Products
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-image-autosave-reliability
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Image Autosave Reliability Plan

## Summary
`xa-uploader` can drop image auto-save attempts during rapid consecutive uploads because image upload completion triggers `onImageUploaded(nextDraft)` while save actions are guarded by a single global busy lock. When a save is in flight, subsequent auto-save attempts may return early and never flush the latest draft to persistence. This plan hardens the image autosave flow so every uploaded image key is eventually persisted without requiring manual Save clicks.

The design must keep two hard constraints:
- Cloudflare free tier only.
- Remain a web app (no desktop/native/offline app migration).

## Evidence
- Image upload appends key to draft and immediately calls autosave callback:
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:461-463`
- Autosave callback maps to `handleSaveImpl(...)`:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:323-337`
- Save path drops duplicate/in-flight attempts via busy lock:
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:254`
- Existing test confirms duplicate saves are intentionally blocked while in-flight:
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx:229-260`

## Hard Constraints (Non-negotiable)
- Must run on current Cloudflare free-tier architecture.
- Must remain browser-based web app UX.
- No paid Cloudflare services may be introduced.
- No mandatory background workers/queues/cron/durable objects for this fix.

## Solution Scope
### In scope
- Client-side autosave queueing + flush semantics.
- Save conflict retry for image-only autosave path.
- Operator-visible internal status (`saving`, `saved`, `unsaved`) in uploader console.
- Tests for rapid upload/save race behavior.

### Out of scope
- Non-web deployment model changes.
- Cloudflare paid service adoption.
- Replacing CSV/cloud-draft persistence model.

## Approach Options
### Option A (Chosen): Client-side latest-wins autosave queue + flush barrier
- Keep current APIs.
- Queue latest draft while save is in flight (never drop).
- Flush pending draft immediately after in-flight save completes.
- Gate sync trigger while autosave is pending.
- Add one-retry merge strategy on revision conflict.
- Infra impact: none (free-tier safe).

### Option B (Deferred): Server-side atomic image-attach endpoint
- Add endpoint that uploads and appends image key in one mutation.
- Stronger atomicity, but larger API/state-contract change.
- Still free-tier compatible, but higher implementation risk and migration cost.

Chosen now: Option A first, Option B only if Option A fails acceptance criteria.

## Free-Tier Compliance Check
- Uses existing Next/Worker request path only.
- No new Cloudflare products.
- No new scheduled/background compute.
- No additional persistent infra beyond existing CSV/cloud draft contract.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add autosave queue state and flush loop (latest-wins) in console hook layer | 88% | M | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add autosave conflict-safe retry + sync gating while autosave pending | 84% | M | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add uploader internal status messaging (`saving/saved/unsaved`) and explicit manual Save fallback copy | 90% | S | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add regression tests for rapid consecutive uploads and autosave flush guarantees | 85% | M | Pending | TASK-02, TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Validation checkpoint and rollout | 95% | S | Pending | TASK-04 | - |

## Tasks
### TASK-01: Autosave queue + flush loop
- **Type:** IMPLEMENT
- **Deliverable:** code-change — autosave queue logic in console hook layer
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `[readonly] apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 88%
  - Implementation: 88% - queue pattern is standard React ref + effect; no new APIs
  - Approach: 90% - latest-wins is the simplest correct strategy for this race
  - Impact: 86% - eliminates the primary data-loss vector but merge conflicts are handled separately in TASK-02
- **Acceptance:**
  - Rapid upload A→B while save A is in flight results in persisted draft containing both image keys.
  - Manual Save button remains functional and compatible with queue state.
- **Validation contract (TC-01):**
  - TC-01: Two rapid autosave calls while first is in-flight → second draft queued, not dropped → after first save completes, queued draft is flushed → final persisted state includes all image keys
  - TC-02: Manual Save clicked while autosave queued → manual save takes priority → queue cleared after manual save completes
- **Execution plan:** Red → Green → Refactor
  - Red: write test for rapid dual autosave (TC-01) expecting queue flush; test fails
  - Green: add `pendingDraftRef` to hold latest-wins draft; add flush callback in save completion path
  - Refactor: extract queue logic into a named helper; ensure `busyLockRef` interaction is clean
- **Planning validation (required for M):**
  - Checks run: verified `tryBeginBusyAction` returns false when busy (catalogConsoleFeedback.ts:134-142); verified `handleSaveWithDraft` delegates to `handleSaveImpl` sharing `busyLockRef` (useCatalogConsole.client.ts:323-337)
  - Validation artifacts: existing TC-04 test at action-feedback.test.tsx:229 confirms busy lock behavior
  - Unexpected findings: none
- **Consumer tracing:**
  - New output: `pendingDraftRef.current` (queued draft state). Consumers: flush callback (same file), manual save path (must clear queue on manual save).
  - Modified behavior: `handleSaveImpl` completion path now checks `pendingDraftRef` and re-invokes save. Callers: `handleSave` (manual), `handleSaveWithDraft` (autosave from image upload) — both compatible since they already share `busyLockRef`.
- **Scouts:** None: queue pattern is well-understood; no external dependency risk
- **Edge Cases & Hardening:**
  - Edge: three+ rapid uploads during single in-flight save → latest-wins means only final draft queued, intermediate states intentionally discarded (they are subsets of the final state)
  - Edge: component unmount during queued flush → cleanup effect must cancel pending flush to prevent state update on unmounted component
- **What would make this >=90%:**
  - Integration test with controlled network delays verifying multi-upload flush
- **Rollout / rollback:**
  - Rollout: deploy with existing xa-uploader release flow
  - Rollback: revert commit; busy lock returns to current drop-on-conflict behavior
- **Documentation impact:** None: internal implementation change
- **Notes / references:**
  - Existing busy lock at catalogConsoleActions.ts:254

### TASK-02: Conflict retry + sync gating
- **Type:** IMPLEMENT
- **Deliverable:** code-change — conflict retry for autosave path + sync button gating
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 84%
  - Implementation: 82% - merge logic for pipe-delimited image fields needs careful string handling
  - Approach: 86% - single-retry with field-scoped merge is conservative and correct
  - Impact: 84% - prevents conflict-induced data loss on the autosave path
- **Acceptance:**
  - No sync run can start while pending image autosave exists.
  - Single 409 revision_conflict on autosave does not force manual recovery for normal image-upload flow.
- **Validation contract (TC-03):**
  - TC-03: Autosave returns 409 → handler reloads server draft → merges aligned image tuples (`file|role|alt`) with local precedence on same file key → retries save once → succeeds
  - TC-04: Second 409 on retry → stop retrying, surface error to operator, do not loop
  - TC-05: Sync button clicked while `isAutosaveDirty` is true or save is in-flight → sync action is blocked with visible indicator
- **Merge strategy (specifics):**
  - On 409: fetch fresh server draft via GET
  - Parse server and local image data into aligned tuples by index: `{file, role, alt}` from `imageFiles|imageRoles|imageAltTexts`
  - Merge tuples keyed by normalized `file` path; local tuple wins on key collision
  - Preserve deterministic order: keep existing server tuple order, append local-only tuples at the end
  - Rebuild `imageFiles`, `imageRoles`, and `imageAltTexts` from the merged tuple list so field lengths stay aligned
  - Non-image fields: local draft wins (unchanged between autosave attempts)
  - Retry the merged draft as a new POST with the fresh revision token
- **Execution plan:** Red → Green → Refactor
  - Red: write test for 409-then-retry scenario (TC-03); test fails
  - Green: add retry branch in `handleSaveImpl` error path with tuple-preserving merge; add `isAutosaveDirty` signal to gate sync button and wire it through `CatalogConsole` into `CatalogSyncPanel`
  - Refactor: extract merge helper for pipe-delimited image fields
- **Planning validation (required for M):**
  - Checks run: verified products API returns 409 with revision_conflict code on stale revision; verified `CatalogConsole` currently wires state to `CatalogSyncPanel` and must pass new `isAutosaveDirty` signal
  - Validation artifacts: pipe-delimited format confirmed in catalogDraft.ts and catalogDraftToContract.ts
  - Unexpected findings: none
- **Consumer tracing:**
  - New output: `isAutosaveDirty` boolean signal. Consumers: `CatalogConsole` (threads state), `CatalogSyncPanel` (disables sync and shows pending-autosave readiness state), `useCatalogConsole` (exposes it in return value).
  - Modified behavior: `handleSaveImpl` error path now catches 409 and retries. All callers (`handleSave`, `handleSaveWithDraft`) benefit transparently.
- **Scouts:** None: 409 handling is standard REST; retry-once prevents loops
- **Edge Cases & Hardening:**
  - Edge: tuple merge receives mismatched field lengths from stale server data → normalize missing role/alt to empty string before merge, then validate schema before retry
  - Edge: non-image field also changed between client draft and server draft → non-image fields use local-wins (acceptable because autosave only triggers on image changes)
  - Edge: merged draft still conflicts on retry → surface error to operator; do not retry infinitely
- **What would make this >=90%:**
  - Explicit fixtures for mixed local edits + image append proving field-scoped merge correctness
- **Rollout / rollback:**
  - Rollout: deploy with xa-uploader release
  - Rollback: revert commit; 409s fall through to existing error display
- **Documentation impact:** None: internal error handling change
- **Notes / references:**
  - Pipe-delimited image field format: `catalogDraft.ts` `buildEmptyDraft()`

### TASK-03: Internal status UX (operator-facing only)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — autosave status indicator in product form
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% - simple conditional text based on existing state signals
  - Approach: 90% - standard UX pattern for save status
  - Impact: 88% - operator can confirm image persistence before sync
- **Acceptance:**
  - Operator can tell whether latest image keys are persisted before sync.
  - One of three states displayed: `Saving image changes...`, `All image changes saved`, `Unsaved image changes`.
  - No customer-facing site changes.
- **Expected user-observable behavior:**
  - [ ] After uploading an image, status shows "Saving image changes..."
  - [ ] After autosave completes successfully, status shows "All image changes saved"
  - [ ] If autosave is queued but not yet flushed, status shows "Unsaved image changes"
- **Validation contract (TC-04):**
  - TC-06: Image uploaded → status text shows "Saving image changes..." → save completes → status shows "All image changes saved"
  - TC-07: Rapid uploads → status shows "Unsaved image changes" while queue dirty → flushes → shows "All image changes saved"
- **Execution plan:** Red → Green → Refactor
  - Red: write test asserting status text transitions (TC-06)
  - Green: derive `autosaveStatus` from React state (`isAutosaveDirty`, in-flight save state, last autosave success timestamp) rather than refs-only signals; add i18n keys; render in form
  - Refactor: clean up any inline conditionals
- **Scouts:** None: simple UI text change
- **Edge Cases & Hardening:**
  - Edge: rapid state transitions can flicker status text → debounce only visual transition from `saving` to `saved` while keeping source-of-truth in state
- **What would make this >=90%:**
  - Visual regression test confirming all three states render correctly
- **Rollout / rollback:**
  - Rollout: deploy with xa-uploader release
  - Rollback: revert commit; status text disappears (no functional regression)
- **Documentation impact:** None: operator-internal UX
- **Notes / references:** None

### TASK-04: Regression tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change — regression test suite for autosave race conditions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`
  - (if needed) new test file `apps/xa-uploader/src/components/catalog/__tests__/autosave-queue.test.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - test harness exists; extending for async race scenarios needs controlled promises
  - Approach: 88% - deterministic promise control is proven pattern in existing TC-04 test
  - Impact: 82% - tests verify the race fix works but cannot fully simulate real network timing
- **Acceptance:**
  - Deterministic green tests covering the rapid-upload race path.
  - Tests assert eventual persisted state includes latest key set.
  - Tests assert sync action blocked during autosave dirty state.
- **Validation contract (TC-05):**
  - TC-08: Exercise TC-01 through TC-07 as implemented tests → all pass deterministically
  - TC-09: Existing TC-04 (busy lock test at action-feedback.test.tsx:229) still passes (no regression)
- **Execution plan:** Red → Green → Refactor
  - Red: write test stubs for TC-01 through TC-07 → initially failing
  - Green: implement tests using controlled promise resolution (same pattern as existing TC-04)
  - Refactor: extract shared test helpers for controlled-timing save mocks
- **Planning validation (required for M):**
  - Checks run: verified existing test harness uses `jest.fn()` for fetch with controlled promise resolution; pattern reusable
  - Validation artifacts: action-feedback.test.tsx:229-268 provides reference pattern
  - Unexpected findings: none
- **Scouts:** None: test infrastructure is established
- **Edge Cases & Hardening:**
  - Edge: test flakiness from timing → use explicit `act()` + `waitFor()` with controlled promise resolution, never real timeouts
- **What would make this >=90%:**
  - Integration test with real component render + simulated network delays
- **Rollout / rollback:**
  - Rollout: tests run in CI automatically
  - Rollback: N/A (tests only)
- **Documentation impact:** None
- **Notes / references:**
  - Reference: existing TC-04 test pattern at action-feedback.test.tsx:229

### TASK-05: Validation checkpoint and rollout
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via /lp-do-build checkpoint run
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/xa-uploader-image-autosave-reliability/plan.md`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents shipping without full validation
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - All prior TCs passing in CI
  - Plan updated with build evidence
- **Horizon assumptions to validate:**
  - All TASK-01 through TASK-04 acceptance criteria met
  - No regressions in existing xa-uploader test suite
  - Typecheck and lint clean: `pnpm --filter @apps/xa-uploader typecheck && pnpm --filter @apps/xa-uploader lint`
- **Validation contract:** CI job for `@apps/xa-uploader` passes with all new tests green
- **Planning validation:** /lp-do-build checkpoint evidence path from TASK-04 results
- **Rollout / rollback:** `None: planning control task`
- **Rollout checklist:**
  - Verify Add flow (multi-image rapid upload)
  - Verify Edit flow (append image to existing item)
  - Verify sync remains disabled until autosave settled
- **Documentation impact:** plan.md updated with build evidence

## Inherited Outcome Contract
- **Why:** Prevent uploaded image keys from being lost during rapid consecutive uploads.
- **Intended Outcome Type:** Reliability hardening (operator workflow integrity).
- **Intended Outcome Statement:** For Add and Edit flows, each successful image upload is eventually persisted to the draft without requiring manual Save retries, and Sync stays blocked until autosave settles.
- **Source:** user-reported rapid-upload autosave race (2026-03-04 thread)

## Disallowed Implementations (by constraints)
- Cloudflare Queues for autosave events.
- Durable Objects for save coordination.
- Cron-triggered reconciliation jobs.
- Any non-web app replacement (desktop/local client).

## Risks & Mitigations
- Risk: Queue logic introduces stale-draft writes.
  - Mitigation: latest-wins queue + revision update after each save + focused race tests.
- Risk: conflict retry merges wrong fields.
  - Mitigation: merge aligned image tuples (`file`,`role`,`alt`) keyed by normalized file path; schema-validate merged draft before retry.
- Risk: sync gating frustrates operators.
  - Mitigation: clear in-panel status + quick flush loop (single pending draft).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (all IMPLEMENT tasks >=80%, unblocked)

## Overall-confidence Calculation
- Task weights: `S=1`, `M=2` (CHECKPOINT tasks excluded from confidence calc)
- Weighted score (IMPLEMENT tasks only):
  - `(88*2 + 84*2 + 90*1 + 85*2) / (2+2+1+2)`
  - `= 604 / 7 = 86.3%`
- Rounded Overall-confidence: `86%`

## What would make this >=90%
- Add a production-like integration test with controlled delayed save responses and multiple upload completions.
- Prove conflict-retry merge logic with explicit fixtures for mixed local edits + image append.
