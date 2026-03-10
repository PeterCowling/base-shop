---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: hbag-pdp-ga4-funnel-feed
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-pdp-ga4-funnel-feed/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304211000-0235
Trigger-Source: dispatch-routed
Trigger-Why: The trust-cues improvement can only be validated if we can repeatedly observe whether PDP visitors progress from view_item to begin_checkout. Without a standing feed, each cycle remains evidence-light and cannot close the KPI loop.
Trigger-Intended-Outcome: type: measurable | statement: A standing HBAG PDP funnel artifact is produced weekly with GA4 counts/rates for view_item and begin_checkout so outcome reviews can compare trend direction and detect regression within one cycle. | source: operator
---

# HBAG PDP GA4 Funnel Feed Fact-Find Brief

## Access Declarations
- None (repo-only investigation)

## Scope
### Summary
HBAG outcome reviews now depend on PDP funnel movement, but there is no standing, repeatable report for the two KPI anchors requested in reflection: `view_item` and `begin_checkout`. Caryina currently emits internal event names (`product_view`, `checkout_started`) and forwards event type directly to the GA provider, so no canonical mapping artifact exists yet for the KPI language used in results review.

### Goals
- Define one canonical, low-friction standing feed for HBAG PDP funnel measurement.
- Confirm where PDP-view and checkout-start events are emitted, validated, and persisted.
- Specify an explicit mapping contract from current event names to KPI labels used in reflections (`view_item`, `begin_checkout`).
- Produce planning-ready implementation boundaries (artifact path, cadence, and validation seam).

### Non-goals
- Reworking the entire analytics event taxonomy for all shops.
- Building GA4 admin dashboards or external BI tooling in this cycle.
- Adding new conversion events beyond the two requested KPI anchors.

### Constraints & Assumptions
- Constraints:
  - Current API whitelist only accepts `product_view` and `checkout_started` (not `view_item`/`begin_checkout`) for these flows.
  - Analytics provider sends `event.type` as GA event name directly.
  - Outcome tracking must be standing and repeatable (not ad-hoc one-off checks).
- Assumptions:
  - KPI labels in reflection can be satisfied via a deterministic mapping layer (`product_view -> view_item`, `checkout_started -> begin_checkout`) without breaking current event producers.

## Outcome Contract
- **Why:** The trust-cues improvement can only be validated if we can repeatedly observe whether PDP visitors progress from view_item to begin_checkout. Without a standing feed, each cycle remains evidence-light and cannot close the KPI loop.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** A standing HBAG PDP funnel artifact is produced weekly with GA4 counts/rates for view_item and begin_checkout so outcome reviews can compare trend direction and detect regression within one cycle.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx` - emits PDP event (`product_view`).
- `apps/caryina/src/app/[lang]/checkout/CheckoutAnalytics.client.tsx` - emits checkout-start event (`checkout_started`).
- `apps/caryina/src/app/api/analytics/event/route.ts` - validates allowed event types before tracking.
- `packages/platform-core/src/analytics/index.ts` - forwards `event.type` as GA Measurement Protocol event name.

### Key Modules / Files
- `apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx`
  - Fires `page_view` + `product_view` on PDP mount/path change.
- `apps/caryina/src/app/[lang]/checkout/CheckoutAnalytics.client.tsx`
  - Fires `page_view` + `checkout_started` on checkout page.
- `apps/caryina/src/app/api/analytics/event/route.ts`
  - `ALLOWED_EVENT_TYPES` includes `product_view`, `checkout_started`; rejects unknown event names.
- `packages/platform-core/src/analytics/client.ts`
  - Client helper posts analytics payloads to `/api/analytics/event` when consent cookie is true.
- `packages/platform-core/src/analytics/index.ts`
  - GA provider uses `event.type` as MP `events[0].name` and appends to local aggregates.
- `apps/caryina/NOTES.md`
  - Documents GA4 setup prerequisites (measurement ID + `GA_API_SECRET`) and fallback behavior.

### Patterns & Conventions Observed
- App emits domain-friendly internal event names (e.g., `product_view`) instead of strict GA ecommerce names.
- Event API enforces a hard allowlist; taxonomy changes require route changes.
- Provider-level mapping does not exist: outbound GA event name is exactly `type`.
- Consent and settings gates are already in place for safe best-effort tracking.

### Data & Contracts
- Event producer contract:
  - `ProductAnalytics`: `{ type: "product_view", productId, path, locale }`
  - `CheckoutAnalytics`: `{ type: "checkout_started", value?, currency?, locale }`
- API contract:
  - Route accepts only known types in `ALLOWED_EVENT_TYPES`; otherwise returns 400.
- Provider contract:
  - Google provider posts MP payload where `name = type`.
- Shop settings contract:
  - `data/shops/caryina/settings.json` currently has GA provider enabled with placeholder measurement ID.

### Dependency & Impact Map
- Upstream dependencies:
  - Consent cookie (`consent.analytics=true`)
  - Shop analytics settings + `GA_API_SECRET`
- Downstream dependents:
  - `analytics.jsonl`/provider stream consumers
  - Results-review and process-improvement KPI interpretation
- Likely blast radius:
  - Analytics route allowlist
  - GA naming/mapping layer
  - Any consumers assuming raw event names only

### Test Landscape
#### Existing Test Coverage
- `apps/caryina/src/app/[lang]/analyticsEmitters.client.test.tsx`
  - Confirms ProductAnalytics emits `product_view` and CheckoutAnalytics emits `checkout_started`.
- `apps/caryina/src/app/api/analytics/event/route.test.ts`
  - Confirms invalid event types are rejected and consent/settings gates are applied.

#### Coverage Gaps
- No standing report generation test proving weekly KPI artifact output.
- No mapping-contract test for KPI aliases (`view_item` / `begin_checkout`).
- No guard that prevents taxonomy drift between reflection KPI language and emitted analytics names.

### Recent Git History (Targeted)
- Not investigated: targeted history was not required to establish current analytics contract and feed gap.

## Questions
### Resolved
- Q: Are `view_item` and `begin_checkout` already emitted in Caryina?
  - A: No; current emitted names are `product_view` and `checkout_started`.
  - Evidence: Product/checkout analytics emitter files listed above.

- Q: Can unknown names pass through today as-is?
  - A: No; route allowlist rejects unknown names.
  - Evidence: `ALLOWED_EVENT_TYPES` in analytics event route.

- Q: Is there an existing standing artifact for this KPI pair?
  - A: No standing weekly artifact path is currently defined for HBAG PDP funnel progress.
  - Evidence: No feed artifact under `docs/business-os/startup-baselines/HBAG/` and idea explicitly raised in process improvements.

### Open (Operator Input Required)
- None.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PDP emitters and checkout emitters | Yes | None | No |
| Event ingestion and validation contract | Yes | None | No |
| GA provider naming semantics | Yes | None | No |
| Standing artifact production path | Partial | [Moderate] no existing weekly feed artifact | Yes |

## Scope Signal
- Signal: right-sized
- Rationale: The requested outcome is narrow (two KPI anchors), current contracts are clear, and the main gap is deterministic artifact production plus naming alignment.

## Confidence Inputs
- Implementation: 88%
  - Evidence basis: Existing emitters, route, and provider path are straightforward and localized.
  - To reach >=90: choose and lock one mapping seam (route-level rename vs report-layer alias) before build.
- Approach: 86%
  - Evidence basis: Add standing report + mapping contract without broad taxonomy rewrite.
  - To reach >=90: include explicit regression tests for mapping and feed generation.
- Impact: 84%
  - Evidence basis: closes currently blocking KPI visibility gap for trust-cues outcome tracking.
  - To reach >=90: collect two consecutive weekly artifacts and verify interpretability in results review.
- Delivery-Readiness: 90%
  - Evidence basis: no external runtime dependency required for first build iteration (can run on analytics store data).
- Testability: 85%
  - Evidence basis: existing emitter and route tests provide stable seams; missing feed tests are straightforward to add.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Mapping ambiguity (`product_view` vs `view_item`) causes inconsistent interpretation | Medium | Medium | Define canonical KPI alias contract in code + artifact header |
| Placeholder GA measurement ID leaves production GA feed incomplete | Medium | Medium | Keep feed generation compatible with file/provider path; document GA setup dependency explicitly |
| Future event taxonomy expansion breaks weekly feed parser | Medium | Low | Add contract test around accepted KPI set and fallback handling |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve consent and allowlist guards.
  - Keep event naming contract explicit and tested.
- Observability expectations:
  - Weekly KPI artifact must be deterministic and reproducible from tracked events.

## Suggested Task Seeds (Non-binding)
- Add KPI alias mapping contract for HBAG funnel (`product_view -> view_item`, `checkout_started -> begin_checkout`).
- Implement recurring feed generator writing a weekly markdown/json artifact for HBAG PDP funnel counts/rates.
- Add tests for mapping contract and feed artifact generation.

## Evidence Gap Review
### Gaps Addressed
- Located exact emitter, ingestion, and provider contracts for the two KPI anchors.
- Confirmed no standing feed currently exists for HBAG PDP funnel KPI tracking.

### Confidence Adjustments
- Testability reduced from 90 to 85 due to missing feed-specific regression tests.

### Remaining Assumptions
- Weekly cadence is acceptable for this KPI loop (rather than daily).

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan hbag-pdp-ga4-funnel-feed --auto`
