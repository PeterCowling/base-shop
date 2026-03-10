---
Status: Complete
Feature-Slug: lp-do-ideas-execution-guarantee
Completed-date: 2026-03-02
artifact: build-record
Build-Event-Ref: docs/plans/lp-do-ideas-execution-guarantee/build-event.json
---

# Build Record: lp-do-ideas Execution Guarantee

## What Was Built

**TASK-01 — Queue check gate hardened:** `.claude/skills/_shared/queue-check-gate.md` was updated to require the agent to verify the fact-find artifact exists on disk before writing `processed_by`. The existing instruction at line 36 now reads: "After artifact persistence is confirmed, and before writing `processed_by`, verify the artifact file at `fact_find_path` exists on disk (use the Read or Bash tool). If the file does not exist: do not write `processed_by`; instead, surface an error naming the dispatch (`dispatch_id`) and the missing `fact_find_path`. If the file exists, populate `processed_by`…". This guard covers both fact-find mode and briefing mode. No other text in the file was changed.

**TASK-02 — Queue audit utility created:** `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` was created as a new read-only TypeScript module. It exports `detectMissingArtifacts(options)` and the `MissingArtifactEntry` type. The function reads `queue-state.json` via an injectable `readFileSyncFn` seam, iterates `dispatches[]`, and returns entries where `processed_by.fact_find_path` is set but the resolved file path does not exist. Entries without `processed_by` or without a `fact_find_path` field are skipped. The function throws with an informative message on read failure or malformed schema. No side effects.

**TASK-03 — Unit tests added:** `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-audit.test.ts` was created with 5 test cases (TC-01 through TC-05) covering all nominal and edge paths. Tests use `@jest/globals` and injectable mocks for both `existsSync` and `readFileSyncFn` — no real filesystem access, no tmp directory.

## Tests Run

- Governed Jest run for TASK-03: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-queue-audit --no-coverage`
  - Result: **PASS** — 5/5 tests passed (TC-01, TC-02, TC-03, TC-04, TC-05)
- TypeScript check for TASK-02: `pnpm exec tsc --noEmit -p tsconfig.json` (from `scripts/`) — clean, 0 errors.
- No tests exist for TASK-01 (prose instruction file — not testable by automated means; acceptance validated by reading the updated file).

## Validation Evidence

**TASK-01:**
- TC-01: `queue-check-gate.md` line 36 contains explicit "verify the artifact file at `fact_find_path` exists on disk" step before `processed_by` write — confirmed by file read.
- TC-02: No auto-invocation language added. "operator confirms invocation" requirement intact (line 41 unchanged: "If the operator replies anything other than **yes**, or does not reply: stop.").

**TASK-02:**
- Export signature matches contract: `detectMissingArtifacts({ queueStatePath, basedir, existsSync?, readFileSyncFn? }): MissingArtifactEntry[]`.
- `MissingArtifactEntry` exported: `{ dispatch_id: string; fact_find_path: string; queue_state: string | undefined }`.
- Schema guard present: throws "Invalid queue-state.json: expected top-level 'dispatches' array…" when `dispatches` key is missing or not an array.
- No disk writes confirmed by code review.

**TASK-03:**
- TC-01: all paths present → returns `[]` ✓
- TC-02: 2 of 4 paths missing → returns array of 2 with correct ids/paths ✓
- TC-03: no `processed_by` entries → returns `[]` ✓
- TC-04: `processed_by` without `fact_find_path` → returns `[]` ✓
- TC-05: `readFileSyncFn` throws → `detectMissingArtifacts` throws ✓

## Scope Deviations

One controlled expansion within TASK-02 scope: added `readFileSyncFn` injectable seam (not listed in original fact-find but added during plan critique to make TC-05 testable without real filesystem access). This was already documented in the final plan's Decision Log (2026-03-02 entry) and accepted by the critique round 2 reviewer.

## Outcome Contract

- **Why:** The queue pipeline records routing intent without enforcing execution — 31/67 dispatches with `processed_by` set have no fact-find artifact on disk. This creates false confidence that work was done and permanently loses those dispatches from the queue without any output.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this fix, a dispatch entry will only be marked as processed when the fact-find artifact can be verified on disk, and any existing `processed_by`-without-artifact entries can be detected and reported by a read-only detection utility.
- **Source:** auto
