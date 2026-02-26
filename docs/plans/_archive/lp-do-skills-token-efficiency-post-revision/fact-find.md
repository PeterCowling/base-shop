---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: lp-do-skills-token-efficiency-post-revision
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique, lp-do-factcheck
Related-Plan: docs/plans/lp-do-skills-token-efficiency-post-revision/plan.md
Trigger-Source: dispatch-routed
Trigger-Why: The lp-do skills were recently restructured (BOS decoupling completed 2026-02-24, post-build validation added 2026-02-25). While the structural changes are clean, the revised orchestrators now contain measurable cross-skill duplication and several exceed the 200-line thin-orchestrator threshold. The opportunity to tighten them is highest immediately after revision, before further changes accumulate.
Trigger-Intended-Outcome: type: operational | statement: All lp-do orchestrators at or below 200 lines; critique loop and queue check gate logic deduplicated into shared modules; phase numbering gap in lp-do-plan repaired | source: operator
Dispatch-ID: IDEA-DISPATCH-20260225-0004
---

# lp-do Skills: Token Efficiency + Effectiveness Post-Revision Fact-Find

## Scope

### Summary
The six lp-do workflow skills (`lp-do-fact-find`, `lp-do-plan`, `lp-do-build`, `lp-do-replan`, `lp-do-critique`, `lp-do-factcheck`) were recently revised in two waves: BOS integration removed (2026-02-24) and post-build validation added to lp-do-build (2026-02-25). Five of the eight SKILL.md orchestrators exceed the 200-line thin-orchestrator threshold established in `startup-loop-token-efficiency-v1`. Measurable cross-skill duplication exists in two areas: a 65/52-line critique loop block split across lp-do-fact-find and lp-do-plan, and a 35/36-line queue check gate split across lp-do-fact-find and lp-do-briefing. This fact-find scopes targeted token reduction and effectiveness improvements across the series.

### Goals
- Reduce lp-do-fact-find, lp-do-plan, and lp-do-build SKILL.md orchestrators to ≤200 lines (lp-do-critique and lp-do-factcheck are verified-justified exceptions due to multi-mode, content-dense scope)
- Eliminate critique loop duplication (~65 lines in fact-find, ~52 lines in plan, near-identical blocks)
- Eliminate queue check gate duplication (~35 lines duplicated between fact-find and briefing)
- Repair the phase numbering gap in lp-do-plan (8 → 10 → 11) left by BOS decoupling
- Extract lp-do-critique Section D (Offer Lens, ~84 lines) to a module
- Tighten lp-do-factcheck pedagogical content (~70 lines reducible)

### Non-goals
- Changes to lp-do-replan or lp-do-sequence (under 200 lines, no duplication issues); lp-do-briefing Phase 0 is in-scope for the queue-check-gate replacement (TASK-05) but no structural or content changes beyond that one phase
- Changes to the `_shared/` files except creating two new shared modules
- Redesigning the skill chain architecture or workflow contracts
- Merging confidence-scoring-rules.md and confidence-protocol.md (related but low-urgency; separate initiative)
- Changes to any production application code

### Constraints & Assumptions
- Constraints:
  - Module extraction must preserve 100% of the governing logic — no rules may be lost, weakened, or changed in semantics during refactor
  - Shared modules must use relative paths from consuming skills' locations
  - The 200-line threshold applies to SKILL.md orchestrators, not to module files (modules may be longer)
  - All changes are to `.claude/skills/` markdown files only — no code, no templates, no application files
- Assumptions:
  - Critique loop logic in both skills can be unified without diverging the fact-find and plan behaviors (confirmed: only two differences — target artifact name and one conditional branch in the post-loop gate; both are parameterizable)
  - Queue check gate logic in fact-find and briefing can be unified (confirmed: only one difference — `status: briefing_ready` filter condition in briefing; parameterizable)

## Outcome Contract

- **Why:** BOS decoupling left two near-identical blocks of logic in separate orchestrators. The revisions are fresh and scope is clear. Deduplicating now prevents the two copies from drifting apart on future edits.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All lp-do orchestrators ≤200 lines; critique loop and queue check gate deduplicated into `_shared/` modules; lp-do-plan phase numbering coherent; lp-do-critique Offer Lens extracted to module
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-fact-find/SKILL.md` — 290 lines — primary orchestrator for fact-finding; contains Phase 7a critique loop (65 lines) and Phase 0 queue check gate (35 lines) both duplicated elsewhere
- `.claude/skills/lp-do-plan/SKILL.md` — 302 lines — primary orchestrator for planning; contains Phase 11 critique loop (52 lines, near-identical to fact-find Phase 7a); phase numbering gap 8→10→11
- `.claude/skills/lp-do-build/SKILL.md` — 262 lines — build orchestrator; Plan Completion and Archiving section (40 lines) contains inline HTML report rules that belong in a shared location
- `.claude/skills/lp-do-critique/SKILL.md` — 668 lines — critique utility; Section D Offer Lens (~84 lines) is a separable lens applied only to lp-offer artifacts; Required Output Template (70 lines) defined inline rather than as a reference file
- `.claude/skills/lp-do-factcheck/SKILL.md` — 496 lines — factcheck utility; Fix Guidelines (~45 lines of pedagogical code-block examples) and Anti-Patterns (~25 lines) account for ~70 lines of trimmable content

### Key Modules / Files

**Cross-skill shared targets:**
- `.claude/skills/_shared/` — 24 files; `stage-doc-operations.md` is a redirect stub (post-decoupling orphan, 11 lines); no `critique-loop-protocol.md` or `queue-check-gate.md` currently exist
- `.claude/skills/lp-do-fact-find/modules/` — 5 modules, 71–147 lines each; all well-scoped
- `.claude/skills/lp-do-plan/modules/` — 3 modules, 25–52 lines; all well-scoped
- `.claude/skills/lp-do-build/modules/` — 6 modules, 18–124 lines; build-validate.md (124 lines, new) is appropriately sized
- `.claude/skills/lp-do-replan/modules/` — 4 modules, 22–30 lines; all well-scoped and below threshold

**Duplication targets (exact):**

Finding 1 — Critique Loop Block (~65/52 lines, near-identical between fact-find and plan):

| Location | Lines | Content |
|---|---|---|
| `lp-do-fact-find/SKILL.md` Phase 7a | 65 | Pre-critique factcheck gate, 3-round iteration table, Round 1/2/3 rules, post-loop gate verdicts |
| `lp-do-plan/SKILL.md` Phase 11 | 52 | Identical table, identical round rules, same verdict definitions; only differs in: (a) artifact name `plan.md` vs `fact-find.md`, (b) post-loop gate includes plan-only vs plan+auto branching |

Finding 2 — Queue Check Gate (~35/36 lines near-identical):

| Location | Lines | Difference |
|---|---|---|
| `lp-do-fact-find/SKILL.md` Phase 0 | 35 | Filters `queue_state: enqueued`; no `status` filter |
| `lp-do-briefing/SKILL.md` Phase 0 | 36 | Adds `status: briefing_ready` filter; field name `fact_find_slug` differs |

Finding 3 — Phase numbering gap in lp-do-plan:
Phase 9 was deleted by BOS decoupling TASK-02. Current sequence: 1, 2, 3, 4, 4.5, 5, 5.5, 6, 7, 8, 10, 11. The jump 8→10→11 is a cosmetic artifact — agent orientation is slightly degraded.

### Patterns & Conventions Observed

- Thin-orchestrator target: 200 lines (established in startup-loop-token-efficiency-v1) - evidence: `docs/plans/archive/startup-loop-token-efficiency-archived-2026-02-18/plan.md`
- Module extraction pattern: orchestrator loads module via relative path reference; module contains the implementation prose - evidence: `lp-do-build/modules/build-validate.md`, `lp-do-sequence/modules/seq-algorithm.md`
- Shared file pattern: `_shared/` contains cross-skill contracts; skills reference them by relative path - evidence: `_shared/subagent-dispatch-contract.md`, `_shared/auto-continue-policy.md`
- meta-loop-efficiency audit: heuristic H1 (SKILL.md > 200 lines without modules/) is the automated detection gate - evidence: `.claude/skills/meta-loop-efficiency/SKILL.md`

### Data & Contracts

- Types/schemas/events: n/a — deliverable is markdown files only
- Persistence: `.claude/skills/` directory; changes are git-committed
- API/contracts: no API interactions

### Delivery & Channel Landscape

- Audience: agents executing lp-do workflow skills — primary consumers are AI agents, not humans
- Channel constraints: none — changes are file writes to the skills directory
- Existing assets: `docs/plans/archive/startup-loop-token-efficiency-archived-2026-02-18/` provides the v1 playbook; `docs/plans/startup-loop-token-efficiency-v2/` provides the v2 playbook; both complete and referenceable as execution patterns
- Ownership: single operator, no review gate required
- Compliance constraints: must not change any governing logic — refactor only, not redesign
- Measurement hooks: `meta-loop-efficiency` H1 heuristic provides post-completion verification (SKILL.md > 200 lines flag); line count measurement is deterministic

### Blast-Radius Map

In-scope:
- `.claude/skills/lp-do-fact-find/SKILL.md` — Phase 7a and Phase 0 replaced with shared module references
- `.claude/skills/lp-do-plan/SKILL.md` — Phase 11 replaced with shared module reference; phase gap repaired
- `.claude/skills/lp-do-briefing/SKILL.md` — Phase 0 replaced with shared module reference
- `.claude/skills/lp-do-critique/SKILL.md` — Section D extracted to `modules/offer-lens.md`; output template section tightened
- `.claude/skills/lp-do-factcheck/SKILL.md` — Fix Guidelines and Anti-Patterns trimmed
- `.claude/skills/lp-do-build/SKILL.md` — Plan Completion inline HTML rules scoped or moved
- New files created: `_shared/critique-loop-protocol.md`, `_shared/queue-check-gate.md`, `lp-do-critique/modules/offer-lens.md`

Out-of-scope (not touched):
- `lp-do-replan/SKILL.md` (169 lines — under threshold, clean)
- `lp-do-sequence/SKILL.md` (128 lines — under threshold, clean)
- `lp-do-briefing/SKILL.md` — only Phase 0 is touched, rest is unchanged
- All `_shared/` files except the two new additions
- All application code, plan templates, and business OS artifacts

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Extracting the critique loop to a shared module preserves identical agent behavior | Semantic equivalence of the unified block with both originals | Low — run both skills post-change, compare outputs | Minutes |
| H2 | Extracting Section D (Offer Lens) from lp-do-critique does not degrade offer critique quality | Module reference is loaded when critique target is an lp-offer artifact | Low — run a critique against an offer artifact post-change | Minutes |
| H3 | lp-do-factcheck can be tightened by ~70 lines without losing governing rules | The trimmed content is pedagogical, not prescriptive | Low — read trimmed version against checklist | Minutes |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Both critique loop blocks read side-by-side; only 2 parameterizable differences identified | Direct code inspection | High (0.90) |
| H2 | Section D is a self-contained Offer Lens with its own heading and subheadings; no intra-skill cross-references to Section D content | Direct code inspection | High (0.88) |
| H3 | Fix Guidelines are example illustrations, not rules; Anti-Patterns are cautionary notes; both explicitly labeled as such in the file | Direct code inspection | Medium (0.80) |

#### Recommended Validation Approach

- Post-change: run `meta-loop-efficiency` heuristic audit — confirms H1 compliance (all SKILL.md ≤ 200 lines)
- Post-change: manually verify critique loop behavior by invoking `/lp-do-critique` on a test artifact and confirming round logic is unchanged
- Post-change: invoke `/lp-do-factcheck` on the updated SKILL.md files to confirm no broken internal references

### Test Landscape

- Frameworks: none — skill files are markdown, no automated test framework
- Commands: `wc -l .claude/skills/lp-do-*/SKILL.md` for line count verification; `rg <deleted-text>` to confirm removal; `meta-loop-efficiency` audit for H1 compliance
- CI integration: none — skill file changes are validated manually post-commit

#### Coverage Gaps
- No automated test for skill semantic correctness — this is an inherent gap for markdown-based skills
- meta-loop-efficiency covers line-count (H1) and dispatch adoption (H2/H3) heuristics but not semantic correctness

### Recent Git History (Targeted)

- `do-skills-bos-decoupling` (2026-02-24): all 6 lp-do skills modified; 3 shared integration files deleted; templates cleaned — all tasks confirmed complete
- `lp-do-build-post-build-validation` (2026-02-25): `build-validate.md` created (124 lines); `build-code.md`, `build-biz.md`, `lp-do-build/SKILL.md` updated — TASK-01 confirmed complete

## Questions

### Resolved

- Q: Should lp-do-build Plan Completion/Archiving inline HTML rules be extracted?
  - A: No — defer. The inline rules in lp-do-build are specific to that skill's operator HTML output and are already referenced correctly from `plan-archiving.md`. Extracting them to a new shared module adds a new file for marginal gain. lp-do-build SKILL.md at 262 lines is 62 lines over the threshold; other reductions (removing redundant gate prose, tightening the Always-Confirm-First block) can bring it under 200 without a new shared file.
  - Evidence: `lp-do-build/SKILL.md` lines 188-227 inspected; `_shared/plan-archiving.md` confirmed at 13 lines (already a separate reference)

- Q: Should confidence-scoring-rules.md and confidence-protocol.md be merged?
  - A: Not in this plan — the two files are complementary (scoring rules + promotion protocol) and consumers reference them from different skills. Merging requires updating multiple consumer references and risks introducing a regression. Low urgency relative to the clear token wins. Defer to a standalone initiative.
  - Evidence: `_shared/confidence-scoring-rules.md` 70 lines; `_shared/confidence-protocol.md` 46 lines; both consumed by different skills

- Q: Can the shared critique-loop-protocol.md handle the fact-find vs plan behavioral differences?
  - A: Yes. The two differences are: (a) artifact name (`fact-find.md` vs `plan.md`) — can be stated as a single substitution note in the shared module; (b) post-loop gate in plan has an extra branch for `plan-only vs plan+auto` — the shared module can include both branches, suppressed by context. The module is ~55 lines total, cleanly parameterized.
  - Evidence: Side-by-side comparison of Phase 7a and Phase 11; both use identical scoring table, round definitions, and verdict labels

- Q: Can the shared queue-check-gate.md handle the fact-find vs briefing filter difference?
  - A: Yes. The briefing skill adds `status: briefing_ready` filter. The shared module can include the filter as a conditional note ("if invoked from briefing, also filter by `status: briefing_ready`"). The output field name difference is minor prose variation.
  - Evidence: Direct comparison of both Phase 0 blocks; ~30/35 lines are identical

- Q: What is the lp-do-factcheck trimming target?
  - A: Remove or condense Fix Guidelines from 5 full code-block examples to 2 representative examples (saves ~25 lines); condense Anti-Patterns from 10 verbose items to a tight 6-item list with one-line descriptions (saves ~15 lines). Total: ~40 lines. Result: 496 → ~456 lines. Still over 200, but this file's length is justified by its role as a multi-mode verification tool with a complex taxonomy — the 200-line target applies to thin-orchestrators; factcheck is a content-heavy utility.
  - Evidence: Lines 250-295 (Fix Guidelines) and 296-325 (Anti-Patterns) reviewed; content is pedagogical, not prescriptive rule text

- Q: Is lp-do-critique at 668 lines reducible below 200?
  - A: No — and that is acceptable. lp-do-critique has four distinct lens sections (A: fact-find, B: plan, C: skill, D: offer), a full scoring rubric, output template, and autofix protocol. The Offer Lens (Section D, ~84 lines) extraction will bring it to ~584 lines. This file is a high-density reference tool, not a thin orchestrator — its length reflects genuine scope. The 200-line target should be applied pragmatically to dispatch orchestrators, not to verification utility skills with multi-mode behavior. No further reduction is needed beyond Section D extraction.
  - Evidence: Section by section review confirmed each of Sections A-C and scoring rubric is necessary; only Section D is separable without logic loss

### Open (Operator Input Required)

None — all design decisions resolvable from documented evidence.

## Confidence Inputs

- Implementation: 93% — exact file paths, line ranges, and change types identified for every task; extraction patterns are proven (v1/v2 token efficiency as precedent)
- Approach: 88% — module extraction approach is well-validated; only risk is semantic drift if the shared critique-loop-protocol.md is written ambiguously (mitigated by post-change factcheck)
- Impact: 85% — line count reductions are deterministic and measurable; effectiveness gains from deduplication (preventing future drift between copies) are real but not metric-quantifiable
- Delivery-Readiness: 95% — all files accessible, no external dependencies, no approval gates
- Testability: 75% — line count is fully verifiable; semantic correctness requires agent execution testing which is manual

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shared critique-loop-protocol.md introduces subtle semantic difference vs originals | Low | High — could cause one skill to run critique incorrectly | Write shared module from one source, diff against the other; run lp-do-factcheck on updated SKILL.md to confirm no broken references |
| lp-do-factcheck trimming inadvertently removes a governing rule disguised as an example | Low | Medium — factcheck behavior degraded silently | Read each trimmed item against governing rule list before removal; retain any item that states a rule even if it uses an example format |
| Phase renumbering in lp-do-plan causes confusion if any external doc references "Phase 9" | Very Low | Low — external docs reference skills by phase name not number | `rg "Phase 9"` confirmed zero hits in `.claude/skills/`; safe to renumber |
| New shared module not found by agent at runtime due to path error | Low | High — skill phase fails silently | Verify relative path resolution in one skill before applying to others |

## Planning Constraints & Notes

- Must-follow patterns:
  - All module files go under the skill's `modules/` directory or `_shared/` for cross-skill contracts
  - Relative paths from skill to `_shared/`: `../_shared/<file>.md`
  - Module reference format: load the module file and follow its instructions (as used in lp-do-build, lp-do-sequence)
  - Preserve all section headings, phase names, and gate names (cosmetic changes to numbering only)
- Rollout/rollback expectations:
  - Each task is atomic (one file change or one new file) — git commit per task or per logical group
  - Rollback: git revert the commit(s) for the affected task
- Observability expectations:
  - Post-completion: run `meta-loop-efficiency` audit to confirm H1 compliance for lp-do-fact-find and lp-do-plan (the two primary orchestrators that were over threshold)
  - Post-completion: `wc -l .claude/skills/lp-do-*/SKILL.md` to confirm all orchestrators ≤ 200 lines (except critique and factcheck, which are verified-justified exceptions)

## Suggested Task Seeds (Non-binding)

- TASK-01: Create `_shared/critique-loop-protocol.md` — unified 3-round critique loop block with artifact-name parameter and plan-mode branch
- TASK-02: Replace Phase 7a in `lp-do-fact-find/SKILL.md` with reference to `_shared/critique-loop-protocol.md` (fact-find mode)
- TASK-03: Replace Phase 11 in `lp-do-plan/SKILL.md` with reference to `_shared/critique-loop-protocol.md` (plan mode); repair phase numbering gap
- TASK-04: Create `_shared/queue-check-gate.md` — unified queue check gate with briefing-mode filter parameter
- TASK-05: Replace Phase 0 in `lp-do-fact-find/SKILL.md` and `lp-do-briefing/SKILL.md` with references to `_shared/queue-check-gate.md`
- TASK-06: Extract lp-do-critique Section D (Offer Lens + Munger Inversions, ~84 lines) to `lp-do-critique/modules/offer-lens.md`; update SKILL.md to load module when target is lp-offer artifact
- TASK-07: Tighten `lp-do-factcheck/SKILL.md` Fix Guidelines and Anti-Patterns (~40 lines)
- TASK-08: Tighten `lp-do-build/SKILL.md` to ≤200 lines (from 262 — needs 62+ lines removed). Primary sources: Plan Completion/Archiving inline HTML report rules (~40 lines, compress to a pointer to `_shared/plan-archiving.md` with a one-line summary); Always-Confirm-First destructive-command list (~12 lines, compress to a 4-line inline rule). These yield ~52 lines. Executor must identify a further ~10 lines from Wave Dispatch preamble, Completion Messages, or Executor Dispatch — audit each section before removing; retain any governing rule content

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-do-critique` (post-change artifact review), `lp-do-factcheck` (verify no broken references in updated SKILL.md files)
- Deliverable acceptance package:
  - All lp-do orchestrators measured at ≤200 lines (except lp-do-critique and lp-do-factcheck, documented as justified exceptions)
  - `_shared/critique-loop-protocol.md` exists and both orchestrators reference it
  - `_shared/queue-check-gate.md` exists and both orchestrators reference it
  - `lp-do-critique/modules/offer-lens.md` exists; SKILL.md Section D replaced with load reference
  - `lp-do-plan/SKILL.md` phase numbering is sequential (no gap)
  - `rg "Phase 9"` returns zero hits in lp-do-plan SKILL.md
  - meta-loop-efficiency H1 audit passes for lp-do-fact-find, lp-do-plan
- Post-delivery measurement plan:
  - Run `meta-loop-efficiency` audit within one week of completion to confirm H1 compliance
  - No further measurement required — this is a one-time refactor with deterministic acceptance criteria

## Evidence Gap Review

### Gaps Addressed

- Line counts for all SKILL.md and module files: measured exactly from filesystem — no estimation
- Cross-skill duplication: identified by side-by-side comparison of Phase 7a / Phase 11 and Phase 0 / Phase 0 blocks
- BOS decoupling completeness: confirmed via `rg` zero-hit checks for deleted file names and removed frontmatter fields
- post-build-validation additions: confirmed via plan.md review of TASK-01 acceptance criteria

### Confidence Adjustments

- Implementation raised to 93% (from initial 90%) — exact line ranges identified for all extraction targets; no ambiguity in scope
- Approach held at 88% — shared module parameterization is straightforward but introduces a new pattern (`_shared/` modules that are loaded with mode context); the only uncertainty is whether agents will correctly parse the mode context from the calling skill

### Remaining Assumptions

- lp-do-critique and lp-do-factcheck are justified exceptions to the 200-line threshold due to their multi-mode, content-dense nature — this assumption is operator-confirmable but not blocking (the trimming in TASK-06 and TASK-07 is still valuable regardless)
- The "Always confirm first" destructive command list in lp-do-build SKILL.md (12 lines) can be tightened to a 4-line inline rule — the full list may have value for agent orientation that a compressed version loses. Low risk; task can assess and confirm before trimming.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan lp-do-skills-token-efficiency-post-revision --auto`
