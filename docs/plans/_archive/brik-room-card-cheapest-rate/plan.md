---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-room-card-cheapest-rate
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average (S=1 each)
Auto-Build-Intent: plan+auto
---

# Brik Room Card Cheapest Rate Plan

## Summary

Each room card on `/en/rooms` and `/en/book` currently shows two action buttons: "Non-Refundable Rates" and "Flexible Room Rates". This plan replaces them with a single "Check Rates" CTA that defaults to the NR (cheapest) rate plan. The `PriceBlock` above the button already renders live pricing on `/book` (when `OCTORATE_LIVE_AVAILABILITY` is on); this feature does not change that wiring — it only reduces the action array from two entries to one. The change is isolated to the shared `RoomsSection` organism (one new optional prop) and the brikette adapter that enables it. All existing GA4 event semantics are preserved, with `plan` always set to `"nr"` for the single CTA path.

## Active tasks

- [x] TASK-01: Add `singleCtaMode` prop to shared RoomsSection
- [x] TASK-02: Add `checkRatesSingle` i18n key to all 18 locale files
- [x] TASK-03: Wire `singleCtaMode` in brikette adapter
- [x] TASK-04: Add unit tests for single-CTA mode

## Goals

- Show a single primary CTA per room card that navigates directly to Octorate at the NR (cheapest) rate
- Remove visual noise from the dual equal-weight button layout
- Preserve live price display ("From €X") above the CTA on `/book` when dates are set and the feature flag is enabled
- Keep GA4 `select_item` and `begin_checkout` events firing correctly (plan always `"nr"` for single CTA)
- Maintain backwards compatibility: the new `singleCtaMode` prop is optional; default behavior (dual buttons) is unchanged

## Non-goals

- Changing the price formatting or i18n interpolation of the "From €X" price label
- Displaying static `basePrice` on the `/rooms` page (no-date context) — deferred
- Replacing or modifying the Octorate deep-link URL builder
- Any room detail page (`/rooms/[id]`) changes
- A/B testing or feature flagging the CTA change itself

## Constraints & Assumptions

- Constraints:
  - `buildOctorateUrl` requires `plan: "nr" | "flex"` — single CTA hardcodes `plan: "nr"` (NR is always cheaper or equal to flex)
  - The shared `packages/ui` layer must remain generic — no brikette-specific logic
  - All i18n strings must go through `t()` with a `defaultValue` fallback
  - Writer-lock protocol required for commits: `scripts/agents/with-writer-lock.sh`
  - `packages/ui` must be rebuilt (`pnpm --filter @acme/ui build`) after changes to shared components before brikette app reflects them
- Assumptions:
  - NR is always the cheapest rate; single CTA defaulting to NR is acceptable UX
  - The `/rooms` page will show no static price on cards (single CTA only, no price block) — this is acceptable for initial delivery
  - `checkRatesSingle` copy "Check Rates" is acceptable placeholder; operator can update copy later
  - All 18 locale `roomsPage.json` files have uniform JSON structure (confirmed: all contain `checkRatesNonRefundable`)

## Inherited Outcome Contract

- **Why:** TBD (dispatch-routed; operator rationale: reduce CTA decision paralysis on room cards, surface cheapest rate more clearly)
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Improve CTA click-through on room cards by reducing decision paralysis from two equal-weight buttons. Expected signal: consolidation of `select_item` plan events to `"nr"`, and increase in `begin_checkout` rate from room cards.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/brik-room-card-cheapest-rate/fact-find.md`
- Key findings used:
  - `ActionButtons` in `RoomCard` already handles single-entry `actions` arrays — no change to `RoomCard.tsx`
  - `PriceBlock` already renders `price.formatted` above buttons — price display is fully decoupled from button count
  - Actions array is built inside shared `RoomsSection` (not in `RoomCard`) — this is the touch-point
  - Brikette adapter uses `ComponentProps<typeof RoomsSectionBase>` — new props flow through automatically
  - 18 locales confirmed, all with `roomsPage.json` and `checkRatesNonRefundable` present
  - `ratesFrom: "From €{{price}}"` already exists in EN (and assumed in all locales — TASK-02 will audit)
  - `rateCodes.direct.nr` present for all rooms in `roomsData.ts`

## Proposed Approach

- Option A: Embed price in button label ("Book from €45/night") — requires new `priceAmount` field on `RoomCardPrice`, changes in three layers, locale interpolation risk. Higher complexity.
- Option B (chosen): Separate price label + single "Check Rates" button — add `singleCtaMode?: boolean` to shared `RoomsSection`; when true, build one action using `t("checkRatesSingle")`; price block remains above button unchanged.
- Option C: Keep dual buttons + price label — already partial state; does not address UX goal of reducing decision paralysis.
- **Chosen approach: Option B.** Lowest complexity, backwards-compatible, no type changes to `RoomCard` or `RoomCardPrice`. Price display and button count are independently controlled. Rollback is setting `singleCtaMode` back to false.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `singleCtaMode` prop to shared RoomsSection | 85% | S | Pending | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add `checkRatesSingle` i18n key to all 18 locales | 80% | S | Pending | - | TASK-03 |
| TASK-03 | IMPLEMENT | Wire `singleCtaMode` in brikette adapter | 85% | S | Pending | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add unit tests for single-CTA mode | 75% | S | Pending | TASK-01, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | None | Run in parallel — independent |
| 2 | TASK-03 | TASK-01 complete + package rebuilt; TASK-02 complete | Wire adapter; depends on new prop and new i18n key |
| 3 | TASK-04 | TASK-01, TASK-03 complete | Tests verify the end-to-end render |

## Tasks

---

### TASK-01: Add `singleCtaMode` prop to shared RoomsSection

- **Type:** IMPLEMENT
- **Deliverable:** Modified `packages/ui/src/organisms/RoomsSection.tsx` — adds `singleCtaMode?: boolean` prop; when true, builds one action instead of two
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — the change is a single prop addition with a conditional in the `actions` array builder. Full file read confirms the exact location (`lines 186-189`). No ambiguity in the mechanics.
  - Approach: 90% — Option B is well-evidenced as lowest-risk. The `actions` array is the only touch-point. Backwards-compatible.
  - Impact: 85% — the change is isolated to this file and has one downstream consumer (TASK-03). `RoomCard.ActionButtons` already handles 1-entry arrays correctly (confirmed by fact-find).
- **Acceptance:**
  - `singleCtaMode?: boolean` added to the RoomsSection props
  - When `singleCtaMode={true}`: only one action is built: `{ id: "nr", label: t("checkRatesSingle", { defaultValue: "Check Rates" }) }`
  - When `singleCtaMode` is `false` or `undefined`: existing dual-button behavior unchanged
  - TypeScript compiles without errors on `@acme/ui`
  - `pnpm --filter @acme/ui build` succeeds
- **Validation contract:**
  - TC-01: Render with `singleCtaMode={true}` → one button rendered with the `checkRatesSingle` label
  - TC-02: Render without `singleCtaMode` → two buttons rendered (non-refundable + flexible, existing behavior)
  - TC-03: Render with `singleCtaMode={false}` → two buttons rendered (same as TC-02)
  - TC-04: TypeScript — prop is optional and does not affect existing callers that omit it
- **Notes on test scope:** The shared `packages/ui` organism has its own Jest config at `packages/ui/jest.config.cjs`. Both configs run in CI. Tests are verified via CI only (per AGENTS.md policy — do not run Jest locally).
- **Planning validation:** `packages/ui/src/organisms/RoomsSection.tsx` lines 186-189 confirmed as the action array construction site. Props are inline (not a named interface) — adding `singleCtaMode?: boolean` to the inline type is the correct change. `ComponentProps<typeof RoomsSectionBase>` in the brikette adapter will automatically reflect the new prop.
- **Scouts:** None: all required information confirmed in fact-find.
- **Edge Cases & Hardening:**
  - `singleCtaMode` is falsy by default — no change to existing consumers
  - The `openBooking` function in the shared organism still accepts `"nonRefundable"` or `"refundable"` argument — in single mode, only `"nonRefundable"` is wired, producing `plan: "nr"` in the `onRoomSelect` callback
- **What would make this >=90%:** Running `pnpm --filter @acme/ui build` successfully with the change in place; confirming `ComponentProps` propagation works in the brikette adapter.
- **Rollout / rollback:**
  - Rollout: package rebuild required after change (`pnpm --filter @acme/ui build`)
  - Rollback: remove `singleCtaMode` prop and conditional from the file; rebuild
- **Documentation impact:** None: internal prop change to a shared component; no public API docs affected.
- **Notes / references:** `packages/ui/src/organisms/RoomsSection.tsx` lines 164-199; `packages/ui/src/molecules/RoomCard.tsx` lines 181-223 (ActionButtons — no change needed).

---

### TASK-02: Add `checkRatesSingle` i18n key to all 18 locale files

- **Type:** IMPLEMENT
- **Deliverable:** 18 modified locale files at `apps/brikette/src/locales/<lang>/roomsPage.json` — each gains `"checkRatesSingle"` key
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/ar/roomsPage.json`, `apps/brikette/src/locales/da/roomsPage.json`, `apps/brikette/src/locales/de/roomsPage.json`, `apps/brikette/src/locales/en/roomsPage.json`, `apps/brikette/src/locales/es/roomsPage.json`, `apps/brikette/src/locales/fr/roomsPage.json`, `apps/brikette/src/locales/hi/roomsPage.json`, `apps/brikette/src/locales/hu/roomsPage.json`, `apps/brikette/src/locales/it/roomsPage.json`, `apps/brikette/src/locales/ja/roomsPage.json`, `apps/brikette/src/locales/ko/roomsPage.json`, `apps/brikette/src/locales/no/roomsPage.json`, `apps/brikette/src/locales/pl/roomsPage.json`, `apps/brikette/src/locales/pt/roomsPage.json`, `apps/brikette/src/locales/ru/roomsPage.json`, `apps/brikette/src/locales/sv/roomsPage.json`, `apps/brikette/src/locales/vi/roomsPage.json`, `apps/brikette/src/locales/zh/roomsPage.json`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — all 18 locale files confirmed present with `roomsPage.json` containing `checkRatesNonRefundable`. Adding a sibling key is mechanical. A script or sequential edits both work.
  - Approach: 90% — using a new key rather than repurposing `checkRatesNonRefundable` avoids unintended side-effects if that key is used elsewhere (StickyBookNow, room detail pages).
  - Impact: 80% — Held-back test: "What single unresolved unknown would push Impact below 80?" → None. Locale files have uniform JSON structure; adding a key with EN fallback in `t()` means even if some non-EN locales retain the EN string initially, the button renders correctly. No structural risk exists that would push this below 80.
- **Acceptance:**
  - All 18 locale `roomsPage.json` files contain `"checkRatesSingle"` key
  - English value: `"Check Rates"` (placeholder; operator can update copy)
  - All other 17 locales: set to `"Check Rates"` initially (same placeholder; translation refinement is a separate follow-up task)
  - `pnpm --filter brikette typecheck` passes (JSON schema, no TS errors)
- **Validation contract:**
  - TC-01: `grep -r "checkRatesSingle" apps/brikette/src/locales/*/roomsPage.json` returns 18 matches
  - TC-02: All 18 files remain valid JSON (`JSON.parse` succeeds)
  - TC-03: The EN value is `"Check Rates"` (non-empty, not an i18n key literal)
- **Planning validation:** `apps/brikette/src/locales/en/roomsPage.json` line 287: `"checkRatesNonRefundable": "Non-Refundable Rates"` — new key `"checkRatesSingle"` should be added near this line for discoverability.
- **Scouts:** Check whether `checkRatesNonRefundable` is used outside of `RoomsSection` (room detail pages, StickyBookNow) before deciding to repurpose vs add new key. Decision: add new key regardless — the existing key may be used elsewhere.
- **Edge Cases & Hardening:** The `t("checkRatesSingle", { defaultValue: "Check Rates" })` call in TASK-01 guarantees a non-empty string even if a locale file is missing the key.
- **What would make this >=90%:** Translated copy approved by operator for at least EN/IT/DE/FR (the primary guest locales for Brikette); using the `ratesFrom` i18n key pattern for consistency.
- **Rollout / rollback:** Rollout: file edits + commit. Rollback: remove `checkRatesSingle` from all 18 files.
- **Documentation impact:** None.
- **Notes / references:** 18 confirmed locales: ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh.

---

### TASK-03: Wire `singleCtaMode` in brikette adapter

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/components/rooms/RoomsSection.tsx` — passes `singleCtaMode={true}` to `RoomsSectionBase`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/components/rooms/RoomsSection.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — the change is a single prop addition to `<RoomsSectionBase>`. The brikette adapter already uses `ComponentProps<typeof RoomsSectionBase>` so the new `singleCtaMode` prop is already in the type (once TASK-01 is complete).
  - Approach: 90% — passes through `singleCtaMode={true}` statically. No dynamic logic needed; the adapter already handles all GA4/navigation complexity.
  - Impact: 85% — this is the change that users see. The GA4 `onRoomSelect` callback in the adapter already handles `ctx.plan: "nr"` correctly — no changes needed there. The `begin_checkout` and `select_item` events will fire with `plan: "nr"` for all card CTA clicks.
- **Acceptance:**
  - `singleCtaMode={true}` passed to `RoomsSectionBase` in the brikette adapter's JSX
  - On `/en/rooms`: each room card shows one "Check Rates" button (no price above it)
  - On `/en/book` with valid dates + `OCTORATE_LIVE_AVAILABILITY=1`: each room card shows "From €X" price label above one "Check Rates" button
  - Clicking the button fires GA4 `select_item` (if `itemListId` is set) then navigates: direct to Octorate (if `queryState === "valid"`) or to `/[lang]/book` (if `queryState === "absent"`)
  - TypeScript compiles without errors (`pnpm --filter brikette typecheck`)
- **Validation contract:**
  - TC-01: `queryState === "valid"` + click → `buildOctorateUrl` called with `plan: "nr"` and `octorateRateCode = room.rateCodes.direct.nr`
  - TC-02: `queryState === "absent"` + click → navigate to `/[lang]/book`
  - TC-03: `queryState === "invalid"` + click → no navigation occurs. The button renders as enabled at the UI level; the navigation guard in the adapter (`if (queryState !== "invalid")`) prevents any `window.location` assignment. No `disabled` prop is set on the action object — this is consistent with the existing dual-button behavior.
  - TC-04: No `plan: "flex"` paths are triggered from room card CTAs after this change
- **Consumer tracing:**
  - New `singleCtaMode={true}` prop value flows to: shared `RoomsSection` → `actions` array → `RoomCard.ActionButtons` → one `<button>` rendered
  - `onRoomSelect` in the brikette adapter: unchanged — already handles `plan: "nr"` via `ctx.plan === "nr"` → `room.rateCodes.direct.nr`. No new consumer update needed.
  - `roomPrices` wiring: unchanged — still passed through `{...(roomPrices ? { roomPrices } : {})}`. Price block continues to render on `/book` when live data is available.
- **Planning validation:** `apps/brikette/src/components/rooms/RoomsSection.tsx` lines 169-176 — the `<RoomsSectionBase {...props} ... />` render block is the exact injection site for the new prop.
- **Scouts:** Confirm `queryState === "invalid"` path still prevents navigation correctly after removing the flex button. Verdict: `queryState !== "invalid"` guard on line 163 is unaffected — it checks `queryState`, not the button plan.
- **Edge Cases & Hardening:**
  - Double-click deduplication guard (`isNavigatingRef`) is unaffected — applies to all plan types
  - `pageshow` reset guard is unaffected
  - Rooms with `available: false` → `soldOut: true` in `roomPrices` → `PriceBlock` shows `soldOutLabel`; single button rendered but user is at Octorate which will show availability — acceptable
- **What would make this >=90%:** Live browser smoke-test confirming single button on `/rooms` and price+button on `/book` with live dates; GA4 debugger confirming `select_item` fires with `plan: "nr"`.
- **Rollout / rollback:**
  - Rollout: edit + commit; no environment variable changes needed
  - Rollback: remove `singleCtaMode={true}` from the JSX
- **Documentation impact:** None.
- **Notes / references:** The brikette adapter `apps/brikette/src/components/rooms/RoomsSection.tsx` line 170: `<RoomsSectionBase` is the injection site.

---

### TASK-04: Add unit tests for single-CTA mode

- **Type:** IMPLEMENT
- **Deliverable:** New/updated test file(s) covering single-CTA mode render and existing dual-button behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` (update button queries), new test file for single-CTA mode at `apps/brikette/src/test/components/` or `packages/ui/__tests__/`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — existing GA4 CTA test file confirmed at `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx`. All 7 test cases query `{ name: /checkRatesNonRefundable/i }` — these must be updated to `{ name: /checkRatesSingle/i }` after TASK-03 wires single CTA mode. New tests for single-CTA behavior follow standard Jest + RTL patterns.
  - Approach: 85% — straightforward render tests; the mock (`t: (key) => key`) returns the i18n key as-is, so button aria-labels are predictable.
  - Impact: 75% — adds useful coverage for new behavior; also prevents regression by updating existing GA4 event tests.
- **Acceptance:**
  - `ga4-11-select-item-room-ctas.test.tsx` updated: all `{ name: /checkRatesNonRefundable/i }` queries changed to `{ name: /checkRatesSingle/i }`
  - At least one new test verifies that `singleCtaMode={true}` on the shared RoomsSection renders exactly one action button
  - At least one new test verifies that the default (no `singleCtaMode`) renders two action buttons (regression guard)
  - All existing tests in `apps/brikette` and `packages/ui` continue to pass (verified via CI on push to `dev`)
  - Brikette Jest config: `apps/brikette/jest.config.cjs` (reference for CI scope)
  - UI Jest config: `packages/ui/jest.config.cjs` (reference for CI scope; existing `packages/ui/__tests__/` tests unaffected)
- **Validation contract:**
  - TC-01: Render shared `RoomsSection` with `singleCtaMode={true}` → button count = 1 per room card
  - TC-02: Render shared `RoomsSection` without `singleCtaMode` → button count = 2 per room card (regression)
  - TC-03: With `singleCtaMode={true}` and `roomPrices` set → price label rendered above single button
  - TC-04: Updated ga4-11 test: `{ name: /checkRatesSingle/i }` button query succeeds; `select_item` and `begin_checkout` GA4 events still fire correctly
  - TC-05: All 7 GA4 test cases in `ga4-11-select-item-room-ctas.test.tsx` pass after button query update
- **Planning validation:** `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` confirmed at line 51, 115, 143, 168, 199, 241, 264 — all use `{ name: /checkRatesNonRefundable/i }` as button selector. These will fail after TASK-03 wires single CTA mode. `packages/ui/__tests__/` directory has its own Jest config (`packages/ui/jest.config.cjs`) and existing tests; no `RoomsSection.test.tsx` present — new tests for single-CTA prop can be added here.
- **Scouts:** No discovery needed — test file and location confirmed above.
- **Edge Cases & Hardening:** Test `singleCtaMode={false}` explicitly → two buttons (tests the false path, not just undefined).
- **What would make this >=90%:** Additional integration test covering the click → `onRoomSelect({ plan: "nr" })` callback path.
- **Rollout / rollback:** Tests only — no production impact. Rollback = delete test file.
- **Documentation impact:** None.
- **Notes / references:** `jest.setup.ts` uses `testIdAttribute: "data-cy"` — use `data-cy` attributes in test queries. See memory: `Brikette Jest Test Patterns`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `singleCtaMode` to shared RoomsSection | Yes — props inline type at confirmed location; `t()` available in scope; `openBooking` fn already handles `"nonRefundable"` | None | No |
| TASK-02: Add `checkRatesSingle` i18n key to 18 locales | Yes — all 18 `roomsPage.json` files confirmed present and uniform | None | No |
| TASK-03: Wire brikette adapter | Partial — TASK-01 must be complete and package rebuilt before `ComponentProps` propagation is testable; TASK-02 must be complete for the key to resolve | [Ordering] Minor: dependency on package rebuild between TASK-01 and TASK-03 (standard monorepo constraint, not a plan gap) | No |
| TASK-04: Add unit tests | Partial — TASK-03 must be complete for the `checkRatesSingle` label to appear in tests; existing `ga4-11-select-item-room-ctas.test.tsx` queries for `checkRatesNonRefundable` which will fail after TASK-03 | [Ordering] Minor: TASK-04 must update ga4-11 test button queries before all brikette tests pass — dependency on TASK-03 declared. [Missing precondition] Minor: fact-find incorrectly stated no button tests exist; TASK-04 explicitly addresses the actual test file. | No (both issues mitigated by explicit dependency and updated task scope) |

No Critical simulation findings. TASK-03 ordering dependency is explicitly declared and is standard monorepo practice (rebuild `@acme/ui` before consuming in `brikette`). TASK-04 scope now explicitly covers updating the existing GA4 CTA test file.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Package rebuild step forgotten between TASK-01 and TASK-03 | Medium | Medium | Plan and build executor must run `pnpm --filter @acme/ui build` after TASK-01 |
| `checkRatesNonRefundable` copy reused on room detail pages — removal from card has no effect there | Low | None | Key is not removed; only a new `checkRatesSingle` key is added. Existing keys untouched. |
| Guest confusion: arrives at Octorate on NR plan, wants flex | Low | Low | Octorate result page shows both plans; guest can switch before completing booking |
| GA4 `plan` field now always `"nr"` from room cards — historical comparison skewed | Medium | Low | Expected behavior change; document in GA4 notes if relevant |
| `ratesFrom` key missing in non-EN locales | Low | Low | `t("ratesFrom", { defaultValue: "From €{{price}}" })` fallback covers any gap; this key is not changed by this plan |

## Observability

- Logging: None required — no new server-side code paths
- Metrics: GA4 `select_item` events — `plan` parameter should shift to 100% `"nr"` for room card CTAs post-deploy
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] Single "Check Rates" button visible on each room card on `/en/rooms` and `/en/book`
- [ ] On `/en/book` with valid dates and `OCTORATE_LIVE_AVAILABILITY=1`: "From €X" price label appears above the single button
- [ ] Button click fires GA4 `select_item` with `plan: "nr"` (when `itemListId` set) then navigates to Octorate (when `queryState === "valid"`) or to `/book` (when absent)
- [ ] All 18 locale `roomsPage.json` files contain `checkRatesSingle` key
- [ ] TypeScript passes in affected packages: `pnpm --filter @acme/ui typecheck` and `pnpm --filter brikette typecheck` (note: `apps/brikette` lint is currently a no-op — typecheck is the active gate)
- [ ] Brikette tests pass via CI (push to `dev`; tests run in CI only per AGENTS.md policy — do not run Jest locally)

## Decision Log

- 2026-02-28: Chosen Option B (separate price label + single CTA) over Option A (embedded price in button) and Option C (keep dual buttons). Rationale: lowest complexity, backwards-compatible, price display decoupled from button count. Fact-find evidence confirms `RoomCard.ActionButtons` already handles single-entry arrays.
- 2026-02-28: Static `basePrice` display on `/rooms` deferred out of scope. Default: no price on `/rooms` cards. Operator can follow up if desired.
- 2026-02-28: `checkRatesSingle` copy set to "Check Rates" as placeholder. Operator should review copy for EN/IT/DE/FR primary locales.
- 2026-02-28: New `checkRatesSingle` key added rather than repurposing `checkRatesNonRefundable` — existing key may be used in StickyBookNow or room detail pages.

## Overall-confidence Calculation

- TASK-01: min(90, 90, 85) = 85, effort S=1 → 85×1 = 85
- TASK-02: min(85, 90, 80) = 80, effort S=1 → 80×1 = 80
- TASK-03: min(90, 90, 85) = 85, effort S=1 → 85×1 = 85
- TASK-04: min(80, 85, 75) = 75, effort S=1 → 75×1 = 75
- Overall = (85+80+85+75) / 4 = 81.25% → **80%**
