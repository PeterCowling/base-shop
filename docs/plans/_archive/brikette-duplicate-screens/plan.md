---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-duplicate-screens
Dispatch-ID: IDEA-DISPATCH-20260310122535-0004
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brikette-duplicate-screens/analysis.md
---

# Brikette Duplicate Screens Plan

## Summary
Fix confirmed drift divergences between `ApartmentBookContent.tsx` and `DoubleRoomBookContent.tsx`. Three independent tasks: (1) migrate apartment analytics from `fireHandoffToEngine` to `trackThenNavigate` + `readAttribution` to restore attribution data on apartment handoff events; (2) correct visual token drift on NR card, saving badges, and dark mode borders; (3) add component-level tests for `DoubleRoomBookContent`. All tasks are independently rollbackable with no cross-task dependencies.

## Active tasks
- [x] TASK-01: Migrate apartment analytics to canonical `trackThenNavigate` + attribution pattern
- [x] TASK-02: Fix visual token drift in `ApartmentBookContent`
- [x] TASK-03: Add `DoubleRoomBookContent` component test suite

## Goals
- Restore attribution data on apartment booking handoff events (currently all absent).
- Fix live visual inconsistencies: NR card hover tokens, saving badge text, dark mode borders.
- Close double-room test coverage gap (currently zero component-level tests).

## Non-goals
- Full shared-base component extraction.
- Unifying pax handling, rate codes, or room-specific copy.
- Adding a CI-level duplicate screen detector.
- Removing `fireHandoffToEngine` from `ga4-events.ts` (dead code cleanup is out of scope).

## Constraints & Assumptions
- Constraints:
  - Existing GA4 event fields must be preserved on migration — only the call pattern changes.
  - `fireHandoffToEngine` in `ga4-events.ts` must remain (becomes dead code after migration; cleanup deferred).
  - No i18n changes.
  - Tests run in CI only — do not run Jest locally; push and use `gh run watch`.
- Assumptions:
  - `trackThenNavigate` + `readAttribution` is the canonical analytics pattern going forward.
  - NR button using `brand-primary` (matching double-room) is the correct token — confirmed by double-room reference and internal flex/NR consistency.
  - `isLongStay` is apartment-specific; correct to be absent from double-room.

## Inherited Outcome Contract
- **Why:** Drift between near-duplicate screens is compounding silently; attribution data is already missing from apartment bookings, and visual inconsistencies are live. Fixing now prevents further compounding before the next feature layer touches these screens.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both booking screens use the canonical analytics pattern (attribution present on all handoffs); visual tokens are consistent; double-room has component-level tests matching apartment coverage.
- **Source:** auto

## Analysis Reference
- Related analysis: `docs/plans/brikette-duplicate-screens/analysis.md`
- Selected approach inherited: Option A — fix each confirmed drift divergence directly in `ApartmentBookContent.tsx` with no shared infrastructure changes.
- Key reasoning used: Three independent drift types (analytics, visual, tests) that don't share a root cause or require shared infrastructure. Options B (shared hook) and C (shared base) rejected due to disproportionate scope relative to intentional differences between the two screens.

## Selected Approach Summary
- What was chosen: Fix-in-place — three targeted IMPLEMENT tasks, each scoped to one divergence type.
- Why planning is not reopening option selection: Analysis was decisive; all three options compared; B and C eliminated with concrete rationale. No operator-only fork remained.

## Fact-Find Support
- Supporting brief: `docs/plans/brikette-duplicate-screens/fact-find.md`
- Evidence carried forward:
  - `ApartmentBookContent.tsx:23-24` imports `fireHandoffToEngine` (deprecated); double-room uses `trackThenNavigate` + `readAttribution`.
  - Null guard pattern confirmed from `DoubleRoomBookContent.tsx:106-117`.
  - `trackThenNavigate.ts:69` confirmed beacon transport with navigation callback.
  - `readAttribution` is from `@/utils/entryAttribution`, not `ga4-events.ts`.
  - Visual token drift: NR button `brand-accent` vs `brand-primary`; badge `text-brand-heading` vs `text-brand-on-accent`; dark mode borders absent on 3 elements in apartment.
  - Test files that need updating: both `ga4-07-apartment-checkout.test.tsx` and `apartment-booking-url-matrix.test.tsx`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Apartment analytics migration | 85% | M | Complete (2026-03-13) | - | - |
| TASK-02 | IMPLEMENT | Fix visual token drift in apartment | 85% | S | Complete (2026-03-13) | - | - |
| TASK-03 | IMPLEMENT | Add DoubleRoomBookContent test suite | 85% | S | Complete (2026-03-13) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Fix 8 CSS class changes on NR card, 2 badge tokens, 3 dark mode borders | TASK-02 | Post-build QA loop required; design intent confirmed in acceptance |
| UX / states | N/A — no state changes | N/A | No pax/date/validity state changes |
| Security / privacy | N/A | N/A | No auth/PII changes |
| Logging / observability / audit | Migrate apartment to `trackThenNavigate` + attribution; field parity verified; null guard required | TASK-01 | Attribution visible in GA4 after deploy |
| Testing / validation | Update 2 apartment test files; add double-room test suite | TASK-01, TASK-03 | GA4 mock paths change: `@/utils/trackThenNavigate` and `@/utils/entryAttribution` |
| Data / contracts | GA4 event payload field parity check at build time | TASK-01 | Existing fields must be preserved; new attribution fields added |
| Performance / reliability | Beacon transport confirmed equivalent; navigation callback pattern unchanged | N/A for TASK-02, TASK-03 | No performance change |
| Rollout / rollback | All 3 tasks rollbackable independently via git revert | All | No feature flag needed |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | — | All independent; start with TASK-01 (highest impact) then TASK-02 and TASK-03 |

## Delivered Processes

None: no material process topology change

## Tasks

### TASK-01: Migrate apartment analytics to canonical `trackThenNavigate` + attribution pattern
- **Type:** IMPLEMENT
- **Deliverable:** Updated `ApartmentBookContent.tsx` with `trackThenNavigate` + `readAttribution` in `handleCheckout`; updated `ga4-07-apartment-checkout.test.tsx`; updated mock in `apartment-booking-url-matrix.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `d5f58b82e0`. `ApartmentBookContent.handleCheckout` migrated to `trackThenNavigate` + `readAttribution`. `buildAttributionFields` extracted as pure helper (fixes max-lines-per-function). Both test files updated. Lint + typecheck pass. TC-01/02/03/04/05 satisfaction confirmed by code walkthrough — CI will execute tests.
- **Affects:**
  - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
  - `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`
  - `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`
  - `[readonly] apps/brikette/src/utils/trackThenNavigate.ts`
  - `[readonly] apps/brikette/src/utils/entryAttribution.ts`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
  - `[readonly] apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — migration pattern directly available from `DoubleRoomBookContent.tsx:100-140`; null guard pattern at lines 106-117; both test files identified with exact mock change paths; `trackThenNavigate.ts` and `entryAttribution.ts` paths confirmed. Held-back test: field parity check at build time is the only unknown — if existing `fireHandoffToEngine` payload fields differ from expectation, must reconcile. This is a build-time verification step, not an architectural unknown. No single unknown would block the implementation path itself.
  - Approach: 90% — `trackThenNavigate` confirmed beacon transport; double-room is a direct working reference; analysis confirmed Option A.
  - Impact: 85% — attribution fields will appear on apartment handoff events in GA4. Downside risk: if `readAttribution()` returns null in production (direct URL visit, no upstream CTA), attribution fields are absent — this is expected behavior, not a regression.
- **Acceptance:**
  - `ApartmentBookContent.handleCheckout` calls `trackThenNavigate("handoff_to_engine", payload, navigateFn)` — no `fireHandoffToEngine` call remains.
  - `readAttribution()` from `@/utils/entryAttribution` called before `trackThenNavigate`; result used to build `attributionFields` with null guard (`attribution ? { entry_source_surface: ..., ... } : {}`).
  - All existing `fireHandoffToEngine` payload fields present in `trackThenNavigate` payload: `handoff_mode`, `engine_endpoint`, `checkin`, `checkout`, `pax`, `rate_plan`, `room_id`, `source_route`, `cta_location`, `brik_click_id`.
  - Attribution fields spread correctly: `entry_source_surface`, `entry_source_cta`, `entry_resolved_intent`, `entry_product_type` (conditional), `entry_decision_mode`, `entry_destination_funnel`, `entry_locale`, `entry_fallback_triggered`.
  - Navigation callback: `() => { window.location.assign(octorateUrl); }` passed as third argument.
  - `sessionStorage.setItem(APARTMENT_BOOKING_RETURN_KEY, ...)` retained — called before `trackThenNavigate`.
  - `ga4-07-apartment-checkout.test.tsx` updated: add `jest.mock("@/utils/trackThenNavigate", () => ({ trackThenNavigate: jest.fn() }))` and `jest.mock("@/utils/entryAttribution", () => ({ readAttribution: jest.fn(() => null) }))`. Note: this file uses `jest.requireActual("@/utils/ga4-events")` spread — there is no explicit `fireHandoffToEngine` mock to remove; no change to the `ga4-events` mock block is required.
  - `apartment-booking-url-matrix.test.tsx` updated: `fireHandoffToEngine: jest.fn()` removed from `jest.mock("@/utils/ga4-events")` block; `trackThenNavigate` and `readAttribution` mocked instead.
  - `begin_checkout` compat event (`win.gtag("event", "begin_checkout", ...)`) retained as-is — separate from handoff, not in migration scope.
  - All apartment tests pass in CI.
  - **Expected user-observable behavior:**
    - [ ] Apartment booking CTA click still navigates to Octorate calendar (no change in user flow)
    - [ ] WhatsApp CTA still functions as before
  - **Post-build QA:** None required — analytics-only change, no visual output change.
- **Engineering Coverage:**
  - UI / visual: N/A — no rendering change
  - UX / states: N/A — no state changes; pax, date, isValidRange unchanged
  - Security / privacy: N/A
  - Logging / observability / audit: Required — attribution fields present in GA4 `handoff_to_engine` events from apartment; null case produces no error and no attribution fields (correct)
  - Testing / validation: Required — 2 existing test files updated; all apartment tests pass
  - Data / contracts: Required — field parity check: all 10 existing `fireHandoffToEngine` fields preserved; 8 new attribution fields added when carrier present
  - Performance / reliability: Required — beacon transport preserved; 200ms timeout fallback in `trackThenNavigate`
  - Rollout / rollback: Required — rollback = `git revert` this task's commit; no feature flag
- **Validation contract (TC-01 through TC-05):**
  - TC-01: `handleCheckout("nr")` with valid dates and attribution carrier set → `trackThenNavigate` called with all 10 base fields + 8 attribution fields; navigation callback called
  - TC-02: `handleCheckout("flex")` with valid dates and no attribution carrier (`readAttribution()` returns null) → `trackThenNavigate` called with all 10 base fields, no attribution fields (empty spread); no error thrown
  - TC-03: `handleCheckout` called when `checkinIso` or `checkoutIso` is empty → returns early; `trackThenNavigate` not called
  - TC-04: `fireHandoffToEngine` mock is NOT called in any apartment test path after migration
  - TC-05: `sessionStorage.setItem(APARTMENT_BOOKING_RETURN_KEY, ...)` still called before `trackThenNavigate` navigation
- **Execution plan:**
  - Red: add failing test TC-01 asserting `trackThenNavigate` called (will fail as apartment still uses `fireHandoffToEngine`)
  - Green: migrate `ApartmentBookContent.handleCheckout` to `trackThenNavigate` + attribution pattern matching `DoubleRoomBookContent:100-140`; fix TC-01; fix TC-02 through TC-05; update both test file mocks
  - Refactor: verify field parity list in acceptance; confirm `begin_checkout` compat event unchanged; confirm `sessionStorage` call order; remove orphaned `fireHandoffToEngine` import if unused
- **Planning validation (required for M/L):**
  - Checks run: Verified `trackThenNavigate` signature at `trackThenNavigate.ts:45-72`; verified attribution field names at `DoubleRoomBookContent.tsx:107-116`; verified both test file mock patterns at `ga4-07-apartment-checkout.test.tsx` and `apartment-booking-url-matrix.test.tsx:52-56`.
  - Validation artifacts: `apps/brikette/src/utils/trackThenNavigate.ts`, `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx:100-140`, `apps/brikette/src/utils/entryAttribution.ts`
  - Unexpected findings: None.
- **Scouts:** `fireHandoffToEngine` has zero other runtime callers after migration (confirmed via grep); `begin_checkout` compat event uses `win.gtag` directly and is separate from `fireHandoffToEngine` — remains unchanged.
- **Edge Cases & Hardening:**
  - Null attribution carrier: handled by null guard (`attribution ? { ... } : {}`)
  - Both plans (nr/flex) produce separate `pax`-parameterized URLs — `pax` field still carried in payload
  - Double-click prevention: not in `trackThenNavigate` contract for this component (same as current behavior)
- **What would make this >=90%:**
  - Completing the build and verifying field parity check passes in CI (GA4 field list confirmed at build time).
- **Rollout / rollback:**
  - Rollout: standard deploy; no feature flag
  - Rollback: `git revert <commit-hash>`; `fireHandoffToEngine` call restored; no data loss
- **Documentation impact:** None — internal analytics pattern change
- **Notes / references:**
  - Attribution field mapping: `DoubleRoomBookContent.tsx:106-117`
  - `trackThenNavigate` signature: `trackThenNavigate.ts:45`
  - `readAttribution` returns `AttributionCarrier | null`: `entryAttribution.ts`

---

### TASK-02: Fix visual token drift in `ApartmentBookContent`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `ApartmentBookContent.tsx` with corrected CSS class tokens on NR card, saving badges, and 3 dark mode border additions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `4b6fee18b4`. All 11 CSS class changes applied: NR card accent→primary (5 classes), NR saving badge text-brand-heading→text-brand-on-accent, flex saving badge text-brand-heading→text-brand-on-accent, date card + rate options card + WhatsApp CTA dark:border-white/30 added. Lint + typecheck pass.
- **Affects:**
  - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact class strings identified from direct code comparison; 11 changes on known lines; no logic changes, CSS token substitution only. Held-back test: design intent for NR=`brand-primary` — if NR should be accent (intentional differentiation from flex), this fix is incorrect. Mitigated: acceptance requires explicit design intent confirmation before committing. No single unknown blocks implementation path.
  - Approach: 90% — token substitution follows double-room pattern exactly; both badges confirmed `text-brand-on-accent` in double-room.
  - Impact: 85% — visual consistency fix; user-visible improvement; low rollback risk.
- **Acceptance:**
  - NR button card: `hover:border-brand-primary` (was `brand-accent`); `focus-visible:ring-brand-primary` (was `brand-accent`)
  - NR button footer: `bg-brand-primary/10` (was `brand-accent/10`); `group-hover:bg-brand-primary` (was `group-hover:bg-brand-accent`)
  - NR button footer CTA text: `text-brand-primary group-hover:text-brand-on-primary` (was `text-brand-accent group-hover:text-brand-on-accent`)
  - NR button footer ArrowRight: `text-brand-primary group-hover:text-brand-on-primary` (was `text-brand-accent group-hover:text-brand-on-accent`)
  - NR saving badge: `text-brand-on-accent` (was `text-brand-heading`)
  - Flex saving badge: `text-brand-on-accent` (was `text-brand-heading`)
  - Date selector card: `dark:border-white/30` added to container div
  - Rate options card: `dark:border-white/30` added to container div
  - WhatsApp CTA anchor: `dark:border-white/30` added
  - Design intent confirmed before commit: NR button uses `brand-primary` (same as flex card and double-room NR card) — differentiation between NR and flex is by card header text, saving badge, and pricing copy, not by colour.
  - **Expected user-observable behavior:**
    - [ ] NR card hover shows primary colour (matching flex card) — consistent with double-room NR card
    - [ ] Saving badges on both NR and flex cards render with correct contrast on coloured badge backgrounds
    - [ ] Card containers and WhatsApp CTA show border in dark mode
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on apartment booking page (`/[lang]/private-rooms/book`). Auto-fix and re-run until no Critical/Major findings remain. Minor findings may be deferred with explicit rationale.
- **Engineering Coverage:**
  - UI / visual: Required — 11 CSS class changes on apartment booking page; post-build QA loop required
  - UX / states: N/A — no state logic changes
  - Security / privacy: N/A
  - Logging / observability / audit: N/A — visual-only change
  - Testing / validation: N/A — no test files reference these CSS class strings; apartment URL/analytics tests unaffected
  - Data / contracts: N/A — no data contract changes
  - Performance / reliability: N/A — CSS class string changes only
  - Rollout / rollback: Required — rollback = `git revert`; no feature flag
- **Validation contract (TC-01 through TC-02):**
  - TC-01: `ApartmentBookContent` renders without error; NR card footer uses `bg-brand-primary/10` and `group-hover:bg-brand-primary` class strings (can assert via `getByRole("button")` className inspection or snapshot)
  - TC-02: Both saving badges have `text-brand-on-accent` class; neither has `text-brand-heading` on the badge span
- **Execution plan:**
  - Red: None (CSS-only change; no behaviour to drive red)
  - Green: Apply all 11 token substitutions to `ApartmentBookContent.tsx`; verify renders without error
  - Refactor: Post-build QA loop (lp-design-qa + contrast + breakpoint); confirm NR/flex visual parity with double-room
- **Planning validation:** N/A for S effort
- **Scouts:** Flex card tokens in apartment already use `brand-primary` correctly — only NR card and both badges require changes.
- **Edge Cases & Hardening:** Dark mode border: confirm `dark:border-white/30` places correctly on rounded card container (same pattern used on double-room, confirmed working).
- **What would make this >=90%:** Design intent explicitly documented in a design spec; snapshot tests covering the className changes.
- **Rollout / rollback:**
  - Rollout: standard deploy
  - Rollback: `git revert <commit-hash>`
- **Documentation impact:** None
- **Notes / references:**
  - Reference: `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` (canonical token reference)

---

### TASK-03: Add `DoubleRoomBookContent` component test suite
- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/brikette/src/test/app/private-rooms/double-room-book-content.test.tsx` (or equivalent path matching brikette test conventions) with analytics, URL construction, and disabled-state tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** Commit `2012430fce`. New test file created at `apps/brikette/src/test/app/private-rooms/double-room-book-content.test.tsx`. 5 test cases: TC-01 (NR analytics params), TC-02 (flex analytics params), TC-03 (disabled state via formatDate mock), TC-04 (NR URL room=433883), TC-04b (flex URL room=433894). Lint passes. CI will execute tests.
- **Affects:**
  - `apps/brikette/src/test/app/private-rooms/double-room-book-content.test.tsx` (new file)
  - `[readonly] apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`
  - `[readonly] apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — test infrastructure identical to apartment; mock paths known (`@/utils/trackThenNavigate`, `@/utils/entryAttribution`); component behaviour fully understood from code read. Held-back test: no single unknown would push below 80 — test patterns are proven in apartment suite.
  - Approach: 90% — mirrors apartment test structure with double-room-specific paths and rate codes; no new testing infrastructure needed.
  - Impact: 85% — closes double-room test gap; CI provides regression coverage for analytics call and URL construction going forward.
- **Acceptance:**
  - Test file exists and passes in CI.
  - Mocks: `jest.mock("@/utils/trackThenNavigate", () => ({ trackThenNavigate: jest.fn() }))` and `jest.mock("@/utils/entryAttribution", () => ({ readAttribution: jest.fn(() => null) }))`.
  - TC-01 covered: NR checkout button click calls `trackThenNavigate("handoff_to_engine", ...)` with `room_id: "double_room"`, `rate_plan: "nr"`, `pax: 2`.
  - TC-02 covered: Flex checkout button click calls `trackThenNavigate("handoff_to_engine", ...)` with `rate_plan: "flex"`.
  - TC-03 covered: Checkout buttons are disabled when no valid date range (both checkinIso and checkoutIso empty).
  - TC-04 covered: URL passed to `window.location.assign` in navigation callback contains `room=433883` (NR rate code) for NR click.
  - **Expected user-observable behavior:**
    - [ ] N/A — tests only; no user-visible change
  - **Post-build QA:** None — test additions only; no UI change.
- **Engineering Coverage:**
  - UI / visual: N/A — test file only
  - UX / states: N/A — disabled-state test covers isValidRange behavior
  - Security / privacy: N/A
  - Logging / observability / audit: Required — TC-01 and TC-02 verify `trackThenNavigate` called with correct params
  - Testing / validation: Required — new test file with 4 test cases
  - Data / contracts: Required — TC-04 verifies URL contains correct rate code `433883` (NR) and `433894` (flex)
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test file only; no production impact
- **Validation contract (TC-01 through TC-04):**
  - TC-01: render `DoubleRoomBookContent` with valid dates → click NR button → `trackThenNavigate` called with `room_id: "double_room"`, `rate_plan: "nr"`, `pax: 2`, `handoff_mode: "same_tab"`
  - TC-02: render with valid dates → click flex button → `trackThenNavigate` called with `rate_plan: "flex"`
  - TC-03: render with no date range → both buttons have `disabled` attribute; `trackThenNavigate` not called on click
  - TC-04: `window.location.assign` called with URL containing `room=433883` for NR; `room=433894` for flex
- **Execution plan:**
  - Red: Create test file with TC-01 through TC-04 as failing tests
  - Green: Run governed test command; all 4 TCs pass against existing `DoubleRoomBookContent` code (no component changes required)
  - Refactor: Confirm mock teardown/reset between tests; confirm test IDs use `data-cy` attribute pattern per jest.setup.ts convention
- **Planning validation:** N/A for S effort
- **Scouts:** `DoubleRoomBookContent` has no `data-testid` or `data-cy` attributes — button identification must use `getByRole("button", { name: ... })` or text-based selectors; rate codes are constants in file (`433883` NR, `433894` flex).
- **Edge Cases & Hardening:** `readAttribution` mock returns null by default (no carrier set) — ensures null guard path is exercised in test; add one test with `readAttribution` returning a mock carrier to confirm spread.
- **What would make this >=90%:** Adding a 5th test case for attribution carrier present and verifying attribution fields in `trackThenNavigate` call.
- **Rollout / rollback:**
  - Rollout: standard deploy; tests are CI-only
  - Rollback: N/A — test addition only
- **Documentation impact:** None
- **Notes / references:**
  - Rate codes: NR=`433883`, flex=`433894` (from `DoubleRoomBookContent.tsx:37-40`)
  - Reference test: `apps/brikette/src/test/components/ga4-07-apartment-checkout.test.tsx`

---

## Risks & Mitigations
- **Null guard omission (analytics migration):** Medium likelihood / Medium impact. Mitigated by TC-02 in TASK-01 acceptance.
- **NR token design intent wrong:** Low likelihood / Low-Medium impact. Mitigated by design intent confirmation in TASK-02 acceptance before commit.
- **GA4 field regression:** Low likelihood / High impact. Mitigated by field parity list in TASK-01 acceptance.
- **Second test file mock not updated:** Mitigated by both test files explicitly in TASK-01 Affects list.

## Observability
- Logging: None required — CI test output.
- Metrics: GA4 `handoff_to_engine` events from `/[lang]/private-rooms/book` should carry attribution fields post-TASK-01 deploy.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)
- [ ] Apartment booking page NR CTA uses `brand-primary` hover tokens (matching double-room and flex card)
- [ ] Saving badges on both screens use `text-brand-on-accent`
- [ ] Apartment booking page cards and WhatsApp CTA have `dark:border-white/30`
- [ ] GA4 `handoff_to_engine` events from apartment carry attribution fields when attribution carrier is present
- [ ] `DoubleRoomBookContent` has ≥4 passing component-level tests in CI
- [ ] All existing apartment tests pass in CI

## Decision Log
- 2026-03-13: Option A (fix-in-place) chosen over B (shared hook) and C (shared base). Rationale: intentional differences between screens make shared infrastructure non-trivial; 3 isolated drift types don't share a root cause. Analysis: `docs/plans/brikette-duplicate-screens/analysis.md`.
- 2026-03-13: NR button token confirmed as `brand-primary` to match double-room and maintain internal consistency (NR and flex differentiated by text/pricing, not colour). Acceptance criterion requires explicit design intent confirmation before commit.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Apartment analytics migration | Yes | None — migration pattern directly available from `DoubleRoomBookContent.tsx:100-140`; both test files in Affects list | No |
| TASK-02: Fix visual token drift | Yes | None — exact class strings identified; 11 changes on known lines; post-build QA required | No |
| TASK-03: Add DoubleRoomBookContent test suite | Yes | None — mock paths known; rate codes confirmed from component constants | No |

## Overall-confidence Calculation
- TASK-01: M=2, confidence=85% → weighted contribution: 170
- TASK-02: S=1, confidence=85% → weighted contribution: 85
- TASK-03: S=1, confidence=85% → weighted contribution: 85
- Sum weighted: 340 / Sum effort: 4 = **85%**
