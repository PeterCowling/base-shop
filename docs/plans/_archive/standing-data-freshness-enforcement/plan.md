---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03T16:30:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: standing-data-freshness-enforcement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Standing Data Freshness Enforcement Plan

## Summary

Standing data files in `docs/business-os/startup-baselines/` have no freshness enforcement — an agent or operator can make a strategy decision based on months-old data with no warning. The aggregate-pack freshness policy is documented in three places but has zero code enforcement. This plan adds a baselines freshness checker that reads frontmatter dates (with git-commit-date fallback), evaluates against a 90-day age threshold, and surfaces warnings through the existing mcp-preflight check and a new CLI script. The confidence-based component of the policy (< 0.6) is future scope.

## Active tasks

- [x] TASK-01: Implement baselines freshness checker, extend mcp-preflight, add CLI script, and tests

## Goals

- Stale standing-baselines files are surfaced automatically — no `git log` required.
- The age-based component of the aggregate-pack freshness policy (90-day threshold) is enforced in code. The confidence-based component (< 0.6) is future scope — it requires a different mechanism since confidence is a subjective field set by the operator.
- Freshness status is available through mcp-preflight and a standalone CLI command.

## Non-goals

- Automatically refreshing stale content (this feature only surfaces the problem).
- Freshness enforcement for non-baselines standing data (future scope).
- Hard blocking of operations on stale data (advisory warnings only).

## Constraints & Assumptions

- Constraints:
  - Inconsistent frontmatter field naming across files — must normalize both `Created`/`Updated` (title-case) and `created`/`last_updated` (snake_case) conventions.
  - Tests run in CI only.
- Assumptions:
  - 90-day threshold matches documented aggregate-pack policy.
  - Advisory warnings (not hard blocks) are the right enforcement level.
  - Git commit date is an acceptable fallback for files without frontmatter dates.

## Inherited Outcome Contract

- **Why:** Standing data files are the input to every startup-loop stage decision. Without freshness enforcement, an agent or operator can make a strategy decision based on a 3-month-old offer doc without any warning. The baselines reorganisation made this visible — the files are now tidy but still have no way to signal when they need refreshing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Startup-baselines files have a freshness enforcement mechanism — stale files are surfaced automatically via a script or preflight check, so decisions are never silently made on outdated standing data.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/standing-data-freshness-enforcement/fact-find.md`
- Key findings used:
  - mcp-preflight scans `startup-baselines/` but filters to 3 runtime file types only (manifest, ledger, metrics) — `.md` content files are not checked
  - `buildFreshnessEnvelope()` in `loop-artifact-reader.ts` provides reusable 3-tier classification pattern (ok/warning/stale)
  - Frontmatter field names vary: `last_updated`, `Last-updated`, `Updated`, `Last-reviewed`, `created`, `Created` — all 6 variants observed
  - Aggregate-pack 90-day / confidence-0.6 policy is documented in `aggregate-pack-contracts.md` but has zero code enforcement
  - `mcp-preflight.test.ts` provides directly applicable test patterns (temp dirs, injectable clock, filesystem mtime)

## Proposed Approach

- Option A: Extend `runArtifactFreshnessCheck()` in-place to also scan `.md` files, adding date-extraction logic directly inside mcp-preflight.
- Option B: Create a standalone `baselines-freshness.ts` module with the core checker logic (frontmatter parsing, date normalization, git fallback, threshold evaluation), then import it into mcp-preflight and expose it as a CLI script.
- Chosen approach: **Option B** — separation of concerns. The checker module is independently testable, reusable by future consumers (e.g. S10 pack build), and keeps mcp-preflight thin. The module lives alongside existing baselines modules at `scripts/src/startup-loop/baselines/baselines-freshness.ts`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Baselines freshness checker + mcp-preflight integration + CLI + tests | 85% | M | Complete (2026-03-03) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no parallelism needed |

## Tasks

### TASK-01: Implement baselines freshness checker, extend mcp-preflight, add CLI script, and tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new module + extended preflight + CLI script + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Affects:** `scripts/src/startup-loop/baselines/baselines-freshness.ts` (new), `scripts/src/startup-loop/baselines/baselines-freshness-cli.ts` (new), `scripts/src/startup-loop/mcp-preflight.ts`, `scripts/src/startup-loop/__tests__/baselines-freshness.test.ts` (new), `scripts/package.json`, `[readonly] packages/mcp-server/src/lib/loop-artifact-reader.ts`, `[readonly] docs/business-os/startup-baselines/`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — clear entry points, existing module patterns in `baselines/` directory, well-tested area. `mcp-preflight.ts` extension is minimal (import + call). Frontmatter parsing is straightforward YAML header extraction.
  - Approach: 85% — Option B (standalone module + thin integration) is a proven pattern in this codebase. `buildFreshnessEnvelope` provides the reference architecture. No novel design decisions.
  - Impact: 80% — addresses a real structural gap. Held-back test: no single unresolved unknown would drop this below 80 because the value is preventive — the gap exists structurally regardless of whether a bad decision has occurred yet, and the only way to detect staleness today is manual `git log`.
- **Acceptance:**
  - `baselines-freshness.ts` exports `checkBaselinesFreshness()` returning structured results per file: `{ file, status, ageSeconds, sourceTimestamp, source }` where source is `"frontmatter" | "git" | "unknown"` and status is `"ok" | "warning" | "stale"`.
  - Frontmatter date field normalization handles all 6 observed variants: `last_updated` → `Last-updated` → `Updated` → `Last-reviewed` → `created` → `Created` (priority order, first match wins, case-insensitive).
  - Git commit date fallback (`git log -1 --format=%aI -- <file>`) used for files without any recognized frontmatter date field.
  - 90-day default threshold (7,776,000 seconds) hardcoded in `checkBaselinesFreshness()`. Accepts `STARTUP_LOOP_STALE_THRESHOLD_SECONDS` env var as override (same var name as mcp-preflight for consistency, but baselines checker sets its own 90-day default independently — does NOT inherit the 30-day default from `mcp-preflight-config.ts`).
  - 3-tier classification matching `buildFreshnessEnvelope` pattern: ok (< 45d), warning (45-90d), stale (> 90d).
  - `mcp-preflight.ts` `runArtifactFreshnessCheck()` extended: new check ID `"baseline-content-freshness"` added to `McpPreflightCheck.id` union type. Scans `.md` files in `startup-baselines/<BIZ>/`. Produces warnings for stale files.
  - `pnpm check-baselines-freshness` script added to `scripts/package.json`. Outputs human-readable summary to stdout. Exits 0 (advisory, matching existing preflight convention).
  - Tests cover: frontmatter date extraction for all 6 field variants, git-date fallback, threshold boundary (ok/warning/stale), missing frontmatter + missing git date (→ stale), file filtering (only `.md` files in `<BIZ>/` subdirectories, excluding `_templates/`).
- **Validation contract (TC-XX):**
  - TC-01: File with `last_updated: 2026-01-01` evaluated at `2026-03-03` → status `"warning"` (62 days, < 90d threshold but > 45d half-threshold)
  - TC-02: File with `Updated: 2025-11-01` evaluated at `2026-03-03` → status `"stale"` (123 days, > 90d)
  - TC-03: File with `Last-reviewed: 2026-02-28` evaluated at `2026-03-03` → status `"ok"` (3 days)
  - TC-04: File with no recognized frontmatter date field → falls back to git commit date
  - TC-05: File with no frontmatter date AND no git date → status `"stale"` (unknown age = stale)
  - TC-06: `_templates/` directory files are excluded from scan
  - TC-07: mcp-preflight returns `baseline-content-freshness` check with status `"warn"` when stale `.md` files present
  - TC-08: mcp-preflight returns `baseline-content-freshness` check with status `"pass"` when all `.md` files fresh
  - TC-09: `pnpm check-baselines-freshness` exits 0 and outputs summary
- **Execution plan:** Red → Green → Refactor
  - Red: No `baselines-freshness.ts` exists. mcp-preflight scans only 3 file types. No CLI script. No tests for standing-content freshness.
  - Green:
    1. Create `scripts/src/startup-loop/baselines/baselines-freshness.ts`:
       - `parseFrontmatterDate(content: string): string | null` — extracts first matching date field from YAML frontmatter (case-insensitive priority: `last_updated` → `last-updated` → `updated` → `last-reviewed` → `created`).
       - `getGitCommitDate(filePath: string): string | null` — runs `git log -1 --format=%aI -- <file>`, returns ISO date or null.
       - `checkBaselinesFreshness(options: { baselinesRoot: string, thresholdSeconds?: number, nowMs?: number, gitDateFn?: (path: string) => string | null }): BaselineFreshnessResult[]` — scans `<BIZ>/` subdirectories for `.md` files, evaluates each, returns array. `gitDateFn` injectable for testing.
       - `BaselineFreshnessResult` type: `{ file: string, status: "ok" | "warning" | "stale", ageSeconds: number | null, thresholdSeconds: number, sourceTimestamp: string | null, source: "frontmatter" | "git" | "unknown" }`.
    2. Extend `mcp-preflight.ts`:
       - Add `"baseline-content-freshness"` to `McpPreflightCheck.id` union type.
       - Add `runBaselineContentFreshnessCheck()` that calls `checkBaselinesFreshness()` and maps results to `McpPreflightIssue[]` + `McpPreflightCheck`.
       - Call from `runMcpPreflight()` alongside existing checks.
    3. Add CLI script entry in `scripts/package.json`:
       - `"check-baselines-freshness": "node --import tsx src/startup-loop/baselines/baselines-freshness-cli.ts"`
       - CLI wrapper: reads env for threshold override, calls `checkBaselinesFreshness()`, prints summary table, exits 0.
    4. Write tests in `scripts/src/startup-loop/__tests__/baselines-freshness.test.ts` covering TC-01 through TC-09.
  - Refactor: Review output format consistency with `buildFreshnessEnvelope`. Ensure error messages are clear.
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `McpPreflightCheck.id` is a string literal union — extending requires adding to the union type (line 27 of mcp-preflight.ts).
    - Confirmed `runArtifactFreshnessCheck` signature and return type are compatible with adding a parallel check.
    - Confirmed `scripts/package.json` has existing `check-*` script patterns.
    - Confirmed existing baselines modules in `scripts/src/startup-loop/baselines/` use same import conventions.
  - Validation artifacts: `mcp-preflight.ts` lines 7-17 (type union), 298-361 (freshness check), 363-386 (main function); `mcp-preflight.test.ts` TC-04 (stale artifact test pattern).
  - Unexpected findings: None.
- **Consumer tracing:**
  - New: `checkBaselinesFreshness()` function → consumed by `runBaselineContentFreshnessCheck()` in mcp-preflight and CLI script. No other consumers exist yet.
  - New: `"baseline-content-freshness"` check ID → consumed by any code reading `McpPreflightResult.checks` array. Existing consumers iterate the array — new entries don't break them. Consumer `mcp-preflight.test.ts` does `arrayContaining` assertions — new check entries are safe.
  - Modified: `McpPreflightCheck.id` union type → extended with new literal. All pattern matches on this type use `id: "registration"` etc. in test assertions with `objectContaining` — new values are safe.
  - Consumer `s10-diagnosis-integration.test.ts` references freshness in test context but does not import from mcp-preflight directly — unchanged, safe.
- **Build Evidence:**
  - Commit: `f03eabc8de` — `feat(startup-loop): add standing-data freshness enforcement for baselines`
  - Inline execution (CODEX_OK=1 but executed inline for precision)
  - All TC contracts implemented in `baselines-freshness.test.ts` (TC-01 through TC-09)
  - CLI validated locally: `pnpm check-baselines-freshness` → 18 files checked, all OK
  - Typecheck passed locally (`npx tsc --noEmit --project scripts/tsconfig.json`)
  - Lint passed in CI (eslint on all 4 TS files)
  - Files created: `baselines-freshness.ts` (225 lines), `baselines-freshness-cli.ts` (78 lines), `baselines-freshness.test.ts` (462 lines)
  - Files modified: `mcp-preflight.ts` (+82 lines), `scripts/package.json` (+1 line)
- **Scouts:** None: approach is well-established (extending existing freshness infrastructure with same patterns).
- **Edge Cases & Hardening:**
  - Empty `startup-baselines/` directory → return empty array, preflight check passes with "no standing content found" info message.
  - File with YAML frontmatter but no recognized date field → fall back to git date.
  - File with malformed frontmatter (no closing `---`) → skip frontmatter parsing, fall back to git date.
  - Non-`.md` files in `<BIZ>/` directories (e.g. `.html` companion files) → skip (only scan `.md`).
  - `S3-forecast/` subdirectories inside `<BIZ>/` → include their `.md` files in scan (they're standing data too).
  - Git not available or `git log` fails → treat as unknown date → stale.
- **What would make this >=90%:**
  - Confirming that the git-date fallback works correctly in CI environment (where repo may be a shallow clone). Would need to verify `git log` depth in CI, or accept that CI doesn't run the freshness check on live data.
- **Rollout / rollback:**
  - Rollout: Merge and deploy. Advisory-only — no behavior changes for existing consumers.
  - Rollback: Revert commit. No data changes.
- **Documentation impact:**
  - None: the feature is self-documenting via `pnpm check-baselines-freshness --help` and preflight output.
- **Notes / references:**
  - `packages/mcp-server/src/lib/loop-artifact-reader.ts` lines 76-129 (`buildFreshnessEnvelope`) — reference architecture for 3-tier classification.
  - `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts` TC-04 — reference test pattern for stale artifact checks.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Frontmatter field normalization misses a variant | Low | Low | Grep all files for date-like fields before implementation; add git-date fallback |
| Git-log fallback slow on large repos | Low | Low | Single `git log -1` per file is fast; injectable for testing |
| False-positive staleness on rarely-changing files | Medium | Low | Advisory only; threshold is configurable via env var |

## Observability

- Logging: mcp-preflight output includes stale file warnings with file path and age.
- Metrics: None (advisory check, no quantitative metrics needed).
- Alerts/Dashboards: None (operator surfaces via CLI invocation or preflight output).

## Acceptance Criteria (overall)

- [ ] `pnpm check-baselines-freshness` runs and reports freshness status for all standing baselines `.md` files in per-business subdirectories (excluding `_templates/`)
- [ ] mcp-preflight includes `baseline-content-freshness` check alongside existing checks
- [ ] Stale files produce warnings (not errors) — advisory only
- [ ] Tests pass in CI covering all 9 TC scenarios

## Decision Log

- 2026-03-03: Chose Option B (standalone module + thin integration) over Option A (in-place extension) for separation of concerns and testability.
- 2026-03-03: Set 90-day threshold matching documented aggregate-pack policy for consistency.
- 2026-03-03: Advisory-only enforcement (no hard blocks) matching existing preflight convention.

## Overall-confidence Calculation

- TASK-01: 85% (M, weight 2)
- Overall = 85% * 2 / 2 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Baselines freshness checker + mcp-preflight + CLI + tests | Yes | None — all entry points verified, `McpPreflightCheck.id` union extensible, `baselines/` directory exists, test patterns confirmed, no circular dependencies | No |
