---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-assessment-post-build-refresh
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-assessment-post-build-refresh/plan.md
Dispatch-ID: IDEA-DISPATCH-20260302210002-0127
---

# Startup Loop Assessment Post-Build Refresh Fact-Find Brief

## Scope

### Summary

The queued idea is directionally correct but too broad as written. The real gap is not that every assessment-era document should be re-generated after each build. The real gap is that the startup loop has no bounded post-build mechanism to reconcile strategy-relevant build outcomes back into the assessment balance sheet.

Today, the intake packet is only written or refreshed during ASSESSMENT-09 from ASSESSMENT-01..08 precursors. Later strategic decisions such as confirmed brand names, product naming, or other assessment-container updates can therefore drift away from the intake packet. At the same time, some downstream artifacts are explicitly seed-once/live-owned and must not be re-seeded from intake on refresh. The buildable problem is to add a post-build assessment refresh contract with explicit target boundaries, not to periodically regenerate the whole assessment layer.

### Goals
- Confirm the exact structural gap between ASSESSMENT-09 intake sync and post-build write-back.
- Distinguish refreshable assessment targets from seed-once/live-owned assessment artifacts.
- Define the minimum viable refresh mechanism for strategy-relevant builds.
- Reuse existing contracts where possible instead of inventing a second free-form reflection path.
- Produce a planning-ready scope that can be implemented deterministically.

### Non-goals
- Re-running every assessment-stage skill after each build.
- Re-seeding seed-once/live-owned documents such as `current-problem-framing.user.md`.
- Revisiting standing-registry registration for assessment containers; that was completed separately.
- Revisiting CASS retrieval for assessment containers; that was completed separately.
- Solving generic standing-artifact write-back for all domains in this task.

### Constraints & Assumptions
- Constraints:
  - `assessment-intake-sync.md` only reads ASSESSMENT-01/02/03/04/06/07/08 precursor artifacts and has no inputs for later strategic decisions.
  - `results-review.user.md` is the formal Layer B -> Layer A feedback handoff today and is scoped to standing-information refresh, not assessment-container refresh.
  - Carry-mode rules for the intake packet already distinguish `revision` vs `link` fields; any fix must preserve those semantics.
  - Some downstream artifacts are explicitly seed-once and say not to re-seed from intake on refresh.
- Assumptions:
  - Strategy-relevant builds can be identified from changed artifacts or build-output metadata without requiring manual per-build interpretation.
  - The correct mechanism is likely a bounded post-build refresh step or bridge, not a blind periodic full regeneration.
  - The intake packet should remain a living snapshot for fields that are still `revision` mode when later strategic decisions materially settle them.

## Outcome Contract

- **Why:** The assessment layer represents the accumulated strategic knowledge of a business. Builds can change strategic facts such as brand name, solution posture, or product naming, but the assessment balance sheet is not refreshed after the build cycle, so it drifts out of sync with accumulated loop learnings.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A defined mechanism exists for assessment containers to be updated after builds that touch strategy-relevant artifacts, preventing the assessment layer from drifting out of sync with accumulated loop learnings.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `docs/business-os/startup-loop/specifications/loop-spec.yaml` - ASSESSMENT-09 writes or refreshes the intake packet; later stages seed from intake or explicitly stop re-seeding.
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md` - the only defined intake refresh mechanism.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` - post-build contract for `results-review.user.md`.
- `.claude/skills/lp-do-build/SKILL.md` - operational post-build sequence.
- `docs/business-os/startup-loop/specifications/two-layer-model.md` - Layer A/Layer B data flow and bounded standing-update rules.
- `docs/business-os/startup-loop/schemas/carry-mode-schema.md` - intake field ownership semantics.

### Key Modules / Files
- `docs/business-os/startup-loop/specifications/loop-spec.yaml`
  - `ASSESSMENT-09` writes/refeshes `assessment-intake-packet.user.md`.
  - `MEASURE-00` is seeded once from intake and then updated directly.
  - `MEASURE-01`, `PRODUCT-01`, `PRODUCTS-01`, and `SELL-01` also document first-run seeding followed by live ownership.
- `.claude/skills/startup-loop/modules/assessment-intake-sync.md`
  - Refresh triggers only when ASSESSMENT precursor dates move.
  - Output logic populates intake sections from ASSESSMENT-01/02/03/04/06/07/08 only.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
  - Defines `results-review.user.md` as the formal post-build feedback artifact.
  - Scopes `Standing Updates` to Layer A standing-information refresh.
- `.claude/skills/lp-do-build/SKILL.md`
  - Produces `build-record.user.md`, `results-review.user.md`, sidecars, and commit artifacts.
  - Contains no post-build step for assessment refresh or intake resync.
- `docs/business-os/startup-loop/specifications/two-layer-model.md`
  - Shows `assessment-intake-packet.user.md` as a Layer A input into Layer B.
  - Shows `results-review.user.md` writing back into Layer A standing updates.
  - Requires bounded standing updates and explicit standing expansion decisions, but does not define an assessment write-back path.
- `docs/business-os/startup-loop/schemas/carry-mode-schema.md`
  - Marks `Business name` and `Business name status` as `revision` until name confirmation.
  - Makes clear that `link`/`revision` ownership already exists inside the intake model.
- `docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md`
  - Still records `Nidilo` as the working recommendation and `unconfirmed` naming status as of 2026-02-20.
- `docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md`
  - Selects `Facilella` on 2026-02-26.
- `docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-26-product-naming.user.md`
  - Already assumes `Business-Name: Facilella`.
- `docs/business-os/strategy/HBAG/assessment/current-problem-framing.user.md`
  - Explicitly says the document was seeded once from intake and must not be re-seeded on refresh.

### Patterns & Conventions Observed
- Intake refresh is currently an ASSESSMENT-stage concern, not a build-stage concern.
- Post-build reflection is already formalized through `results-review.user.md`, but its contract stops at Layer A standing updates.
- The intake packet is not architecturally static by design; it already has field-level `revision` semantics for items like naming status and business name until confirmation.
- The missing piece is the source graph and orchestration boundary after ASSESSMENT-09, not the absence of a mutable intake model.
- Review-trigger frontmatter is common across intake and assessment docs, but it is declarative only; no deterministic post-build runner consumes it.
- Seed-once/live-owned documents intentionally break the "keep reading intake forever" model and must remain outside any blanket resync path.

### Data & Contracts
- Types/schemas/events:
  - `results-review.user.md` requires `Observed Outcomes`, `Standing Updates`, `New Idea Candidates`, and `Standing Expansion`.
  - The two-layer model enforces bounded standing updates and anti-loop rules.
  - Carry-mode schema defines which intake fields are `revision` vs `link`.
- Persistence:
  - Intake packet lives at `docs/business-os/startup-baselines/<BIZ>/<YYYY-MM-DD>-assessment-intake-packet.user.md`.
  - Later assessment artifacts live under `docs/business-os/strategy/<BIZ>/assessment/`.
  - Build output reflection lives under `docs/plans/<slug>/`.
- API/contracts:
  - No existing contract maps later assessment decisions (for example `DEC-*-NAME-*` or ASSESSMENT-13 outputs) back into intake refresh inputs.
  - No existing contract defines how post-build outputs should update assessment containers directly.

### Dependency & Impact Map
- Upstream dependencies:
  - `build-record.user.md` and `results-review.user.md` from `/lp-do-build`
  - Intake packet carry-mode semantics
  - Later assessment artifacts under `docs/business-os/strategy/<BIZ>/assessment/`
  - Build-scope metadata or changed-file evidence to classify strategy-relevant builds
- Downstream dependents:
  - Skills that still read the intake packet as canonical business/product context
  - Future fact-finds and plans consuming assessment state via CASS and direct reads
  - Seed-once/live-owned artifacts that must be protected from unintended resync
- Likely blast radius:
  - `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
  - `docs/business-os/startup-loop/specifications/two-layer-model.md`
  - `.claude/skills/lp-do-build/SKILL.md`
  - `.claude/skills/startup-loop/modules/assessment-intake-sync.md` or a new adjacent refresh module
  - tests around startup-loop build reflection / assessment lifecycle contracts

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest under `scripts/src/startup-loop/__tests__/`
- Commands: CI-only per repo testing policy
- CI integration: existing startup-loop test suite already covers build reflection sidecars and related infrastructure

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `results-review` extraction/prefill | Unit | `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-prefill.test.ts` | Covers post-build reflection artifacts, not assessment refresh |
| reflection debt / sidecar handling | Unit | `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` | Covers post-build quality gates, not assessment write-back |
| assessment artifact presence | Unit | `scripts/src/startup-loop/__tests__/assessment-completion.test.ts`, `scripts/src/startup-loop/__tests__/contract-lint.test.ts` | Presence/path checks only; no post-build refresh behavior |

#### Coverage Gaps
- No direct tests for `assessment-intake-sync.md` behavior.
- No direct tests for post-build refresh into assessment containers or intake packet.
- No tests enforcing "seed once, then update directly" protection against accidental re-seeding.
- No tests proving that later strategic decisions can reconcile revision-mode intake fields without touching seed-once docs.

#### Testability Assessment
- Easy to test:
  - classification of refresh targets (`intake field` vs `live-owned doc` vs `no-refresh`)
  - intake packet update from a later confirmed decision
  - no-op behavior for unrelated builds
- Hard to test:
  - deriving refresh intent from free-form prose alone
  - protecting all live-owned docs without an explicit target matrix
- Test seams needed:
  - a deterministic refresh target matrix or contract
  - a small fixture set with intake + later assessment decisions + seed-once docs

#### Recommended Test Approach
- Unit tests for target classification and refresh eligibility.
- Integration tests for one end-to-end strategy-relevant build case:
  - later name decision updates intake `Business name` / `Business name status`
  - `current-problem-framing.user.md` remains untouched
- Contract tests for post-build step gating so non-strategy builds do not trigger assessment refresh.

### Recent Git History (Targeted)
- `IDEA-DISPATCH-20260302210000-0125` was completed on 2026-03-02 and registered assessment artifacts in the standing registry.
- `IDEA-DISPATCH-20260302210001-0126` was completed on 2026-03-02 and extended CASS retrieval into assessment containers.
- This leaves `IDEA-DISPATCH-20260302210002-0127` as the remaining balance-sheet gap: signals and retrieval are now wired, but post-build refresh is still missing.

## Access Declarations

None. All evidence is local repository state.

## Questions

### Resolved
- Q: Is the queued diagnosis correct as written?
  - A: Partly. It is correct that the intake packet has no post-build refresh path and can drift from later strategic decisions. It is too broad to imply that every assessment-era document should be refreshed from intake after every build.
  - Evidence: `docs/business-os/startup-loop/specifications/loop-spec.yaml`, `.claude/skills/startup-loop/modules/assessment-intake-sync.md`, `docs/business-os/strategy/HBAG/assessment/current-problem-framing.user.md`

- Q: Can this be solved by simply re-running `assessment-intake-sync.md` after every build?
  - A: No. The current sync module only reads ASSESSMENT-01/02/03/04/06/07/08 precursor artifacts, so it cannot see later decisions such as `DEC-HEAD-NAME-01` or ASSESSMENT-13 outputs. It would also ignore the live-ownership boundaries already defined for seed-once docs.
  - Evidence: `.claude/skills/startup-loop/modules/assessment-intake-sync.md`, `docs/business-os/strategy/HEAD/assessment/DEC-HEAD-NAME-01.user.md`

- Q: Does the intake model itself support later refresh for some fields?
  - A: Yes. Carry-mode rules explicitly mark `Business name` and `Business name status` as `revision` until name confirmation. The issue is missing source linkage and orchestration after ASSESSMENT-09, not a static-only intake contract.
  - Evidence: `docs/business-os/startup-loop/schemas/carry-mode-schema.md`

- Q: Should `results-review.user.md` directly mutate assessment docs by itself?
  - A: Not as a free-form mechanism. `results-review.user.md` is the right existing post-build handoff seam, but it needs a bounded assessment-refresh contract layered on top of it. Direct prose-driven mutation would ignore ownership boundaries and seed-once protections.
  - Evidence: `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/business-os/startup-loop/specifications/two-layer-model.md`

- Q: What is the minimum viable fix surface?
  - A: A bounded post-build assessment refresh step that:
    1. runs only for strategy-relevant builds,
    2. uses an explicit target matrix,
    3. updates only allowed intake `revision` fields and explicitly refreshable assessment docs,
    4. leaves seed-once/live-owned artifacts untouched.
  - Evidence: combined from `loop-spec.yaml`, `assessment-intake-sync.md`, `carry-mode-schema.md`, and live examples in HEAD/HBAG assessment docs

### Open (Operator Input Required)
None.

## Confidence Inputs
- **Implementation:** 84%
  - Evidence basis: the affected surfaces are known and bounded, but there is no existing refresh bridge or target matrix to extend.
  - What raises this to >=80: already met.
  - What raises this to >=90: define the exact refresh target matrix and settle whether the implementation extends `assessment-intake-sync.md` or creates a new post-build module.
- **Approach:** 88%
  - Evidence basis: the repo already points toward a bounded contract-based refresh rather than blanket regeneration.
  - What raises this to >=80: already met.
  - What raises this to >=90: confirm one canonical trigger source for "strategy-relevant build" classification.
- **Impact:** 90%
  - Evidence basis: real drift is proven in HEAD, and adjacent gaps for registry and retrieval are already closed.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met.
- **Delivery-Readiness:** 82%
  - Evidence basis: no external systems are required, but implementation crosses contracts, skills, and likely tests.
  - What raises this to >=80: already met.
  - What raises this to >=90: add fixture-backed tests and finalize the write surface.
- **Testability:** 78%
  - Evidence basis: no direct existing tests cover the gap, so the follow-on build must create new fixtures and guards.
  - What raises this to >=80: add a deterministic target matrix and one canonical end-to-end fixture.
  - What raises this to >=90: add contract tests for trigger gating plus seed-once protection cases.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Over-refresh rewrites live-owned seed-once docs | Medium | High | Require an explicit target matrix; default unknown targets to no-refresh |
| Under-refresh only patches intake and still leaves critical assessment drift elsewhere | Medium | Medium | Include explicitly refreshable assessment docs in the ownership matrix, not just intake |
| Free-form reflection prose drives nondeterministic updates | Medium | High | Use structured trigger/target rules; do not parse arbitrary prose into mutations |
| Strategy-refresh step fires on non-strategy builds and creates noise | Medium | Medium | Gate on changed-file/build-output classification for strategy-relevant artifacts |
| No direct regression coverage allows future contract drift | High | Medium | Add fixture-backed tests as part of the first implementation plan |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve `link` vs `revision` carry-mode semantics.
  - Respect seed-once/live-owned artifacts and never re-seed them from intake.
  - Reuse existing build-output contracts where possible rather than inventing a second free-form operator document.
  - Keep the mechanism deterministic and bounded.
- Rollout/rollback expectations:
  - Rollout should be additive: no existing build path should break when no strategy-relevant targets are present.
  - Rollback should be straightforward via revert of the new post-build refresh contract/module.
- Observability expectations:
  - Post-build evidence should show whether assessment refresh ran, what targets were updated, and why it no-op'd when skipped.

## Suggested Task Seeds (Non-binding)
1. **IMPLEMENT** — define the assessment post-build ownership matrix:
   - intake fields refreshable from later strategic decisions
   - explicitly refreshable assessment docs
   - seed-once/live-owned docs that must never be auto-refreshed
2. **IMPLEMENT** — update `two-layer-model.md`, `loop-output-contracts.md`, and `lp-do-build/SKILL.md` to add a bounded assessment refresh step for strategy-relevant builds
3. **IMPLEMENT** — extend `assessment-intake-sync.md` or add a new adjacent post-build bridge module that can consume later assessment decisions without re-running whole assessment stages
4. **IMPLEMENT** — add fixture-backed tests proving:
   - a later confirmed name updates revision-mode intake fields
   - seed-once docs such as `current-problem-framing.user.md` are untouched
   - non-strategy builds no-op cleanly

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - explicit post-build assessment refresh contract
  - deterministic refresh target matrix
  - implementation module/skill wiring
  - regression tests for protected live-owned docs and one positive reconciliation case
- Post-delivery measurement plan:
  - next strategy-relevant build should emit visible assessment refresh/no-op evidence
  - previously stale revision-mode intake fields should reconcile when later decisions settle them

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ASSESSMENT-09 intake sync source graph | Yes | None - source boundary is explicit and fully traced | No |
| Post-build artifact chain (`build-record` -> `results-review`) | Yes | [Scope gap] [Major]: no assessment refresh step exists after reflection artifacts are produced | No |
| Intake carry-mode semantics | Yes | None - `revision` vs `link` rules are explicit | No |
| Seed-once/live-owned downstream docs | Yes | [Boundary coverage] [Major]: blanket resync would violate explicit "Do NOT re-seed" contracts | No |
| Real drift example (HEAD naming) | Yes | None - concrete mismatch proves impact | No |
| Automated test surface | Partial | [Missing precondition] [Moderate]: no direct refresh tests exist, so first implementation must create them | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The gap is narrower than the original queue framing but still concrete. Adjacent prerequisites are already complete (assessment registry and CASS retrieval). The remaining work is one bounded contract/process seam plus tests, not a redesign of the whole assessment layer.

## Evidence Gap Review

### Gaps Addressed
- Confirmed the existing post-build contract ends at Layer A standing updates and does not include assessment refresh.
- Confirmed the only intake refresh mechanism is ASSESSMENT-09 precursor drift detection.
- Confirmed some downstream assessment docs are explicitly seed-once/live-owned and therefore outside any blanket refresh design.
- Proved real drift with the HEAD name-decision example.
- Confirmed adjacent assessment-registry and CASS-retrieval gaps were already completed, narrowing this fact-find to the remaining balance-sheet refresh problem.

### Confidence Adjustments
- Reduced `Implementation` from near-certain to 84% because no refresh target matrix or direct tests exist yet.
- Increased `Impact` to 90% because the repo now contains a concrete stale-state example, not just an architectural suspicion.
- Reduced `Testability` to 78% because current coverage stops short of the actual gap.

### Remaining Assumptions
- Strategy-relevant builds can be classified deterministically enough for a gated refresh step.
- Later strategic decisions should update at least some intake `revision` fields without reopening ASSESSMENT-01..08 artifacts.
- No hidden operator-only refresh process exists outside the repo contracts examined here.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-assessment-post-build-refresh --auto`
