---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: process-improvements-live-update
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/process-improvements-live-update/plan.md
Trigger-Why: The operator edits results-review, build-record, and reflection-debt files regularly as part of the build loop, but process-improvements.user.html only updates when a script is run manually. This means the HTML the operator reads is stale until someone remembers to regenerate it — the operator wants it to update automatically.
Trigger-Intended-Outcome: type: operational | statement: After any commit touching docs/plans/**/*results-review.user.md, docs/plans/**/*build-record.user.md, or docs/plans/**/*reflection-debt.user.md, the process-improvements.user.html and process-improvements.json files are regenerated without operator action | source: operator
---

# Process-Improvements Live Update Fact-Find Brief

## Scope

### Summary

The `process-improvements.user.html` file is the operator's primary view of ideas, risks, and pending reviews extracted from build artifacts across `docs/plans/`. It is regenerated only by running `pnpm run startup-loop:generate-process-improvements` manually (or the composite `generate-stage-operator-views` script). There is no automated trigger — no file watcher, no CI job, no pre-commit hook. The operator reads a stale HTML until the script is run.

The goal is to make regeneration happen automatically so the HTML is always current after a commit that touches the source files.

### Goals

- Regenerate `process-improvements.user.html` and `process-improvements.json` automatically whenever `results-review.user.md`, `build-record.user.md`, or `reflection-debt.user.md` files under `docs/plans/` are added or modified.
- The operator should not need to manually invoke the generation script after editing these source files.
- Failures in the generation script (e.g. malformed source file) must surface clearly without silently blocking commits.

### Non-goals

- Live in-memory preview server (a dev-only file-watcher is a stretch goal, not the primary scope).
- Changing the generation script's logic or output format.
- Automating regeneration of the stage-operator-views or build-summary (separate generators).

### Constraints & Assumptions

- Constraints:
  - Pre-commit hooks use `set -euo pipefail` and run the writer-lock check — any script added must be compatible with this environment.
  - The pre-commit hook chain is: `block-commit-on-protected-branches.sh` → `require-writer-lock.sh` → `no-partially-staged.js` → `check-next-webpack-flag.mjs` → `run-lint-staged.sh` → `typecheck-staged.sh` → `lint-staged-packages.sh` → `validate-agent-context`. Adding a new step must not break existing hook exit-code semantics.
  - The lint-staged config in `package.json` only runs ESLint on `*.{ts,tsx,js,jsx}` — the Markdown source files are not in its scope, so lint-staged cannot be the vehicle.
  - CI workflows do not reference any of the three generation scripts (`generate-process-improvements.ts`, `generate-stage-operator-views.ts`, `generate-build-summary.ts`) — confirmed by searching all `.github/workflows/*.yml` files.
  - There is no Husky directory; hooks are managed via `simple-git-hooks` configured in `.git/hooks/pre-commit` and `.git/hooks/pre-push`.
  - The Business OS app (`apps/business-os/`) does not import `process-improvements.json` — confirmed by grep; it serves its data from D1/Cloudflare. The JSON is consumed by the HTML file itself (inline JS array assignment), not by the app build.
  - The `check-stage-operator-views` script uses `--check` mode to detect drift, but no equivalent `--check` mode exists on `generate-process-improvements.ts` — it only has a CLI entry point with no drift-check mode.
  - The `generate-process-improvements.ts` script already handles malformed source files gracefully: invalid YAML frontmatter is caught and ignored (returns `{}`), malformed JSON in reflection-debt ledger blocks is caught and returns empty array. The only hard failure is if `process-improvements.user.html` does not contain the expected `var IDEA_ITEMS =` / `var RISK_ITEMS =` / `var PENDING_REVIEW_ITEMS =` assignments — `replaceArrayAssignment` throws. This is an invariant the HTML file already satisfies.
  - The BOS export CI workflow (`bos-export.yml`) runs hourly and exports D1 data to `docs/business-os/` — it does not touch `docs/plans/` files or run generation scripts.
- Assumptions:
  - The correct trigger is a pre-commit hook that runs when staged files match the source glob pattern. This is the lowest-latency option that keeps the generated files in the same commit as the changes that triggered them.
  - A CI job would regenerate post-push, meaning the pushed commit would still have stale HTML — it could auto-commit a fix but this creates bots-commit noise and latency.
  - A file watcher is dev-only and does not help with committed state.

## Outcome Contract

- **Why:** The operator edits results-review, build-record, and reflection-debt files as part of normal build-loop work. The HTML view only updates when someone runs the script manually — this friction means the operator's dashboard is regularly out of date.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After any commit that touches source files under `docs/plans/`, the `process-improvements.user.html` and `process-improvements.json` are regenerated automatically in the same commit, without operator action.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/generate-process-improvements.ts` — CLI entry point at line 548: runs `runCli()` when `process.argv[1]` includes `generate-process-improvements`. Uses `process.cwd()/../` as repo root. Invoked via `pnpm run startup-loop:generate-process-improvements` from `scripts/`.
- `scripts/package.json` — defines both `startup-loop:generate-process-improvements` (direct script) and `generate-stage-operator-views` (composite: runs generate-stage-operator-views + generate-build-summary + generate-process-improvements in sequence).

### Key Modules / Files

- `scripts/src/startup-loop/generate-process-improvements.ts` — the generator. Exports `collectProcessImprovements(repoRoot)` and `updateProcessImprovementsHtml(html, data, dateIso)`. No `--check` mode; only has a write mode.
- `scripts/package.json` — scripts registry. No watch script, no file-watcher dependency (no `chokidar`, no `nodemon`, no `watchman`).
- `.git/hooks/pre-commit` — calls `bash scripts/git-hooks/pre-commit.sh`. Uses `simple-git-hooks`. Contains `SKIP_SIMPLE_GIT_HOOKS=1` bypass for CI use.
- `scripts/git-hooks/pre-commit.sh` — current hook chain. Does NOT call any generation script. Uses `set -euo pipefail`.
- `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` — existing unit tests for `collectProcessImprovements` and `updateProcessImprovementsHtml`. Tests use a temp directory fixture; they do not test the CLI `runCli()` function or the `--check` mode (since none exists).
- `docs/business-os/process-improvements.user.html` — output HTML. Contains `var IDEA_ITEMS = [...];`, `var RISK_ITEMS = [...];`, `var PENDING_REVIEW_ITEMS = [...];` inline JS arrays. Mutated by `replaceArrayAssignment`. Last regenerated during this session.
- `docs/business-os/_data/process-improvements.json` — machine-readable output. Written alongside the HTML.

### Patterns & Conventions Observed

- **Drift-check mode pattern**: `generate-stage-operator-views.ts` has a `--check` flag that compares generated output to committed files and exits non-zero if stale. This is used by `check-stage-operator-views` script. The same pattern could be applied to `generate-process-improvements.ts`. — evidence: `scripts/src/startup-loop/generate-stage-operator-views.ts` lines 657–678
- **Atomic write pattern**: `generate-process-improvements.ts` uses `writeFileAtomic` (write to `.tmp`, then `renameSync`) to avoid partial writes. — evidence: lines 519–524
- **Pre-commit hook pattern**: hooks use `set -euo pipefail`; any non-zero exit blocks the commit. Scripts that should warn-only (not block) must exit 0 explicitly. — evidence: `scripts/git-hooks/pre-commit.sh`
- **Staged-file conditional pattern**: `scripts/git-hooks/typecheck-staged.sh` line 21 uses `git diff --cached --name-only --diff-filter=ACMRTUXB` to get the list of staged files. The new hook script should use the same command and filter its output with `grep -E 'docs/plans/.*(results-review|build-record|reflection-debt)\.user\.md$'` to decide whether to run the generator. Note: the full `typecheck-staged.sh` logic maps files to packages for turbo — only the staged-file detection line applies here.

### Data & Contracts

- Types/schemas/events:
  - `ProcessImprovementItem` — `{type, business, title, body, suggested_action?, source, date, path}` — defined in `generate-process-improvements.ts` line 19.
  - `ProcessImprovementsData` — `{ideaItems, riskItems, pendingReviewItems}` — line 329.
  - HTML output contract: three `var X = [...];` array assignments in `process-improvements.user.html`. The `replaceArrayAssignment` function locates them by string search; the HTML must contain them or an error is thrown.
- Persistence:
  - `docs/business-os/process-improvements.user.html` — overwritten in-place (via atomic temp file).
  - `docs/business-os/_data/process-improvements.json` — written alongside.
- API/contracts:
  - No external API calls. Pure filesystem reads from `docs/plans/**/*.user.md` and write to `docs/business-os/`.

### Dependency & Impact Map

- Upstream dependencies:
  - `docs/plans/**/*results-review.user.md` — source of idea candidates (New Idea Candidates section).
  - `docs/plans/**/*build-record.user.md` — source of pending-review items (triggers if no valid results-review exists alongside it).
  - `docs/plans/**/*reflection-debt.user.md` — source of risk items (open reflection debt ledger entries).
  - `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` — `validateResultsReviewFile` is imported and used to check sibling results-review files.
  - `js-yaml` — YAML frontmatter parser.
- Downstream dependents:
  - `docs/business-os/process-improvements.user.html` — operator-facing HTML dashboard.
  - `docs/business-os/_data/process-improvements.json` — machine-readable data; currently only consumed by the HTML's inline JS. Not imported by any TypeScript code in the monorepo (confirmed by grep).
- Likely blast radius:
  - Adding a pre-commit hook step affects every commit that touches the source files. Scope is low — the hook would be a no-op on commits that don't touch `docs/plans/**/*.user.md`.
  - The generation script itself has no side effects beyond writing two files in `docs/business-os/`. If it throws, the pre-commit hook exits non-zero and blocks the commit — this is acceptable for hard invariant failures (missing array assignments in the HTML). For malformed source files, the script already silently skips them — this is acceptable behaviour.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (with `@jest/globals`), run via `pnpm test` in the `scripts` package.
- Commands: `pnpm --filter scripts test` or `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=generate-process-improvements`
- CI integration: `test.yml` and `ci.yml` both run unit tests via `pnpm test:affected`. The `scripts` package is included in the affected workspace set when its source files change.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `collectProcessImprovements` | Unit | `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` | Covers idea collection, reflection debt parsing, pending review detection. Fixture-based with temp dirs. |
| `updateProcessImprovementsHtml` | Unit | Same file | Covers array replacement in HTML. |
| CLI `runCli()` | None | — | Not tested. Entry point guard not covered. |
| `--check` mode | None | — | Does not exist yet; would need tests. |

#### Coverage Gaps

- Untested paths:
  - `runCli()` — the CLI entry point is not tested. No test verifies that the script resolves `repoRoot` correctly from `cwd()`.
  - A future `--check` mode needs tests: drift-detected case (exits 1), no-drift case (exits 0), missing output file case.
  - The pre-commit hook script (new file) needs at least a smoke test confirming the conditional logic.
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test:
  - `--check` mode on `generate-process-improvements.ts` — same fixture pattern as `generate-stage-operator-views.ts` tests can be applied.
  - The hook script conditional logic (grep staged files, run or skip) — can be tested with a mock git working tree.
- Hard to test:
  - Full end-to-end git hook invocation requires a real git repo fixture or a test that shells out to git.
- Test seams needed:
  - `generate-process-improvements.ts` needs an exported `runCheck(repoRoot)` function (parallel to `run()` in `generate-stage-operator-views.ts`) so it can be unit-tested without spawning a subprocess.

### Recent Git History (Targeted)

- `scripts/src/startup-loop/generate-process-improvements.ts` — one commit: `19b4c203f0 chore: checkpoint outstanding workspace changes`. The script was introduced in that checkpoint (no incremental history visible; may be a squash).
- `docs/business-os/process-improvements.user.html` — commits: `19b4c203f0` (initial), `bd5e865529` (regenerated in session: `docs(plans): plan completion artifacts — build-record, results-review, reflection-debt`), `0a4b2ed936` (regenerated: `docs(plans): lp-do-skills-token-efficiency — completion artifacts + archive`). Evidence confirms: HTML is only updated by manual script runs coinciding with plan-completion commits.

## Questions

### Resolved

- Q: Does `generate-stage-operator-views` composite script run as part of any automated trigger (CI, build, pre-push hook)?
  - A: No. The composite script (`generate-stage-operator-views` in `scripts/package.json`) is not referenced in any GitHub Actions workflow file (confirmed by grep across all `.github/workflows/*.yml`). It is not called from `pre-commit.sh`, `pre-push.sh`, or `validate-changes.sh`. It is manually invoked only.
  - Evidence: `scripts/package.json` line 8; full grep of `.github/workflows/` returning no matches.

- Q: Does the Business OS app have a build dependency on `process-improvements.json` that could serve as a natural regeneration hook?
  - A: No. The Business OS app (`apps/business-os/`) does not import or reference `process-improvements.json`. The JSON is consumed inline by the HTML file's JavaScript. The app serves data from D1/Cloudflare. There is no natural build hook.
  - Evidence: grep of `apps/business-os/src/` for `process-improvements` returned no results.

- Q: What trigger option is best — file-watcher, pre-commit hook, CI job, or chaining with an existing build step?
  - A: Pre-commit hook is the recommended approach. Reasoning: (1) A file-watcher is dev-only and does not update committed state. (2) A CI job runs post-push — the pushed commit would still contain stale HTML; auto-fixing via bot commit creates noise and latency. (3) No existing build step in CI processes `docs/plans/` content or runs BOS tooling scripts. (4) A pre-commit hook keeps the generated files in the same commit as the source changes, at zero CI cost, with immediate feedback. The hook should be conditional: only run the generator when the staged files include at least one of the three source file patterns.
  - Evidence: Analysis of all CI workflows, `pre-commit.sh`, `pre-push.sh`, and `validate-changes.sh`. Pattern from `typecheck-staged.sh` (conditional on staged files).

- Q: What happens when the generation script encounters a malformed source file?
  - A: Malformed YAML frontmatter is silently skipped (returns `{}`). Malformed JSON in a reflection-debt ledger block is silently skipped (returns `[]`). The script logs a warning to stderr if an idea title exceeds 100 characters but continues. The only hard failure path is `replaceArrayAssignment` throwing if the HTML template does not contain the expected `var X = [...]` markers — this is an invariant that the committed HTML already satisfies. Conclusion: the generator is robust to malformed source files and should not block commits due to source file problems.
  - Evidence: `generate-process-improvements.ts` lines 96–117 (frontmatter parse), 300–317 (reflection debt parse), 388–389 (stderr warning for title length), 476–493 (replaceArrayAssignment hard failure).

- Q: Should the pre-commit hook failure mode block the commit or warn-only?
  - A: The hook should distinguish two failure classes. (1) HTML-template corruption (missing `var IDEA_ITEMS =` / `var RISK_ITEMS =` / `var PENDING_REVIEW_ITEMS =` markers): this is a hard invariant failure meaning the template has been manually corrupted in source control — the commit should be blocked so the operator is forced to repair the template before proceeding. (2) All other errors (non-zero exit from source-file parsing, file permission issues, unexpected runtime errors): these should be warn-only — print a warning and exit 0 so the commit is not blocked. Implementation: wrap the generator invocation in a subshell that traps non-invariant errors and exits 0 with a warning; let the HTML-marker `replaceArrayAssignment` throw propagate as an untrapped failure, which causes the hook to exit non-zero via `set -euo pipefail`. Do NOT use unconditional `|| true` — that would suppress the HTML-marker failure.
  - Evidence: `scripts/git-hooks/pre-commit.sh` uses `set -euo pipefail`; `generate-process-improvements.ts` `replaceArrayAssignment` throws with an explicit Error message when markers are missing (lines 476–493); all source-file errors are caught within the generator and produce empty results rather than throwing.

- Q: Should a `--check` (drift detection) mode be added to `generate-process-improvements.ts`?
  - A: Yes, but it is not required for the primary pre-commit trigger. The drift-check mode is most useful as a CI check to catch cases where the generated files are stale (e.g., someone committed source files but the hook was bypassed). This is lower priority than the pre-commit hook. The pattern from `generate-stage-operator-views.ts` (`--check` flag, compare generated to committed, exit 1 on drift) should be followed exactly for consistency.
  - Evidence: `generate-stage-operator-views.ts` lines 657–678; `scripts/package.json` `check-stage-operator-views` script.

### Open (Operator Input Required)

No genuinely open questions remain. All design decisions have been resolved by reasoning from documented constraints and codebase evidence.

## Confidence Inputs

- Implementation: 90%
  - Evidence basis: All relevant files inspected. Entry point, hook chain, existing patterns, and error-handling all verified. The implementation is a known quantity — add a conditional block to `pre-commit.sh` that greps staged files for the source glob and runs the generator.
  - What raises to >=80: Already there. What raises to >=90: Already there (verified all existing hook scripts and patterns).

- Approach: 88%
  - Evidence basis: Pre-commit hook is the right trigger for this use case. CI job and file-watcher ruled out with evidence. Conditional execution pattern confirmed in `typecheck-staged.sh`.
  - What raises to >=90: Operator confirms preference for pre-commit (not CI-only) — but the analysis strongly supports it.

- Impact: 85%
  - Evidence basis: The operator currently sees stale HTML between manual runs. Git history confirms 2+ cases of regeneration being deferred to a separate commit. The operator's stated intent is clear.
  - What raises to >=90: First use after the hook is wired — confirms the HTML updates in-place with the commit.

- Delivery-Readiness: 92%
  - Evidence basis: All files identified. Pattern established. No blocking dependencies. Writer lock, simple-git-hooks, and lint-staged all operate compatibly with adding a new conditional hook step.
  - What raises to >=90: Already there.

- Testability: 80%
  - Evidence basis: Existing test infrastructure is solid. A `--check` mode in the generator can be tested with the same fixture pattern. The hook script logic can be tested by inspection and smoke test.
  - What raises to >=90: Add unit tests for `--check` mode and the hook's conditional logic (staged file detection).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Generator exits non-zero on a real source file issue, blocking a commit | Low | Medium | Wrap non-invariant generator errors with a subshell trap — exit 0 with a warning for all ordinary errors. The HTML-template corruption case (missing array markers) is intentionally allowed to block the commit; this is the only legitimate hard failure and the template is stable in source control. |
| Hook adds noticeable latency to every commit touching plan files | Low | Low | Generator takes <1s on current file count (reads ~30 files, writes 2). Conditional check (grep staged files first) keeps it a no-op on commits that don't touch source files. |
| Someone bypasses hook via `SKIP_SIMPLE_GIT_HOOKS=1` (CI export workflow does this) | Medium | Low | The bos-export CI workflow explicitly sets `SKIP_SIMPLE_GIT_HOOKS=1` to skip hooks — this is correct behaviour (the export workflow doesn't edit plan files). If a drift-check CI step is added later, it closes this gap. |
| `repoRoot` resolution in hook differs from expected path | Low | Medium | The generator uses `path.resolve(process.cwd(), "..")` when invoked from `scripts/`. The hook must invoke the script from the repo root using `pnpm --filter scripts run startup-loop:generate-process-improvements` to ensure correct resolution. Verified: `scripts/package.json` scripts are run from the `scripts/` subdirectory by pnpm. |
| Generated files conflict with staged changes | Very Low | Medium | The generator writes two output files. If these are already staged with different content, the hook overwrites and re-stages them with the generated version (which is authoritative). Before running `git add`, the hook script should check `git diff --cached --name-only \| grep -q process-improvements` and print a notice if so, but still proceed. The operator can review the output diff in the pre-commit log. No manual re-staging is required — `git add` in the hook handles it. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use the `git diff --cached --name-only` pattern from `typecheck-staged.sh` to detect whether the hook should run. Only run the generator when at least one of these patterns matches: `docs/plans/**/results-review.user.md`, `docs/plans/**/build-record.user.md`, `docs/plans/**/reflection-debt.user.md`.
  - Invoke the generator via `pnpm --filter scripts run startup-loop:generate-process-improvements` (not directly via `node --import tsx`) to ensure correct working directory and dependency resolution.
  - After generation succeeds, run `git add docs/business-os/process-improvements.user.html docs/business-os/_data/process-improvements.json` so the regenerated files are included in the commit automatically.
  - Distinguish two failure classes in the hook wrapper: (a) HTML-template corruption (missing array markers in `process-improvements.user.html`) — let this throw propagate untrapped so `set -euo pipefail` blocks the commit; (b) all other errors — wrap in a subshell with explicit error capture, print a warning to stderr, and exit 0. Do NOT use unconditional `|| true` — that would suppress the HTML-marker failure. Example wrapper: `if ! pnpm --filter scripts run startup-loop:generate-process-improvements 2>&1; then echo "[generate-process-improvements] WARN: regeneration failed — run manually" >&2; fi` — but structured so the exit code from the invariant-failure case is preserved.
  - Use `set -euo pipefail` in the new hook script (consistent with all other scripts in `scripts/git-hooks/`).
  - File name convention: `generate-process-improvements.sh` in `scripts/git-hooks/`.

- Rollout/rollback expectations:
  - No deployment. The hook is installed via `simple-git-hooks` which reads from `package.json`. After adding the hook call to `pre-commit.sh`, each developer's `.git/hooks/pre-commit` is automatically updated on next `pnpm install` (or by running `pnpm exec simple-git-hooks`).
  - Rollback: remove the hook call from `pre-commit.sh`.

- Observability expectations:
  - The generator already logs to stdout on success: `[generate-process-improvements] updated ... (ideas=N, risks=N, pending=N)`. This will appear in the pre-commit hook output.
  - On failure, the hook wrapper should print: `[generate-process-improvements] WARN: regeneration failed — run \`pnpm --filter scripts run startup-loop:generate-process-improvements\` manually`.

## Suggested Task Seeds (Non-binding)

1. Add conditional execution script `scripts/git-hooks/generate-process-improvements.sh` — greps staged files, runs generator if source files are staged, git-adds outputs.
2. Add call to the new script in `scripts/git-hooks/pre-commit.sh`.
3. Add `--check` mode to `generate-process-improvements.ts` (following `generate-stage-operator-views.ts` pattern), export `runCheck(repoRoot)` function.
4. Add `check-process-improvements` script to `scripts/package.json` calling the new `--check` flag.
5. Write unit tests for `--check` mode in `generate-process-improvements.test.ts`.
6. (Optional/stretch) Add a CI step in `ci.yml` that runs `check-process-improvements` when `docs/plans/` or `docs/business-os/process-improvements.*` files are touched.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - After a commit that touches a `results-review.user.md`, `build-record.user.md`, or `reflection-debt.user.md` file, the `process-improvements.user.html` and `process-improvements.json` are automatically updated in the same commit without operator action.
  - The hook exits 0 for all ordinary generator errors (warn-only); the HTML-template corruption case (missing array markers) is the single allowed blocking failure.
  - The two generated files are included in the commit automatically via `git add`.
- Post-delivery measurement plan:
  - Make a test commit touching a `results-review.user.md` file and verify: (1) the hook ran, (2) the HTML was updated, (3) the JSON was updated, (4) both files appear in `git diff --cached`.

## Evidence Gap Review

### Gaps Addressed

1. **CI automation status**: Confirmed — no CI workflow references any of the three generation scripts. Gap was: might there be an obscure workflow that already handles this? Addressed by full grep of all 22 workflow files.
2. **Business OS app dependency**: Confirmed — the app does not import `process-improvements.json`. Gap was: could regeneration be chained to the BOS build? Addressed by grep of `apps/business-os/src/`.
3. **Error handling in the generator**: Confirmed — all three malformed-input paths are handled gracefully. The only hard failure is the HTML marker invariant, which is stable. Gap was: would adding the hook to pre-commit risk blocking commits on bad source data? Addressed.
4. **Writer-lock and hook compatibility**: Confirmed — the pre-commit hook can be extended safely; the writer-lock check runs before the hook body and exports the token.

### Confidence Adjustments

- No downward adjustments required. All investigated gaps resolved cleanly.
- Implementation confidence raised to 90% (was 88% based on dispatch packet) after confirming the exact conditional pattern to use and the correct pnpm invocation path.

### Remaining Assumptions

- Confirmed (not an assumption): `runCli()` at line 527 of `generate-process-improvements.ts` uses `path.resolve(process.cwd(), '..')`. pnpm workspace scripts run with cwd set to the package directory (`scripts/`) when invoked via `pnpm --filter scripts run`, so `..` resolves to the repo root. No task verification needed — this is settled by reading the source.
- It is assumed that `git add` inside a pre-commit hook is safe and that the resulting staged files will be included in the commit. This is standard Git behaviour and is confirmed by widespread open-source usage of this pattern, but should be tested in TASK-02.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan process-improvements-live-update`
