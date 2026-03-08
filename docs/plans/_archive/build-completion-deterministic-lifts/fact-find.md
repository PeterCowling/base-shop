---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: build-completion-deterministic-lifts
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/build-completion-deterministic-lifts/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304020000-0988
---

# Build Completion Deterministic Lifts — Fact-Find Brief

## Scope

### Summary

The lp-do-build plan completion sequence (Steps 1-8) burns 7-15k tokens per build cycle. Investigation shows 60-65% of results-review, pattern-reflection, and standing-updates content is deterministic template fill that the LLM generates but a TS script could compute from build diffs, registry paths, and task completion status. This fact-find maps exactly which sections can be lifted to deterministic scripts and what the integration surface looks like.

### Goals

- Build a deterministic pre-fill script (`lp-do-build-results-review-prefill.ts`) that generates the boilerplate sections of results-review, pattern-reflection, and standing-updates from build artifacts.
- Reduce per-build token consumption by ~55% on the completion sequence.
- Preserve LLM involvement only for genuinely variable content (idea descriptions, observed-outcomes narrative, edge-case verdicts).

### Non-goals

- Changing the results-review template structure or schema.
- Replacing codemoot/inline fallback entirely — LLM remains the refinement layer.
- Automating the operator-intake structured questions (separate dispatch 0989).

### Constraints & Assumptions

- Constraints:
  - Must not break existing lp-do-build completion flow — pre-fill is additive, codemoot/inline fallback remains.
  - Pre-fill output must conform to `docs/plans/_templates/results-review.user.md` structure.
  - Pattern-reflection must conform to `pattern-reflection.v1` schema.
- Assumptions:
  - Build-record, build-event, and plan are always available at pre-fill time (they're produced in Steps 1-1.5 before Step 2).
  - Git history is available for diff computation.
  - Standing-registry.json is the single source of truth for artifact paths.

## Outcome Contract

- **Why:** Each build cycle burns 7-15k tokens on results-review, pattern-reflection, and standing-updates sections that are 60-65% boilerplate. The LLM generates None entries, counts recurrences, and fills verdicts that a TS script could compute deterministically from build diffs and task status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A deterministic pre-fill script generates 60%+ of results-review, pattern-reflection, and standing-updates content from build artifacts, reducing per-build token consumption by ~55%.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-build/SKILL.md` — Steps 2, 2.5, 2.6 in "Plan Completion and Archiving" define the current LLM-driven generation flow
- `scripts/src/startup-loop/build/generate-process-improvements.ts` — the `collectProcessImprovements()` function (line 508) shows how ideas are extracted from results-review files and filtered against `completed-ideas.json`

### Key Modules / Files

- `scripts/src/startup-loop/build/generate-process-improvements.ts` (990 lines) — ideas collection, HTML rendering, bridge wiring. Contains `deriveIdeaKey()`, `appendCompletedIdea()`, `loadCompletedIdeasRegistry()`.
- `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` — `emitBuildEvent()` and `writeBuildEvent()` produce `build-event.json` with `intended_outcome` field.
- `scripts/src/startup-loop/build/lp-do-build-reflection-debt.ts` — `validateResultsReviewContent()` validates results-review section completeness; `emitReflectionDebt()` checks for missing sections.
- `docs/business-os/startup-loop/ideas/standing-registry.json` — 38 active entries with artifact paths, business codes, domains.
- `docs/plans/_templates/results-review.user.md` — canonical template with 5 sections.
- `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` — pattern-reflection.v1 schema with routing decision tree.

### Data & Contracts

- Types/schemas:
  - `build-event.v1` schema: `{ intended_outcome: { type, statement, source }, why, why_source }`
  - `pattern-reflection.v1` schema: `{ entries: [{ pattern_summary, category, routing_target, occurrence_count, evidence_refs }] }`
  - `completed-ideas.v1` schema: `{ entries: [{ idea_key, title, source_path, plan_slug, completed_at, output_link }] }`
- Persistence:
  - Results-review: `docs/plans/<slug>/results-review.user.md` (markdown)
  - Pattern-reflection: `docs/plans/<slug>/pattern-reflection.user.md` (YAML frontmatter + markdown)
  - Build-event: `docs/plans/<slug>/build-event.json` (JSON)
  - Standing-registry: `docs/business-os/startup-loop/ideas/standing-registry.json` (JSON)

### Dependency & Impact Map

- Upstream dependencies:
  - `build-record.user.md` (Step 1) — must exist before pre-fill runs
  - `build-event.json` (Step 1.5) — provides intended_outcome for verdict
  - `plan.md` — provides task statuses, acceptance criteria, scope
  - Git history — for diff computation
  - `standing-registry.json` — for standing-updates detection
- Downstream dependents:
  - `lp-do-build` Step 2 (codemoot/inline) — pre-fill output becomes the scaffold that codemoot refines
  - `lp-do-build` Step 3 (reflection-debt) — validates results-review completeness
  - `generate-process-improvements.ts` — consumes results-review `## New Idea Candidates` section
- Blast radius: Low. Pre-fill is additive — produces a scaffold file that codemoot/inline refines. If pre-fill fails, existing flow runs unchanged.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest via `@jest/globals`
- Pattern: tmpdir fixtures with cleanup, YAML frontmatter parsing, markdown section detection
- CI integration: `pnpm -w run test:governed` (CI-only per testing policy)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Process improvements collection | Unit | `generate-process-improvements.test.ts` (461 lines) | Idea extraction, None suppression, completed-ideas filtering, classification |
| Build event emission | Unit | `lp-do-build-event-emitter.test.ts` (208 lines) | Operator + heuristic inputs, write/read idempotency |
| Reflection debt validation | Unit | `lp-do-build-reflection-debt.test.ts` (344 lines) | Missing section detection, intended outcome check (TC-06) |
| Codebase-signals bridge | Unit | `lp-do-ideas-codebase-signals-bridge.test.ts` (159 lines) | First-run emission, repeat-run suppression |
| Agent-session bridge | Unit | `lp-do-ideas-agent-session-bridge.test.ts` (180 lines) | Finding extraction, repeat-run suppression |

#### Coverage Gaps

- No tests for results-review pre-fill or template generation
- No tests for pattern-reflection auto-generation or recurrence counting
- No tests for standing-updates auto-detection via git diff intersection

#### Testability Assessment

- Easy to test: All inputs are files (plan.md, build-record.user.md, build-event.json, standing-registry.json, git diffs). All outputs are files (results-review.user.md, pattern-reflection.user.md). Pure functions with tmpdir fixtures.
- Hard to test: Git diff computation in test environment (need mock git repos or fixture files).
- Test seams: Accept `gitDiffFiles: string[]` as parameter instead of running `git diff` directly, enabling test injection.

### Recent Git History (Targeted)

- `7e259ccf4e` (2026-03-04) — Added codebase-signals and agent-session bridges, wired into generate-process-improvements.ts. Demonstrates the bridge-wiring pattern this pre-fill script will follow.
- `c055f8048d` (2026-03-04) — Completed 0151-0154 followthrough with registry expansion, build-commit hook, self-evolving bridge. Shows the full plan-completion artifact set.
- Recent None-placeholder fix in generate-process-improvements.ts (em-dash separator handling) — directly relevant as it shows the extraction patterns the pre-fill must match.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Results-review 5-category scan | Yes | None | No |
| Standing-updates registry intersection | Yes | None | No |
| Pattern-reflection recurrence counting | Partial | [Missing Domain Coverage] Minor: fuzzy matching for pattern summaries needs stable IDs or normalized keys | No |
| Intended-outcome auto-verdict | Yes | None | No |
| Test infrastructure | Yes | None | No |
| lp-do-build SKILL.md integration | Yes | None | No |

## Scope Signal

- Signal: right-sized
- Rationale: The 4 pre-fill targets (results-review None categories, standing updates, pattern-reflection, intended-outcome verdict) are well-bounded, all inputs are local files, blast radius is low (additive scaffold with fallback), and test patterns are established. No external dependencies.

## Access Declarations

None.

## Confidence Inputs

- Implementation: 85% — all inputs/outputs are well-defined files; existing test patterns (tmpdir, markdown parsing) directly apply; `generate-process-improvements.ts` already demonstrates the extraction logic.
- Approach: 88% — pre-fill-then-refine pattern is proven (codemoot already works as a refinement layer); the only design question is whether pattern-reflection should use exact-match IDs or fuzzy text matching (recommend exact-match `idea_key` derivation).
- Impact: 82% — 60-65% of results-review is demonstrably boilerplate (verified across 5 archived files); token savings are real but exact % depends on how much codemoot still refines.
- Delivery-Readiness: 90% — no missing infrastructure, no external dependencies, no deployment steps.
- Testability: 90% — pure file I/O with injectable git diff parameter; existing Jest patterns apply directly.

What would raise to >=90: Ship the script and measure actual token reduction on 3 consecutive builds.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pre-fill generates incorrect None for a category that has real content | Low | Medium | Codemoot/inline refinement catches it; pre-fill is scaffold not final |
| Pattern-reflection fuzzy matching produces false recurrence counts | Medium | Low | Use exact `idea_key` derivation (SHA-1 of source_path + title) instead of fuzzy text match |
| Git diff unavailable in some build contexts | Low | Low | Accept `gitDiffFiles` as optional parameter; fall back to empty list (no standing updates detected) |
| Pre-fill adds complexity to already-long completion sequence | Low | Low | Single function call inserted before Step 2; fail-open (if script errors, existing flow runs) |

## Questions

### Resolved

- Q: Should pre-fill replace codemoot/inline entirely?
  - A: No. Pre-fill generates the scaffold; codemoot/inline refines only the genuinely variable sections. This is the same pattern as `draft_refine` in the email pipeline (deterministic template → LLM refinement).
  - Evidence: Email pipeline `auto_best` mode demonstrates deterministic-first approach saves tokens while maintaining quality.

- Q: How should pattern-reflection count recurrences without fuzzy matching?
  - A: Use `deriveIdeaKey(source_path, title)` (SHA-1 hash) for exact matching. The function already exists in `generate-process-improvements.ts` line 590. Count matching keys across `_archive/*/results-review.user.md` idea bullets.
  - Evidence: `deriveIdeaKey` is battle-tested — used by `completed-ideas.json` exclusion.

- Q: Where does the pre-fill script run in the completion sequence?
  - A: Between Step 1.5 (build-event.json) and Step 2 (codemoot/inline). Pre-fill writes the scaffold to `docs/plans/<slug>/results-review.user.md`; codemoot reads it and refines.
  - Evidence: All upstream inputs (build-record, build-event, plan) are available after Step 1.5.

### Open (Operator Input Required)

None — all design decisions are resolvable from codebase evidence and established patterns.

## Planning Constraints & Notes

- Must-follow patterns:
  - Pre-fill output must be valid markdown matching `docs/plans/_templates/results-review.user.md` structure.
  - Pattern-reflection output must conform to `pattern-reflection.v1` YAML schema.
  - Use existing `deriveIdeaKey()` for recurrence matching.
  - Accept injectable parameters for git diff (testability seam).
- Rollout: No deployment — script runs locally as part of lp-do-build completion.
- Observability: Log pre-fill decisions to stdout (`[pre-fill] standing-updates: 2 artifacts changed`, `[pre-fill] idea-scan: 3/5 categories None`, `[pre-fill] verdict: Met (all tasks Complete, no deviations)`).

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Results-review pre-fill script** — `lp-do-build-results-review-prefill.ts` with 5-category None scan, standing-updates detection, intended-outcome auto-verdict. ~300-400 lines.
2. **IMPLEMENT: Pattern-reflection auto-generator** — `lp-do-build-pattern-reflection-prefill.ts` with archive recurrence counting via `deriveIdeaKey`, routing decision tree, YAML rendering. ~200-250 lines.
3. **IMPLEMENT: Wire pre-fill into lp-do-build SKILL.md** — Insert pre-fill call between Step 1.5 and Step 2; modify codemoot prompt to say "refine the pre-filled scaffold" instead of "fill all sections".
4. **IMPLEMENT: Tests** — tmpdir fixtures for pre-fill and pattern-reflection, covering None detection, standing-updates intersection, verdict logic, recurrence counting.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Pre-fill scripts produce valid results-review and pattern-reflection scaffolds; codemoot/inline refinement still runs; `generate-process-improvements.ts` extracts ideas correctly from pre-filled output.
- Post-delivery measurement plan: Compare token usage on 3 consecutive builds before/after pre-fill activation.

## Evidence Gap Review

### Gaps Addressed

- Verified results-review template structure and all 5 scan categories against 5 archived examples.
- Confirmed `deriveIdeaKey()` exists and is suitable for recurrence matching (line 590 of generate-process-improvements.ts).
- Confirmed standing-registry.json has 38 active entries with paths suitable for git-diff intersection.
- Verified pattern-reflection.v1 routing decision tree is fully deterministic (Section 4.1 of schema spec).
- Confirmed test infrastructure patterns (tmpdir, YAML parsing, markdown sections) from 3 existing test files.

### Confidence Adjustments

- Implementation raised from 80→85 after confirming `deriveIdeaKey()` solves the recurrence counting problem without fuzzy matching.
- Testability raised from 85→90 after confirming injectable git-diff parameter pattern.

### Remaining Assumptions

- Codemoot refinement step will correctly handle a pre-filled scaffold (not verified — but the codemoot prompt is user-defined and can be adjusted in SKILL.md).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan build-completion-deterministic-lifts --auto`
