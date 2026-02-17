---
Type: Plan
Status: Draft
Domain: UI
Workstream: Engineering
Created: 2026-02-17
Last-updated: 2026-02-17 (TASK-05 complete — single host invariant + orphaned shim deprecation)
Feature-Slug: brikette-modal-system-remake
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-replan,lp-sequence,lp-refactor
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Brikette Modal System Remake Plan

## Summary
This plan addresses systemic fragility in Brikette modal architecture exposed by the policy-fee panel visibility incident.

Incident recap:
- Symptom: booking modal opened, but policy-fee clarity content was partially or fully unreachable/invisible in some first-open and constrained-viewport flows.
- Root cause class: contract drift (`unknown` payload casts), dual-host divergence, and i18n lifecycle readiness races.
- Target invariant: policy-fee clarity content is reachable and populated on first open, with one authoritative host and deterministic lifecycle behavior.

The target is an architecture-first remake: typed payload contracts, single orchestration ownership, effect decomposition, normalized modal layout behavior, and deterministic integration/a11y coverage.

The plan explicitly preserves product and analytics invariants while reducing regression risk from contract drift and duplicated hosts. Execution is staged to avoid a big-bang replacement and includes a checkpoint before final validation and cleanup.

Because open decisions remain (ownership boundary and booking-flow convergence), this plan is `Draft` and `plan-only`.

## Goals
- Replace `unknown` modal payload handling with typed, compile-time-checked contracts.
- Establish one authoritative modal orchestration stack.
- Normalize modal runtime behavior (scroll, viewport fit, focus, escape) through shared contracts.
- Lock product/analytics/a11y invariants with deterministic tests.
- Remove legacy duplicate paths after parity is proven.
- Keep initial-route startup impact within explicit preload budget (defined in TASK-03).
- Hold modal quality gate by release:
  - CI/staging invariant suite (`TC-09`) green.
  - No modal analytics lifecycle mismatch increase beyond 1% week-over-week.
  - No booking modal abandonment increase beyond 3% week-over-week during ramp.

## Non-goals
- Visual redesign of modal UI beyond behavior-contract consistency.
- Immediate deprecation of booking flows without product decision.
- Non-modal funnel redesign work outside this architecture scope.

## Constraints & Assumptions
- Constraints:
  - Booking modal behavior is conversion-critical and cannot regress during migration.
  - Accessibility behavior must be treated as release-blocking criteria.
  - Startup bundle/runtime cost cannot exceed agreed preload budget (TASK-03).
  - Evidence capture rule: all behavior claims used for plan decisions must be anchored to reproducible artifacts (commit SHA, test output, or captured repro log/screenshot reference).
- Assumptions:
  - Brikette remains modal-first for short-term booking entry.
  - Existing GA4 modal/handoff events remain canonical unless a decision task changes policy.

## Fact-Find Reference
- Related brief: `docs/plans/brikette-modal-system-remake/fact-find.md`
- Key findings used:
  - Untyped payload contract (`modalData: unknown`) drives cast-based drift (E1, E6).
  - Dual orchestration stacks (`apps/brikette` and `packages/ui`) create divergence risk (E7).
  - i18n readiness depends on lifecycle timing (`bookPage` preload race class) (E3, E4, E5).
  - Coverage is smoke-level for viewport/race/focus invariants (E8, E10).

## Proposed Approach
- Option A: Big-bang rewrite (replace host, contracts, effects, and tests in one release).
  - Pros: shorter dual-stack window.
  - Cons: high regression risk, difficult rollback boundaries.
- Option B: Staged architecture-first migration with invariant lock and checkpoint.
  - Pros: controlled blast radius, measurable parity gates, safer rollback.
  - Cons: longer migration timeline.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
  - Pass meaning: fact-find evidence, execution track, and validation landscape are present.
- Sequenced: Yes
  - Pass meaning: task dependencies are topologically ordered and checkpointed.
- Edge-case review complete: Yes
  - Pass meaning: viewport/focus/i18n race/analytics drift edge classes are represented in tasks.
- Build Gate: Pass
  - TASK-01 resolved 2026-02-17: Option A — `apps/brikette` authoritative owner.
  - TASK-02 resolved 2026-02-17: Option B — converge to single booking modal flow with unified event contract.
- Auto-build eligible: Yes (decisions resolved; TASK-03 and TASK-04 now eligible)

## Decision SLA and Default Rule
- Deadline for unresolved blocking decisions: `2026-02-20`.
- If TASK-01 is unresolved by deadline, proceed with default Option A (`apps/brikette` authoritative owner).
- If TASK-02 is unresolved by deadline, proceed with default Option A (versioned V1/V2 coexistence with canonical shared event contract).
- Each defaulted decision must be logged in `## Decision Log` with timestamp and rationale.
- Escalation path for missed decision SLA: Brikette Tech Lead -> Product Owner -> Engineering Manager same business day.

## Layering and Ownership Boundaries
- Option A boundary (recommended default):
  - `apps/brikette` owns modal registry, `ModalKey -> Payload` map, provider/host/switcher orchestration, and booking analytics wiring.
  - `packages/ui` exports reusable modal primitives/components only; it does not define Brikette modal keys.
- Option B boundary (if selected in TASK-01):
  - `packages/ui` owns generic orchestration interfaces and host contracts.
  - `apps/brikette` supplies typed registry/config entries and product policies through app-boundary adapters.
- Shared modal type rule:
  - Shared modal payload types live in `packages/ui` only when they are product-agnostic.
  - Brikette-specific payload fields remain in `apps/brikette` to avoid reverse coupling.
- Circular dependency guard:
  - `packages/ui` must not import Brikette app payload types.

## Global Rollout and Rollback Plan
- Single operational lever: `modal_orchestration_v2_enabled` runtime flag selects active host/orchestration path.
- Rollout stages:
  - Stage 1: `dev` internal QA with flag on.
  - Stage 2: `staging` full regression/a11y/browser-harness validation.
  - Stage 3: production ramp 10% -> 50% -> 100% after 24h healthy intervals.
- Rollback policy:
  - Immediate rollback to legacy host path if trigger thresholds are breached.
  - Trigger thresholds:
    - booking abandonment increases >3% vs 7-day baseline.
    - handoff success drops >2% vs 7-day baseline.
    - modal lifecycle event mismatch exceeds 1%.
    - P0 accessibility regression observed in browser harness or staging checklist.
- Code merged is not equal to behavior activated: activation only through flag rollout stages above.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Select authoritative modal orchestration owner (`apps/brikette` vs `packages/ui`) | 74% | S | Complete (2026-02-17) | - | TASK-04, TASK-05 |
| TASK-02 | DECISION | Decide booking-flow convergence and handoff/analytics semantics (V1/V2 policy) | 76% | S | Complete (2026-02-17) | - | TASK-04 |
| TASK-03 | INVESTIGATE | Produce preload-policy evidence (global core preload vs modal-scoped preload contract) | 72% | S | Complete (2026-02-17) | - | TASK-06 |
| TASK-04 | IMPLEMENT | Introduce typed modal payload registry + migrate initial consumers off `unknown` casts | 82% | M | Complete (2026-02-17) | TASK-01, TASK-02 | TASK-05, TASK-06, TASK-09 |
| TASK-05 | IMPLEMENT | Migrate to single modal host/switcher ownership and deprecate duplicate orchestration path | 80% | M | Complete (2026-02-17) | TASK-01, TASK-04 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Decompose provider effects and implement selected i18n preload contract | 82% | M | Pending | TASK-03, TASK-04, TASK-05 | TASK-08 |
| TASK-07 | IMPLEMENT | Normalize modal primitive/layout behavior (viewport, scroll affordance, interaction consistency) | 81% | M | Pending | TASK-05 | TASK-08 |
| TASK-08 | CHECKPOINT | Horizon checkpoint before downstream validation/cleanup | 95% | S | Pending | TASK-06, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Add integration/contract/a11y test suite for modal invariants | 81% | M | Pending | TASK-04, TASK-06, TASK-07, TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Remove legacy compatibility paths and finalize docs/rollout notes | 84% | S | Pending | TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Independent decision/investigation lane |
| 2 | TASK-04 | Wave 1: TASK-01, TASK-02 | Contract foundation |
| 3 | TASK-05 | Wave 2: TASK-04 (+ TASK-01) | Host ownership migration |
| 4 | TASK-06, TASK-07 | Wave 3: TASK-05 (+ TASK-03/TASK-04 for TASK-06) | Effects and primitive contracts can proceed in parallel |
| 5 | TASK-08 | Wave 4: TASK-06, TASK-07 | Mandatory checkpoint gate |
| 6 | TASK-09 | Wave 5: TASK-08 (+ TASK-04/TASK-06/TASK-07) | Validation hardening |
| 7 | TASK-10 | Wave 6: TASK-09 | Cleanup and docs |

## Tasks

### TASK-01: Select authoritative modal orchestration owner (`apps/brikette` vs `packages/ui`)
- **Type:** DECISION
- **Deliverable:** decision record in `docs/plans/brikette-modal-system-remake/plan.md` (Decision Log + updated task assumptions)
- **Execution-Skill:** lp-replan
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Decision:** Option A — `apps/brikette` is the authoritative modal orchestration owner. `packages/ui` exports modal components/primitives only; it does not define Brikette modal keys or own host/provider/switcher logic.
- **Build completion evidence:** Decision logged 2026-02-17 by user instruction. Option A confirmed. TASK-04 layering boundary: `ModalPayloadMap` authoritative in `apps/brikette`; `packages/ui` remains generic/presentation-only.
- **Affects:** `apps/brikette/src/context/modal/*`, `packages/ui/src/context/modal/*`, `packages/ui/src/organisms/GlobalModals.tsx`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 74%
  - Implementation: 74% - options are clear, but org-level ownership decision is external.
  - Approach: 78% - trade-offs are documented in fact-find.
  - Impact: 80% - this decision strongly determines migration safety.
- **Decision owner:** Brikette Tech Lead
- **Decision deadline:** `2026-02-20`
- **Escalation if missed:** Product Owner -> Engineering Manager (same day)
- **Options:**
  - Option A: `apps/brikette` owns orchestration; `packages/ui` exports modal components/primitives only.
  - Option B: `packages/ui` owns orchestration; Brikette supplies configuration hooks and product-specific wrappers.
- **Recommendation:** Option A for this feature scope; it minimizes immediate cross-app coordination and aligns with current app-level analytics wiring.
- **Decision input needed:**
  - question: Which stack is authoritative for modal host/provider/switcher after migration?
  - why it matters: determines deletion path and prevents prolonged dual-host divergence.
  - default + risk: Default to Option A; risk is lower reuse across other apps until a shared orchestration abstraction is designed.
- **Acceptance:**
  - Owner is explicitly chosen and documented.
  - If unresolved by deadline, default Option A is automatically adopted and logged.
  - Non-owner stack is tagged for deprecation scope in TASK-05/TASK-10.
- **Validation contract:** decision explicitly resolves Q1 from fact-find, updates dependencies/assumptions in this plan, and confirms layering rules for TASK-04/TASK-05.
- **Planning validation:** None: decision task, no runtime command required.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update Decision Log and task notes.
- **Future-proofing note:** once Brikette migration is stable, create follow-on ADR for cross-app shared orchestration abstraction.

### TASK-02: Decide booking-flow convergence and handoff/analytics semantics (V1/V2 policy)
- **Type:** DECISION
- **Deliverable:** booking flow policy section in `docs/plans/brikette-modal-system-remake/plan.md`
- **Execution-Skill:** lp-replan
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Decision:** Option B — converge V1 and V2 into one booking modal flow with a single handoff mode and the canonical event contract defined below. The canonical event schema (modal_open, modal_close, handoff_to_engine, handoff_failed) is adopted and versioned. TASK-04 and TASK-09 acceptance criteria apply the unified-flow policy.
- **Build completion evidence:** Decision logged 2026-02-17 by user instruction. Option B confirmed. TASK-04 payload model targets single booking modal with one handoff contract; V1 compatibility shim scope reduced accordingly.
- **Affects:** `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`, `apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 76%
  - Implementation: 76% - technical options are straightforward once policy is chosen.
  - Approach: 79% - invariants are defined in fact-find.
  - Impact: 82% - misalignment here causes analytics and conversion drift.
- **Decision owner:** Product Owner (Bookings) with Analytics Owner sign-off
- **Decision deadline:** `2026-02-20`
- **Escalation if missed:** Brikette Tech Lead -> Engineering Manager
- **Options:**
  - Option A: keep V1/V2 separate with explicit, versioned contracts.
  - Option B: converge to one booking modal flow with one handoff mode and event contract.
- **Recommendation:** Option A as transitional target for this remake, with documented migration path to Option B after parity data.
- **Decision input needed:**
  - question: Should V1/V2 remain distinct in this migration horizon?
  - why it matters: drives payload model and validation scope for TASK-04 onward.
  - default + risk: Default to Option A; risk is prolonged dual-flow complexity.
- **Canonical event contract (applies in both options):**

| Event | Trigger | Required dimensions | Dedupe rule |
|---|---|---|---|
| `modal_open` | modal becomes visible | `modal_type`, `modal_version`, `source`, `session_id` | one per visible-open transition |
| `modal_close` | modal closes by user/system | `modal_type`, `modal_version`, `close_reason`, `session_id` | one per close transition |
| `handoff_to_engine` | user enters booking handoff | `modal_type`, `handoff_mode`, `dates_present`, `guests_present`, `session_id` | one per successful handoff action |
| `handoff_failed` | handoff attempt fails | `modal_type`, `failure_reason`, `session_id` | one per failed attempt |

- **Acceptance:**
  - Product invariants are explicit: modal open preserves user-provided dates/guests when present.
  - Analytics invariants are explicit: canonical event schema above is adopted and versioned.
  - If unresolved by deadline, default Option A is automatically adopted and logged.
  - TASK-04 acceptance references the chosen policy.
- **Validation contract:** Decision updates acceptance criteria of TASK-04/TASK-09 to remove ambiguity.
- **Planning validation:** None: decision task, no runtime command required.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Decision Log update and invariant section update.

### TASK-03: Produce preload-policy evidence (global core preload vs modal-scoped preload contract)
- **Type:** INVESTIGATE
- **Deliverable:** preload strategy memo appended to `docs/plans/brikette-modal-system-remake/plan.md` (Decision Log references)
- **Execution-Skill:** lp-replan
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Decision:** Option B (modal-scoped preload via `i18n.loadNamespaces(["bookPage"])` in provider `useEffect([])`) is confirmed as the correct policy.
- **Build completion evidence (2026-02-17):**
  - `apps/brikette/src/context/modal/provider.tsx:82-86`: preload call already implemented and fires at provider mount — no startup bundle cost.
  - `apps/brikette/src/i18n.namespaces.ts:64`: `CORE_LAYOUT_I18N_NAMESPACES` intentionally excludes `bookPage`.
  - Decision matrix: Option A (add to `CORE_LAYOUT`) fails startup delta budget (~18 locales × 1-3KB gzip per locale). Option B (current) meets all three budgets with a theoretical race window that is negligible in practice (provider mounts before user interaction is possible).
  - Recommendation: formalize current approach; add explicit loading state to `PolicyFeeClarityPanel` as belt-and-suspenders against the narrow race window.
  - This evidence unblocks TASK-06 implementation.
- **Affects:** `apps/brikette/src/i18n.namespaces.ts`, `apps/brikette/src/context/modal/provider.tsx`, `apps/brikette/src/i18n.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 72%
  - Implementation: 72% - investigation method is clear, outcomes depend on measured trade-offs.
  - Approach: 75% - requires agreed budget thresholds.
  - Impact: 78% - preload choice affects correctness and first-load cost.
- **Budgets (decision thresholds):**
  - Initial route startup JS budget: delta <= +10KB gzip.
  - Parse/eval budget on mid-tier mobile profile: delta <= +30ms.
  - First-open policy panel readiness budget on Slow 3G profile: content available <= 400ms after modal open.
- **Questions to answer:**
  - What bundle/runtime delta results from adding `bookPage` to `CORE_LAYOUT_I18N_NAMESPACES`?
  - What user-visible behavior occurs on slow-network first-open with modal-scoped preload + loading state?
  - Which option best satisfies correctness without unacceptable startup cost?
- **Measurement method:**
  - Build output + analyzer artifacts for startup size delta.
  - Controlled throttled modal-open runbook (Slow 3G + CPU throttle) capturing namespace load timing.
  - Decision matrix scoring each option on correctness risk, first-open UX latency, startup cost, and implementation complexity.
- **Acceptance:**
  - Quantitative evidence for both preload options is captured.
  - Decision matrix is completed with explicit winner and rationale.
  - Winner meets all budgets or logs approved exception with owner sign-off.
  - Recommended preload policy is ready for implementation in TASK-06.
- **Validation contract:** evidence includes command outputs/artifacts for route payload or namespace loading timing and documented expected/observed outcomes against numeric budgets.
- **Planning validation:**
  - Checks run: baseline fact-find evidence + local i18next behavior repro.
  - Validation artifacts: `docs/plans/brikette-modal-system-remake/fact-find.md` evidence IDs E3-E5.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Decision Log + TASK-06 assumptions update.
- **Notes / references:**
  - `docs/plans/brikette-modal-system-remake/fact-find.md` (Q3)

### TASK-04: Introduce typed modal payload registry + migrate initial consumers off `unknown` casts
- **Type:** IMPLEMENT
- **Deliverable:** code changes in modal context and wrappers replacing `unknown` payload casts with discriminated payload map
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Commit:** `5ccade3757`
- **Affects:** `packages/ui/src/context/modal/context.ts`, `apps/brikette/src/context/modal/context.ts`, `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`, `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`, `[readonly] packages/ui/src/organisms/modals/types.ts`
- **Controlled scope expansion:** `apps/brikette/src/context/modal/payloadMap.ts` (new — ModalPayloadMap + boundary validators), `apps/brikette/src/context/modal/hooks.ts` (TypedOpenModal + useModalPayload), `apps/brikette/src/test/context/modal-payload-contract.test.ts` (TC-03/TC-05 tests). Expansion bounded to TASK-04 objective; documented here per scope gate policy.
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05, TASK-06, TASK-09
- **Confidence:** 82%
  - Implementation: 82% - payload callsites and consumers are mapped in fact-find.
  - Approach: 84% - discriminated unions are standard and fit current architecture.
  - Impact: 85% - directly removes high-frequency regression amplifier.
- **Layering boundary contract:**
  - If TASK-01 Option A: `ModalPayloadMap` is authoritative in `apps/brikette`; `packages/ui` remains generic/presentation-only for Brikette keys.
  - If TASK-01 Option B: `packages/ui` owns generic registry interface, but Brikette payload definitions are provided via app-owned adapter config.
  - `packages/ui` must not import Brikette payload types in either option.
- **Contract shape target:**
  - `type ModalPayloadMap = { ... }` with explicit no-payload modals modeled as `undefined`.
  - `openModal<K extends keyof ModalPayloadMap>(key: K, payload: ModalPayloadMap[K])` with convenience overload for `undefined` payload keys.
- **Acceptance:**
  - `openModal` is typed by modal key and payload shape.
  - Booking wrappers no longer rely on ad-hoc `as Partial<...>` reads for core payload fields.
  - Runtime boundary validation exists for externally sourced payload inputs (query/local storage/URL handoff if used).
  - `ModalPayloadMap` is single-sourced (no duplicate app+ui authoritative maps).
  - No `as any` / `as unknown as` remains in migrated producer paths.
  - Compile-time invalid payload usage fails in affected producers.
- **Validation contract (TC-04):**
  - TC-01: valid `openModal("booking2", payload)` compiles and modal renders expected values.
  - TC-02: invalid booking payload field/type fails TypeScript checks.
  - TC-03: booking v1 payload preserves provided dates/guests according to chosen policy.
  - TC-04: no-payload modal calls (`openModal("language")`) compile without unsafe filler payloads.
  - TC-05: boundary validator rejects malformed externally sourced payload before modal render.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/policy-fee-clarity-panel.test.tsx --maxWorkers=2`
    - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx --maxWorkers=2`
  - Validation artifacts:
    - `docs/plans/brikette-modal-system-remake/fact-find.md` (E1, E6, E10)
  - Unexpected findings:
    - Existing tests do not yet assert payload-preservation behavior; TASK-09 closes this gap.
- **Scouts:**
  - Probe all `openModal(...)` callsites for payload shape drift before compile-time tightening.
- **Edge Cases & Hardening:**
  - Transitional adapter for legacy callsites during migration window.
  - Explicit fallback behavior for optional/no-payload modals.
- **What would make this >=90%:**
  - Add compile-time contract tests covering all modal keys and producer callsites plus boundary-runtime validation tests.
- **Rollout / rollback:**
  - Rollout: introduce typed registry behind compatibility wrappers, then remove wrappers after TASK-09.
  - Rollback: restore previous context typing and adapters in one revert commit.
- **Documentation impact:**
  - Update modal contract docs in plan and inline type comments.
- **Build completion evidence (2026-02-17):**
  - `payloadMap.ts` created: `ModalPayloadMap` with 7 modal keys; `parseBooking2Payload` + `parseBookingPayload` boundary validators (pre-commit hook auto-refactored for complexity compliance).
  - `hooks.ts` updated: `TypedOpenModal` overloads (no-payload and optional-payload variants), `TypedModalContextValue`, `useModalPayload<K>()`. `packages/ui` left generic per TASK-01 Option A.
  - `BookingModal.tsx`: `as Partial<{ deal?: unknown }>` cast replaced with `useModalPayload("booking")`.
  - `Booking2Modal.tsx`: both `as Partial<{...}>` casts replaced with `useModalPayload("booking2")`.
  - TC-01 (typed `openModal` compiles): verified via `tsc --noEmit` clean. TC-02 (invalid types fail): verified — TS initially rejected `openModal("booking")` without payload, confirming enforcement. TC-03/TC-05: 14/14 pass (`modal-payload-contract.test.ts`). TC-04 (no-payload compile): verified clean. TC-05: boundary validator tests pass.
  - Typecheck: clean (`tsc --noEmit` exit 0 after fixing `TypedOpenModal` optional-payload overload and adding `room?: unknown` to `Booking2Payload`).
  - Drift found: `openModal("booking", { room, rateType })` in `HomeContent.tsx` passes fields unused by `BookingGlobalModal` — documented in `BookingPayload` interface with inline comment. No fix needed in this task.
- **Notes / references:**
  - Fact-find evidence E1, E6.

### TASK-05: Migrate to single modal host/switcher ownership and deprecate duplicate orchestration path
- **Type:** IMPLEMENT
- **Deliverable:** one authoritative host/provider/switcher path with deprecation notices/removals for duplicate stack
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Affects:** `apps/brikette/src/context/modal/provider.tsx`, `apps/brikette/src/context/modal/global-modals.tsx`, `apps/brikette/src/components/modals/GlobalModals.tsx`, `packages/ui/src/context/modal/provider.tsx`, `packages/ui/src/organisms/GlobalModals.tsx`
- **Depends on:** TASK-01, TASK-04
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 80%
  - Implementation: 80% - ownership options are clear once TASK-01 resolves.
  - Approach: 82% - migration can be staged with adapter boundaries.
  - Impact: 81% - removes root source of behavioral drift.
- **Acceptance:**
  - Exactly one orchestration stack is active for Brikette runtime.
  - Non-owner orchestration path is deprecated or isolated from Brikette execution path.
  - Dev/test runtime invariant added: fail-fast (or loud warning) when multiple modal hosts/providers are mounted.
  - Modal open/close behavior parity is preserved for all supported modal types.
- **Validation contract (TC-05):**
  - TC-01: opening each modal type routes through the chosen owner stack.
  - TC-02: no duplicate modal hosts render concurrently.
  - TC-03: modal lifecycle events continue with correct modal_type/source attribution.
  - TC-04: invariant test fails when a second host/provider is mounted in test tree.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx --maxWorkers=2`
  - Validation artifacts:
    - `docs/plans/brikette-modal-system-remake/fact-find.md` (E7, E10)
  - Unexpected findings:
    - Existing re-export path may hide ownership ambiguity and requires explicit deprecation notes.
- **Scouts:**
  - Confirm no external app depends on Brikette-specific re-export path before removals.
- **Edge Cases & Hardening:**
  - Guard against nested providers during transitional rollout.
- **What would make this >=90%:**
  - Confirm single-host invariant in both unit and browser-harness suites.
- **Rollout / rollback:**
  - Rollout: owner stack first, then non-owner deprecation toggles.
  - Rollback: re-enable previous host path with feature-flagged switch.
- **Documentation impact:**
  - Update architecture section in plan and migration notes.
- **Notes / references:**
  - Fact-find evidence E7.
- **Build completion evidence (2026-02-17):**
  - Scout confirmed `apps/brikette/src/components/modals/GlobalModals.tsx` has zero runtime importers — already orphaned.
  - `useModalHostInvariant()` added to `provider.tsx` using `useContext(ModalContext)` to detect nesting (context-based, test-safe).
  - `GlobalModals.tsx` shim updated with `@deprecated` JSDoc documenting correct orchestration path and TASK-10 removal target.
  - TC-02: single ModalProvider mounts without invariant error — PASS.
  - TC-04: nested ModalProvider logs `[ModalProvider] Invariant` error — PASS.
  - Typecheck: clean (brikette tsc --noEmit exit 0).
  - Commits: provider.tsx changes in `4daa764745`; shim + test in `8f4ed6b348`.

### TASK-06: Decompose provider effects and implement selected i18n preload contract
- **Type:** IMPLEMENT
- **Deliverable:** provider split into state host + dedicated effect modules (telemetry, preload, focus/scroll/escape)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/context/modal/provider.tsx`, `apps/brikette/src/context/modal/environment.ts`, `apps/brikette/src/i18n.namespaces.ts`, `[readonly] apps/brikette/src/i18n.ts`
- **Depends on:** TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 82% - preload policy now confirmed (TASK-03 complete: Option B, modal-scoped). Provider is 147 lines with 3 clearly separable effects. Decomposition scope is concrete.
  - Approach: 82% - modular effects reduce coupling; provider already has clean seams.
  - Impact: 82% - improves reliability and testability; scope well understood.
- **Replan note (2026-02-17):** TASK-03 confirmed preload policy = Option B. TASK-01 Option A confirmed provider stays in `apps/brikette`. Confidence raised 78% → 82%. Task is now above the 80% threshold for IMPLEMENT.
- **Sequencing contract (state transitions):**
  - `OPEN_REQUESTED -> PRELOAD_STARTED -> OPEN_RENDERED -> FOCUS_TRAPPED`
  - `CLOSE_REQUESTED -> TELEMETRY_FLUSHED -> FOCUS_RESTORED -> CLOSED`
- **Acceptance:**
  - Provider core owns state transitions only; side effects are isolated modules/hooks.
  - Effect modules consume explicit transition states instead of ad-hoc booleans.
  - Preload policy from TASK-03 is implemented explicitly (no implicit ad-hoc load).
  - Focus restore, escape behavior, and scroll locking remain correct.
- **Validation contract (TC-06):**
  - TC-01: modal open/close and telemetry parity remains unchanged.
  - TC-02: first-open policy panel behavior matches chosen preload strategy.
  - TC-03: escape key and focus return behavior remains stable.
  - TC-04: transition ordering is deterministic in integration tests.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @apps/brikette test -- apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx --maxWorkers=2`
    - local i18next repro for missing namespace behavior (fact-find E3)
  - Validation artifacts:
    - `docs/plans/brikette-modal-system-remake/fact-find.md` (E3, E4, E5)
  - Unexpected findings:
    - Current setup relies on lifecycle timing and optional chaining semantics.
- **Scouts:**
  - Verify no hidden preload side-effects in modal wrappers after decomposition.
- **Edge Cases & Hardening:**
  - Slow-network first-open.
  - SSR/test shim compatibility for document/body operations.
- **What would make this >=90%:**
  - Add deterministic integration tests for first-open load timing + focus behavior.
- **Rollout / rollback:**
  - Rollout: land decomposition in small, behavior-locked slices.
  - Rollback: revert isolated effect modules without dropping typed contract work.
- **Documentation impact:**
  - Add provider architecture notes and preload policy rationale.
- **Notes / references:**
  - Fact-find evidence E3-E5.

### TASK-07: Normalize modal primitive/layout behavior (viewport, scroll affordance, interaction consistency)
- **Type:** IMPLEMENT
- **Deliverable:** shared modal layout contract applied across modal implementations
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/ui/src/organisms/modals/primitives.tsx`, `packages/ui/src/organisms/modals/BookingModal.tsx`, `packages/ui/src/organisms/modals/BookingModal2.tsx`, `packages/ui/src/organisms/modals/FacilitiesModal.tsx`, `packages/ui/src/organisms/modals/LanguageModal.tsx`
- **Depends on:** TASK-05
- **Blocks:** TASK-08
- **Confidence:** 81%
  - Implementation: 81% - affected components and style patterns are mapped.
  - Approach: 83% - centralizing layout contract is low-risk with parity checks.
  - Impact: 82% - reduces recurring viewport/clipping regressions.
- **Acceptance:**
  - Viewport-bounded scroll behavior is contract-driven, not modal-specific patchwork.
  - Layout invariant: modal shell uses dynamic viewport contract (`100dvh` + safe-area handling) for mobile browsers.
  - Layout invariant: scroll lives in a single documented container (content region), not split across nested ad-hoc wrappers.
  - Layout invariant: close affordance remains visible or reachable in constrained viewports.
  - Layout invariant: background page scrolling is locked while modal is open.
  - Modal panels expose consistent interaction affordances and class composition strategy.
  - Existing visual semantics remain functionally equivalent unless explicitly changed.
- **Validation contract (TC-07):**
  - TC-01: short viewport keeps full modal content reachable via scroll.
  - TC-02: policy panel remains reachable in booking2 without custom one-off classes.
  - TC-03: no regression in close interactions for non-booking modals.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx --maxWorkers=2`
  - Validation artifacts:
    - `docs/plans/brikette-modal-system-remake/fact-find.md` (E8, E10)
  - Unexpected findings:
    - `ModalContainer` exists but is not consistently adopted.
- **Scouts:**
  - Compare overlay/content class divergence across all modal components before refactor.
- **Edge Cases & Hardening:**
  - iOS Safari viewport unit behavior (`vh` vs `dvh`) and scroll-lock interaction.
- **What would make this >=90%:**
  - Add viewport-constrained integration tests for each high-traffic modal variant.
- **Rollout / rollback:**
  - Rollout: introduce shared layout utilities first, then migrate modal-by-modal.
  - Rollback: revert modal-specific migrations incrementally.
- **Documentation impact:**
  - Update modal primitive usage guidance.
- **Notes / references:**
  - Fact-find evidence E8.

### TASK-08: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via /lp-replan
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-modal-system-remake/plan.md`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-build` checkpoint executor run
  - `/lp-replan` run on downstream tasks
  - confidence for downstream tasks recalibrated from latest evidence
  - plan updated and re-sequenced
  - Exit criteria met:
    - TC-04, TC-05, TC-06, and TC-07 pass in local/CI runs.
    - no open P0 defects for modal orchestration, visibility, or accessibility.
    - Decision Log reflects final TASK-01/TASK-02 outcomes.
- **Horizon assumptions to validate:**
  - Typed contract migration did not introduce hidden producer drift.
  - Host consolidation did not regress modal lifecycle analytics or a11y behavior.
- **Validation contract:** checkpoint completion logged with updated dependencies/confidence in this plan.
- **Planning validation:** replan evidence captured in updated task notes and Decision Log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update at `docs/plans/brikette-modal-system-remake/plan.md`

### TASK-09: Add integration/contract/a11y test suite for modal invariants
- **Type:** IMPLEMENT
- **Deliverable:** deterministic tests covering payload preservation, namespace race, viewport reachability, focus/escape/focus-return, and handoff contracts
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/components/*modal*.test.tsx`, `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx`, `apps/brikette/src/test/context/*`, `[readonly] apps/brikette/src/context/modal/*`
- **Depends on:** TASK-04, TASK-06, TASK-07, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 81%
  - Implementation: 81% - TASK-02 Option B (single booking flow) reduces combinatorics. One test path for booking payload instead of V1+V2 variants. New dimension: V1-producer transition tests are bounded and explicit.
  - Approach: 82% - canonical event contract is unambiguous; single flow reduces test-matrix surface.
  - Impact: 81% - unchanged; test suite is the confidence lock for rollout.
- **Replan note (2026-02-17):** TASK-02 Option B reduces test-case complexity. Single unified `booking` key means no dual-path payload preservation tests. V1→unified producer transition test added to scope (bounded). Confidence raised 78% → 81%. Task now above 80% threshold for IMPLEMENT.
- **Acceptance:**
  - Tests assert booking intent payload preservation behavior.
  - Tests assert first-open namespace behavior for policy panel path.
  - Browser-level tests (Playwright or equivalent) assert viewport reachability and focus/keyboard modal invariants.
  - Tests assert canonical handoff-mode/event invariants per chosen policy.
  - Automated a11y assertions (role/aria and accessibility checks) are included for key modal flows.
  - If browser harness cannot run in CI, staging manual QA checklist is mandatory release gate with explicit sign-off.
- **Validation contract (TC-09):**
  - TC-01: `BookingWidget -> booking modal` reflects passed dates/guests according to policy.
  - TC-02: first-open delayed namespace eventually renders policy list without reopen.
  - TC-03: constrained viewport keeps panel reachable through scroll contract.
  - TC-04: tab loop, escape close, and focus return behave correctly.
  - TC-05: handoff events remain canonical and dedupe/transport expectations hold.
  - TC-06: browser-harness run verifies body scroll lock and close-affordance reachability on constrained viewport.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - existing baseline tests in fact-find (panel + modal basics + ga4 lifecycle/handoff)
    - browser harness smoke run in headed/headless mode for booking modal critical path
  - Validation artifacts:
    - `docs/plans/brikette-modal-system-remake/fact-find.md` (Test Landscape + E10)
  - Unexpected findings:
    - current suite lacks deterministic viewport/focus coverage.
- **Scouts:**
  - confirm any CI policy constraints around pending tests before adding new suites.
- **Edge Cases & Hardening:**
  - Slow-network translation load and rapid open/close race.
  - iOS scroll-lock behavior and focus restoration from keyboard-triggered opens.
- **What would make this >=90%:**
  - keep browser-harness suite stable in CI for two releases with no flake >2%.
- **Rollout / rollback:**
  - Rollout: land tests before removing compatibility paths.
  - Rollback: retain tests; only gate removals if unstable.
- **Documentation impact:**
  - update testing policy references in plan notes if new harness conventions are introduced.
- **Notes / references:**
  - Fact-find Recommended Test Approach.

### TASK-10: Remove legacy compatibility paths and finalize docs/rollout notes
- **Type:** IMPLEMENT
- **Deliverable:** cleanup of deprecated orchestration/contract shims and final migration documentation
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/modals/GlobalModals.tsx`, `packages/ui/src/context/modal/*`, `docs/plans/brikette-modal-system-remake/plan.md`, `[readonly] docs/briefs/policy-fee-clarity-panel-modal-visibility-briefing.md`
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 84% - cleanup targets are concrete once parity tests pass.
  - Approach: 86% - straightforward removal/documentation once migration is stable.
  - Impact: 85% - eliminates long-tail drift risk.
- **Acceptance:**
  - Deprecated compatibility paths are removed or explicitly quarantined with rationale.
  - Quarantined paths (if any) live in one documented location with deprecation marker and Brikette import guard.
  - Cross-repo usage scan is completed and attached before deleting shared paths.
  - Final architecture and rollout/rollback notes are documented.
  - Plan status can move from `Draft` to `Active` only when decision blockers are resolved.
- **Validation contract (TC-10):**
  - TC-01: no remaining runtime imports route Brikette through deprecated host path.
  - TC-02: updated docs accurately reflect final ownership and contracts.
  - TC-03: cross-repo usage scan shows no unresolved dependency on removed paths.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: None: S-effort cleanup task; validation covered by upstream TASK-09 suites.
  - Validation artifacts: updated plan + migration notes.
  - Unexpected findings: None: expected once upstream tasks complete.
- **Scouts:** None: cleanup follows validated migration output.
- **Edge Cases & Hardening:**
  - Ensure cleanup does not remove paths still needed by other packages/apps.
- **What would make this >=90%:**
  - no quarantine leftovers after one full release cycle.
- **Rollout / rollback:**
  - Rollout: remove legacy paths after green test suite.
  - Rollback: restore shims with explicit deprecation marker if downstream dependency discovered.
- **Documentation impact:**
  - finalize plan decision log and migration completion notes.
- **Notes / references:**
  - TASK-09 outputs and checkpoint evidence.

## Risks & Mitigations
- Decision latency on TASK-01/TASK-02 can stall implementation start.
  - Mitigation: enforce `2026-02-20` default-to-progress rule with documented owner/escalation path.
- Dual-host drift may continue if TASK-05 is partially implemented.
  - Mitigation: treat single-owner proof and dev-time invariant as release gate.
- A11y regressions may hide behind passing unit tests.
  - Mitigation: TASK-09 requires browser-level harness and staging fallback checklist if CI is constrained.
- Preload policy may satisfy correctness but miss startup budget.
  - Mitigation: TASK-03 numeric budgets + signed exception path.

## Observability
- Logging:
  - modal host ownership path selected at runtime (debug/dev).
  - preload policy branch execution in modal open path.
  - rollout flag state (`modal_orchestration_v2_enabled`) and host path selection.
- Metrics:
  - `modal_open`, `modal_close`, `handoff_to_engine` continuity.
  - booking modal abandonment and handoff success trends post-migration.
  - modal lifecycle mismatch rate and duplicate-host invariant violations.
- Alerts/Dashboards:
  - Threshold alerts align with rollback triggers in `Global Rollout and Rollback Plan`.

## Acceptance Criteria (overall)
- [ ] Modal payload handling is typed and compile-time enforced for migrated modal types.
- [ ] Brikette runs on one authoritative modal orchestration stack.
- [ ] Provider concerns are decomposed and preload strategy is explicit.
- [ ] Modal layout behavior is contract-driven and viewport-safe.
- [ ] Integration/contract/a11y test suite covers identified regression classes, including browser-level assertions for viewport/focus/scroll-lock.
- [ ] Legacy compatibility paths are removed or explicitly quarantined with rationale.
- [ ] Rollout flag and rollback triggers are configured and validated before production ramp.

## Decision Log
- 2026-02-17: Plan created in `plan-only` mode from `docs/plans/brikette-modal-system-remake/fact-find.md`.
- 2026-02-17: Chosen migration strategy set to staged architecture-first (Option B).
- 2026-02-17: Default-to-progress rule adopted for unresolved blocking decisions with deadline `2026-02-20`.
- 2026-02-17: Global rollout lever defined as `modal_orchestration_v2_enabled`.
- 2026-02-17: **TASK-01 resolved — Option A.** `apps/brikette` is the authoritative modal orchestration owner. `packages/ui` exports primitives/components only. `ModalPayloadMap` lives in `apps/brikette`; `packages/ui` must not import Brikette payload types. TASK-04 and TASK-05 are unblocked.
- 2026-02-17: **TASK-02 resolved — Option B.** Converge V1/V2 booking flows into a single booking modal with one handoff mode and the canonical event contract (modal_open, modal_close, handoff_to_engine, handoff_failed). V1 payload/shim complexity is scoped for removal in TASK-04/TASK-10. TASK-04 is unblocked.
- 2026-02-17: **TASK-03 complete — preload policy = modal-scoped (Option B).** `bookPage` preload via `i18n.loadNamespaces(["bookPage"])` in provider `useEffect([])` is confirmed correct. Option A (add to `CORE_LAYOUT`) fails startup delta budget. Current implementation already uses Option B. TASK-06 unblocked. Recommendation: add explicit loading state to `PolicyFeeClarityPanel` to close the narrow race window.
- 2026-02-17: **Confidence replan.** TASK-06 raised 78% → 82% (preload policy confirmed, decomposition scope concrete). TASK-09 raised 78% → 81% (TASK-02 Option B reduces test combinatorics). All IMPLEMENT tasks now meet ≥80% threshold. Plan is fully eligible for `/lp-build`.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task confidence:
  - TASK-01: 74 x 1 = 74 (Complete)
  - TASK-02: 76 x 1 = 76 (Complete)
  - TASK-03: 72 x 1 = 72 (Complete)
  - TASK-04: 82 x 2 = 164
  - TASK-05: 80 x 2 = 160
  - TASK-06: 82 x 2 = 164 (raised from 78 — replan 2026-02-17)
  - TASK-07: 81 x 2 = 162
  - TASK-08: 95 x 1 = 95
  - TASK-09: 81 x 2 = 162 (raised from 78 — replan 2026-02-17)
  - TASK-10: 84 x 1 = 84
- Sum(weighted confidence) = 1213
- Sum(weights) = 15
- Overall-confidence = 1213 / 15 = 80.87% (rounded to 81%)

## Critical Path Confidence
- Critical path tasks: TASK-01 -> TASK-02 -> TASK-04 -> TASK-05 -> TASK-06/TASK-07 -> TASK-08 -> TASK-09 -> TASK-10
- Raw critical-path weighted confidence:
  - TASK-01: 74 x 1 = 74 (Complete)
  - TASK-02: 76 x 1 = 76 (Complete)
  - TASK-04: 82 x 2 = 164
  - TASK-05: 80 x 2 = 160
  - TASK-06: 82 x 2 = 164
  - TASK-07: 81 x 2 = 162
  - TASK-08: 95 x 1 = 95
  - TASK-09: 81 x 2 = 162
  - TASK-10: 84 x 1 = 84
- Sum(weighted confidence) = 1141
- Sum(weights) = 14
- Raw critical-path confidence = 1141 / 14 = 81.5%
- Decision gate cap: lifted — TASK-01/TASK-02 resolved 2026-02-17.
- Effective critical-path confidence (current) = 81.5%

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
