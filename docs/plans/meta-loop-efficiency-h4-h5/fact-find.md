---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: meta-loop-efficiency-h4-h5
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: meta-loop-efficiency, tools-loop-efficiency-deterministic-extraction
Related-Plan: docs/plans/meta-loop-efficiency-h4-h5/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304122500-0004
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Meta-Loop Efficiency H4/H5 Fact-Find Brief

## Scope
### Summary
`/meta-loop-efficiency` already documents H4 deterministic-extraction and H5 anti-gaming heuristics, but the repo does not have an executable audit path that computes them. The current audit artifacts remain structural-only, and the downstream deterministic-extraction scout/queue tooling only ingests H1-H3. This work closes that gap by implementing a script-backed audit path with tested H4/H5 logic and by extending the scout pipeline so new signals propagate into execution queues.

### Goals
- Implement executable H0-H5 audit logic for startup-loop skills.
- Score H4 deterministic-extraction and H5 shrink-without-simplification in the generated audit artifact.
- Use previous-audit `git_sha` snapshots so H5 works deterministically without manual baselines.
- Extend deterministic-extraction scout support so H4/H5 findings flow into analysis and execution queues.

### Non-goals
- Reworking unrelated skill-efficiency backlog items.
- Full automation of chat-level `/meta-loop-efficiency` invocation plumbing outside the script path.
- Running local Jest; tests remain CI-only by repo policy.

### Constraints & Assumptions
- Constraints:
  - Changes must stay scoped to the audit/scout pipeline plus required docs.
  - Local validation must avoid Jest/e2e execution.
  - The worktree is dirty; commit scope must be explicit and narrow.
- Assumptions:
  - The previous audit artifact `git_sha` is sufficient to reconstruct prior skill snapshots for delta comparison.
  - `scripts` is the right home for deterministic audit logic because H4/H5 require repeatable computation and tests.

## Outcome Contract
- **Why:** Close the structural-only gap in skill-efficiency auditing so deterministic extraction and anti-gaming regressions are detected automatically instead of relying on prose-only guidance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/meta-loop-efficiency` emits artifacts with H4/H5 findings, and downstream deterministic-extraction tooling can ingest those findings into planning/build queues.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/meta-loop-efficiency/SKILL.md` - canonical heuristic contract including H4/H5.
- `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md` - latest artifact proving H4/H5 are not yet scored.
- `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs` - parses current audit artifact into analysis scout rows.
- `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs` - turns scout rows into execution queue rows.

### Key Modules / Files
- `.claude/skills/meta-loop-efficiency/SKILL.md` - defines H0-H5, ranking, and artifact contract.
- `docs/plans/loop-skill-efficiency-audit/plan.md` - original implementation chose a prose-only skill over a script.
- `scripts/package.json` - existing home for startup-loop deterministic CLIs.
- `scripts/src/startup-loop/diagnostics/validate-process-assignment.ts` - reference pattern for tested CLI logic in `scripts`.
- `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` - reference pattern for pure-function Jest tests in `scripts`.

### Patterns & Conventions Observed
- Skill audit contract already requires `List 3 — Deterministic extraction and anti-gaming` in `.claude/skills/meta-loop-efficiency/SKILL.md`.
- Latest artifact explicitly says deterministic extraction and anti-gaming are “Not yet scored” in `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`.
- The scout parser only handles `## 3. List 1` and `## 4. List 2` in `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs`.
- The queue builder only has signal-specific notes for H1/H2/H3 in `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs`.

### Data & Contracts
- Types/schemas/events:
  - Audit artifact frontmatter/header fields and section names are contractually defined by `.claude/skills/meta-loop-efficiency/SKILL.md`.
  - Dispatch packet `IDEA-DISPATCH-20260304122500-0004` captures the intended H4/H5 scope in `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- Persistence:
  - Audit artifacts live under `docs/business-os/platform-capability/skill-efficiency-audit-YYYY-MM-DD-HHMM.md`.
  - Deterministic extraction analysis and queue live under `docs/plans/startup-loop-token-efficiency-v2/`.
- API/contracts:
  - No external API dependency; git object lookup via local `git show`/`git ls-tree` is the only prior-snapshot dependency.

### Dependency & Impact Map
- Upstream dependencies:
  - Previous audit artifact header `git_sha`.
  - Current skill directory content under `.claude/skills/`.
- Downstream dependents:
  - `tools-loop-efficiency-deterministic-extraction` scout and queue scripts.
  - Any future `/meta-loop-efficiency` run or plan triggered from its artifacts.
- Likely blast radius:
  - `scripts/package.json`
  - new `scripts/src/startup-loop/diagnostics/meta-loop-efficiency-audit.ts`
  - new `scripts/src/startup-loop/__tests__/meta-loop-efficiency-audit.test.ts`
  - `.claude/skills/meta-loop-efficiency/SKILL.md`
  - `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs`
  - `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs`

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest in `scripts` package.
- Commands: local Jest execution is prohibited by repo policy; static validation can use `tsc` and `eslint`.
- CI integration: `scripts` package tests run in CI via workspace test pipeline.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| deterministic CLI logic | unit | `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` | Pure-function validation with fixture builders |
| startup-loop signal extraction | unit | `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts` | Filesystem fixture scanning patterns already exist |

#### Coverage Gaps
- Untested paths:
  - No executable audit implementation exists for H4/H5.
  - No downstream parser coverage for a third audit list.
- Extinct tests:
  - None identified in touched area.

#### Testability Assessment
- Easy to test:
  - Pure metric extraction over synthetic skill fixtures.
  - Prior-snapshot comparison using injected git readers.
- Hard to test:
  - End-to-end chat invocation of `/meta-loop-efficiency`.
- Test seams needed:
  - Audit scanner should expose pure functions with injectable filesystem/git adapters.

#### Recommended Test Approach
- Unit tests for:
  - current metric extraction,
  - H4/H5 detection,
  - delta classification,
  - artifact section rendering invariants.
- Integration-style validation for:
  - dry-run CLI over current repo,
  - scout dry-run parsing of generated artifact format.
- CI-only:
  - Jest execution of new `scripts` tests.

## Questions
### Resolved
- Q: Is H4/H5 already implemented anywhere executable?
  - A: No. They exist only in skill prose; the latest artifact still marks them unscored.
  - Evidence: `.claude/skills/meta-loop-efficiency/SKILL.md`, `docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md`
- Q: Does downstream tooling already ingest a third audit list?
  - A: No. The scout parser only reads List 1 and List 2, and the queue builder only has H1/H2/H3 notes.
  - Evidence: `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/refresh-analysis-and-scout.mjs`, `.claude/skills/tools-loop-efficiency-deterministic-extraction/scripts/build-execution-queue.mjs`
- Q: Is a prose-only update sufficient?
  - A: No. H5 needs deterministic previous-state comparison and repeatable validation, which belongs in tested code rather than skill prose.
  - Evidence: `docs/plans/loop-skill-efficiency-audit/plan.md`, `.claude/skills/meta-loop-efficiency/SKILL.md`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: scope is bounded to one new diagnostic CLI plus two downstream parser updates and one skill doc alignment.
  - Raises to >=90%: confirm targeted `tsc` and `eslint` pass on first attempt.
- Approach: 86%
  - Evidence basis: previous-artifact `git_sha` gives a deterministic prior snapshot path without inventing new storage.
  - Raises to >=90%: dry-run over current repo produces List 3 without format churn.
- Impact: 84%
  - Evidence basis: this closes an explicitly logged P1 gap and prevents line-budget gaming from being invisible.
  - Raises to >=90%: scout dry-run confirms H4/H5 findings flow into analysis rows.
- Delivery-Readiness: 90%
  - Evidence basis: clear files, clear contract, no missing prerequisites once writer lock is free.
  - Raises to >=90%: no additional work.
- Testability: 83%
  - Evidence basis: pure-function structure is straightforward, but local Jest execution is blocked by policy so test execution proof is deferred to CI.
  - Raises to >=90%: CI passes new unit tests.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Previous artifact `git_sha` cannot reconstruct a file path | Low | Medium | Fail closed per-skill for H5 and surface explicit note in artifact |
| H4 keyword markers over-flag prose-heavy skills | Medium | Medium | Keep signal as advisory; add tests around threshold and artifact-ref suppression |
| Artifact format drift breaks existing scout parsing | Medium | High | Update scout parser in the same change and validate with dry-run |
| Dirty worktree contaminates commit | Medium | High | Stage explicit paths only and keep commit scope narrow |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| audit heuristic computation | Yes | None | No |
| previous-snapshot comparison | Yes | None | No |
| downstream scout ingestion | Yes | None | No |
| execution queue propagation | Yes | None | No |

## Scope Signal
Signal: right-sized
Rationale: one bounded audit pipeline with well-defined contracts, no unresolved operator input, and a single affected package for local validation.

## Evidence Gap Review
### Gaps Addressed
- Confirmed H4/H5 exist only in prose, not code.
- Confirmed downstream scout/queue support is incomplete for new signals.
- Confirmed `scripts` package provides the right executable/tested home.

### Confidence Adjustments
- Testability capped below 90 because local Jest execution is disallowed.

### Remaining Assumptions
- Previous artifact `git_sha` objects remain available in local git history.
