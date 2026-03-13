---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: brikette-duplicate-screens
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brikette-duplicate-screens/fact-find.md
Related-Plan: docs/plans/brikette-duplicate-screens/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Brikette Duplicate Screens Analysis

## Decision Frame
### Summary
`ApartmentBookContent.tsx` and `DoubleRoomBookContent.tsx` have accumulated silent drift on three independent fronts: (1) analytics — apartment sends no attribution data; (2) visual tokens — NR card, saving badge, and dark mode borders are inconsistent; (3) test coverage — double-room has zero tests. The decision is whether to fix these divergences in-place or first create shared infrastructure.

### Goals
- Migrate apartment analytics to the canonical `trackThenNavigate` + attribution pattern (highest impact).
- Correct visual token drift (NR button, badge text, dark mode borders on 3 elements).
- Add double-room component-level tests to close the coverage gap.

### Non-goals
- Full shared-base component extraction.
- Unifying pax handling, rate codes, or room-specific copy.
- Adding a CI-level duplicate screen detector.

### Constraints & Assumptions
- Constraints:
  - Existing GA4 event fields must be preserved — only the call pattern changes.
  - `fireHandoffToEngine` must remain in `ga4-events.ts` (it has no other runtime callers after migration, but its mock is referenced in `apartment-booking-url-matrix.test.tsx`; becomes dead code after migration — follow-up cleanup is out of scope for this plan).
  - No i18n changes.
- Assumptions:
  - `trackThenNavigate` + `readAttribution` is the canonical analytics pattern going forward.
  - Visual token drift is bugs, not intentional design differences (NR=accent vs NR=primary).
  - `isLongStay` is apartment-specific; correct to be absent from double-room.

## Inherited Outcome Contract

- **Why:** Drift between near-duplicate screens is compounding silently; attribution data is already missing from apartment bookings, and visual inconsistencies are live. Fixing now prevents further compounding before the next feature layer touches these screens.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both booking screens use the canonical analytics pattern (attribution present on all handoffs); visual tokens are consistent; double-room has component-level tests matching apartment coverage.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/brikette-duplicate-screens/fact-find.md`
- Key findings used:
  - Apartment imports `fireHandoffToEngine` from `ga4-events.ts`; double-room uses `trackThenNavigate` from `trackThenNavigate.ts` + `readAttribution` from `entryAttribution.ts`.
  - NR button: `hover:border-brand-accent` (apartment) vs `hover:border-brand-primary` (double-room).
  - Saving badge: `text-brand-heading` (apartment) vs `text-brand-on-accent` (double-room).
  - Dark mode border `dark:border-white/30` absent from all 3 card/CTA elements in apartment; present on all 3 in double-room.
  - `trackThenNavigate.ts:69` confirmed beacon transport with navigation callback — transport-equivalent to `fireHandoffToEngine`.
  - Attribution fields built with null guard in double-room (`attributionFields` spreads to `{}` when `readAttribution()` returns null).
  - Double-room: zero component tests. Apartment: 2 test files covering analytics + URL matrix.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Analytics attribution correctness | Attribution data absent from apartment = all apartment bookings unattributable in GA4 | P1 |
| Rollback safety | Change must be trivially revertible — no shared infrastructure change | P1 |
| Build complexity | Fewer tasks = less risk of build-time decision points | P2 |
| Test coverage completeness | Double-room gap leaves analytics and URL logic untested | P2 |
| Visual consistency | NR card token inconsistency is user-visible on two live pages | P3 |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Fix in-place | Directly fix each confirmed drift divergence in the individual components. Three independent tasks: analytics migration, visual token correction, double-room tests. No shared abstraction. | Minimal blast radius. Each change rollbackable individually. Pattern already proven in double-room. | Both components remain structurally separate — future drift is still possible without a shared base. | Null guard omitted in analytics migration; NR token design intent ambiguity. | Yes (**chosen**) |
| B — Shared hook extraction, then fix | Extract shared booking state + analytics logic into a custom hook (`useBookingHandoff`), then migrate both components to use it, fixing drift as part of the extraction. | Single source of truth for analytics logic going forward. | Larger surface area — touching both components and adding a new hook in the same change. Increases risk of regression in apartment while fixing drift. Disproportionate effort for 3 isolated divergences. | Migration of two components simultaneously multiplies rollback risk. Shared hook adds an abstraction layer not yet proven necessary. | No |
| C — Full shared base component | Extract `PrivateRoomBookContent` base with room-specific props. | Eliminates all future drift structurally. | Intentional differences (pax range 2–3, rate code map, FitCheck, i18n namespaces, long-stay flag) require significant prop surface. Risk of new abstraction coupling two room types that may legitimately diverge further. | Over-engineering for current scope; risk of hiding intentional differences inside a combined prop API. | No |

## Engineering Coverage Comparison
| Coverage Area | Option A (fix in-place) | Option B (shared hook) | Option C (shared base) | Chosen implication (A) |
|---|---|---|---|---|
| UI / visual | Fix 6 class tokens across 3 elements in apartment only | Same fix applies via hook output | Fix applied via base component render | Visual token fixes scoped to `ApartmentBookContent` only; dark mode borders on date card, rate card, WhatsApp CTA |
| UX / states | No state changes; `isValidRange` and pax state unchanged | Same | Same — pax state would need prop-level configuration | No UX state changes |
| Security / privacy | N/A | N/A | N/A | N/A |
| Logging / observability / audit | Apartment migrated to `trackThenNavigate` + attribution fields; beacon transport preserved; null guard required | Hook handles attribution; same transport | Same via base | Attribution fields present on all apartment handoffs post-migration; field parity with double-room verified |
| Testing / validation | Apartment test updated; new double-room test suite added | Hook unit tests required in addition to component tests | Base component tests required in addition to room-specific tests | 3 targeted test changes: update apartment analytics test, add double-room analytics + URL tests |
| Data / contracts | GA4 event payload: must preserve all existing fields; new attribution fields added | Same | Same | Field parity acceptance criterion required in IMPLEMENT task |
| Performance / reliability | Beacon transport preserved; `trackThenNavigate` confirmed transport-equivalent | Same | Same | No performance change |
| Rollout / rollback | Each of 3 tasks rollbackable independently | Single commit; rollback affects both components simultaneously | Larger rollback surface (new component + 2 rewrites) | Preferred: independent rollback per task type |

## Chosen Approach

- **Recommendation:** Option A — fix each confirmed drift divergence directly in `ApartmentBookContent.tsx` with no shared infrastructure changes.
- **Why this wins:**
  - All three drift types are independent — analytics migration does not depend on visual token fixes, which do not depend on test additions. Each can be delivered and rolled back independently.
  - Option B and C introduce shared abstractions that are not yet justified: the intentional differences (pax range, rate codes, FitCheck, namespaces) are real and would require significant prop engineering to accommodate cleanly.
  - `trackThenNavigate` + `readAttribution` is already proven in double-room. The migration pattern is copy-and-adapt, not design-from-scratch.
  - Transport mode confirmed equivalent — no unknown in the migration path.
- **What it depends on:**
  - Field parity verification between current `fireHandoffToEngine` call (apartment) and `trackThenNavigate` payload (double-room) — must be done before marking analytics task complete.
  - Null guard required (`attributionFields = attribution ? { ... } : {}`) — this is the double-room pattern and must be replicated.
  - Design intent confirmation that NR button should use `brand-primary` (matching flex card pattern on both screens and double-room NR card) before committing visual token changes.

### Rejected Approaches
- **Option B (shared hook extraction)** — disproportionate scope for 3 isolated divergences. Increases regression risk by touching both components in the same change. The shared abstraction would need to handle apartment-specific pax state and FitCheck rendering, making it a non-trivial hook. Deferred to a future fact-find if drift continues to compound.
- **Option C (full shared base)** — over-engineering. Intentional differences (pax 2-3 vs fixed 2, rate code maps differ, FitCheck presence, i18n namespaces, long-stay flag) are substantial. A shared base component would need to accommodate all these via props or render slots, adding complexity without a clear benefit at current scale. Not warranted until a third private-room booking screen emerges.

### Open Questions (Operator Input Required)
None. All decisions are agent-resolvable from code and business evidence.

## End-State Operating Model

None: no material process topology change

## Planning Handoff
- Planning focus:
  - Three independent IMPLEMENT tasks (not chained — can be executed in any order after TASK-01 analytics migration):
    1. Analytics migration: migrate `ApartmentBookContent.handleCheckout` to `trackThenNavigate` + attribution pattern from `entryAttribution.ts`; update `ga4-07-apartment-checkout.test.tsx`.
    2. Visual token drift: fix NR card hover (`brand-accent` → `brand-primary`), badge text (`text-brand-heading` → `text-brand-on-accent`), add `dark:border-white/30` to date card, rate card, WhatsApp CTA.
    3. Test coverage: add `DoubleRoomBookContent` test suite — analytics call with attribution fields present/absent, URL construction, disabled state when no range.
- Validation implications:
  - Analytics task: field-parity acceptance check is required — all existing `fireHandoffToEngine` payload fields must appear in the `trackThenNavigate` call. Null guard acceptance: `readAttribution()` returning null must produce empty attribution spread (no runtime error). **Two test files must be updated**: (1) `ga4-07-apartment-checkout.test.tsx` — replace assertions targeting `fireHandoffToEngine` with `trackThenNavigate`; (2) `apartment-booking-url-matrix.test.tsx` — remove `fireHandoffToEngine: jest.fn()` from the `jest.mock("@/utils/ga4-events")` block and add mocks for `trackThenNavigate` (from `@/utils/trackThenNavigate`) and `readAttribution` (from `@/utils/entryAttribution`).
  - Visual task: design intent confirmation for NR=`brand-primary` must be explicit. Dark mode border: 3 elements (not 1).
  - Test task: new test suite for `DoubleRoomBookContent.tsx` must mock `trackThenNavigate` from `@/utils/trackThenNavigate` and `readAttribution` from `@/utils/entryAttribution` — different paths from the apartment mock pattern.
- Sequencing constraints:
  - All three tasks are independently runnable. No cross-task dependency.
  - Analytics task should be first (highest business impact, most complex).
- Risks to carry into planning:
  - Null guard risk: if analytics migration omits the null guard, `trackThenNavigate` receives an attribution spread from null — runtime error.
  - NR token intent: if NR=accent is intentional on apartment (NR vs flex differentiation), the token fix is incorrect. Needs design intent check in acceptance.
  - `fireHandoffToEngine` callers: confirm no other callers before removing (or note it must remain as-is per fact-find constraint).

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Analytics migration omits null guard for `readAttribution()` | Medium | Medium — runtime error spreading null | Execution detail, not architecture decision | Null guard must be in IMPLEMENT acceptance criteria with explicit test case |
| NR button token fix (`brand-accent` → `brand-primary`) is incorrect if apartment intentionally differentiates NR/flex by colour | Low | Low-Medium — visual regression on live page | Design intent not documented; no design spec in repo | Add acceptance criterion: NR button hover in apartment matches double-room (`brand-primary`) |
| GA4 field regression on analytics migration | Low | High — drops existing event data | Field parity is a build-time check | Field parity checklist in IMPLEMENT acceptance: all existing `fireHandoffToEngine` payload fields present in new call |

## Planning Readiness
- Status: Go
- Rationale: All drift divergences mapped to direct code evidence. Chosen approach is fix-in-place with zero shared infrastructure changes. Three independent tasks with no cross-task dependencies. Key risks (null guard, field parity, token design intent) are explicit acceptance criteria — no operator forks remain.
