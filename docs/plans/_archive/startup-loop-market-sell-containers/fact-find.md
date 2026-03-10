---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-21
Last-updated: 2026-02-21
Feature-Slug: startup-loop-market-sell-containers
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-sequence
Related-Plan: docs/plans/startup-loop-market-sell-containers/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop MARKET/SELL Containerization Fact-Find Brief

## Scope
### Summary
Evaluate whether startup-loop marketing/sales should remain as separate stage IDs (`S2`, `S2B`, `S3B`, `S6B`) or be consolidated into one or two container stages. This fact-find focuses on the clean split option (`MARKET` + `SELL`), required interface contract, and migration blast radius across loop contracts, skill routing, MCP tooling, and data-plane workers.

### Goals
- Decide between single container (`M&S`) vs dual containers (`MARKET`, `SELL`) using repository evidence.
- Define a planning-ready interface contract from `MARKET` to `SELL`.
- Preserve current gate semantics (especially S2B messaging gate and S6B strategy/spend split).
- Map implementation touchpoints and test impact before planning.

### Non-goals
- Implementing stage renames or schema migrations in this run.
- Rewriting startup-loop process semantics beyond the marketing/sales segment.
- Changing BOS write policy or single-writer control-plane behavior.

### Constraints & Assumptions
- Constraints:
  - `docs/business-os/startup-loop/loop-spec.yaml` remains canonical stage authority.
  - S6B must keep strict separation between strategy completion and spend authorization.
  - S3B remains conditional and non-blocking at S4 unless explicitly promoted.
  - Backward compatibility is required for existing stage IDs during migration.
- Assumptions:
  - Containerization can be additive (new container IDs + legacy sub-stage IDs retained initially).
  - Operator UX gains from container labels are meaningful only if resolver/aliases and generated stage views are updated together.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` - canonical stage graph, join barrier, and gate metadata.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` - canonical operator labels/aliases and generated map inputs.
- `.claude/skills/startup-loop/modules/cmd-advance.md` - operational gate behavior for `GATE-BD-03`, `GATE-S3B-01`, `GATE-S6B-STRAT-01`, `GATE-S6B-ACT-01`.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml` - currently models `S2 -> S2B -> [S3,S3B,S6B] -> S4`.
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md` - capability ownership and stage/gate anchors.
- `docs/business-os/startup-loop/artifact-registry.md` - canonical `offer`, `channels`, and `forecast` path contracts.
- `docs/business-os/startup-loop/demand-evidence-pack-schema.md` - DEP pass floor used by S6B gates.
- `scripts/src/startup-loop/s6b-gates.ts` - hardcoded gate evaluators for STRAT/ACT split.
- `scripts/src/startup-loop/baseline-merge.ts` - S4 worker requiring `S2B.offer`, `S3.forecast`, `S6B.channels`.
- `scripts/src/startup-loop/bottleneck-detector.ts` - stage enum and upstream priority order include `S2B`, `S6B`, `S3B`.
- `scripts/src/startup-loop/stage-addressing.ts` - canonical stage resolution behavior via generated map.
- `packages/mcp-server/src/tools/loop.ts` - policy stage allowlists (currently drifted: includes legacy `S1`, `S1B`, `S2A`).
- `packages/mcp-server/src/tools/bos.ts` - policy stage allowlists (same drift pattern as loop tool).

### Patterns & Conventions Observed
- Container-stage precedent already exists and works (`ASSESSMENT`, `DO`) in `loop-spec.yaml`.
- Marketing/sales is already functionally split: proposition definition (`S2/S2B`) vs route-to-demand execution (`S6B`).
- S6B already has dual-gate semantics in both docs and code (`scripts/src/startup-loop/s6b-gates.ts`).
- Stage identity is duplicated across docs, generated maps, TypeScript enums, and MCP tool allowlists; migration is multi-surface.

### Data & Contracts
- Types/schemas/events:
  - Stage result contract: `docs/business-os/startup-loop/stage-result-schema.md`.
  - Capability registry: `docs/business-os/startup-loop/marketing-sales-capability-contract.md`.
  - DEP gating schema: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`.
- Persistence:
  - Offer artifact (`S2B`): `docs/business-os/startup-baselines/<BIZ>-offer.md`.
  - Channels artifact (`S6B`): `docs/business-os/startup-baselines/<BIZ>-channels.md`.
  - Optional S3B results: `docs/business-os/strategy/<BIZ>/lp-other-products-results.user.md`.
- API/contracts:
  - Stage addressing and aliases derive from generated stage-operator map and dictionary.
  - MCP policy tools validate `current_stage` against local stage allowlists.

### Dependency & Impact Map
- Upstream dependencies:
  - `MEASURE-02` output quality/freshness before `S2`.
  - `S2` intelligence freshness gates `S2B` validity.
- Downstream dependents:
  - S4 join barrier requires `S2B offer`, `S3 forecast`, `S6B channels`.
  - Bottleneck diagnosis and replan triggers currently point directly to `S2B` and `S6B` constraint keys.
  - `lp-channels`, `lp-seo`, and `draft-outreach` dispatch path is tied to `S6B` completion semantics.
- Likely blast radius:
  - Contract docs: loop spec, stage dictionary, generated map/table, artifact registry, capability registry.
  - Skills: startup-loop wrapper/advance, lp-offer/lp-channels/lp-forecast/lp-baseline-merge/lp-other-products references.
  - Code: gate evaluators, baseline merge worker, stage-addressing consumers, MCP tool stage allowlists.
  - Tests/fixtures: startup-loop integration tests and manifest fixtures referencing stage keys.

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop maintainers (contract + code migration).
  - Operators (clearer labels and checkpoints).
  - Skill authors (routing and stage references).
- Channel constraints:
  - Internal repo contracts only; no external publishing constraints.
- Existing templates/assets:
  - Fact-find template and evidence-gap checklist are available and used.
  - Existing stage dictionary/generator pipeline already supports label-first operator rendering.
- Approvals/owners:
  - BOS/startup-loop maintainers for stage-contract and MCP policy changes.
  - Operator owner (Pete) for final naming/compatibility choices.
- Measurement hooks:
  - Preserve S6B activation safety checks and S10 denominator integrity behavior.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Two containers (`MARKET` + `SELL`) preserve operational clarity better than one (`M&S`) | Existing gate/ownership boundaries map cleanly | Low | Immediate (contract review) |
| H2 | `MARKET -> SELL` interface can be represented as a strict Offer Contract without breaking S6B gating | Offer artifact + messaging hierarchy + assumptions contract | Medium | 1-2 design cycles |
| H3 | Hard cutover without legacy IDs is feasible if all stage consumers are migrated together in one release window | Complete stage-consumer inventory + synchronized validation | Medium | 1 sprint |
| H4 | Current repo has stage-ID drift risk that must be addressed as part of migration | Duplicate stage lists in MCP and detector code | Low | Immediate (grep + lint evidence) |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | S2/S2B and S6B are already semantically distinct with different hard gates | `loop-spec.yaml`, `cmd-advance.md`, `s6b-gates.ts` | High |
| H2 | Offer and channels artifacts already separated with canonical paths and consumer contracts | `artifact-registry.md` | High |
| H3 | Stage consumer surfaces are enumerable across contracts, scripts, and MCP tooling, enabling coordinated hard cutover | `stage-addressing.ts`, `scripts/src/startup-loop/*`, `packages/mcp-server/src/tools/*` | Medium |
| H4 | MCP tool stage allowlists still include retired IDs (`S1`, `S1B`, `S2A`) | `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/bos.ts` | High |

#### Falsifiability Assessment
- Easy to test:
  - Whether `MARKET`/`SELL` preserves existing hard gates and S4 requirements.
  - Whether stage addressing can resolve both new and legacy aliases deterministically.
- Hard to test:
  - Full downstream skill-ecosystem compatibility without staged rollout checks.
- Validation seams needed:
  - Contract-lint extension for new container IDs and alias compatibility.
  - MCP integration tests for accepted `current_stage` values across tools.

#### Recommended Validation Approach
- Quick probes:
  - Add draft container IDs to stage dictionary and generate map/table; verify resolver behavior with legacy aliases.
- Structured tests:
  - Update startup-loop integration tests and stage fixtures; verify policy allowlist acceptance and join-barrier behavior.
- Deferred validation:
  - Operator comprehension timing test after UX labels are updated in workflow/run-packet surfaces.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest for MCP server startup-loop integration tests.
  - Shell contract lint for startup-loop consistency checks.
- Commands:
  - `bash scripts/check-startup-loop-contracts.sh`
  - `pnpm --filter @acme/mcp-server test:startup-loop -- --testPathPattern="startup-loop-tools.integration.test.ts"`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| MCP startup-loop + BOS flows | Integration | `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` | Passes currently; validates tool behaviors over run artifacts |
| Contract alignment | Lint/contract | `scripts/check-startup-loop-contracts.sh` | Currently failing with stage coverage drift in workflow/prompt index |

#### Coverage Gaps
- Untested paths:
  - No explicit tests that retired marketing/sales IDs are rejected after MARKET/SELL cutover.
  - No parity test that all stage allowlists are generated from a single canonical source.
- Extinct tests:
  - Not investigated.

#### Testability Assessment
- Easy to test:
  - Resolver and MCP policy acceptance for stage IDs.
  - Join-barrier input key validation after contract updates.
- Hard to test:
  - All skill-document references without stronger lint coverage.
- Test seams needed:
  - Shared stage-constant import or generated stage enum to eliminate duplicated literal lists.

#### Recommended Test Approach
- Unit tests for:
  - stage-addressing resolution for new container IDs and explicit rejection of retired IDs.
- Integration tests for:
  - MCP tools accepting container-stage `current_stage` values.
- Contract tests for:
  - loop-spec vs stage dictionary vs MCP stage allowlists parity.

### Recent Git History (Targeted)
- `bd83190757` - chore: outstanding startup-loop + skill updates (recent baseline for current contracts).
- `4d962cb4ed` - refactor: lp skill namespace + artifact refresh.
- `b30290573c` - integrity audit fixes across startup-loop surfaces.
- `46d86ec187` - resolver + typed union expansion for stages.
- `2c2f55d622` - capability gap audit completion including S6B gate work.

## External Research (If Needed)
Not investigated: repository evidence is sufficient for this stage-model decision.

## Questions
### Resolved
- Q: Should this be one container (`M&S`) or two (`MARKET` + `SELL`)?
  - A: Two containers are cleaner and lower-risk because proposition-definition and demand-execution already have distinct contracts/gates.
  - Evidence: `loop-spec.yaml`, `cmd-advance.md`, `s6b-gates.ts`.
- Q: Should legacy IDs (`S2`, `S2B`, `S3B`, `S6B`) remain externally addressable during migration?
  - A: No. Decision is hard cutover with no legacy ID retention.
  - Evidence: user directive on 2026-02-21.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: touchpoints are known across docs, skills, and code; migration is broad but bounded.
  - Raise to >=80: already met.
  - Raise to >=90: complete a full dependency matrix mapping every stage-ID consumer and required edit.
- Approach: 89%
  - Evidence basis: existing ASSESSMENT/DO container precedent and already-split S6B gates support this design.
  - Raise to >=80: already met.
  - Raise to >=90: finalize explicit Offer Contract schema and no-alias hard-cutover contract checks.
- Impact: 86%
  - Evidence basis: improves operator comprehension and ownership boundaries without removing existing safeguards.
  - Raise to >=80: already met.
  - Raise to >=90: run an operator-facing stage-comprehension check on updated run packets/workflow.
- Delivery-Readiness: 78%
  - Evidence basis: repository already has stage contract drift (contract lint fails), which increases migration risk.
  - Raise to >=80: resolve current startup-loop contract lint failures first.
  - Raise to >=90: restore contract-lint green and add stage parity tests before implementing rename migration.
- Testability: 82%
  - Evidence basis: existing integration/lint harnesses exist and are directly relevant.
  - Raise to >=80: already met.
  - Raise to >=90: add generator-backed stage parity tests to remove duplicated literal stage lists.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Stage-ID drift worsens during rename | High | High | Generate all stage lists from one canonical source and add parity lint/tests |
| Breaking external stage callers | Medium | High | Coordinate a single hard-cutover release with full consumer inventory and strict pre-merge validation gates |
| S6B spend gate accidentally weakened | Low | Critical | Preserve `GATE-S6B-ACT-01` as non-negotiable invariant |
| S4 join barrier breaks due key remap errors | Medium | High | Keep artifact keys stable (`offer`, `forecast`, `channels`) and update worker tests |
| Bottleneck diagnosis mappings become stale | Medium | Medium | Update stage enums and constraint-key mappings in one migration step |
| Operator UX improves in docs but not in commands/tooling | Medium | Medium | Update stage dictionary, resolver, and run-packet display fields together |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep canonical gate IDs and semantics intact.
  - Keep stage-result/artifact-key contracts deterministic.
  - Preserve fail-closed stage resolution behavior.
- Rollout/rollback expectations:
  - Rollout as a coordinated hard cutover with all known consumers migrated in the same change window.
  - Rollback by reverting the cutover change-set as a whole.
- Observability expectations:
  - Contract lint must be green after each migration phase.
  - MCP startup-loop integration suite must stay green.

## Suggested Task Seeds (Non-binding)
1. Add `MARKET` and `SELL` container stages to `loop-spec.yaml` and remove legacy marketing/sales stage IDs from canonical stage lists.
2. Define the `MARKET -> SELL` Offer Contract (required fields + freshness + quality status).
3. Update stage dictionary and regenerate operator map/table with container labels and no retired-ID aliases.
4. Refactor startup-loop gate docs (`cmd-advance.md`) to anchor gates to container microsteps.
5. Update S4 join-barrier and baseline merge worker references if stage-path assumptions change.
6. Update bottleneck detector stage enums and constraint-key mapping policy.
7. Replace duplicated stage allowlists in MCP loop/bos tools with generated canonical stage set.
8. Extend contract lint to validate no-legacy-ID hard-cutover policy across active startup-loop surfaces.
9. Add tests for stage-addressing rejection of retired IDs and MCP policy acceptance of container-stage IDs.
10. Publish hard-cutover migration checklist with rollback contract and pre-merge validation gates.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `lp-sequence`
- Deliverable acceptance package:
  - Updated loop contract docs + generated stage views + code/policy parity updates + passing contract lint/tests.
- Post-delivery measurement plan:
  - Contract lint pass rate (`scripts/check-startup-loop-contracts.sh`).
  - Startup-loop MCP integration suite pass.
  - Operator comprehension check for stage labels and next actions.

## Evidence Gap Review
### Gaps Addressed
- Verified canonical stage/gate truth from loop spec, gate docs, and gate code.
- Verified code-level blast radius with concrete stage-ID consumers.
- Ran targeted validations:
  - `bash scripts/check-startup-loop-contracts.sh` (failed; documented as readiness risk).
  - `pnpm --filter @acme/mcp-server test:startup-loop -- --testPathPattern="startup-loop-tools.integration.test.ts"` (passed).

### Confidence Adjustments
- Lowered Delivery-Readiness due to observed contract lint failures unrelated to this proposed migration but directly affecting migration safety.
- Kept Approach high because container split aligns with existing gate topology and artifact boundaries.

### Remaining Assumptions
- `MARKET`/`SELL` hard cutover can be completed in one coordinated release window without missing stage-ID consumers.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning.
- Recommended next step:
  - `/lp-do-plan` to sequence a phased migration with explicit compatibility and parity-test gates.
