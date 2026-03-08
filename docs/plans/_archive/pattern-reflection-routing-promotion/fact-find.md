---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: pattern-reflection-routing-promotion
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: typescript-script
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/pattern-reflection-routing-promotion/plan.md
Trigger-Why: Pattern-reflection routing outputs (loop_update, skill_proposal) are produced but never consumed downstream, making the routing decision tree dead code for non-defer targets.
Trigger-Intended-Outcome: type: operational | statement: Produce two deterministic scripts that read pattern-reflection routing outputs and produce actionable drafts (process doc patches and SKILL.md scaffolds), closing the reflection-to-action gap. | source: operator
---

# Pattern-Reflection Routing Promotion — Fact-Find Brief

## Scope

### Summary

The pattern-reflection artifact (`pattern-reflection.user.md`) is produced at the end of every build (Step 2.4-2.5 of `/lp-do-build`). Its routing decision tree classifies entries into three targets: `loop_update`, `skill_proposal`, and `defer`. However, no downstream process reads the structured `routing_target` fields on individual entries and acts on them. The artifact is consumed as a document-level blob by `self-evolving-from-build-output.ts` (observation seeding), but the entry-level routing targets (`loop_update`, `skill_proposal`) are never parsed or acted upon — making the routing decision tree effectively dead code for non-defer targets.

Two deterministic TypeScript scripts are needed:
1. **`lp-do-pattern-promote-loop-update`** — reads entries with `routing_target: loop_update`, drafts patches to relevant standing process docs
2. **`lp-do-pattern-promote-skill-proposal`** — reads entries with `routing_target: skill_proposal`, scaffolds a SKILL.md template in `.claude/skills/`

### Goals

- Close the reflection-to-action gap for `loop_update` and `skill_proposal` routing targets
- Keep promotion deterministic — no LLM reasoning in the scripts themselves
- Produce operator-reviewable output (draft patches / scaffold files) rather than auto-applying changes

### Non-goals

- Modifying the pattern-reflection prefill script or routing decision tree thresholds
- Auto-applying changes without operator review
- Handling `defer` entries (they remain as-is by design)
- Integrating into the build completion sequence as a mandatory step (advisory/fail-open only)

### Constraints & Assumptions

- Constraints:
  - Scripts must be deterministic TypeScript (no LLM calls)
  - Output must be operator-reviewable before application
  - Must not create self-triggering loops (anti-loop safety required)
- Assumptions:
  - Pattern-reflection YAML frontmatter `entries[]` array is the authoritative input
  - Standing process docs and skill directories have stable, known paths
  - Volume is low: only 3 non-defer entries exist across all archived builds (1 `loop_update`, 2 `skill_proposal`)

## Outcome Contract

- **Why:** The pattern-reflection artifact captures recurring patterns and routes them to targets like `loop_update` and `skill_proposal`, but no downstream process reads these outputs. For `loop_update` entries, process improvements identified across multiple builds never reach the standing docs they should update. For `skill_proposal` entries, identified skill opportunities are logged but never scaffolded. The routing decision tree is effectively dead code for non-defer targets.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce two deterministic scripts that read pattern-reflection routing outputs and produce actionable drafts: one for standing process doc patches (`loop_update`), one for SKILL.md scaffolds (`skill_proposal`), closing the reflection-to-action gap.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — produces the pattern-reflection artifact with YAML frontmatter entries and routing targets
- `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` — defines the `pattern-reflection.v1` schema including routing decision tree

### Key Modules / Files

- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — prefill script (source of truth for `PatternEntry`, `RoutingTarget`, `PatternCategory` types)
- `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` — existing test suite (TC-01 through TC-06 + unit tests)
- `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` — schema spec with routing decision tree (§4)
- `.claude/skills/lp-do-build/SKILL.md` — build completion sequence Steps 2.4-2.6 (production site)
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` — artifact contracts including pattern-reflection
- `docs/business-os/startup-loop/process-registry-v2.md` — standing process registry (target for `loop_update` patches)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — `SELF_TRIGGER_PROCESSES` set (line 457-462, 4 entries)
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` — reads pattern-reflection as document-level blob (not entry-level parsing)

### Patterns & Conventions Observed

- **Deterministic script pattern**: Follow `self-evolving-write-back.ts` (907 lines) as the model — standalone CLI with `--dry-run`, typed inputs/outputs, dedicated audit trail, anti-loop registration — evidence: `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts`
- **YAML frontmatter parsing**: Pattern-reflection entries are in YAML frontmatter `entries[]` array — evidence: `lp-do-build-pattern-reflection-prefill.ts` line 160-180
- **Type exports from prefill script**: `PatternEntry`, `RoutingTarget`, `PatternCategory` already exported — evidence: `lp-do-build-pattern-reflection-prefill.ts`
- **Skill directory convention**: `.claude/skills/<skill-name>/SKILL.md` with optional `modules/` subdirectory — evidence: `.claude/skills/lp-seo/`, `.claude/skills/guide-translate/`
- **Anti-loop registration**: New self-trigger processes should be added to `SELF_TRIGGER_PROCESSES` set as defense-in-depth — evidence: `lp-do-ideas-trial.ts` line 457-462. Note: suppression only triggers when `ArtifactDeltaEvent.updated_by_process` matches; the build commit-hook hardcodes `"lp-do-build-post-commit-hook"` so registration is forward-looking for these draft-producing scripts

### Data & Contracts

- Types/schemas/events:
  - `PatternEntry { pattern_summary: string; category: PatternCategory; routing_target: RoutingTarget; occurrence_count: number; evidence_refs: string[] }` — from prefill script
  - `PatternCategory = "deterministic" | "ad_hoc" | "access_gap" | "unclassified"` — from prefill script
  - `RoutingTarget = "loop_update" | "skill_proposal" | "defer"` — from prefill script
  - Schema: `pattern-reflection.v1` — YAML frontmatter with `schema_version`, `feature_slug`, `generated_at`, `entries[]`
- Persistence:
  - Input: `docs/plans/_archive/<slug>/pattern-reflection.user.md` (YAML frontmatter entries)
  - Output (loop_update): draft patch files (proposed changes to standing process docs)
  - Output (skill_proposal): scaffold SKILL.md files in `.claude/skills/`
- API/contracts:
  - Routing decision tree (§4.1 of schema spec): `deterministic + count>=3 → loop_update`, `ad_hoc + count>=2 → skill_proposal`, all others → `defer`

### Dependency & Impact Map

- Upstream dependencies:
  - Pattern-reflection prefill script produces the input artifact
  - Build completion sequence (Step 2.4-2.5) is the production site
- Downstream dependents:
  - Standing process docs (`process-registry-v2.md`) — target for `loop_update` patches
  - Skill directory (`.claude/skills/`) — target for `skill_proposal` scaffolds
  - `SELF_TRIGGER_PROCESSES` — should register new process names as forward-looking defense-in-depth (optional for current draft/scaffold scripts since commit-hook emits `lp-do-build-post-commit-hook`, not these process names)
- Likely blast radius:
  - Low — scripts produce draft output for operator review, not auto-applied changes
  - New files: 2 scripts + 2 test files + package.json entries
  - Modified files: `lp-do-ideas-trial.ts` (SELF_TRIGGER_PROCESSES additions)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (`@jest/globals` imports, `.js` extension convention)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: Tests run in CI only per `docs/testing-policy.md`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Pattern-reflection prefill | Unit + Integration | `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-prefill.test.ts` | TC-01 through TC-06, routing decision tree, recurrence key normalization, archive scanning |
| Self-evolving write-back | Unit + Integration | `scripts/src/startup-loop/__tests__/self-evolving-write-back.test.ts` | 36 tests, model for new scripts |

#### Testability Assessment

- Easy to test:
  - YAML frontmatter parsing (structured input, deterministic output)
  - Entry filtering by `routing_target` (simple filter predicate)
  - Scaffold generation (string template output)
  - Dry-run mode (no side effects)
- Hard to test:
  - Nothing identified — all logic is deterministic with file I/O as the only side effect
- Test seams needed:
  - Tmpdir-based integration tests (same pattern as existing write-back tests)

#### Recommended Test Approach

- Unit tests for: entry filtering, YAML parsing, scaffold template generation, patch draft generation
- Integration tests for: end-to-end with tmpdir (write pattern-reflection input, run script, verify output files)
- Contract tests for: schema compliance of input parsing and output format

## Access Declarations

None — all investigation is repo-internal.

## Questions

### Resolved

- Q: What format are pattern-reflection entries stored in?
  - A: YAML frontmatter `entries[]` array in `pattern-reflection.user.md` with fields: `pattern_summary`, `category`, `routing_target`, `occurrence_count`, `evidence_refs`
  - Evidence: `lp-do-build-pattern-reflection-prefill.ts`, `task-01-schema-spec.md` §2.1

- Q: What standing process docs would `loop_update` target?
  - A: Primary target is `docs/business-os/startup-loop/process-registry-v2.md` (20 workstream processes). Secondary targets include loop-output-contracts.md and skill SKILL.md files. The entry's `evidence_refs` and `pattern_summary` provide the targeting signal — the script must map pattern content to the appropriate doc.
  - Evidence: `process-registry-v2.md`, `loop-output-contracts.md`

- Q: What does a SKILL.md scaffold look like?
  - A: Frontmatter (`name`, `description`), heading, quick description, invocation section, operating mode, global invariants (allowed/prohibited), inputs, workflow phases, integration notes. Examples: `lp-seo/SKILL.md` (phased modules), `guide-translate/SKILL.md` (validation gates), `lp-offer/SKILL.md` (subagent dispatch).
  - Evidence: `.claude/skills/lp-seo/SKILL.md`, `.claude/skills/guide-translate/SKILL.md`

- Q: How many non-defer entries exist in the archive?
  - A: 3 total: 1 `loop_update` (in `lp-do-ideas-execution-guarantee`), 2 `skill_proposal` (in `bos-loop-assessment-registry` and `brik-sticky-book-now-room-context`). Volume is very low.
  - Evidence: grep across `docs/plans/_archive/*/pattern-reflection.user.md`

- Q: Does the self-evolving bridge parse entry-level routing targets?
  - A: No — `self-evolving-from-build-output.ts` treats pattern-reflection as a document-level blob for observation seeding. It does not parse YAML frontmatter entries or `routing_target` values.
  - Evidence: `self-evolving-from-build-output.ts` lines 224-228

### Open (Operator Input Required)

No open questions — all decisions are agent-resolvable from available evidence.

## Confidence Inputs

- Implementation: 90% — clear input format (YAML frontmatter), known output targets, established patterns (write-back script is a direct model). Would reach 95% with a spike confirming YAML parsing from the frontmatter block.
- Approach: 90% — two standalone scripts matching the established deterministic-script pattern, draft-output-for-review model is proven safe.
- Impact: 75% — only 3 non-defer entries exist in the archive currently. Impact grows as more builds produce pattern-reflection entries that cross thresholds. Would reach 85% with evidence of increasing entry volume.
- Delivery-Readiness: 90% — all input types, output targets, and test patterns are well-understood. No external dependencies.
- Testability: 95% — fully deterministic, tmpdir-based integration testing, established test patterns from prefill script and write-back script.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| YAML frontmatter parsing edge cases (malformed entries, missing fields) | Low | Low | Defensive parsing with skip-on-error per entry; test with malformed inputs |
| `loop_update` target doc identification is ambiguous (pattern doesn't clearly map to a specific doc) | Medium | Medium | Script outputs a draft with the pattern summary and evidence refs; operator decides target doc. Include a `target_doc: unknown` fallback. |
| Low volume means scripts run rarely and may bit-rot | Medium | Low | Include in post-build completion sequence as advisory step; tests in CI catch regressions |
| Scaffold SKILL.md may not match evolving skill conventions | Low | Low | Use a minimal template; operator refines before use |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow `self-evolving-write-back.ts` as the structural model (CLI entry point, `--dry-run`, typed exports, dedicated audit)
  - Import `PatternEntry` types from the existing prefill script (don't duplicate)
  - Register process names in `SELF_TRIGGER_PROCESSES` for anti-loop safety
- Rollout/rollback expectations:
  - Scripts are advisory/fail-open — no mandatory integration needed initially
  - Can be inserted as optional steps after Step 2.5 in the build completion sequence
- Observability expectations:
  - Console output summarizing entries processed, drafts produced, entries skipped
  - `--dry-run` mode for safe testing

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Core loop_update promotion script** (M) — `lp-do-pattern-promote-loop-update.ts`: parse pattern-reflection YAML frontmatter, filter `routing_target: loop_update` entries, identify target standing doc from evidence_refs/pattern_summary, produce draft patch file with proposed changes. CLI: `--reflection-path`, `--output-dir`, `--dry-run`.
2. **TASK-02: Core skill_proposal promotion script** (S) — `lp-do-pattern-promote-skill-proposal.ts`: parse pattern-reflection YAML frontmatter, filter `routing_target: skill_proposal` entries, scaffold SKILL.md template in output directory. CLI: `--reflection-path`, `--output-dir`, `--dry-run`.
3. **TASK-03: Anti-loop integration** (S) — Add `"pattern-promote-loop-update"` and `"pattern-promote-skill-proposal"` to `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts` as defense-in-depth. Note: these scripts produce draft/scaffold output files (not direct standing artifact edits), so the current commit-hook (which emits `updated_by_process: "lp-do-build-post-commit-hook"`) would not match these process names. The registration is forward-looking — it prevents self-triggering if these scripts later evolve to emit `ArtifactDeltaEvent` directly.
4. **TASK-04: Test suite** (M) — Tests for both scripts: YAML parsing, entry filtering, draft generation, scaffold generation, dry-run mode, edge cases (empty entries, malformed YAML, no matching routing target).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - 2 TypeScript scripts with CLI entry points and `--dry-run` mode
  - Anti-loop registration in `SELF_TRIGGER_PROCESSES`
  - Test suite with unit + integration coverage
  - Package.json entries for both scripts
- Post-delivery measurement plan:
  - Count of pattern-reflection entries promoted per build cycle
  - Count of operator-accepted vs operator-rejected draft patches/scaffolds

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Pattern-reflection YAML schema | Yes | None | No |
| Routing decision tree thresholds | Yes | None | No |
| Archive entry volume and examples | Yes | None | No |
| Standing process doc targets | Yes | [Moderate]: target doc identification may be ambiguous for some entries | No — handled by `target_doc: unknown` fallback in risk table |
| SKILL.md template conventions | Yes | None | No |
| Anti-loop safety (SELF_TRIGGER_PROCESSES) | Yes | None | No |
| Existing test patterns | Yes | None | No |
| Build completion sequence insertion point | Yes | None | No |

## Scope Signal

- Signal: right-sized
- Rationale: Two focused scripts with clear inputs (YAML entries), clear outputs (draft files/scaffolds), established patterns to follow (write-back script), and low volume (3 existing non-defer entries). No external dependencies. Scope is well-bounded and realistic.

## Evidence Gap Review

### Gaps Addressed

- Pattern-reflection schema fully documented from spec + prefill source
- Standing process doc targets identified (process-registry-v2.md primary)
- SKILL.md template conventions captured from 3 examples
- Anti-loop registration path confirmed (SELF_TRIGGER_PROCESSES)
- Test patterns established from existing prefill + write-back test suites

### Confidence Adjustments

- No adjustments needed — all evidence areas met minimum threshold

### Remaining Assumptions

- YAML frontmatter entries are well-formed (defensive parsing mitigates)
- Pattern-to-target-doc mapping can be reasonably inferred from evidence_refs and pattern_summary (fallback to unknown mitigates)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan pattern-reflection-routing-promotion --auto`
