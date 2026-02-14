---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-ga4-baseline-lock
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-weekly-kpcs-memo
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence
Related-Plan: docs/plans/brik-ga4-baseline-lock/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID:
---

# BRIK GA4 Event Verification + 7-Day Baseline Lock Fact-Find

## Scope
### Summary
BRIK has completed S2/S3/S4/S5/S6 artifacts, but the top-ranked P1 execution item remains open: verify `web_vitals` and `begin_checkout` at event level in GA4, then lock the first measured 7-day KPI baseline in canonical strategy docs. This fact-find defines the execution path and evidence contract for that closure.

### Goals
- Close the S2A measurement verification gap for `web_vitals` and `begin_checkout`.
- Lock a first 7-day measured KPI baseline into `docs/business-os/strategy/BRIK/plan.user.md`.
- Update loop control docs so S5 routing is tracked as active execution, not generic pending intent.

### Non-goals
- Rebuilding GA4 instrumentation architecture (already covered in `brik-ga4-world-class`).
- Designing new growth experiments.
- Completing day-14 recalibration in this packet.

### Constraints & Assumptions
- Constraints:
  - Existing gate language currently names GA4 DebugView/Realtime verification as mandatory evidence.
  - This work must preserve the canonical strategy plan format and workflow status tables.
  - Baseline metrics must be explicitly date-bounded and source-labeled.
- Assumptions:
  - Existing code instrumentation for both target events is already live and tested.
  - GA4 property-level UI access remains available to the operator.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop-workflow.user.md` - active workflow and open tasks.
- `docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md` - P1 ranking source.
- `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` - current verification state.
- `docs/business-os/strategy/BRIK/plan.user.md` - canonical outcome contract + metrics section.

### Key Modules / Files
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - Emits `begin_checkout` via `fireCheckoutGA4` before network confirm-link resolution.
- `apps/brikette/src/performance/reportWebVitals.ts`
  - Emits `web_vitals` GA4 event in prod when `gtag` and measurement ID are present.
- `apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx`
  - Verifies enriched `begin_checkout` payload for room booking flow.
- `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`
  - Verifies enriched `begin_checkout` payload for apartment booking flow.

### Patterns & Conventions Observed
- Event instrumentation is fail-soft (`gtag` guarded) and non-blocking for user flows.
- Existing measurement docs are date-stamped and command-evidence-based.
- Startup-loop workflow doc tracks stage-level missing items via explicit evidence path rows.

### Data & Contracts
- Event contracts:
  - `begin_checkout` carries `currency`, `value`, and `items[]` payloads in booking flows.
  - `web_vitals` carries metric-specific telemetry fields (`name`, `metric_id`, `metric_value`, etc.).
- Strategy contract:
  - Canonical KPI baseline must live in `docs/business-os/strategy/BRIK/plan.user.md` and feed weekly K/P/C/S decisions.

### Dependency & Impact Map
- Upstream dependencies:
  - GA4 property access (UI) for DebugView/Realtime verification.
  - Existing production traffic hitting instrumented pages.
- Downstream dependents:
  - S10 weekly decision quality.
  - S3 day-14 forecast recalibration quality.
  - S5 P1/P2 sequencing confidence.
- Likely blast radius:
  - Documentation and decisioning quality only (no required product runtime changes in this phase).

### Delivery & Channel Landscape
- Audience/recipient:
  - Internal operator (Pete) and startup-loop execution agents.
- Channel constraints:
  - Verification evidence requires GA4 UI and/or Data API access.
- Existing templates/assets:
  - Measurement verification note structure already established in `2026-02-13-measurement-verification.user.md`.
- Approvals/owners:
  - Owner and reviewer: Pete (BRIK).
- Compliance constraints:
  - Keep measurement claims evidence-backed; do not mark verified without source trace.
- Measurement hooks:
  - GA4 DebugView/Realtime event visibility.
  - (Optional) GA4 Data API query for 7-day event counts when enabled.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | `begin_checkout` and `web_vitals` are already emitted in production with valid payloads. | Existing instrumentation + live traffic | Low | <1 day |
| H2 | First 7-day KPI baseline can be locked without schema ambiguity once event-level evidence is captured. | Verified event visibility + plan update | Low | <1 day |
| H3 | Current blocker is access/verification path, not missing code. | GA4 UI/Data access posture | Low-Medium | <1 day |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Instrumentation code and targeted tests pass for `begin_checkout`; `web_vitals` emitter exists in prod-gated path | Code + tests | High |
| H2 | Plan doc already has canonical metric section, currently marked unmeasured | Strategy doc | Medium |
| H3 | Data API probe failed with `SERVICE_DISABLED` for `analyticsdata.googleapis.com` | Command output (2026-02-13) | High |

#### Falsifiability Assessment
- Easy to test:
  - `begin_checkout` payload correctness (already covered by targeted tests).
  - Presence of `web_vitals` emission path in code.
- Harder to test in-agent:
  - Live GA4 UI verification without operator session access.

#### Recommended Validation Approach
- Quick probes:
  - Run targeted booking GA4 tests (done).
  - Record GA4 Data API access state (done; currently blocked by service disabled).
- Structured checks:
  - Operator performs DebugView/Realtime checks and records timestamps + event evidence.
- Deferred:
  - Add dedicated automated test for `reportWebVitals` emitter path.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + React Testing Library (`apps/brikette`).
- Commands executed:
  - `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx --maxWorkers=2`
  - `pnpm --filter brikette test -- apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx --maxWorkers=2`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Hostel booking `begin_checkout` payload | component/unit | `apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx` | Pass (1/1) |
| Apartment booking `begin_checkout` payload | component/unit | `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx` | Pass (2/2) |
| `web_vitals` emitter path | none currently | - | Gap: no dedicated tests |

#### Coverage Gaps (Planning Inputs)
- `reportWebVitals.ts` has no direct test coverage.
- GA4 UI-level verification evidence is still pending.
- 7-day measured KPI table is not yet persisted in canonical plan.

#### Testability Assessment
- Easy to test:
  - `begin_checkout` payload behavior.
- Hard to test:
  - GA4 UI verification in non-interactive agent runs.
- Test seams needed:
  - Dedicated test harness for `reportWebVitals.ts` with mocked `window.gtag` and prod env gates.

#### Recommended Test Approach
- Keep targeted GA4 booking tests as regression contract.
- Add `reportWebVitals` unit tests in a follow-on task.

### Recent Git History (Targeted)
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` was recently adjusted to fire `begin_checkout` before confirm-link network outcome.
- `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` was recently added and currently tracks open GA4 UI checks.

## External Research (If needed)
- No external web sources required for this fact-find.

## Questions
### Resolved
- Q: Is `begin_checkout` instrumentation present and tested in both room and apartment booking surfaces?
  - A: Yes; targeted tests pass and code paths are active.
  - Evidence: `apps/brikette/src/test/components/ga4-08-book-checkout-payload.test.tsx`, `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`.

- Q: Is GA4 Data API currently usable for autonomous 7-day metric extraction?
  - A: No; API call returned `SERVICE_DISABLED` for `analyticsdata.googleapis.com` on 2026-02-13.
  - Evidence: command output in this session (runReport 403).

### Open (User Input Needed)
- None required to write plan tasks; operator execution steps are explicit in the plan.

## Confidence Inputs (for /lp-plan)
- **Implementation:** 84%
  - Event instrumentation and document integration path are concrete; external verification step is clear.
- **Approach:** 86%
  - Closing measurement truth before recalibration is the right long-term loop behavior.
- **Impact:** 82%
  - Affected surfaces and downstream decision dependencies are mapped.
- **Delivery-Readiness:** 76%
  - GA4 UI/Data API access path is partially blocked (`analyticsdata.googleapis.com` disabled), so enablement work is still required.
- **Testability:** 79%
  - Booking instrumentation is test-covered, but `web_vitals` lacks direct tests.

### What would raise to >=80 / >=90
- To >=80:
  - Enable or bypass Data API dependency via documented GA4 UI verification capture.
  - Add explicit operator checklist and evidence slots in measurement doc.
- To >=90:
  - Add automated `reportWebVitals` tests.
  - Capture first completed 7-day baseline table with reproducible extraction method.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| GA4 UI verification stays pending due access/tooling friction | Medium | High | Add explicit execution checklist and owner deadline in plan tasks |
| Baseline is logged without reproducible source window | Medium | High | Require date-bounded source notation and evidence links in acceptance |
| Overconfidence from code-only checks without live telemetry proof | Medium | Medium | Keep verification gate explicit before marking S2A measurement gap closed |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve existing strategy and workflow doc schema.
  - Use explicit dates and source paths for all metric claims.
- Rollout/rollback expectations:
  - Documentation-first changes are reversible via normal doc updates.
- Observability expectations:
  - Any closure claim must include GA4 evidence link or explicitly logged blocker.

## Suggested Task Seeds (Non-binding)
- Enable verification execution path (UI or Data API) and capture evidence.
- Lock first 7-day baseline into canonical plan metrics section.
- Update weekly decision + workflow status rows with linked evidence.
- Add follow-on test coverage for `reportWebVitals.ts`.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-build`
- Supporting skills:
  - `/lp-sequence`
- Deliverable acceptance package:
  - Updated measurement verification note, canonical plan baseline table, and workflow status update.
- Post-delivery measurement plan:
  - Weekly K/P/C/S refresh against locked baseline, plus day-14 recalibration artifact.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - External verification access remains a work item, not a planning blocker.
