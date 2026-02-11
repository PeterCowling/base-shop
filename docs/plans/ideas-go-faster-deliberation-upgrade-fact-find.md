---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-go-faster-deliberation-upgrade
Deliverable-Type: code-change
Execution-Track: mixed
Primary-Execution-Skill: build-feature
Supporting-Skills: none
Related-Plan: docs/plans/ideas-go-faster-deliberation-upgrade-plan.md
Business-OS-Integration: off
Business-Unit: BOS
---

# Ideas-Go-Faster Deliberation Upgrade Fact-Find Brief

## Scope
### Summary
Audit the current `/ideas-go-faster` output contract for deliberation transparency and persuasive quality, then define a planning-ready upgrade path so sweep reports show who argued what, what was considered and rejected, which core tools are missing, and how human assumptions were challenged.

### Goals
- Add explicit **"who said what"** attribution so disagreements and decision rationale are visible.
- Add a **"where's my tool?"** register so expert-requested missing tools/data are captured and escalated.
- Add a **"human assumes what?"** matrix so human assumptions are explicitly accepted/conditioned/rejected by lenses.
- Add complementary sections that increase decision quality and trust (graveyard, economics, experiment contracts, collisions, deltas).
- Keep dry-run mode first-class, with all new deliberation sections available without persistence writes.

### Non-goals
- Replacing the Cabinet model or reducing lens coverage.
- Changing Business OS API schemas in this phase.
- Implementing new runtime services; this is contract-level hardening in skill + checker scope.

### Constraints and Assumptions
- Constraints:
  - `ideas-go-faster` remains prompt-orchestrated (`.claude/skills/ideas-go-faster/SKILL.md:979`).
  - Existing Stage 1-7.5 sequencing and gate invariants remain intact.
  - Dry-run write-block behavior remains strict (`.claude/skills/ideas-go-faster/SKILL.md:525`, `.claude/skills/ideas-go-faster/SKILL.md:593`, `.claude/skills/ideas-go-faster/SKILL.md:883`).
- Assumptions:
  - Deliberation upgrades can be achieved by extending report and dossier contracts plus checker invariants.
  - A small DECISION task is needed for assumption-intake interface shape.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/ideas-go-faster/SKILL.md` - current orchestrator contract.
- `scripts/check-ideas-go-faster-contracts.sh` - contract drift checks (F1-F12 coverage only).
- `docs/business-os/sweeps/2026-02-10-sweep.user.md` - latest dry-run report artifact.

### Key Modules / Files
- `.claude/skills/ideas-go-faster/SKILL.md:773` - sweep report structure.
- `.claude/skills/ideas-go-faster/SKILL.md:404` - dossier-level decision log merge behavior.
- `.claude/skills/ideas-go-faster/SKILL.md:888` - hard guardrails.
- `scripts/check-ideas-go-faster-contracts.sh:72` - currently validates cadence/depth/coverage/dry-run safety only.

### Patterns and Conventions Observed
- Strong pipeline quality controls exist (depth gate, contrarian gate, stance propagation, dry-run safety).
- Current report emphasizes rollups and counts; deliberation internals are mostly implicit.
- Existing clustering preserves rivalry in dossier internals, but report-level reader experience is still summary-heavy.

### Data and Contracts
- Report sections currently defined as 21 sections (`.claude/skills/ideas-go-faster/SKILL.md:773`).
- Section set includes clustering/rivalry counts but no dedicated per-idea attribution ledger (`.claude/skills/ideas-go-faster/SKILL.md:780`, `.claude/skills/ideas-go-faster/SKILL.md:798`).
- Dry-run report sample confirms aggregate-heavy output (`docs/business-os/sweeps/2026-02-10-sweep.user.md:45`, `docs/business-os/sweeps/2026-02-10-sweep.user.md:70`).

### Dependency and Impact Map
- Upstream dependencies:
  - `_shared/cabinet` personas and dossier template conventions.
  - stance contract in `.claude/skills/_shared/cabinet/stances.md`.
- Downstream dependents:
  - `/fact-find` stage-doc seeding quality (decision logs and evidence handoff).
  - `/plan-feature` confidence and rationale quality from seeded docs.
- Likely blast radius:
  - Skill contract readability and operator trust.
  - Checker coverage breadth.
  - Sweep report size and interpretation complexity.

### Test Landscape (required for `code` or `mixed`)
#### Test Infrastructure
- Contract checks are shell-based (`scripts/check-ideas-go-faster-contracts.sh`).
- Validation path already integrated in `scripts/validate-changes.sh`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Ideas-go-faster contract drift | shell checks | `scripts/check-ideas-go-faster-contracts.sh` | Covers F1-F12 invariants; does not cover deliberation-transparency artifacts yet. |
| Dry-run output shape | manual artifact review | `docs/business-os/sweeps/2026-02-10-sweep.user.md` | Demonstrates current output style; no automated content-quality checks. |

#### Coverage Gaps
- No checker assertions for:
  - who-said-what ledger contract
  - tool-gap register contract
  - human-assumption challenge contract
  - graveyard/economics/experiment/delta/coverage sections
- No explicit report requirement for per-idea dissent trace or rejection reasoning table.

## Findings
### F1 (High): Report lacks explicit per-idea "who said what" attribution ledger
- Evidence:
  - Dossier merge retains decision logs (`.claude/skills/ideas-go-faster/SKILL.md:404`), but report sections do not require a per-idea attribution table (`.claude/skills/ideas-go-faster/SKILL.md:773`).
  - Dry-run report presents aggregate phase summaries, not lens-by-lens argument trace (`docs/business-os/sweeps/2026-02-10-sweep.user.md:58`, `docs/business-os/sweeps/2026-02-10-sweep.user.md:70`).
- Impact:
  - Decisions feel opaque; stakeholder confidence drops even when gating is rigorous.

### F2 (High): No explicit "where's my tool?" capability-gap register
- Evidence:
  - No report section for missing tools/data required by experts in current section list (`.claude/skills/ideas-go-faster/SKILL.md:773`).
  - No checker coverage for tool-gap artifacts (`scripts/check-ideas-go-faster-contracts.sh:122`).
- Impact:
  - Recurrent blockers remain implicit and are less likely to be prioritized as enabling work.

### F3 (High): No first-class "human assumes what?" challenge pathway
- Evidence:
  - Invocation supports stance/flags but no assumptions input contract (`.claude/skills/ideas-go-faster/SKILL.md:14`).
  - No report section requiring assumption-by-assumption verdicts.
- Impact:
  - Human priors are not systematically pressure-tested by cabinet lenses.

### F4 (Medium): "Why this died" and hold/kill rationale are under-surfaced
- Evidence:
  - Contrarian and filter outcomes are counted (`.claude/skills/ideas-go-faster/SKILL.md:781`, `.claude/skills/ideas-go-faster/SKILL.md:782`), but no required graveyard section with reason codes.
- Impact:
  - Useful negative knowledge is hard to reuse; same weak ideas can recur.

### F5 (Medium): Decision economics and experiment contracts are not globally mandatory
- Evidence:
  - Traction-mode has some structured fields (`.claude/skills/ideas-go-faster/SKILL.md:622`), but non-traction promoted ideas do not require a uniform economics + kill-threshold contract in report.
- Impact:
  - Promoted ideas can still feel directional vs testable.

### F6 (Medium): Learning loop artifacts (delta + lens coverage) are missing
- Evidence:
  - No mandated sections for "what changed since last sweep" or "lens contribution quality" in report schema (`.claude/skills/ideas-go-faster/SKILL.md:773`).
- Impact:
  - Process quality improvements are harder to drive with evidence.

## Enhancement Catalog (Planning Input)
| Enhancement | Primary Gap Closed | Expected Effect |
|---|---|---|
| Who Said What ledger | F1 | Transparent deliberation and traceable decisions |
| Where's My Tool register | F2 | Converts hidden blockers into actionable enabling backlog |
| Human Assumes What matrix | F3 | Structured challenge of operator assumptions |
| Why This Died graveyard | F4 | Reusable negative knowledge and reduced idea churn |
| Rivalry matrix + evidence grade | F1/F4 | Clear disagreement topology and evidence strength |
| Decision economics + experiment contract | F5 | Better actionability and faster learn-or-kill loops |
| Inaction cost + dependency critical path | F5/F6 | Stronger prioritization and sequencing logic |
| Capacity collision check | F6 | Prevents over-allocating the same owner/time window |
| Delta since last sweep | F6 | Makes process progression auditable |
| Lens coverage audit | F6 | Enables cabinet roster tuning over time |

## Questions
### Resolved
- Q: Is this mainly a generation-quality issue?
  - A: Partly, but evidence shows the larger gap is output transparency and deliberation surfacing.
- Q: Can this be done without runtime API changes?
  - A: Yes. Skill/report/checker contract upgrades are sufficient for phase 1.
- Q: Should dry-run include all new sections?
  - A: Yes. Dry-run should be the primary review mode for deliberation quality.

### Open (User Input Needed During Planning)
1. Assumption input interface preference:
   - A) inline block in invocation prompt body
   - B) `--assumptions-file <path>`
   - C) both
2. Maximum report verbosity per idea (for who-said-what rows):
   - A) concise (1 support + 1 objection)
   - B) standard (2 support + 2 objections)
   - C) full ledger (all participating lenses)

## Confidence Inputs (for /plan-feature)
- Implementation: 84%
  - Contract edits are localized and pattern-consistent.
- Approach: 81%
  - Direction is clear; remaining uncertainty is assumptions-input UX.
- Impact: 90%
  - Directly targets perceived quality/trust gap in sweep outputs.
- Delivery-Readiness: 86%
  - No external dependencies for phase 1 contract work.
- Testability: 82%
  - Checker script can enforce most invariants; narrative quality still needs spot review.

## Planning Constraints and Notes
- Preserve existing gates and dry-run safety.
- Keep section additions deterministic and parseable.
- Avoid bloating each idea with unconstrained prose; require bounded row formats.

## Suggested Task Seeds (Non-binding)
- Define assumptions intake contract and fallback behavior.
- Add Who Said What, Rivalry Matrix, and Why This Died report sections.
- Add Where's My Tool register with DGP auto-escalation rules.
- Add Human Assumes What matrix with accept/conditional/reject outcomes.
- Add decision economics + experiment contract requirements for promoted ideas.
- Add inaction cost, capacity collision, dependency critical path, delta-since-last-sweep, and lens coverage audit sections.
- Extend checker script with F13+ invariants for new sections.
- Run comparative dry-run baseline vs upgraded format.

## Execution Routing Packet
- Primary execution skill:
  - `/build-feature`
