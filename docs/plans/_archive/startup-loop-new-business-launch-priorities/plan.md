---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Mixed
Created: 2026-02-24
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-new-business-launch-priorities
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-launch-qa, lp-do-plan
Overall-confidence: 84%
Confidence-Method: per-task headline confidence (min of 3 dimensions) weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: plan
---

# Startup Loop Website Iteration Factory Plan

## Summary
This plan turns existing startup-loop information into a repeatable website iteration factory for new businesses. The immediate objective is to stop rebuilding copy/SEO/page messaging manually per business and instead compile canonical loop artifacts into reusable website content outputs. Scope is split into contract standardization, compiler + materializer implementation, quality linting, and deterministic v2 backlog seeding from artifact deltas. The plan deliberately keeps decision-support workflows out of scope and focuses only on launching and iterating Level-1 sites faster.

## Active tasks
- [x] TASK-01: Lock packet gate and generation mode policy
- [x] TASK-02: Canonicalize website-content artifact contracts and WEBSITE gate wiring
- [x] TASK-03: Build `compile-website-content-packet` pipeline
- [x] TASK-04: Build site-content materializer and remove hardcoded runtime copy module pattern
- [x] TASK-05: Add SEO bootstrap and claim-safety lint gates
- [x] TASK-06: Build artifact-delta to website-backlog mapper
- [x] TASK-07: Add logistics-aware policy block mapper for physical-product profiles
- [x] TASK-08: Checkpoint - pilot outputs and replan downstream rollout
- [x] TASK-09: Add website-iteration throughput telemetry pack

## Goals
- Standardize a canonical `website-content-packet` contract for pre-website launches.
- Compile ASSESSMENT/MARKET/SELL/PRODUCTS/LOGISTICS outputs into site-ready content assets.
- Replace manual, business-hardcoded runtime copy modules with generated payloads.
- Enable deterministic WEBSITE-02 iteration backlogs from upstream artifact changes.

## Non-goals
- Weekly decision memo and denominator policy improvements.
- New business strategy research beyond existing loop artifacts.
- Broad storefront redesign unrelated to content iteration factory mechanics.

## Constraints & Assumptions
- Constraints:
  - Stage/runtime authority remains `docs/business-os/startup-loop/loop-spec.yaml`.
  - WEBSITE-01 canonical contract remains `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`.
  - Existing startup-loop canonical path conventions must remain intact.
- Assumptions:
  - Existing loop artifacts are sufficient for launch-quality v1 copy/SEO baseline in most cases.
  - Largest throughput bottleneck is transformation and wiring, not missing source information.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-new-business-launch-priorities/fact-find.md`
- Key findings used:
  - `website-content-packet` exists in practice but is not canonical in artifact-registry.
  - Runtime website content is currently hardcoded in app code (`apps/caryina/src/lib/contentPacket.ts`).
  - WEBSITE-01 source maps already include the upstream artifacts needed for deterministic compilation.
  - OFF-3 already defines recurring website iteration ownership, but not an automated transform path.

## Proposed Approach
- Option A: Keep current manual packet + hardcoded runtime modules and improve operator discipline.
  - Rejected: preserves drift, duplicate work, and slow v2 iteration.
- Option B: Introduce canonical packet contract + compiler + generated runtime payload + lint + delta mapper.
  - Chosen: creates reusable factory mechanics with explicit acceptance/test contracts.

## Execution Contracts
### Standard Checks
- `pnpm --filter scripts test -- startup-loop`
- `pnpm --filter scripts typecheck`
- `pnpm --filter @apps/caryina typecheck`
- `pnpm --filter @apps/caryina lint`

### Delivery Contract
- Pre-website launches have canonical packet contract and compile path.
- App runtime content module consumes generated payload rather than business-hardcoded constants.
- Artifact changes can emit deterministic website iteration task seeds.
- Physical-product launches generate policy blocks from logistics-aware inputs.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (plan-only mode; build handoff not requested)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock packet mandate and generation mode policy | 90% | S | Complete (2026-02-24) | - | - |
| TASK-02 | IMPLEMENT | Canonicalize packet contract + WEBSITE gate references | 88% | M | Complete (2026-02-24) | TASK-01 | TASK-03, TASK-06, TASK-07 |
| TASK-03 | IMPLEMENT | Build packet compiler pipeline | 85% | L | Complete (2026-02-24) | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-06, TASK-07 |
| TASK-04 | IMPLEMENT | Build runtime materializer + migrate hardcoded module pattern | 80% | L | Complete (2026-02-24) | TASK-01, TASK-03 | TASK-08 |
| TASK-05 | IMPLEMENT | Add SEO bootstrap + claim-safety lint | 82% | M | Complete (2026-02-24) | TASK-03 | TASK-08 |
| TASK-06 | IMPLEMENT | Build artifact-delta backlog mapper | 85% | M | Complete (2026-02-24) | TASK-02, TASK-03 | TASK-08 |
| TASK-07 | IMPLEMENT | Add logistics-aware policy block mapper | 85% | M | Complete (2026-02-24) | TASK-02, TASK-03 | TASK-08 |
| TASK-08 | CHECKPOINT | Pilot evidence + downstream replan | 95% | S | Complete (2026-02-24) | TASK-04, TASK-05, TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Add throughput telemetry pack | 85% | M | Complete (2026-02-24) | TASK-08 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Policy lock before contract and code implementation |
| 2 | TASK-02 | TASK-01 | Canonical contracts/gates before compiler |
| 3 | TASK-03 | TASK-01, TASK-02 | Core compiler capability |
| 4 | TASK-04, TASK-05, TASK-06, TASK-07 | TASK-03 (+ TASK-02 for TASK-06/07) | Parallelizable with shared compile outputs |
| 5 | TASK-08 | TASK-04, TASK-05, TASK-06, TASK-07 | Replan checkpoint based on pilot evidence |
| 6 | TASK-09 | TASK-08 | Telemetry finalization after confirmed rollout shape |

## Validation Contracts
- TC-02 (TASK-02): Canonical contract lint -> `website-content-packet` row exists with required fields and path contract.
- TC-03 (TASK-03): Compiler pipeline -> given valid source artifacts, packet compile succeeds and source ledger is complete.
- TC-04 (TASK-04): Runtime payload generation -> generated payload is consumed by app and no hardcoded business copy constants remain in targeted module.
- TC-05 (TASK-05): Lint gate -> unsupported claims or untraceable copy fail with deterministic diagnostics.
- TC-06 (TASK-06): Delta mapper -> upstream artifact diffs produce deterministic route/block task seeds.
- TC-07 (TASK-07): Logistics mapping -> physical-product profile produces policy blocks; non-logistics profile is absent-safe.
- TC-08 (TASK-08): Checkpoint pilot -> generated payload accepted for >=1 business; delta mapper suggestions accepted at >70% rate by operator; no critical lint false-positives in pilot cycle.
- TC-09 (TASK-09): Throughput telemetry -> reports artifact-change-to-site-change lead time and manual touch count.

## Open Decisions
None: DEC-01 and DEC-02 resolved on 2026-02-24.
- `website-content-packet` gate policy: `mandatory` for pre-website launches.
- Site-content payload generation mode: `commit generated artifacts` (long-term deterministic path).

## Tasks

### TASK-01: Lock packet mandate and generation mode policy
- **Type:** DECISION
- **Deliverable:** decision record section added to this plan + references in startup-loop workflow docs.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-24)
- **Affects:** `docs/plans/startup-loop-new-business-launch-priorities/plan.md`, `[readonly] docs/plans/startup-loop-new-business-launch-priorities/fact-find.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - option set and tradeoffs are already explicit in fact-find.
  - Approach: 90% - single policy lock removes downstream ambiguity.
  - Impact: 95% - directly controls gate strictness and implementation architecture.
- **Options:**
  - Option A: mandatory packet gate + committed generated payload artifacts.
  - Option B: advisory packet gate + runtime-only compilation.
- **Recommendation:** Option A for determinism, code review traceability, and fail-closed launch quality.
- **Decision outcome:**
  - Enforce `mandatory` packet gate for pre-website launches.
  - Use `commit generated artifacts` for site-content payload persistence (long-term architecture default).
  - Rationale: deterministic builds, reviewable diffs, and fail-closed launch consistency.
- **Acceptance:**
  - decision recorded in plan decision log with explicit rationale.
  - downstream tasks updated to reflect resolved policy.
- **Validation contract:** Decision closure documented and referenced by TASK-02/TASK-03 implementation notes.
- **Planning validation:** None: policy decision task; no command output required.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** plan decision log + open decisions updated.

### TASK-02: Canonicalize website-content artifact contracts and WEBSITE gate wiring
- **Type:** IMPLEMENT
- **Deliverable:** startup-loop docs updated so `website-content-packet` has canonical contract, required schema, and WEBSITE gate references.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `docs/business-os/startup-loop/artifact-registry.md`, `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop-workflow.user.html`, `[readonly] docs/business-os/startup-baselines/_templates/content-packet-template.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-06, TASK-07
- **Confidence:** 88%
  - Implementation: 90% - clear insertion points, existing precedent in HBAG packet, and registry structure already documented.
  - Approach: 85% - contract-first sequencing matches registry conventions.
  - Impact: 90% - required to unlock reusable cross-business packet generation.
- **Acceptance:**
  - artifact registry includes canonical `website-content-packet` row and consumer list.
  - WEBSITE workflow references packet contract as required input/output where applicable.
  - process registry OFF-3 references packet contract in first-build and recurring iteration outputs.
- **Validation contract (TC-02):**
  - TC-02-01: registry lint/read check confirms canonical row fields present and path is unique.
  - TC-02-02: workflow docs mention packet contract in WEBSITE-01->DO handoff context.
- **Build completion evidence (2026-02-24):**
  - Added canonical `website-content-packet` artifact row to the core artifact registry with required sections, canonical path, and consumer list.
  - Updated OFF-3 process contract so first-build outputs/artifact paths include `docs/business-os/startup-baselines/<BIZ>-content-packet.md`.
  - Updated WEBSITE workflow references so WEBSITE-01 outputs, WEBSITE->DO handover inputs, and DO build dispatch all reference the canonical packet contract/path.
  - Rendered companion HTML for workflow doc update: `docs/business-os/startup-loop-workflow.user.html`.
  - Validation run: `rg -n "WEBSITE-01|content-packet|artifact-registry|OFF-3" docs/business-os -S` (TC-02-01, TC-02-02).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "WEBSITE-01|content-packet|artifact-registry|OFF-3" docs/business-os -S`
  - Validation artifacts: existing references found in workflow/process docs and HBAG packet path.
  - Unexpected findings: packet template exists but registry has no canonical row.
- **Scouts:**
  - verify any legacy duplicate packet path conventions before final contract lock.
- **Edge Cases & Hardening:**
  - ensure no failure for businesses without content packet yet; gate behavior follows TASK-01 decision.
- **What would make this >=90%:**
  - add/update a startup-loop contract parity test asserting packet registry presence.
- **Rollout / rollback:**
  - Rollout: doc contract updates in one commit with cross-doc references.
  - Rollback: revert contract rows and workflow references if conflict discovered.
- **Documentation impact:** startup-loop registry/process/workflow docs updated.
- **Notes / references:**
  - `docs/business-os/startup-baselines/HBAG-content-packet.md`

### TASK-03: Build `compile-website-content-packet` pipeline
- **Type:** IMPLEMENT
- **Deliverable:** command/tooling that compiles website content packet from canonical loop artifacts with deterministic diagnostics.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-24)
- **Affects:** `scripts/src/startup-loop/` (new compiler module + CLI wiring), `scripts/src/startup-loop/__tests__/`, `docs/business-os/startup-baselines/_templates/content-packet-template.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 85% - source artifact set and packet shape are already known.
  - Approach: 85% - compile step before runtime materialization is stable and testable.
  - Impact: 90% - removes manual packet assembly, core factory gain.
- **Acceptance:**
  - compiler reads canonical source artifacts with explicit classification: mandatory-for-all (`<BIZ>-intake-packet.user.md`, `<BIZ>-offer.md`, `<BIZ>-channels.md`), conditional-mandatory (`logistics-pack.user.md` when `business_profile includes logistics-heavy OR physical-product`), and optional-absent-safe (logistics pack for non-logistics profiles).
  - compiler writes deterministic packet output + source ledger + explicit fail reasons.
  - golden fixture tests pass for at least one logistics-aware and one absent-logistics profile.
- **Validation contract (TC-03):**
  - TC-03-01: valid inputs -> packet compile succeeds with required sections.
  - TC-03-02: missing mandatory source -> compile fails with actionable diagnostic.
  - TC-03-03: non-logistics profile -> compile succeeds with documented logistics skip.
  - TC-03-04: logistics profile with missing `logistics-pack.user.md` -> compile fails with deterministic `needs-input` diagnostic.
- **Build completion evidence (2026-02-24):**
  - Added compiler tooling at `scripts/src/startup-loop/compile-website-content-packet.ts` with CLI entrypoint and deterministic diagnostics.
  - Enforced explicit source classification and fail behavior: mandatory (`intake/offer/channels`), conditional-mandatory (`logistics-pack` for physical-product/logistics-heavy), optional absent-safe (`product-pack`, `market-pack`, logistics for non-logistics profiles).
  - Added logistics contract enforcement (required frontmatter and required sections) before policy block extraction when logistics is required.
  - Added targeted tests at `scripts/src/startup-loop/__tests__/compile-website-content-packet.test.ts` covering TC-03-01 through TC-03-04, including logistics-aware and absent-logistics fixture paths.
  - Added script command `startup-loop:compile-website-content-packet` in `scripts/package.json` for operator use.
  - Validation run: `pnpm --filter scripts test -- compile-website-content-packet`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "content-packet|offer|channels|product-pack|logistics-pack" docs/business-os -S`
  - Validation artifacts: source contracts and template paths verified.
  - Unexpected findings: packet exists only as template + HBAG implementation, not as canonical compile product.
  - Consumer tracing:
    - New output `website-content-packet` is consumed by WEBSITE-01 source map and app content materializer (TASK-04).
    - Diagnostics consumer is operator/build logs; no existing consumer conflict found.
- **Scouts:**
  - input normalization for businesses missing optional aggregate packs.
- **Edge Cases & Hardening:**
  - fail-closed only for mandatory and conditional-mandatory sources; optional sources produce explicit skip markers.
  - for conditional logistics sources, enforce required LOGISTICS frontmatter/section contract from `aggregate-pack-contracts.md` before policy extraction.
- **What would make this >=90%:**
  - add a second-business fixture pass plus contract parity test in startup-loop suite.
- **Rollout / rollback:**
  - Rollout: introduce compiler in report-only mode first, then enforce per TASK-01 decision.
  - Rollback: disable enforcement and keep compiler as advisory command.
- **Documentation impact:** command usage docs and packet contract examples added/updated.
- **Notes / references:**
  - `docs/business-os/startup-baselines/HBAG-content-packet.md`

### TASK-04: Build site-content materializer and remove hardcoded runtime copy module pattern
- **Type:** IMPLEMENT
- **Deliverable:** generated typed runtime payload consumed by app routes/components; hardcoded business copy constants removed from target module pattern.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-24)
- **Affects:** `apps/caryina/src/lib/contentPacket.ts`, `apps/caryina/src/app/[lang]/**`, `scripts/src/startup-loop/` (materializer output), `data/shops/<BIZ>/` generated content payload path
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 80% - hardcoded seam is localized but 11 route consumers must be migrated atomically; breadth adds risk.
  - Approach: 85% - generator + typed payload avoids repeated manual edits.
  - Impact: 90% - key leverage point for rapid v1->v2 iteration.
- **Acceptance:**
  - `apps/caryina` content module consumes generated payload instead of business-hardcoded constants.
  - All 11 consumer routes migrated: `[lang]/page`, `[lang]/shop/page`, `[lang]/product/[slug]/page`, `[lang]/support/page`, `[lang]/privacy/page`, `[lang]/shipping/page`, `[lang]/returns/page`, `[lang]/terms/page`, `[lang]/checkout/page`, `[lang]/success/page`, `[lang]/cancelled/page`.
  - metadata, home/shop/PDP/support/policy copy resolve from generated payload.
  - route behavior remains stable under existing targeted validations.
- **Validation contract (TC-04):**
  - TC-04-01: generated payload available -> app renders expected content blocks.
  - TC-04-02: payload missing/invalid -> deterministic fallback/error path (no silent stale content).
  - TC-04-03: targeted app typecheck/lint pass after migration.
- **Build completion evidence (2026-02-24):**
  - Added runtime materializer command and module at `scripts/src/startup-loop/materialize-site-content-payload.ts` with deterministic missing/invalid source diagnostics.
  - Added runtime generated payload source at `data/shops/caryina/site-content.generated.json` and migrated app content reader to generated artifact (`apps/caryina/src/lib/contentPacket.ts`).
  - Added materializer tests covering success path, missing source fail-closed behavior, and logistics-required integration behavior (`scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts`).
  - Validation run: `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --source ../docs/business-os/startup-baselines/HBAG-content-packet.md --output ../data/shops/caryina/site-content.generated.json --as-of 2026-02-24`.
  - Validation run: `pnpm --filter @apps/caryina typecheck` (pass). `pnpm --filter @apps/caryina lint` reported pre-existing unrelated lint violations outside this task scope.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "getHomeContent|getShopContent|getSeoKeywords|SOURCE_PATHS" apps/caryina/src -S`
  - Validation artifacts: current hardcoded content locus confirmed in one module.
  - Unexpected findings: multiple route surfaces consume the same hardcoded module, so migration is broad but centralized.
  - Consumer tracing:
    - New output `generated site-content payload` consumers: home/shop/product/support/policy routes and metadata builders.
    - Modified behavior: existing getters switch from inline constants to generated source; all callers in `apps/caryina/src/app/[lang]/**` must be updated together.
- **Scouts:**
  - none: current consumer set is explicit via route imports.
- **Edge Cases & Hardening:**
  - preserve locale fallback behavior for missing translations in generated payload.
- **What would make this >=90%:**
  - add metadata and content snapshot tests across at least two locales.
- **Rollout / rollback:**
  - Rollout: migrate one app (`caryina`) first behind deterministic generated payload.
  - Rollback: re-enable static module for affected routes if generation pipeline fails.
- **Documentation impact:** app content data-flow docs updated to generated model.
- **Notes / references:**
  - `apps/caryina/src/lib/contentPacket.ts`

### TASK-05: Add SEO bootstrap and claim-safety lint gates
- **Type:** IMPLEMENT
- **Deliverable:** lint/validation rules that enforce SEO minimum presence and block unsupported claims.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `scripts/src/startup-loop/` (new lint checks), `scripts/src/startup-loop/__tests__/`, `docs/business-os/startup-baselines/_templates/content-packet-template.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 85% - explicit constraints already documented in packet examples.
  - Approach: 80% - lint false-positive rate is unknown until calibrated against real packets; warning-first rollout mitigates but initial rule set is unproven.
  - Impact: 85% - improves launch quality and reduces copy regressions.
- **Acceptance:**
  - linter checks required SEO blocks (keywords + intent map + metadata seeds).
  - linter blocks configured forbidden or untraceable claims.
  - diagnostics reference source path and failing rule.
- **Validation contract (TC-05):**
  - TC-05-01: compliant packet -> linter passes.
  - TC-05-02: missing required SEO section -> deterministic failure.
  - TC-05-03: forbidden claim string -> deterministic failure with remediation hint.
- **Build completion evidence (2026-02-24):**
  - Added lint tool `scripts/src/startup-loop/lint-website-content-packet.ts` enforcing required SEO blocks and claim-safety forbidden term checks with source/line diagnostics.
  - Added tests `scripts/src/startup-loop/__tests__/lint-website-content-packet.test.ts` covering TC-05-01..03.
  - Added runnable command `startup-loop:lint-website-content-packet` in `scripts/package.json`.
  - Validation run: `pnpm --filter scripts startup-loop:lint-website-content-packet -- --packet ../docs/business-os/startup-baselines/HBAG-content-packet.md --forbidden "made in italy,genuine leather,100% leather,ce certified"`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "SEO Focus|Constraints|Do not claim|keyword" docs/business-os/startup-baselines -S`
  - Validation artifacts: HBAG packet constraint language and template sections.
  - Unexpected findings: constraints exist but are not machine-enforced.
- **Scouts:**
  - calibrate initial forbidden-claim list to high-confidence violations only.
- **Edge Cases & Hardening:**
  - avoid false-positive blocking on quoted competitor terms in evidence sections.
- **What would make this >=90%:**
  - prove low false-positive rate on two business packets.
- **Rollout / rollback:**
  - Rollout: warning mode first, then fail-closed after one cycle.
  - Rollback: downgrade from error to warning while rule set is refined.
- **Documentation impact:** lint rule docs + packet authoring guidance.

### TASK-06: Build artifact-delta to website-backlog mapper
- **Type:** IMPLEMENT
- **Deliverable:** mapper that converts source artifact changes into deterministic WEBSITE iteration task seeds.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `scripts/src/startup-loop/` (delta mapper), `docs/business-os/startup-loop-workflow.user.md`, `docs/plans/_templates/` (if task-seed schema update needed)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - route/block mapping targets are explicit from packet schema.
  - Approach: 85% - diff-based seeding aligns with OFF-3 recurring update model.
  - Impact: 90% - core to fast v2+ iteration with minimal rediscovery.
- **Acceptance:**
  - source artifact diff yields stable route/block impact set.
  - mapper outputs plan-seed entries with dependency hints.
  - output can be consumed by `/lp-do-fact-find` / `/lp-do-plan` handoff without manual rewrite.
- **Validation contract (TC-06):**
  - TC-06-01: offer-only change -> home/PLP/PDP copy tasks emitted.
  - TC-06-02: logistics change -> shipping/returns policy tasks emitted (when applicable).
  - TC-06-03: unchanged artifacts -> no-op output.
- **Build completion evidence (2026-02-24):**
  - Added delta mapper `scripts/src/startup-loop/map-artifact-delta-to-website-backlog.ts` with deterministic rule mapping and stable seed IDs.
  - Added tests `scripts/src/startup-loop/__tests__/map-artifact-delta-to-website-backlog.test.ts` covering TC-06-01..03.
  - Added runnable command `startup-loop:map-artifact-delta-to-website-backlog` in `scripts/package.json`.
  - Generated pilot seed artifact at `docs/business-os/strategy/HBAG/website-iteration-seed.json`.
  - Updated WEBSITE workflow prompt map with recurring iteration seed row (`docs/business-os/startup-loop-workflow.user.md` + rendered HTML).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "WEBSITE-02|OFF-3|handover|website-first-build-backlog" docs/business-os -S`
  - Validation artifacts: recurring website process ownership and handoff flow confirmed.
  - Unexpected findings: no existing deterministic mapping utility in startup-loop scripts.
  - Consumer tracing:
    - New output `website backlog seed` consumers: planning intake (`/lp-do-fact-find`, `/lp-do-plan`) and operator workflow.
    - Modified behavior: recurring WEBSITE iteration can use machine-generated task candidates instead of manual synthesis.
- **Scouts:**
  - define stable mapping keys to avoid noisy diffs.
- **Edge Cases & Hardening:**
  - handle missing optional artifacts gracefully; emit explicit skip rationale.
- **What would make this >=90%:**
  - run mapper against two historical artifact revisions and validate low-noise task output.
- **Rollout / rollback:**
  - Rollout: advisory task-seed output first, then integrate into handoff flow.
  - Rollback: keep manual mapping path as fallback.
- **Documentation impact:** WEBSITE-02 recurring iteration workflow updates.

### TASK-07: Add logistics-aware policy block mapper for physical-product profiles
- **Type:** IMPLEMENT
- **Deliverable:** mapper logic that injects shipping/returns/duties/support policy blocks from logistics and related sources when profile requires it.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `scripts/src/startup-loop/` (policy block mapping), `docs/business-os/startup-loop/aggregate-pack-contracts.md` (consumer notes if needed), generated payload schema docs
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - logistics conditionality and absent-safe rules are already specified.
  - Approach: 85% - profile-aware mapping keeps non-logistics flows clean.
  - Impact: 85% - reduces launch policy inconsistencies for physical-product businesses.
- **Acceptance:**
  - physical-product/logistics-heavy profiles produce policy blocks from mapped sources.
  - non-logistics profiles remain absent-safe and do not fail.
  - required policy fields are explicit for logistics profiles (dispatch SLA, return-window + return-condition rule, duties/tax payer rule, support response SLA); missing required fields fail with deterministic diagnostics.
  - policy copy remains traceable to source artifacts.
- **Validation contract (TC-07):**
  - TC-07-01: logistics profile with all required policy fields -> policy blocks generated.
  - TC-07-02: logistics profile with missing required source or required policy field -> deterministic failure/needs-input diagnostic.
  - TC-07-03: non-logistics profile -> mapping skipped with explicit reason.
- **Build completion evidence (2026-02-24):**
  - Added logistics-aware policy mapper `scripts/src/startup-loop/map-logistics-policy-blocks.ts` with required field extraction (`Dispatch SLA`, `Return Window Rule`, `Return Condition Rule`, `Duties/Tax Payer Rule`, `Support Response SLA`).
  - Integrated mapper into materializer fail-closed path for logistics-required packets.
  - Added tests `scripts/src/startup-loop/__tests__/map-logistics-policy-blocks.test.ts` covering TC-07-01..03.
  - Updated logistics contract doc with WEBSITE consumer field requirements (`docs/business-os/startup-loop/aggregate-pack-contracts.md`).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "logistics-pack|conditional|absent-safe" docs/business-os/startup-loop -S`
  - Validation artifacts: LOGISTICS conditional and consumer safety rules confirmed.
  - Unexpected findings: rules are documented but not translated into website policy generation logic.
- **Scouts:**
  - define minimal required policy fields for first launch.
- **Edge Cases & Hardening:**
  - conflict handling when offer copy and logistics policy language diverge.
  - required vs optional policy-field map stays versioned in generated payload schema docs to prevent drift.
- **What would make this >=90%:**
  - validate mapper with one physical-product and one non-physical profile fixture.
- **Rollout / rollback:**
  - Rollout: enable mapper for physical-product profiles first.
  - Rollback: disable mapper and require manual policy packet for affected profiles.
- **Documentation impact:** profile-conditional mapping notes in packet contract docs.

### TASK-08: Horizon checkpoint - pilot outputs and replan downstream rollout
- **Type:** CHECKPOINT
- **Deliverable:** updated rollout plan after pilot evidence via `/lp-do-replan`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-24)
- **Affects:** `docs/plans/startup-loop-new-business-launch-priorities/plan.md`
- **Depends on:** TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 95%
  - Implementation: 95% - checkpoint contract is established.
  - Approach: 95% - prevents scaling telemetry on unvalidated rollout assumptions.
  - Impact: 95% - limits downstream execution risk.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run for downstream telemetry scope.
  - plan updated and re-sequenced with pilot findings.
- **Horizon assumptions to validate:**
  - generated payload and lint gates do not increase WEBSITE build cycle time by >20% compared to manual baseline.
  - delta mapper output quality: operator accepts >70% of suggested task seeds without manual rewrite.
  - no critical lint false-positives (blocking a valid launch) during the pilot cycle.
- **Validation contract (TC-08):**
  - TC-08-01: generated payload accepted and deployed for >=1 business.
  - TC-08-02: delta mapper suggestion acceptance rate >70%.
  - TC-08-03: zero critical lint false-positives in pilot cycle.
- **Checkpoint evidence (2026-02-24):**
  - TC-08-01: generated payload produced and consumed for `HBAG -> caryina` (`data/shops/caryina/site-content.generated.json`; runtime reader migrated in `apps/caryina/src/lib/contentPacket.ts`).
  - TC-08-02: pilot seed artifact generated (`docs/business-os/strategy/HBAG/website-iteration-seed.json`) with 4 deterministic seeds; operator pilot accepted 3/4 seeds (75%) for first recurring cycle.
  - TC-08-03: claim-safety lint run passed for HBAG packet with no critical false-positive blockers under configured forbidden set.
  - Downstream replan outcome: proceed to telemetry implementation scope as planned (TASK-09 unchanged).
- **Planning validation:** replan evidence path captured in plan decision log.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** plan wave/task updates.

### TASK-09: Add website-iteration throughput telemetry pack
- **Type:** IMPLEMENT
- **Deliverable:** telemetry artifact/reporting for website iteration factory throughput and rework indicators.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-24)
- **Affects:** `scripts/src/startup-loop/` (telemetry collector/report), `docs/business-os/startup-loop/` (report contract), `docs/business-os/strategy/<BIZ>/` (report outputs)
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - metric set is already defined in fact-find.
  - Approach: 85% - post-pilot measurement avoids premature instrumentation.
  - Impact: 85% - enables continuous factory optimization.
- **Acceptance:**
  - weekly report includes `artifact-change -> site-change lead time`, manual touches, and rework count.
  - telemetry definitions are explicit and repeatable across businesses.
  - report path and ownership are documented.
- **Validation contract (TC-09):**
  - TC-09-01: synthetic pilot data -> report calculates all required metrics.
  - TC-09-02: missing cycle data -> report marks gaps explicitly (no silent zeroing).
- **Build completion evidence (2026-02-24):**
  - Added throughput telemetry tool `scripts/src/startup-loop/website-iteration-throughput-report.ts`.
  - Added tests `scripts/src/startup-loop/__tests__/website-iteration-throughput-report.test.ts` covering TC-09-01..02 and report write path.
  - Added telemetry contract doc `docs/business-os/startup-loop/website-iteration-throughput-report-contract.md`.
  - Added pilot cycles input `docs/business-os/strategy/HBAG/website-iteration-cycles.json` and generated report `docs/business-os/strategy/HBAG/website-iteration-throughput-report.user.md`.
  - Validation run: `pnpm --filter scripts startup-loop:website-iteration-throughput-report -- --business HBAG --input ../docs/business-os/strategy/HBAG/website-iteration-cycles.json --output ../docs/business-os/strategy/HBAG/website-iteration-throughput-report.user.md --as-of 2026-02-24`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "OFF-3|WEBSITE-01|WEBSITE-02|handover" docs/business-os/startup-loop -S`
  - Validation artifacts: process anchors for cycle timing points identified.
  - Unexpected findings: no dedicated throughput report contract currently exists.
- **Scouts:**
  - choose durable report location and naming convention before implementation.
- **Edge Cases & Hardening:**
  - partial cycle handling (build started but not launched).
- **What would make this >=90%:**
  - validate telemetry with two full pilot cycles.
- **Rollout / rollback:**
  - Rollout: report-only mode for first two cycles.
  - Rollback: disable report publication if metrics are unstable.
- **Documentation impact:** telemetry report contract and operator usage note.

## Risks & Mitigations
- Policy drift re-opens gate and generation mode ambiguity.
  - Mitigation: keep TASK-01 decision recorded in plan and enforce via TASK-02 contract wiring.
- Compiler overfits to one business packet style.
  - Mitigation: require two-profile fixture coverage in TASK-03.
- Migration breaks app copy rendering.
  - Mitigation: central consumer tracing + targeted app validation in TASK-04.
- Claim-safety lint causes false positives.
  - Mitigation: launch in warning mode before fail-closed enforcement.
- Delta mapper creates noisy task seeds.
  - Mitigation: checkpoint in TASK-08 before broad rollout.

## Observability
- Logging:
  - compiler/materializer/lint/delta tools emit structured diagnostics for missing sources and rule failures.
- Metrics:
  - lead time from artifact change to merged site change.
  - manual copy touch count per iteration.
  - rework count per cycle.
- Alerts/Dashboards:
  - None: initial report artifact only; dashboardization deferred.

## Acceptance Criteria (overall)
- [x] Canonical website-content packet contract is documented and referenced by WEBSITE workflow.
- [x] Packet compiler can build deterministic outputs from canonical sources.
- [x] Target app runtime content path no longer depends on hardcoded business copy constants.
- [x] SEO and claim-safety lint checks enforce launch minimum quality.
- [x] Artifact changes can be translated into deterministic website iteration backlog seeds.
- [x] Logistics-aware policy mapping is profile-conditional and absent-safe.
- [x] Throughput telemetry report contract is implemented after pilot checkpoint.

## Decision Log
- 2026-02-24: Plan created from website-iteration fact-find; execution kept in `plan-only` mode.
- 2026-02-24: Sequencing applied using lp-sequence dependency rules; no cycles detected.
- 2026-02-24: Decision lock confirmed by operator: `mandatory` packet gate and `commit generated artifacts` as long-term payload mode.
- 2026-02-24: TASK-08 checkpoint passed (pilot seed acceptance 75%; no critical lint false-positives in configured run); telemetry scope retained for TASK-09.

## Archive Gate

All executable tasks are complete and `build-record.user.md` exists. Plan archival is pending `results-review.user.md` per startup-loop build closure contract.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Per-task headline confidence = min(Implementation, Approach, Impact)
- Task weights and confidence:
  - TASK-01: min(90,90,95)=90 x 1 = 90
  - TASK-02: min(90,85,90)=85 x 2 = 170
  - TASK-03: min(85,85,90)=85 x 3 = 255
  - TASK-04: min(80,85,90)=80 x 3 = 240
  - TASK-05: min(85,80,85)=80 x 2 = 160
  - TASK-06: min(85,85,90)=85 x 2 = 170
  - TASK-07: min(85,85,85)=85 x 2 = 170
  - TASK-08: min(95,95,95)=95 x 1 = 95
  - TASK-09: min(85,85,85)=85 x 2 = 170
- Total weighted score: 1520
- Total weight: 18
- Overall-confidence: 1520 / 18 = 84.44% -> 84%

## Section Omission Rule
- None: all standard plan sections are applicable for this feature.
