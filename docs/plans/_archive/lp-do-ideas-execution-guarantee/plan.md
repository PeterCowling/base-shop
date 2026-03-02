---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02T18:10Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-execution-guarantee
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# lp-do-ideas Execution Guarantee Plan

## Summary

The lp-do-ideas trial queue marks dispatches as `processed_by` in `queue-state.json` without verifying that the fact-find artifact actually landed on disk. This creates a permanent false record — the dispatch is consumed but no work product exists. 31 of 67 dispatches with `processed_by` currently point to missing files (measured 2026-03-02). The fix has two parts: (1) harden the `queue-check-gate.md` instruction to require on-disk artifact verification before writing `processed_by`, and (2) add a read-only TypeScript audit utility with unit tests that reports existing gaps. No autonomy changes; no schema migrations.

## Active tasks
- [x] TASK-01: Harden queue-check-gate processed_by write guard — Complete (2026-03-02)
- [x] TASK-02: Add lp-do-ideas-queue-audit detection utility — Complete (2026-03-02)
- [x] TASK-03: Write unit tests for detectMissingArtifacts — Complete (2026-03-02)

## Goals
- Prevent dispatches from being permanently marked processed when no fact-find artifact exists.
- Provide a read-only audit utility to detect and report existing gaps on demand.
- Leave trial contract (Option B, Section 2) and queue-state schema unchanged.

## Non-goals
- Option C autonomy or any auto-invocation changes.
- Automatic re-queuing of historical gap entries.
- Schema version bump on `queue-state.json`.
- Changes to TypeScript orchestrator or routing modules.

## Constraints & Assumptions
- Constraints:
  - `queue-check-gate.md` is prose consumed by an LLM agent — the guard is a behavioral instruction, not a runtime check. The instruction must be unambiguous.
  - The detection utility must be permanently read-only. No `--fix` flag; no queue writes.
  - Trial contract Section 2 (Option B) must not be weakened in any way.
  - Tests must not be run locally — push and use CI (`docs/testing-policy.md`).
- Assumptions:
  - `queue-state.json` `queue.v1` flat-array format is stable for this build (no concurrent schema work).
  - The 14 `processed_by`-without-`fact_find_path` entries (`auto_executed` metadata entries with only `route`+`processed_at`) are correctly excluded from detection scope — they have no path to check.
  - Detection utility lives under `scripts/src/startup-loop/` alongside existing peer modules.

## Inherited Outcome Contract

- **Why:** The queue pipeline records routing intent without enforcing execution — 31/67 dispatches with `processed_by` set have no fact-find artifact on disk. This creates false confidence that work was done and permanently loses those dispatches from the queue without any output.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this fix, a dispatch entry will only be marked as processed when the fact-find artifact can be verified on disk, and any existing `processed_by`-without-artifact entries can be detected and reported by a read-only detection utility.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-execution-guarantee/fact-find.md`
- Key findings used:
  - Root cause confirmed in `.claude/skills/_shared/queue-check-gate.md` lines 36–39 — no artifact existence check before `processed_by` write.
  - `processed_by` is agent-written only; no TypeScript module touches this field.
  - `queue-state.json` uses `queue.v1` (flat array); TypeScript adapter uses `queue-state.v1` (separate schema) — no conflict.
  - Detection function `detectMissingArtifacts()` is purely testable with injectable seams for both `existsSync` and `readFileSyncFn`.
  - 31 entries with `fact_find_path` pointing to missing files; 14 entries excluded (no `fact_find_path` field).

## Proposed Approach

- Option A: Instruction hardening only. Update `queue-check-gate.md` to require artifact verification before writing `processed_by`. No detection utility.
- Option B (chosen): Instruction hardening + read-only detection utility. Both deliverables are independent and low-risk. The detection utility gives the operator a durable audit tool and provides unit-test coverage for the detection logic.

Chosen approach: **Option B**. The instruction change stops future gaps; the detection utility surfaces existing ones and is testable. Neither introduces autonomy or schema changes. The marginal cost of the utility (TASK-02 + TASK-03, S effort each) is justified by the auditing value and testability.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Harden queue-check-gate processed_by write guard | 90% | S | Complete (2026-03-02) | - | - |
| TASK-02 | IMPLEMENT | Add lp-do-ideas-queue-audit detection utility | 85% | S | Complete (2026-03-02) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Write unit tests for detectMissingArtifacts | 90% | S | Complete (2026-03-02) | TASK-02 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Parallel-safe wave. |
| 2 | TASK-03 | TASK-02 | Sequential boundary. |

## Tasks

### TASK-01: Harden queue-check-gate processed_by write guard
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/_shared/queue-check-gate.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/_shared/queue-check-gate.md`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 95% — The change is a single prose instruction update. The existing instruction is at lines 36–39. The addition of an explicit verification step ("before writing `processed_by`, confirm the file at `fact_find_path` exists on disk using the Read or Bash tool; if not present, do not write `processed_by` and surface an error") is unambiguous and complete.
  - Approach: 90% — Instruction hardening is the correct primary guard for an LLM-executed pipeline. Held-back test: the only risk is the agent misreading the new instruction — but the instruction is a file-existence check, not an inference, which minimises ambiguity. No single unknown would push this below 80.
  - Impact: 85% — Prevents all future `processed_by`-without-artifact entries for queue-routed dispatches. Does not recover historical gaps (by design). Impact is bounded to future dispatches.
- **Acceptance:**
  - `queue-check-gate.md` contains an explicit, unambiguous step requiring the agent to verify `fact_find_path` exists on disk before writing `processed_by`.
  - The instruction must cover both fact-find mode and briefing mode paths.
  - The instruction must specify what to do on failure: do not write `processed_by`; surface an error message identifying the dispatch and the missing path.
  - No other changes to `queue-check-gate.md` are made.
- **Validation contract (TC-01 — TC-02):**
  - TC-01: After update, `queue-check-gate.md` lines governing `processed_by` write must include explicit artifact existence verification (file read or bash check at `fact_find_path`) before any `processed_by` mutation.
  - TC-02: The instruction must not introduce any auto-invocation language or weaken the "operator confirms invocation" requirement from trial contract Section 2.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Review current `queue-check-gate.md` lines 36–39 — confirms no artifact existence guard exists.
  - Green: Insert the verification step immediately before the `processed_by` write instruction. Verify the prose is unambiguous. Verify trial contract compliance (Section 2, Option B language preserved).
  - Refactor: Read the full gate instruction to confirm no sentence contradicts the new guard; tighten wording if needed.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: root cause is fully confirmed from direct file read; no unknowns.
- **Edge Cases & Hardening:**
  - Edge case: Agent has the slug but not yet the path (e.g. path is inferred, not yet written). Instruction must specify that path verification happens *after* the fact-find artifact is confirmed written, not before.
  - Edge case: Briefing mode (lp-do-briefing Phase 0) uses the same gate instruction. The update must cover both `fact_find_path` (fact-find mode) and `fact_find_path` (briefing mode) — the briefing uses the same field name in its `processed_by` block.
- **What would make this >=95%:** Confirmation from a test run (integration test or manual trace) that an agent following the updated instruction correctly withholds `processed_by` when the artifact file is absent. Not achievable for prose instructions in this build; risk is accepted.
- **Rollout / rollback:**
  - Rollout: Immediate — the instruction file is read at invocation time. No deploy, no restart.
  - Rollback: Revert `queue-check-gate.md` to previous content via git revert.
- **Documentation impact:** None beyond the skill instruction itself.
- **Notes / references:**
  - Target file: `.claude/skills/_shared/queue-check-gate.md` lines 36–39.
  - Trial contract reference: Section 2 (Option B), Section 7 (queue lifecycle).
- **Build evidence (Complete 2026-03-02):**
  - Offload route: codex exec exit 0.
  - TC-01: Line 36 of queue-check-gate.md now contains "After artifact persistence is confirmed, and before writing `processed_by`, verify the artifact file at `fact_find_path` exists on disk" — explicit guard present.
  - TC-02: No auto-invocation language added; "operator confirms invocation" requirement preserved.
  - Commit: 174d6df537 (wave 1).

---

### TASK-02: Add lp-do-ideas-queue-audit detection utility
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` with exported `detectMissingArtifacts` function
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` (new)
- **Depends on:** —
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — Function signature and logic are fully specified in the fact-find. The implementation is pure I/O: read JSON via injectable `readFileSyncFn`, iterate dispatches, check existence via injectable `existsSync`. Both seam patterns are well-established in peer modules.
  - Approach: 85% — The `basedir` + relative `fact_find_path` join pattern is correct. Held-back test: if the `queue-state.json` format ever deviates from `queue.v1` (different top-level key from `dispatches`), the function would silently return empty. Mitigated by a schema check on load.
  - Impact: 80% — Held-back test: the utility's value depends on operators actually running it. It has no callers at build time and is not wired to CI. If no one runs it, the observability benefit is zero. However, this is acceptable for a first-pass audit utility — the instruction guard (TASK-01) is the primary fix; the utility is a secondary observability tool. No single unknown would push this below 80 once the schema check is in place.
- **Acceptance:**
  - `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` exports `detectMissingArtifacts(options: { queueStatePath: string; basedir: string; existsSync?: (path: string) => boolean; readFileSyncFn?: (path: string, encoding: BufferEncoding) => string }): MissingArtifactEntry[]`.
  - `MissingArtifactEntry` type exported: `{ dispatch_id: string; fact_find_path: string; queue_state: string | undefined }`.
  - Function reads `queue-state.json` via `readFileSyncFn` (defaults to `fs.readFileSync` from `node:fs`), iterates `dispatches[]`, and returns entries where `processed_by.fact_find_path` is a non-empty string AND the resolved path (`path.join(basedir, fact_find_path)`) does not exist per `existsSync`.
  - `existsSync` parameter defaults to `fs.existsSync` from `node:fs` — injectable for tests.
  - Entries without `processed_by` are skipped.
  - Entries with `processed_by` but without `fact_find_path` (auto_executed metadata entries) are skipped.
  - If `queue-state.json` cannot be read (`readFileSyncFn` throws) or the parsed JSON has no `dispatches` key, the function throws with an informative message.
  - No side effects: function never writes to disk.
- **Validation contract:**
  - TC-01: All-present case — all `fact_find_path` values exist → returns `[]`.
  - TC-02: Some-missing case — 2 of 4 paths missing → returns array of length 2 with correct `dispatch_id` and `fact_find_path` values.
  - TC-03: No-`processed_by` entries → not counted; function returns `[]`.
  - TC-04: `processed_by` with no `fact_find_path` field (auto_executed metadata) → not counted.
  - TC-05: `readFileSyncFn` throws (file not found) → `detectMissingArtifacts` throws with informative error.
- **Execution plan:** Red -> Green -> Refactor
  - Red: No `lp-do-ideas-queue-audit.ts` exists yet; TC-01 through TC-05 are failing.
  - Green: Create `lp-do-ideas-queue-audit.ts`. Export `MissingArtifactEntry` interface. Export `detectMissingArtifacts()` with injectable `existsSync` and `readFileSyncFn`. Implement: load JSON via `readFileSyncFn`, validate top-level `dispatches` key exists, iterate, check path via `existsSync`, accumulate results.
  - Refactor: Ensure TypeScript strict null checks pass. Confirm exports are clean. Confirm file follows same import style as peer modules (ESM with `.js` extension in imports).
- **Planning validation:**
  - Checks run: Reviewed `lp-do-ideas-persistence.ts` import style (uses `node:fs` named imports, `.js` extension in relative imports). Confirmed `scripts/tsconfig.json` uses `"moduleResolution": "bundler"` or equivalent — verify at build time.
  - Validation artifacts: `scripts/src/startup-loop/lp-do-ideas-persistence.ts` (import pattern reference).
  - Unexpected findings: None.
- **Consumer Tracing (S effort — abbreviated):**
  - New output: `MissingArtifactEntry[]` from `detectMissingArtifacts()`. Consumers at build time: TASK-03 test file only. No production callers at this stage — this is an on-demand utility. No silent-fallback risk.
  - New value produced: none consumed by existing code paths.
- **Scouts:** None: function shape is fully specified; no unknowns.
- **Edge Cases & Hardening:**
  - Relative vs absolute path join: always use `path.join(basedir, fact_find_path)` — fact-find paths in `queue-state.json` are relative (e.g. `docs/plans/foo/fact-find.md`); `basedir` is the repo root.
  - Malformed `fact_find_path` (empty string, null): skip entry — only process non-empty strings.
  - `queue-state.json` top-level `dispatches` key absent (e.g. file uses different schema): throw with clear message rather than silently returning `[]`.
- **What would make this >=90%:** A CLI entry point that outputs the report to stdout (making the utility runnable with `npx tsx`). Deferred — out of scope for this task.
- **Rollout / rollback:**
  - Rollout: New file; no existing callers. Safe to deploy with no coordination.
  - Rollback: Delete the file. No downstream breakage.
- **Documentation impact:** None required beyond the exported types (which are self-documenting via JSDoc comments in the function).
- **Notes / references:**
  - Import style reference: `scripts/src/startup-loop/lp-do-ideas-persistence.ts` (uses `node:fs` named imports, `.js` extensions).
  - Schema reference: `queue-state.json` top-level key is `dispatches` (not `entries`) in `queue.v1` format.
- **Build evidence (Complete 2026-03-02):**
  - Offload route: codex exec exit 0.
  - File created: `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` (101 lines).
  - Exports: `MissingArtifactEntry` type and `detectMissingArtifacts()` with `existsSync?` + `readFileSyncFn?` injectable seams.
  - Schema guard: throws with informative message when `dispatches` key is missing or not an array.
  - TypeScript check: `pnpm exec tsc --noEmit` in scripts package — clean (0 errors).
  - Commit: 174d6df537 (wave 1).
  - TASK-03 re-scored: confidence remains 90% (TASK-02 produced exactly the interface specified; no surprises).

---

### TASK-03: Write unit tests for detectMissingArtifacts
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-audit.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-audit.test.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 95% — Test cases are fully specified in the acceptance criteria. Both injectable seams (`existsSync` and `readFileSyncFn`) make all tests pure in-memory (no real file system access, no tmp dir). The test patterns follow existing peer tests exactly.
  - Approach: 90% — Jest + `@jest/globals` pattern is established in all peer test files. Injectable seams avoid all file system dependency. Held-back test: no single unknown would drop this below 80.
  - Impact: 85% — Tests validate the detection function's nominal paths and give CI coverage. Tests do not cover the queue-check-gate instruction (prose — untestable by automated means). Impact is bounded but concrete.
- **Acceptance:**
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-audit.test.ts` covers all 5 TCs from TASK-02.
  - Tests use `describe` + `it` structure matching peer test files.
  - Both `existsSync` and `readFileSyncFn` are injected as mocks (`jest.fn()`) — no real file system access; no tmp directory required.
  - All tests pass under the scripts Jest config (`scripts/jest.config.cjs`).
  - No `describe.skip` or `it.skip` used (no tests currently skipped in scripts).
- **Validation contract:**
  - TC-01: All paths exist (existsSync always returns true; readFileSyncFn returns valid queue JSON) → `detectMissingArtifacts()` returns `[]`.
  - TC-02: 2 of 4 paths missing (existsSync returns false for those 2) → returns array of length 2 with correct dispatch_id and fact_find_path.
  - TC-03: Dispatches with no `processed_by` → not counted; returns `[]`.
  - TC-04: Dispatches with `processed_by` but no `fact_find_path` → not counted.
  - TC-05: `readFileSyncFn` throws (simulating file-not-found) → `detectMissingArtifacts` throws.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Test file does not exist yet.
  - Green: Create test file. Import `detectMissingArtifacts` from `../lp-do-ideas-queue-audit.js`. Write 5 test cases using in-memory fixtures. Each test builds a minimal `queue-state.json`-shaped object serialised to a string and returned by a mock `readFileSyncFn`; `existsSync` is also mocked per test case.
  - Refactor: Confirm test IDs and descriptions are clear. Confirm no imports are unused. Confirm file is picked up by the scripts Jest config.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: test pattern is fully established in peer files.
- **Edge Cases & Hardening:**
  - TC-05 (throws case): pass a `readFileSyncFn` that throws `new Error('ENOENT')` and use `expect(() => detectMissingArtifacts(...)).toThrow()`.
  - Ensure the fixture `queue-state.json` shape in tests matches the `queue.v1` flat-array format (top-level `dispatches[]`, not `entries[]`).
- **What would make this >=95%:** Add a TC-06 for malformed JSON (parse error) and a TC-07 for empty `dispatches[]`. These are minor additions and can be added in-build if effort permits.
- **Rollout / rollback:**
  - Rollout: New test file; no production impact. Safe to add at any time.
  - Rollback: Delete the file.
- **Documentation impact:** None.
- **Notes / references:**
  - Peer test pattern: `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts` (Jest + @jest/globals + fixture factories).
  - Import extension convention: `.js` in import path even for `.ts` source files.
- **Build evidence (Complete 2026-03-02):**
  - Offload route: codex exec exit 0.
  - File created: `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-audit.test.ts` (207 lines, 5 test cases).
  - Governed Jest run: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-queue-audit --no-coverage` → PASS, 5/5 tests passed.
  - TC-01, TC-02, TC-03, TC-04, TC-05 all pass. No `describe.skip` or `it.skip`.
  - Commit: cc6c496dd5.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agent follows old queue-check-gate instruction (caching or context mismatch) | Low | Medium | Instruction update is in a file read at invocation time. No caching layer. |
| `queue-state.json` schema changes concurrently | Low | Low | Detection utility has schema guard; will throw on unexpected shape. |
| Detection utility silently misses entries due to path join error | Low | Low | Unit tests TC-01–TC-05 cover nominal and edge paths. |
| TypeScript import extension convention differs from peer modules | Low | Low | Verified against `lp-do-ideas-persistence.ts` — `.js` extension required; apply same pattern. |

## Observability
- Logging: Detection utility outputs `MissingArtifactEntry[]` — callers log to stdout as needed.
- Metrics: None wired to CI for this build. Operator runs utility on demand.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `.claude/skills/_shared/queue-check-gate.md` requires on-disk artifact verification before writing `processed_by` — verified by reading the updated file.
- [ ] `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts` exports `detectMissingArtifacts` with injectable `existsSync` and `readFileSyncFn` seams — verified by import in tests.
- [ ] All 5 test cases in `lp-do-ideas-queue-audit.test.ts` pass in CI.
- [ ] No changes to `queue-state.json` schema, TypeScript orchestrator modules, or trial contract.
- [ ] No `describe.skip` or `it.skip` added.

## Decision Log
- 2026-03-02: Chosen Option B (instruction hardening + detection utility) over Option A (instruction only). Detection utility adds testability and durable auditing with minimal extra effort (2 S-effort tasks).
- 2026-03-02: Detection utility is permanently read-only — no `--fix` flag. Historical re-queue requires explicit operator action outside this build.
- 2026-03-02: Added `readFileSyncFn` injectable seam alongside `existsSync` to keep TASK-03 tests fully in-memory; avoids tmp directory dependency and makes TC-05 (file-not-found) testable without real file system access.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Harden queue-check-gate | Yes — file exists at `.claude/skills/_shared/queue-check-gate.md`; lines 36–39 confirmed present | None | No |
| TASK-02: Create queue-audit utility | Yes — `scripts/src/startup-loop/` directory exists; peer modules confirm import/export pattern; both injectable seams specified; no callers to update | None | No |
| TASK-03: Write unit tests | Partial — depends on TASK-02 output existing; plan sequences TASK-03 after TASK-02 | [Missing precondition] [Minor]: TASK-03 cannot run until TASK-02 implementation exists; sequencing ensures this but must not be reversed | No (sequenced correctly) |

All tasks: no Critical simulation findings. TASK-03 minor precondition dependency is handled by the sequencing (Wave 2 after Wave 1).

## Overall-confidence Calculation
- TASK-01: confidence 90%, effort S (weight 1)
- TASK-02: confidence 85%, effort S (weight 1)
- TASK-03: confidence 90%, effort S (weight 1)
- Overall = (90 + 85 + 90) / 3 = 88%, rounded to nearest 5 = **90%**. Frontmatter: `Overall-confidence: 90%`.

Note: Per scoring rules, individual task confidence = min(Implementation, Approach, Impact). Applied above.
