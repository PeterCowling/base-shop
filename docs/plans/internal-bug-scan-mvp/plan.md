---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: internal-bug-scan-mvp
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Internal Bug Scan MVP Plan

## Summary
Built a repository-native bug scanner MVP that complements existing lint/typecheck/security checks with focused static heuristics over changed files or explicit target paths. This replaces reliance on invasive external scanner installers for this workflow.

## Active tasks
- [x] TASK-01: Implement scanner CLI script with high-signal MVP rules.
- [x] TASK-02: Wire root commands (`bug-scan`, `bug-scan:changed`) and document usage in plan evidence.
- [x] TASK-03: Validate affected package gates and mark plan complete.

## Goals
- Provide deterministic scanner behavior with no external installer dependency.
- Keep output actionable and machine-readable.
- Keep default workflow optimized for changed files.

## Non-goals
- CI enforcement in this task.
- Exhaustive static analysis coverage.

## Inherited Outcome Contract
- **Why:** Add a deterministic, repository-native bug scanning layer that improves early detection of risky code patterns without introducing invasive external installers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deliver an MVP internal scanner and integrate runnable commands for manual and changed-file scans, with validation proving typecheck/lint compatibility.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/internal-bug-scan-mvp/fact-find.md`

## Proposed Approach
- Option A: pure regex grep scanner.
- Option B: TypeScript AST-based scanner with targeted semantic checks.
- Chosen approach: Option B (AST-based) for lower false positives and extensibility.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add AST scanner script with MVP rules and output modes | 92% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add root script wiring for manual and changed-file scans | 94% | S | Complete (2026-03-02) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Run validation gates and capture evidence | 90% | S | Complete (2026-03-02) | TASK-02 | - |

## Build Evidence
### TASK-01
- Added `scripts/src/quality/bug-scan.ts` (AST scanner).
- Implemented MVP rules:
  - `no-eval-call`
  - `no-new-function`
  - `unsafe-innerhtml-assignment`
  - `unsafe-dangerouslysetinnerhtml`
  - `no-as-any`
  - `no-angle-any`
  - `no-dom-query-non-null-assertion`
  - `hardcoded-secret-literal`
- Added scanner modes:
  - explicit targets
  - `--changed`
  - `--staged`
  - output formats: `text`, `json`
  - non-zero exit on findings

### TASK-02
- Added root scripts in `package.json`:
  - `bug-scan`: `node --import tsx scripts/src/quality/bug-scan.ts`
  - `bug-scan:changed`: `node --import tsx scripts/src/quality/bug-scan.ts --changed`

### TASK-03
- Executed `pnpm bug-scan scripts/src/quality/bug-scan.ts` (0 findings).
- Executed fixture verification with `eval()` sample; scanner returned exit code 1.
- Executed `pnpm bug-scan:changed` (ran successfully on current changed-file set).
- Executed `scripts/validate-changes.sh` under writer lock wrapper; validation passed.

## Risks & Mitigations
- Risk: Rule noise reduces adoption.
  - Mitigation: keep MVP rules high-signal and easily configurable.
- Risk: Changed-file detection misses edge cases.
  - Mitigation: support explicit targets and staged/working-tree fallback.

## Acceptance Criteria (overall)
- [x] `scripts/src/quality/bug-scan.ts` exists and runs.
- [x] `pnpm bug-scan` and `pnpm bug-scan:changed` execute.
- [x] Scanner exits non-zero when findings exist.
- [x] Validation passes for affected scope.
