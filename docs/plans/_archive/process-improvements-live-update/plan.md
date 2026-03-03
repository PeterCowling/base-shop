---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-live-update
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Process-Improvements Live Update Plan

## Summary

The `process-improvements.user.html` operator dashboard is currently regenerated only by manual script invocation. This plan wires a conditional pre-commit hook that detects when `results-review.user.md`, `build-record.user.md`, or `reflection-debt.user.md` files are staged, runs the generator, and auto-stages the two output files in the same commit. A `--check` (drift-detection) mode is also added to the generator script for optional future CI use. The scope is four small tasks across two parallelism waves, with no deployment and no app code changes.

## Active tasks

- [x] TASK-01: Add conditional hook script `scripts/git-hooks/generate-process-improvements.sh` — Complete (2026-02-26)
- [x] TASK-02: Wire hook script into `scripts/git-hooks/pre-commit.sh` — Complete (2026-02-26)
- [x] TASK-03: Add `--check` mode and `runCheck()` export to `generate-process-improvements.ts` — Complete (2026-02-26)
- [x] TASK-04: Unit tests for `--check` mode in `generate-process-improvements.test.ts` — Complete (2026-02-26)

## Goals

- After any commit that stages a `results-review.user.md`, `build-record.user.md`, or `reflection-debt.user.md` file, `process-improvements.user.html` and `process-improvements.json` are regenerated and included in the same commit automatically.
- The hook is a no-op on commits that do not touch source files.
- The hook does not block commits for ordinary generator errors; only HTML-template corruption (missing array markers) is a hard failure.
- A `--check` mode is available for future CI drift detection.

## Non-goals

- Live in-memory dev server or file-watcher.
- Changing the generator's output format or collection logic.
- Adding a CI step for drift-check (stretch goal, not in this plan).
- Automating `generate-stage-operator-views` or `generate-build-summary`.

## Constraints & Assumptions

- Constraints:
  - All hook scripts use `set -euo pipefail`. The new script must follow the same convention.
  - The hook must not block commits for source-file parsing errors — only the HTML-marker invariant failure (missing `var IDEA_ITEMS =` etc.) is a legitimate block.
  - Invoking via `pnpm --filter scripts run startup-loop:generate-process-improvements` sets cwd to `scripts/`, so `path.resolve(cwd(), "..")` correctly resolves to the repo root (confirmed from source at line 527 of `generate-process-improvements.ts`).
  - `simple-git-hooks` config lives in root `package.json` under `"simple-git-hooks"` key; hook re-registration happens via `scripts/git-hooks/install-hooks.sh` (called by `prepare` lifecycle script).
  - Lint-staged only covers `*.{ts,tsx,js,jsx}` — cannot be used for `.md` file triggers.
- Assumptions:
  - `git add` inside a pre-commit hook reliably includes the added files in the commit in progress. This is standard git behavior.
  - The `BASESHOP_WRITER_LOCK_TOKEN` env var is exported by `require-writer-lock.sh` (which runs before the new hook step) so generator subprocesses that shell back to git inherit the token.

## Inherited Outcome Contract

- **Why:** The operator edits results-review, build-record, and reflection-debt files as part of normal build-loop work. The HTML view only updates when someone runs the script manually — this friction means the operator's dashboard is regularly out of date.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After any commit that touches source files under `docs/plans/`, the `process-improvements.user.html` and `process-improvements.json` are regenerated automatically in the same commit, without operator action.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/process-improvements-live-update/fact-find.md`
- Key findings used:
  - No CI workflow or pre-commit hook currently invokes any generation script (confirmed by full grep of `.github/workflows/*.yml` and reading `pre-commit.sh`).
  - `generate-process-improvements.ts` already handles all malformed source files gracefully; the only hard failure is the HTML-marker invariant.
  - Conditional staged-file detection pattern: `git diff --cached --name-only --diff-filter=ACMRTUXB` piped through a grep (from `typecheck-staged.sh` line 21).
  - `generate-stage-operator-views.ts` provides the exact `--check` mode pattern to follow (lines 657–678).
  - `simple-git-hooks` config is in root `package.json`; hook installation runs via `scripts/git-hooks/install-hooks.sh`.

## Proposed Approach

- Option A: Pre-commit hook (conditional on staged files, runs generator, auto-stages outputs).
- Option B: CI job that detects drift post-push and auto-commits a fix.
- Option C: Developer file-watcher (dev-only, does not affect committed state).
- Chosen approach: **Option A** — pre-commit hook. Keeps generated files in the same commit as the changes that triggered them, at zero CI cost, with immediate developer feedback. Option B produces stale commits and bot-commit noise. Option C does not affect committed state. CI drift-check (`--check` mode) is additive and can be wired later without changing the primary mechanism.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode via `--notauto`)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `generate-process-improvements.sh` hook script | 90% | S | Complete (2026-02-26) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Wire hook into `pre-commit.sh` | 90% | S | Complete (2026-02-26) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Add `--check` mode + `runCheck()` to generator | 85% | M | Complete (2026-02-26) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Unit tests for `--check` mode | 85% | M | Complete (2026-02-26) | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Independent — hook script and generator extension can be built in parallel |
| 2 | TASK-02, TASK-04 | TASK-01 (for TASK-02); TASK-03 (for TASK-04) | Wire hook after script exists; write tests after code exists |

## Tasks

---

### TASK-01: Add `generate-process-improvements.sh` hook script

- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/git-hooks/generate-process-improvements.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/git-hooks/generate-process-improvements.sh` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — All patterns verified: `git diff --cached --name-only`, conditional grep, `pnpm --filter scripts run`, `git add`. The only design decision (two-class failure mode) is fully specified in the fact-find.
  - Approach: 90% — Pre-commit conditional hook is the established pattern in this repo. Script structure mirrors existing hooks.
  - Impact: 90% — Directly delivers the stated outcome. Once wired (TASK-02), the regeneration happens automatically.
  - **min = 90%**
  - Held-back test (90%): "What single unresolved unknown would drop this below 80?" — None. The file patterns, invocation path, cwd resolution, and failure mode are all confirmed from source. Score stands at 90.
- **Acceptance:**
  - The script exists at `scripts/git-hooks/generate-process-improvements.sh` and is executable.
  - When no staged files match `docs/plans/**/results-review.user.md`, `docs/plans/**/build-record.user.md`, or `docs/plans/**/reflection-debt.user.md`, the script exits 0 immediately with a skip message.
  - When matching staged files exist, the script invokes `pnpm --filter scripts run startup-loop:generate-process-improvements` and, on success, runs `git add docs/business-os/process-improvements.user.html docs/business-os/_data/process-improvements.json`.
  - On ordinary generator failure (non-invariant), the script prints a warning to stderr and exits 0.
  - On HTML-marker invariant failure (generator exits with the `replaceArrayAssignment` error message), the script exits non-zero.
  - The script uses `set -euo pipefail` at the top.
- **Validation contract (TC-01 through TC-05):**
  - TC-01: Staged files include `docs/plans/foo/results-review.user.md` → script runs generator, generator succeeds, `git add` is called for the two output files, script exits 0.
  - TC-02: Staged files include `docs/plans/foo/build-record.user.md` only → same as TC-01 (build-record also triggers).
  - TC-03: Staged files include `docs/plans/foo/reflection-debt.user.md` only → same as TC-01 (reflection-debt also triggers).
  - TC-04: No staged files match the source pattern (e.g., only TypeScript files staged) → script exits 0 immediately with "[generate-process-improvements] No relevant files staged; skipping." printed to stdout.
  - TC-05: Generator is invoked but exits with an error unrelated to HTML markers (e.g., simulated permission error) → script prints warning to stderr and exits 0 (commit not blocked).
- **Execution plan:** Red → Green → Refactor
  - Red: Write the script skeleton with `set -euo pipefail`, staged-file check, and a stub that always exits 0. TC-04 passes; TC-01–03, TC-05 fail.
  - Green: Add the generator invocation, `git add`, and two-class error handling. All TCs pass.
  - Refactor: Verify the warning message format matches the generator's existing log prefix `[generate-process-improvements]`. Tighten the error-class distinction if needed.
- **Planning validation (S effort — abbreviated):**
  - Checks run: Read `typecheck-staged.sh` line 21 for `git diff --cached` pattern. Read `pre-commit.sh` for `set -euo pipefail` convention. Read `generate-process-improvements.ts` lines 476–493 for the `replaceArrayAssignment` error message text. Confirmed `pnpm --filter scripts run` cwd behavior from line 527.
  - Validation artifacts: Source files read at fact-find time.
  - Unexpected findings: None.
- **Scouts:** None — all design decisions settled at fact-find time.
- **Edge Cases & Hardening:**
  - If `pnpm` is not on PATH when the hook runs (unlikely in this repo, but possible in CI with `SKIP_SIMPLE_GIT_HOOKS=1` bypassed): the script should fail with a clear error. `set -euo pipefail` handles this — if `pnpm` is missing, the invocation fails and (because it's in the two-class wrapper) exits 0 with a warning.
  - If the two output files do not yet exist (first-time setup): `git add` will succeed — git adds any file including newly created ones.
  - If both output files are already staged with different content: `git add` overwrites the staged version with the generated version (which is authoritative). A notice is printed before `git add` if the files are already staged.
- **What would make this >=90%:** Already at 90%. Would reach 95% after TC-01–TC-05 pass in a live git fixture test.
- **Rollout / rollback:**
  - Rollout: File is created; TASK-02 wires it into `pre-commit.sh`. No pnpm install required to pick up the new file — only the `pre-commit.sh` call is needed.
  - Rollback: Delete `generate-process-improvements.sh` and remove its call from `pre-commit.sh`.
- **Documentation impact:**
  - None required. The script header comment is self-documenting.
- **Notes / references:**
  - Error message text from `replaceArrayAssignment`: `"Unable to locate ${variableName} assignment in process improvements HTML."` — the script should detect this specific substring to classify as an invariant failure vs ordinary error.
  - Reference: `scripts/git-hooks/typecheck-staged.sh` line 21 for the staged-file detection command.

---

### TASK-02: Wire hook script into `pre-commit.sh`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/git-hooks/pre-commit.sh` — one line added calling `generate-process-improvements.sh`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/git-hooks/pre-commit.sh`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Trivial file edit: one line added to an existing shell script. All surrounding context verified.
  - Approach: 90% — Appending at the end of the hook chain is safe; the hook chain is ordered with env checks first, lint/typecheck last. The new generator step should run after lint-staged (to avoid unnecessary work if lint fails) but before `validate-agent-context` (which is the final check).
  - Impact: 90% — Directly activates the auto-regeneration for every pre-commit invocation.
  - **min = 90%**
  - Held-back test (90%): "What single unresolved unknown would drop this below 80?" — None. The insertion point, exit code semantics, and hook chain order are all verified.
- **Acceptance:**
  - `scripts/git-hooks/pre-commit.sh` contains a call to `bash scripts/git-hooks/generate-process-improvements.sh`.
  - The call is placed after `bash scripts/git-hooks/lint-staged-packages.sh` and before `pnpm validate:agent-context`.
  - A commit that stages a `results-review.user.md` file results in `process-improvements.user.html` and `process-improvements.json` being included in the commit.
- **Validation contract (TC-06 through TC-08):**
  - TC-06: Make a commit that stages `docs/plans/test-plan/results-review.user.md` → `process-improvements.user.html` and `process-improvements.json` appear in `git diff --cached` before the commit finalizes → both files are in the resulting commit.
  - TC-07: Make a commit that stages only TypeScript files → hook runs, generate-process-improvements.sh exits 0 immediately with skip message, no extra files added to commit.
  - TC-08: Existing hook chain steps (lint-staged, typecheck-staged, validate-agent-context) still execute after the generator step — confirm by running a commit with a TypeScript file staged and verifying lint runs.
- **Execution plan:** Red → Green → Refactor
  - Red: Do not add the call yet — TC-06 fails (commit does not include generated files).
  - Green: Add `bash scripts/git-hooks/generate-process-improvements.sh` at the correct insertion point. All TCs pass.
  - Refactor: Verify the hook chain order matches the documented sequence in the fact-find.
- **Planning validation (S effort — abbreviated):**
  - Checks run: Read `pre-commit.sh` in full at fact-find time. Current last line is `pnpm validate:agent-context`. The new line inserts before it.
  - Validation artifacts: `pre-commit.sh` content verified.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - If `SKIP_LINT_STAGED=1` is set, `run-lint-staged.sh` exits early — this does not affect the generator call (it runs regardless of lint-staged skip).
  - If `SKIP_TYPECHECK=1` is set, `typecheck-staged.sh` exits early — same, generator call is independent.
- **What would make this >=90%:** Already at 90%. TC-06 executed in a real git context would confirm.
- **Rollout / rollback:**
  - Rollout: Edit `pre-commit.sh`. Immediately active for all subsequent commits. No pnpm install needed.
  - Rollback: Remove the added line from `pre-commit.sh`.
- **Documentation impact:** None.
- **Notes / references:**
  - Current `pre-commit.sh` tail: `bash scripts/git-hooks/lint-staged-packages.sh` → `pnpm validate:agent-context`. New line inserts between these two.

---

### TASK-03: Add `--check` mode and `runCheck()` export to `generate-process-improvements.ts`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/src/startup-loop/generate-process-improvements.ts` + new entry in `scripts/package.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/generate-process-improvements.ts`, `scripts/package.json`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — Pattern from `generate-stage-operator-views.ts` lines 657–678 is directly applicable. The `--check` logic compares generated output to committed files and exits 1 if different. The `runCheck(repoRoot)` export mirrors `run()` in the sibling script. One unknown: the exact comparison mechanism — `generate-stage-operator-views.ts` compares string equality of full file contents, which is correct for deterministic generators. `generate-process-improvements.ts` is deterministic (sorts items by date then title), so this approach is valid.
  - Approach: 85% — Following an established in-repo pattern. The only open question is whether to compare HTML content directly or the JSON separately — the answer is: compare both independently (two checks, one for HTML, one for JSON), same as `generate-stage-operator-views.ts` compares three output files.
  - Impact: 85% — Adds a `check-process-improvements` script to `scripts/package.json` that can be run in CI. No impact on existing functionality (additive only).
  - **min = 85%**
- **Acceptance:**
  - `runCheck(repoRoot: string): void` is exported from `generate-process-improvements.ts`.
  - When invoked with `--check`, the generator computes the expected HTML and JSON content, compares to committed files, exits 0 if identical, exits 1 if different (with a message naming the file and stating it is stale).
  - `scripts/package.json` contains `"check-process-improvements": "node --import tsx src/startup-loop/generate-process-improvements.ts --check"`.
  - No changes to `runCli()` or existing exports (`collectProcessImprovements`, `updateProcessImprovementsHtml`).
  - TypeScript compiles cleanly with the new export (`pnpm --filter scripts typecheck` passes).
- **Validation contract (TC-09 through TC-12):**
  - TC-09: Run `pnpm --filter scripts run check-process-improvements` when committed files are up to date → exits 0, prints "[generate-process-improvements] CHECK OK — generated files are up-to-date".
  - TC-10: Modify `docs/plans/foo/results-review.user.md` without running the generator, then run `check-process-improvements` → exits 1, prints a message naming `docs/business-os/process-improvements.user.html` as stale.
  - TC-11: Delete `docs/business-os/process-improvements.user.html` and run `check-process-improvements` → exits 1, prints message that file does not exist.
  - TC-12: `pnpm --filter scripts typecheck` passes after changes.
- **Execution plan:** Red → Green → Refactor
  - Red: Add `runCheck(repoRoot)` stub that throws `"not implemented"`. TC-09–TC-11 fail; TC-12 fails if types are wrong.
  - Green: Implement `runCheck(repoRoot)`: call `collectProcessImprovements(repoRoot)`, read committed HTML and JSON, call `updateProcessImprovementsHtml(html, data, dateIso)` using a fixed or dummy date to produce the expected array assignments, extract the three `var X = [...]` array assignment blocks from both the generated output and the committed file, compare those blocks only (not full file content — the footer date stamp makes full-string comparison unreliable after midnight). Exit 1 if any block differs, naming the variable and file. Wire CLI guard: `if (process.argv.includes("--check")) { runCheck(repoRoot); process.exit(0); }` before the existing `runCli()` guard. Add `check-process-improvements` to `scripts/package.json`. TC-09–TC-12 pass.
  - Refactor: Add a comment near `runCheck` explaining the array-only comparison approach and the date-stamp exclusion. Extract the array-assignment extraction into a helper if used by both `runCheck` and future callers. No design changes — the approach is settled.
- **Planning validation (M effort):**
  - Checks run: Read `generate-stage-operator-views.ts` lines 657–678 (check mode implementation). Read `generate-process-improvements.ts` lines 476–516 (`replaceArrayAssignment`, `updateProcessImprovementsHtml`) to understand what the check needs to compare. Verified `collectProcessImprovements` is deterministic (sorts by date then title). Identified the date-stamp refactor issue (footer comparison instability).
  - Validation artifacts: Source files read at fact-find and planning time.
  - Unexpected findings: The `updateLastClearedFooter` function (lines 495–504) writes today's date into the HTML. This means a full-string comparison for drift detection will always fail after midnight. The check mode must either (a) use the date from the committed file's footer, (b) compare only the array assignments, or (c) accept false positives after midnight. Approach (b) is cleanest and matches the actual changed content.
- **Consumer tracing (M effort):**
  - New output: `runCheck(repoRoot)` function — consumed by the new CLI guard in `generate-process-improvements.ts` and by TASK-04 unit tests. No other TypeScript code in the monorepo imports this function.
  - New output: `check-process-improvements` npm script — consumed only as a CLI invocation. Not imported by any code.
  - Modified behavior: None. Existing exports (`collectProcessImprovements`, `updateProcessImprovementsHtml`, `runCli()`) are unchanged.
- **Scouts:**
  - Date-stamp instability: The `updateLastClearedFooter` function writes today's date. The `--check` mode must avoid comparing this footer to prevent false positives. Resolved: check mode compares only the three array variable assignments in the HTML, not the full file content.
- **Edge Cases & Hardening:**
  - If committed HTML is missing the array markers: `runCheck` should surface the same error as `replaceArrayAssignment` — the template is corrupted.
  - If `docs/business-os/_data/process-improvements.json` does not exist: `runCheck` should exit 1 (file is stale/missing).
- **What would make this >=90%:** Passing TC-09–TC-12 in a real run (the array-only comparison design is settled; no further design resolution needed).
- **Rollout / rollback:**
  - Rollout: No deployment. New CLI flag is additive; existing behavior unchanged.
  - Rollback: Remove the `runCheck` export and the `--check` guard from the CLI entry. Remove the `check-process-improvements` script from `scripts/package.json`.
- **Documentation impact:**
  - Add a comment near `runCheck` explaining the date-stamp comparison limitation and why only array assignments are compared.
- **Notes / references:**
  - `generate-stage-operator-views.ts` lines 657–678: the drift-check implementation to mirror.
  - `updateLastClearedFooter` lines 495–504: the date-stamp injection that must be excluded from drift comparison.

---

### TASK-04: Unit tests for `--check` mode

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — The existing test file already uses temp-dir fixtures and Jest. The new tests follow the same pattern: create a temp dir, write fixture files (source `.user.md` files and an HTML template), call `runCheck(repoRoot)`, assert on exit behavior (via `process.exit` mock or thrown error). One unknown: whether `runCheck` calls `process.exit(1)` directly (which requires mocking) or throws an error (which is catchable). TASK-03 will determine this; the test must match.
  - Approach: 85% — Fixture-based Jest tests are the established pattern. The test file already imports `collectProcessImprovements` and `updateProcessImprovementsHtml` from the generator — importing `runCheck` uses the same pattern.
  - Impact: 85% — Tests validate the `--check` mode works correctly and prevents regressions. They run as part of the `scripts` package test suite in CI.
  - **min = 85%**
- **Acceptance:**
  - `describe("runCheck")` block added to the existing test file.
  - TC-13: no-drift case — fixture with up-to-date committed files → `runCheck` does not throw / exits 0.
  - TC-14: drift case — fixture where committed HTML has stale array assignments → `runCheck` exits 1 with a message identifying the stale file.
  - TC-15: missing output file case → `runCheck` exits 1 with a message that the file does not exist.
  - `pnpm --filter scripts test -- --testPathPattern generate-process-improvements` passes with no failures.
- **Validation contract (TC-13 through TC-15):**
  - TC-13: Create temp repoRoot with valid source files and up-to-date committed output → `runCheck(tmpDir)` completes without error.
  - TC-14: Create temp repoRoot with stale committed output (array assignments differ from what the source files would generate) → `runCheck(tmpDir)` throws or calls `process.exit(1)`.
  - TC-15: Create temp repoRoot with source files but no committed HTML file → `runCheck(tmpDir)` throws or calls `process.exit(1)`.
- **Execution plan:** Red → Green → Refactor
  - Red: Add test stubs (`it.todo()`) for TC-13–TC-15. Tests are pending but do not fail.
  - Green: Implement tests using the fixture pattern from existing tests in the file. Determine from TASK-03 whether `runCheck` uses `process.exit` or throws; mock or catch accordingly. TC-13–TC-15 pass.
  - Refactor: Extract fixture setup into a helper function to reduce repetition across the three cases.
- **Planning validation (M effort):**
  - Checks run: Read the existing test file (lines 1–50+) to understand fixture pattern. Confirmed: tests use `fs.mkdtemp`, `writeFile`, call exported functions directly. No subprocess spawning — functions are called inline. `runCheck` must be callable inline (export required from TASK-03).
  - Validation artifacts: Test file read at fact-find time.
  - Unexpected findings: If `runCheck` calls `process.exit(1)` directly, it will kill the Jest test process. TASK-03 should throw a `ProcessExitError` or similar catchable error instead of calling `process.exit` directly when running in a test context. Mitigation: mock `process.exit` in the test block using `jest.spyOn(process, 'exit').mockImplementation(...)`. This is a known Jest pattern.
- **Consumer tracing (M effort):**
  - New output: Three new test cases in the existing test file. Consumed by the Jest test runner; no code consumers.
  - No existing function signatures are modified.
- **Scouts:**
  - `process.exit` mocking: required if `runCheck` calls `process.exit(1)`. Standard Jest pattern (`jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called') })`).
- **Edge Cases & Hardening:**
  - The fixture HTML template must contain the three `var X = [...]` array markers for `updateProcessImprovementsHtml` to work — reuse the HTML fixture pattern from the existing test.
- **What would make this >=90%:** TASK-03 implemented cleanly (throwing vs process.exit resolved); TC-13–TC-15 passing in CI.
- **Rollout / rollback:**
  - Rollout: Tests run automatically in CI when `scripts/` is affected.
  - Rollback: Remove the new `describe("runCheck")` block.
- **Documentation impact:** None.
- **Notes / references:**
  - Existing test file: `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`.
  - `process.exit` mock pattern: `jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called') })`.

---

## Risks & Mitigations

- **`git add` inside pre-commit hook includes files operator did not explicitly stage** — Very Low likelihood, Medium impact. Mitigation: the generated files are always authoritative; the hook prints a notice when overwriting already-staged content. Operator can review the diff in pre-commit output.
- **Generator reads working-tree files, not the git staged index — partially-staged source files produce ghost-content** — Low likelihood, Medium impact. If a `results-review.user.md` file has both staged and unstaged changes, the generator sees the full working-tree version, and the committed output will reflect changes not yet staged. Mitigation: acceptable for this scope, as results-review files are rarely in a partially-staged state. Future iteration could read staged content via `git show :<path>` if this becomes a practical issue.
- **`SKIP_SIMPLE_GIT_HOOKS=1` bypass leaves HTML stale in agent commits** — Medium likelihood (bos-export uses this), Low impact (bos-export does not touch plan files anyway). No mitigation needed for current scope; `--check` CI step (stretch goal) would close this gap.
- **Date-stamp in `updateLastClearedFooter` causes false drift in `--check` mode** — Low likelihood (only relevant if checking on a different day than last generation), Medium impact. Mitigation: TASK-03 compares only the three array variable assignments, not the full HTML file.
- **HTML-marker invariant failure blocks a commit unexpectedly** — Very Low likelihood (template is in source control and stable). Mitigation: the error message from `replaceArrayAssignment` is explicit; the hook prints it and the operator can repair the template.

## Observability

- Logging:
  - On success: `[generate-process-improvements] updated docs/business-os/process-improvements.user.html (ideas=N, risks=N, pending=N)` (existing generator stdout — verify exact format against generator source during TASK-03 build; update this entry if the format differs).
  - On skip: `[generate-process-improvements] No relevant files staged; skipping.` (new, from TASK-01 hook script).
  - On ordinary failure: `[generate-process-improvements] WARN: regeneration failed — run 'pnpm --filter scripts run startup-loop:generate-process-improvements' manually` (new, from TASK-01 hook script stderr).
- Metrics: None required for this infra task.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `scripts/git-hooks/generate-process-improvements.sh` exists and is executable.
- [ ] `scripts/git-hooks/pre-commit.sh` calls the new hook script after `lint-staged-packages.sh`.
- [ ] A commit staging a `results-review.user.md` file automatically includes updated `process-improvements.user.html` and `process-improvements.json`.
- [ ] A commit staging only TypeScript files does not trigger the generator (hook exits immediately).
- [ ] `runCheck(repoRoot)` is exported from `generate-process-improvements.ts` and works correctly.
- [ ] `pnpm --filter scripts run check-process-improvements` exits 0 on up-to-date files, exits 1 on stale.
- [ ] Unit tests for `--check` mode pass in `pnpm --filter scripts test`.
- [ ] `pnpm --filter scripts typecheck` passes.

## Decision Log

- 2026-02-26: Chose pre-commit hook over CI job and file-watcher. Pre-commit keeps generated files in same commit; CI produces stale commits; file-watcher is dev-only. Ref: fact-find Resolved Questions.
- 2026-02-26: Chose warn-only for non-invariant errors (exit 0 with warning), hard-fail only for HTML-marker corruption. Ref: fact-find Resolved Questions.
- 2026-02-26: `--check` mode compares only array variable assignments (not full HTML) to avoid false positives from date-stamp in footer. Ref: TASK-03 Planning Validation.
- 2026-02-26: Plan-only mode (`--notauto`) as explicitly requested.

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 90% × S(1) = 90
- TASK-03: 85% × M(2) = 170
- TASK-04: 85% × M(2) = 170
- Sum weights: 1+1+2+2 = 6
- Overall-confidence = (90+90+170+170) / 6 = 520/6 = **86.7% → 85%** (rounded to nearest 5)
