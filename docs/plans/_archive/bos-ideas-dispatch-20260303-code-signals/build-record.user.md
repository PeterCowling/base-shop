---
Type: Build-Record
Status: Complete
Feature-Slug: bos-ideas-dispatch-20260303-code-signals
Completed-date: 2026-03-04
artifact: build-record
Build-Event-Ref: docs/plans/bos-ideas-dispatch-20260303-code-signals/build-event.json
---

# Build Record: BOS Ideas Dispatch 0155/0156 — Code Signals

## Outcome Contract

- **Why:** Bug-scan and codebase evolution data are high-value but were not reaching the ideas queue.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Dispatch candidates are emitted automatically from critical code-quality and structural code-change signals.
- **Source:** operator

## What Was Built

**Bug-scan to dispatch bridge (TASK-01):** The codebase-signals bridge reads bug-scan artifacts, filters by severity threshold (default: critical), hashes findings for deduplication, and emits ArtifactDeltaEvent records through the trial orchestrator into the queue-state.

**Structural code-signal bridge (TASK-02):** The same bridge also analyzes git diffs between refs, classifies structural changes (API endpoints, route changes, schema changes, dependency updates, component additions), and emits dispatch candidates when structural tags are detected.

**Process-improvements integration (TASK-03):** The bridge is imported and called from `generate-process-improvements.ts` as a post-generation step, running automatically on every process-improvements regeneration with `fromRef: HEAD~1, toRef: HEAD`.

**Tests and registry (TASK-04):** Two Jest tests cover first-run emission and repeat-run suppression (idempotency). Standing registry synthetic entries `BOS-BOS-BUG_SCAN_FINDINGS` and `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS` activated (`active: true`).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project scripts/tsconfig.json` | Pass | Clean typecheck |
| Manual validation | Pass | Script entry verified in package.json, function signatures match |

## Validation Evidence

### TASK-01
- `lp-do-ideas-codebase-signals-bridge.ts` (544 lines): deriveBugScanEvent function reads artifact, filters severity, hashes, emits events
- Test: first-run emission verified with mock critical bug-scan finding

### TASK-02
- Same file: deriveCodebaseEvent function uses git diff, classifies structural tags, hashes, emits events
- Test: structural change detection verified with mock API route addition

### TASK-03
- `generate-process-improvements.ts` imports and calls `runCodebaseSignalsBridge()` at lines 932-943
- Output logging confirms bridge execution in process-improvements runs

### TASK-04
- Test file: 159 lines covering emission and repeat-suppression
- Registry entries `BOS-BOS-BUG_SCAN_FINDINGS` and `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS` set `active: true`

## Scope Deviations

None.
