---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Operations
Created: 2026-02-22
Last-updated: 2026-02-22
Feature-Slug: startup-loop-parallel-container-wiring
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-parallel-container-wiring/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
direct-inject: true
direct-inject-rationale: Platform process redesign identified during container architecture review — not surfaced via IDEAS pipeline
---

# Startup Loop Parallel Container Wiring — Fact-Find Brief

## Scope

### Summary

The current startup loop spec (v3.9.6) models post-MEASURE containers as strictly sequential: `MEASURE → PRODUCT → PRODUCTS → LOGISTICS → MARKET → SELL → S4`. This is architecturally wrong. PRODUCTS-02 (Competitor Product Scan) runs before MARKET-01 (Competitor Mapping), yet PRODUCTS-02 logically requires MARKET-01 as input. Similarly, PRODUCTS-04 (Bundle Hypotheses) runs before MARKET-03 (Pricing Benchmarks) which it depends on.

The correct model is three parallel workstreams post-MEASURE (MARKET intelligence, PRODUCTS+LOGISTICS, and SELL standing intel) with explicit cross-stream sync points where one stream must produce output before another stream can progress. MARKET-06 (Offer Design) is the synthesis join point where all streams converge before the existing fan-out-1.

This fact-find documents the required wiring changes to `loop-spec.yaml`, `stage-operator-dictionary.yaml`, and `startup-loop-containers-process-map.html`.

### Goals

- Define the correct parallel stream model for post-MEASURE containers
- Specify all cross-stream sync points (intermediate dependencies between parallel streams)
- Identify all changes required to `loop-spec.yaml` ordering section and container definitions
- Identify all changes required to `stage-operator-dictionary.yaml` (`operator_next_prompt` routing)
- Define the HTML representation (swim lanes vs. annotated dependency arrows)

### Non-goals

- Changes to ASSESSMENT or MEASURE container internals
- Changes to S4, S5A, S5B, S6, DO, S9B, S10 (post-join stages)
- Changes to stage skills, prompt templates, or artifact key names
- Changes to SELL-01 through SELL-07 stage content (only sequencing/wiring)
- Demand validation or market research for any specific business

### Constraints & Assumptions

- Constraints:
  - Must remain compatible with existing `stage-addressing` logic (stage IDs unchanged)
  - S4 join barrier required inputs unchanged: MARKET-06 offer, S3 forecast, SELL-01 channels
  - fan-out-1 members (S3, SELL-01, PRODUCT-02) remain triggered by MARKET-06 exit
  - LOGISTICS remains conditional (`business_profile includes logistics-heavy OR physical-product`)
  - PRODUCTS-03, PRODUCTS-05, PRODUCTS-06 remain conditional (post-launch only)
  - spec_version must be bumped with changes
- Assumptions:
  - SELL-01 (Channel Strategy) continues to require MARKET-06 offer as input — only SELL standing intelligence stages (audits, research) are candidates for early parallel start; see Open Questions
  - Cross-stream sync points do not require new stage IDs — they are ordering constraints between existing stages across different containers
  - The HTML process map moves to a swim-lane layout to reflect parallel streams visually

---

## Evidence Audit (Current State)

### Key Modules / Files

- `docs/business-os/startup-loop/loop-spec.yaml` (spec_version: 3.9.6) — primary spec; defines stages, containers, ordering constraints, parallel groups, S4 join barrier
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` — operator-facing routing: `operator_next_prompt` fields, `outcome_operator`, aliases
- `docs/business-os/startup-loop-containers-process-map.html` — visual representation (currently: linear sequential stack of containers)

### Current Sequential Ordering (Evidence: `loop-spec.yaml` ordering section, lines ~1180–1200)

```
MEASURE-00 → MEASURE-01 → MEASURE-02
  → PRODUCT-01 → PRODUCT
  → PRODUCTS-01 → PRODUCTS-02 → PRODUCTS-03 → PRODUCTS-04 → PRODUCTS-05 → PRODUCTS-06 → PRODUCTS-07 → PRODUCTS
  → LOGISTICS-01 → ... → LOGISTICS-07 → LOGISTICS   [conditional]
  → MARKET-01 → MARKET-02 → MARKET-03 → MARKET-04 → MARKET-05 → MARKET-06 → MARKET
  → [fan-out-1: S3 | SELL-01 | PRODUCT-02] → S4
```

### Dependency Violations in Current Model

| Violated dependency | Stage that needs it | Stage that produces it | Current gap |
|---|---|---|---|
| Competitor map | PRODUCTS-02 (competitor product scan) | MARKET-01 | PRODUCTS-02 runs ~10 stages before MARKET-01 |
| Pricing benchmarks | PRODUCTS-04 (bundle hypotheses) | MARKET-03 | PRODUCTS-04 runs ~8 stages before MARKET-03 |
| Cost structure | MARKET-06 offer pricing | LOGISTICS-07 aggregate | LOGISTICS does run before MARKET — ✓ this one is correct |
| Product definition | MARKET-06 offer design | PRODUCTS-01 / PRODUCT-01 | PRODUCTS runs before MARKET — ✓ this one is correct |

### Cross-Stream Dependencies Identified (Evidence: stage descriptions + operator context)

| Produces | Stage | Consumes | Stage | Notes |
|---|---|---|---|---|
| Competitor landscape map | MARKET-01 | Competitor product scan | PRODUCTS-02 | Can't scan competitor products without mapping competitors first |
| Pricing benchmark ranges | MARKET-03 | Bundle hypotheses | PRODUCTS-04 | Bundle pricing strategy requires competitor pricing context |
| Channel landscape | MARKET-04 | Channel strategy | SELL-01 | SELL-01 needs channel landscape — currently satisfied (SELL-01 starts after MARKET-06 which is after MARKET-04) ✓ |
| Product definition | PRODUCTS-01 | Offer design | MARKET-06 | PRODUCTS before MARKET — ✓ already correct |
| Supply chain costs | LOGISTICS-07 | Offer pricing | MARKET-06 | LOGISTICS before MARKET — ✓ already correct |
| Offer contract | MARKET-06 | Channel strategy | SELL-01 | SELL-01 needs offer — ✓ already correct (fan-out-1) |
| Offer contract | MARKET-06 | Outreach + content | SELL-03 | SELL-03 needs offer — ✓ already correct (sequential within SELL) |

### Proposed Parallel Model

```
MEASURE
  ↓ [fan-out-2: new]
  ├─ MARKET stream:    MARKET-01 → MARKET-02 → MARKET-03 → MARKET-04 → MARKET-05 ─────────────┐
  │                        │                       │                                             │
  │                        │ [cross-stream]         │ [cross-stream]                             │
  │                        ↓                       ↓                                             ↓
  ├─ PRODUCTS stream:  PRODUCT-01 → PRODUCTS-01 → PRODUCTS-02 → PRODUCTS-03* → PRODUCTS-04 → PRODUCTS-05* → PRODUCTS-06* → PRODUCTS-07 ─┐
  │                                                                                                                                       │
  └─ LOGISTICS stream: LOGISTICS-01 → ... → LOGISTICS-07  [conditional] ───────────────────────────────────────────────────────────────┐ │
                                                                                                                                        ↓ ↓
                                                                       MARKET-06 (Offer Design) ← synthesis join: MARKET-05 + PRODUCTS-07 + LOGISTICS-07
                                                                             ↓
                                                              [fan-out-1: existing — S3 | SELL-01 | PRODUCT-02]
                                                                             ↓
                                                                            S4
```

_* = conditional (post-launch only). Note: LOGISTICS branches from within the PRODUCTS stream (after PRODUCTS-01), not directly from MEASURE exit — the diagram shows conceptual stream groupings. The diagram's LOGISTICS branch starting position is approximate; in the spec it is gated by `[PRODUCTS-01, LOGISTICS-01]` (or equivalent after TASK-02)._

### Cross-Stream Sync Points (New Ordering Constraints Required)

| Constraint | Type | Notes |
|---|---|---|
| `MARKET-01 → PRODUCTS-02` | cross-stream sync | PRODUCTS-02 blocked until MARKET-01 complete |
| `MARKET-03 → PRODUCTS-04` | cross-stream sync | PRODUCTS-04 blocked until MARKET-03 complete |
| `PRODUCTS-07 → MARKET-06` | stream join | MARKET-06 waits for PRODUCTS-07 aggregate |
| `LOGISTICS → MARKET-06` | stream join (conditional) | MARKET-06 waits for LOGISTICS when applicable; skips when LOGISTICS absent |
| `MARKET-05 → MARKET-06` | intra-stream (already exists) | ✓ no change |

### SELL Stream Question (Open)

SELL-01 (Channel Strategy) requires the offer (MARKET-06) to finalize — correctly gated by fan-out-1. However, SELL standing intelligence stages (SELL-02 SEO baseline, SELL-04 competitive outreach scan) do not logically require MARKET-06. They could run in parallel with the MARKET intelligence phase. This would require:
- Splitting SELL into two sub-streams: SELL-standing-intel (parallel with MARKET-01..05) and SELL-strategy (starts after MARKET-06)
- Restructuring SELL container stage ordering

This is an Open Question (see below) — not assumed in scope unless user confirms.

### Patterns & Conventions Observed

- Parallel groups currently declared in `loop-spec.yaml` under `ordering.parallel_groups` — evidence: `fan-out-1` declaration, lines ~1194–1197
- Cross-container ordering constraints currently only exist as `[PRODUCTS, MARKET-01]` and `[LOGISTICS, MARKET-01]` (container-level, not stage-level cross-stream)
- `operator_next_prompt` in `stage-operator-dictionary.yaml` is the human-facing routing guide — must be updated to reflect parallel start instructions at MEASURE exit
- HTML currently uses linear vertical stack of container blocks; no swim-lane layout exists

### Data & Contracts

- `loop-spec.yaml` `ordering.sequential` array: add cross-stream stage-level constraints
- `loop-spec.yaml` `ordering.parallel_groups`: add `fan-out-2` group at MEASURE exit
- `loop-spec.yaml` `ordering.sequential`: remove `[PRODUCT, PRODUCTS-01]` → `[PRODUCTS, LOGISTICS-01]` → `[LOGISTICS, MARKET-01]` sequential chain; replace with fan-out-2 model
- `loop-spec.yaml` `ordering.sequential` **deletions required** (without these the old gates block parallelism):
  - Remove `[LOGISTICS, MARKET-01]` — LOGISTICS no longer gates MARKET-01; it feeds MARKET-06 instead
  - Remove `[PRODUCTS, MARKET-01]` — container-level gate no longer valid; MARKET-01 starts in parallel from MEASURE
- `loop-spec.yaml` `ordering.sequential` **addition for fan-out-2 trigger**: Add `[MEASURE-02, MARKET-01]` — this is the second branch from MEASURE exit that starts the MARKET stream in parallel with the PRODUCTS stream (alongside existing `[MEASURE-02, PRODUCT-01]`)
- `stage-operator-dictionary.yaml`: update `operator_next_prompt` for MEASURE-02 (currently says "proceed to PRODUCT-01") to explain parallel stream start
- `stage-operator-dictionary.yaml`: update `operator_next_prompt` for PRODUCTS-01 (currently routes to PRODUCTS-02 directly without noting MARKET-01 dependency)
- HTML: new swim-lane CSS + layout; cross-stream dependency arrows between lanes

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (packages/mcp-server, scripts/src/startup-loop)
- Relevant test files: `packages/mcp-server/src/__tests__/fixtures/startup-loop/` (manifest fixtures), `scripts/src/startup-loop/__tests__/` (stage-addressing, manifest-update, generate-stage-operator-views)
- CI integration: governed test runner via `pnpm -w run test:governed`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Manifest structure | Fixture | `fixtures/startup-loop/manifest.complete.json` | Tests manifest fields, not ordering constraints |
| Stage addressing | Unit | `__tests__/stage-addressing.test.ts` | Tests stage ID resolution; ordering constraints not directly tested |
| Stage operator views | Unit | `__tests__/generate-stage-operator-views.test.ts` | Tests YAML → JSON generation; will need update if ordering section changes format |

#### Testability Assessment
- Easy to test: stage ID resolution (unchanged — no risk)
- Hard to test: ordering constraint correctness (no existing topological sort test); correctness of parallel model relies on visual/manual review
- Test seams needed: a topological sort test on `ordering.sequential` would catch cycles introduced by new cross-stream constraints

#### Recommended Test Approach
- No new tests strictly required (spec/doc change only)
- Manual: run `scripts/src/startup-loop/generate-stage-operator-views.ts` after TASK-02 and confirm no parse errors
- Manual: topological sort of `ordering.sequential` array to confirm acyclicity after constraint additions/deletions

### Dependency & Impact Map

- Upstream: MEASURE-02 exits into the new fan-out-2
- Downstream: MARKET-06 remains the synthesis join point feeding fan-out-1; no change to S4 join barrier required inputs
- Blast radius: loop-spec.yaml ordering section (significant rewrite of sequential array); stage-operator-dictionary.yaml operator_next_prompt for ~5 stages; HTML layout (significant)
- Stage IDs: unchanged — no downstream breakage to stage-addressing or BOS sync

---

## Questions

### Resolved

- Q: Is MARKET-06 the correct synthesis join point?
  - A: Yes — MARKET-06 (Offer Design) is explicitly the stage that needs product definition (PRODUCTS-01), supply chain costs (LOGISTICS), and market intelligence (MARKET-05). All three streams must converge here. S4 required inputs unchanged.
  - Evidence: `loop-spec.yaml` MARKET-06 definition and S4 `required_inputs` block

- Q: Do cross-stream sync points require new stage IDs?
  - A: No — they are expressed as ordering constraints between existing stage IDs (e.g. `[MARKET-01, PRODUCTS-02]` added to `ordering.sequential`). No new stages needed.
  - Evidence: existing `[PRODUCTS, MARKET-01]` cross-container constraint pattern in loop-spec.yaml

- Q: Does LOGISTICS fit as a sub-stream of PRODUCTS or as its own parallel stream?
  - A: Sub-stream of PRODUCTS. LOGISTICS starts after PRODUCTS-01 (needs product definition to assess supply chain) and feeds MARKET-06 alongside PRODUCTS-07. It is conditional and does not run in parallel with PRODUCTS from day one.
  - Evidence: current `[PRODUCTS, LOGISTICS-01]` ordering; LOGISTICS-01 skill requires product definition context

### Open (User Input Needed)

- Q: Should SELL standing intelligence stages be decoupled from SELL-01 and started in parallel with MARKET intelligence?
  - Why it matters: if yes, this adds a third parallel stream from MEASURE exit and requires SELL container restructure. If no, SELL remains entirely post-MARKET-06 (fan-out-1 unchanged).
  - Per-stage dependency analysis (to inform this decision):

    | Stage | Needs MARKET-06 offer? | Needs SELL-01 channels? | Early start possible? |
    |---|---|---|---|
    | SELL-02 Channel performance baseline | No | Yes — needs channel strategy to define baseline | No — wait for SELL-01 |
    | SELL-03 Outreach + content | Yes — offer defines message | Yes | No — wait for MARKET-06 |
    | SELL-04 Competitive outreach scan | No — auditing competitor outreach, not writing ours | No | **Yes — could start early** |
    | SELL-05 SEO standing | No — technical SEO audit independent of offer | No | **Yes — could start early** |
    | SELL-06 Paid channel standing | Partially — paid messaging benefits from offer | No | Maybe — depends on whether paid copy is in scope |
    | SELL-07 Aggregate pack | No | Needs SELL-01..06 | No — join stage |

  - Decision impacted: scope of fan-out-2 (two streams vs. three); whether SELL-04/05 restructure adds meaningful value vs. complexity
  - Decision owner: Peter
  - Default assumption: No — SELL-01 gates all SELL stages. Even if SELL-04/05 could start early, the operational complexity of splitting the container likely outweighs a ~1-stage time saving. Recommend revisiting only if SELL standing intel is identified as a bottleneck in practice.

---

## Confidence Inputs

- Implementation: 85%
  - Evidence: loop-spec.yaml ordering section is well-structured; cross-stream constraints follow existing pattern; no new stage IDs required
  - To reach 90%: confirm SELL stream scoping decision (Open Question above)
- Approach: 80%
  - Evidence: parallel stream model is architecturally sound and matches how real intelligence gathering works; fan-out-2 pattern follows fan-out-1 precedent
  - To reach 90%: confirm HTML swim-lane layout approach with user before implementation
- Impact: 90%
  - Evidence: resolves confirmed dependency violations (PRODUCTS-02 before MARKET-01, PRODUCTS-04 before MARKET-03); does not break S4 join barrier or existing fan-out-1
  - Gap: SELL stream decision could expand scope
- Delivery-Readiness: 85%
  - Evidence: all three target files are well-understood; no external dependencies; changes are additive to ordering (not removing capabilities)
  - To reach 90%: confirm HTML approach
- Testability: 70%
  - Evidence: loop-spec.yaml has associated test fixtures in `packages/mcp-server/src/__tests__/fixtures/startup-loop/`; stage-operator-dictionary.yaml is validated by `scripts/src/startup-loop/generate-stage-operator-views.ts`
  - To reach 80%: check whether ordering constraint tests exist and whether new cross-stream constraints need fixture updates

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| SELL stream scope creep | Medium | Medium | Resolve Open Question before planning; default assumption is SELL unchanged |
| HTML swim-lane complexity | Medium | Low | HTML already uses custom CSS; swim lanes are additive layout change; can iterate |
| operator_next_prompt gaps | Low | Medium | Systematic audit of all stage prompts that reference next-stage routing in affected containers |
| Cross-stream constraint introduces cycle | Low | High | fan-out-2 is acyclic by construction (MEASURE → streams → MARKET-06 → S4); verify with topological sort after changes |
| Test fixture staleness | Low | Low | Fixtures reference manifest structure not ordering constraints; likely no breakage |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - New parallel group declaration format must match `fan-out-1` shape in `ordering.parallel_groups`
  - Cross-stream ordering constraints added to `ordering.sequential` using existing `[A, B]` format
  - spec_version bump required (3.9.6 → 3.10.0 — minor bump for structural change)
  - `stage-operator-dictionary.yaml` `operator_next_prompt` must be human-readable; not YAML machine directives
- Rollout/rollback expectations:
  - Files are spec/doc files (no runtime services); rollback = git revert
  - HTML is a standalone file; no build pipeline dependency

---

## Suggested Task Seeds (Non-binding)

- TASK-01 (INVESTIGATE): Resolve SELL stream scoping — confirm whether SELL-02..07 should decouple from SELL-01 into early parallel stream. Gate for TASK-03.
- TASK-02 (IMPLEMENT): Update `loop-spec.yaml` — bump spec_version to 3.10.0; add fan-out-2 parallel group at MEASURE exit; add `[MEASURE-02, MARKET-01]` as the second fan-out-2 branch (alongside existing `[MEASURE-02, PRODUCT-01]`); add cross-stream ordering constraints (MARKET-01→PRODUCTS-02, MARKET-03→PRODUCTS-04, PRODUCTS-07→MARKET-06, LOGISTICS→MARKET-06); **remove** old constraints `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` which would otherwise block MARKET-01 from starting in parallel; remove sequential chain PRODUCT→PRODUCTS→LOGISTICS→MARKET; replace with fan-out-2 + synthesis join.
- TASK-03 (IMPLEMENT): Update `stage-operator-dictionary.yaml` — revise `operator_next_prompt` for MEASURE-02 (fan-out-2 instruction), PRODUCTS-01 (note MARKET-01 dependency before PRODUCTS-02), PRODUCTS-03/05/06 conditional skip instructions; add SELL stream changes if TASK-01 expands scope.
- TASK-04 (IMPLEMENT): Update `startup-loop-containers-process-map.html` — redesign layout to swim-lane columns (MARKET, PRODUCTS+LOGISTICS, SELL); add cross-stream dependency arrows at sync points; update MEASURE-02 exit annotation to show fan-out-2; MARKET-06 shown as synthesis join.

---

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `loop-spec.yaml`: fan-out-2 parallel group declared; cross-stream ordering constraints present; spec_version = 3.10.0; no ordering cycles
  - `stage-operator-dictionary.yaml`: MEASURE-02 next prompt instructs parallel stream start; PRODUCTS-01 next prompt notes MARKET-01 dependency; all affected prompts updated
  - `startup-loop-containers-process-map.html`: swim-lane layout visible; cross-stream dependency arrows present; MARKET-06 identified as synthesis join
- Post-delivery measurement plan: visual review of HTML in browser; cross-check ordering.sequential array for cycles using topological sort logic

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed S4 required inputs unchanged — no blast radius on join barrier (read loop-spec.yaml S4 block directly)
- Confirmed LOGISTICS correctly positioned before MARKET in current spec — only PRODUCTS positioning is wrong
- Confirmed cross-stream constraints follow existing pattern (`[A, B]` in ordering.sequential) — no new syntax needed
- Confirmed stage IDs unchanged — stage-addressing and BOS sync unaffected

### Confidence Adjustments

- Testability score held at 70% — did not inspect test fixture contents for ordering constraint coverage; not a blocker for planning
- SELL stream confidence held at assumption — Open Question must resolve before TASK-03 scope is final

### Remaining Assumptions

- SELL-01 continues to gate all SELL stages (default: no SELL stream decoupling) — to be confirmed by user
- HTML swim-lane layout is the right visual approach — to be confirmed before TASK-04 implementation

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - Open Question: SELL stream scoping (TASK-01 INVESTIGATE resolves this before TASK-03)
- Recommended next step: `/lp-do-plan startup-loop-parallel-container-wiring`
