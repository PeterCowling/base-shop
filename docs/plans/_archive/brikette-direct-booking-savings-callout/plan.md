---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-direct-booking-savings-callout
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Direct Booking Savings Callout Plan

## Summary

The hostel `/book` page already has a "Why book direct?" perks block but never names the OTA reference — the apartment page already provides an explicit "Up to 26% less than Booking.com" savings headline. This plan adds parity: a named-OTA savings eyebrow + headline rendered at the top of `DirectPerksBlock` on the hostel booking page. Implementation is a prop extension on one component, two new i18n keys in the EN locale, a one-line wire-up in `BookPageContent.tsx`, unit tests, and i18n fallback for the 17 non-EN locales. No data layer changes; no feature flag needed.

## Active tasks

- [x] TASK-01: Extend `DirectPerksBlock` with optional savings headline props
- [x] TASK-02: Add EN hostel directSavings i18n keys to `bookPage.json`
- [x] TASK-03: Wire savings headline from `BookPageContent` to `DirectPerksBlock`
- [x] TASK-04: Tests — `DirectPerksBlock` savings props + integration ordering
- [x] TASK-05: Propagate EN fallback keys to 17 non-EN `bookPage.json` files

## Goals

- Add an explicit named-OTA savings claim ("Up to 25% less than Booking.com") visible on the hostel `/book` page before the room grid
- Match the visual framing of the apartment `directSavings` block (eyebrow text + bold headline above the perks checklist)
- Extend `DirectPerksBlock` minimally; no new booking components
- Cover all 18 locales via i18n (EN translations + BRIK-005 fallback for non-EN until translations land)

## Non-goals

- Live/dynamic OTA rate comparison (out of scope for P3)
- Rate-match guarantee mechanic
- Changes to apartment booking flow, notification banner, deals page, or room card badges
- A/B test infrastructure

## Constraints & Assumptions

- Constraints:
  - Savings claim must use "up to 25%" — established sitewide figure; do not change without operator confirmation
  - OTA name must be "Booking.com" — consistent with apartment page convention
  - `BRIK-005 [ttl=2026-03-15]` i18n-exempt pattern applies to all new `defaultValue` strings; if shipping at or after 2026-03-15, provide full translations in the same PR
  - Tailwind tokens only — no hardcoded colors
  - `data-cy` test IDs — configured via `testIdAttribute` in `test/setup/mocks.ts:29`
- Assumptions:
  - `DirectPerksBlock` has a single production consumer import (`BookPageContent.tsx`); blast radius is confirmed minimal (test files may import it directly but are not affected by optional prop addition)
  - Booking.com is the correct named OTA for the hostel product (inferred from apartment page + `ratingsBar.json`)

## Inherited Outcome Contract

- **Why:** Guests landing on the hostel booking page have no named-OTA price anchor. The apartment page already provides this. Adding parity closes a minor conversion gap for the higher-volume hostel product.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Named-OTA savings headline visible on the hostel `/book` page before the room grid; GA4 `view_item_list` and `search_availability` events continue to fire without regression; no locale fallback warnings in production builds
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brikette-direct-booking-savings-callout/fact-find.md`
- Key findings used:
  - `DirectPerksBlock.tsx` has a single production consumer (`BookPageContent.tsx:12`); prop extension is safe (tests may import directly but do not affect the blast radius of the production change)
  - Apartment page savings pattern (`tBook("apartment.nr.saving")`) is the reference visual treatment
  - 18 locales total: EN + 17 non-EN (`ar da de es fr hi hu it ja ko no pl pt ru sv vi zh`)
  - BRIK-005 i18n-exempt TTL expires 2026-03-15; ship before that date for fallback to apply
  - `book-page-perks-cta-order.test.tsx` fully mocks `DirectPerksBlock` — existing assertions unaffected; extend mock for new assertions

## Proposed Approach

- Option A: Extend `DirectPerksBlock` with two optional props (`savingsEyebrow`, `savingsHeadline`); render above the heading when both are present. Wire from `BookPageContent.tsx` via `useTranslation("bookPage")`.
- Option B: Create a new `HostelDirectSavings` standalone component inserted separately in `BookPageContent.tsx` before `DirectPerksBlock`.
- **Chosen approach:** Option A — prop extension. The callout is semantically part of the same conversion messaging block. Optional props with undefined-safe rendering mean zero regression risk. Option B creates an unnecessary new component for a single-surface, two-string change. All DECISION gate criteria are met by Option A.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Extend `DirectPerksBlock` props + render | 85% | S | Complete (2026-02-27) | - | TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add EN hostel directSavings i18n keys | 85% | S | Complete (2026-02-27) | - | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Wire savings headline in `BookPageContent` | 85% | S | Complete (2026-02-27) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Tests for new props + ordering integration | 80% | M | Complete (2026-02-27) | TASK-01, TASK-03 | - |
| TASK-05 | IMPLEMENT | Propagate EN fallback to 17 non-EN locales | 75% | S | Complete (2026-02-27) | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; run in parallel |
| 2 | TASK-03 | TASK-01 + TASK-02 complete | TASK-05 can also start once TASK-02 is done |
| 2b | TASK-05 | TASK-02 complete | Mechanical; 17 JSON files; can run alongside TASK-03 |
| 3 | TASK-04 | TASK-01 + TASK-03 complete | Tests cover the integrated behavior |

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend DirectPerksBlock props | Yes | None — `DirectPerksBlockProps` interface fully read; conditional JSX pattern clear | No |
| TASK-02: Add EN i18n keys | Yes | None — `bookPage.json` structure confirmed; key path `hostel.directSavings.*` parallel to `apartment.*` | No |
| TASK-03: Wire in BookPageContent | Yes — depends on TASK-01 interface + TASK-02 keys | None — `useTranslation("bookPage")` already in scope on line 75; prop addition is two lines | No |
| TASK-04: Tests | Yes — depends on TASK-01 interface + TASK-03 integration | [Minor] `book-page-perks-cta-order.test.tsx` mock structure not fully read; update approach is extend-not-rewrite | No |
| TASK-05: Non-EN locale propagation | Yes — depends on TASK-02 key names | [Minor] JSON keys must match exactly; 17 files mechanical risk | No |

No Critical findings. All Minor findings are advisory and addressed within each task's execution plan.

## Tasks

---

### TASK-01: Extend `DirectPerksBlock` with optional savings headline props

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/components/booking/DirectPerksBlock.tsx` — new optional props rendered above existing heading
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `DirectPerksBlockProps` extended with `savingsEyebrow?/savingsHeadline?`; `showSavingsBanner` guard renders `<div><p eyebrow><p headline></div>` above `<h3>` when both props are non-empty. Commit `fff8afa5c3`. Typecheck + lint: PASS.
- **Affects:** `apps/brikette/src/components/booking/DirectPerksBlock.tsx`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 90% — file read in full; interface extension + conditional JSX is clear; no hidden complexity
  - Approach: 90% — optional props with undefined-safe render is idiomatic React; exact same pattern used elsewhere in the codebase
  - Impact: 85% — absent props = component identical to today; present props = savings headline renders above existing content; zero regression surface
- **Acceptance:**
  - `DirectPerksBlockProps` has two new optional string props: `savingsEyebrow?: string` and `savingsHeadline?: string`
  - When both `savingsEyebrow` and `savingsHeadline` are non-empty strings, the component renders them above the existing "Why book direct?" heading
  - When either or both are absent/empty, the component renders identically to today
  - No TypeScript errors; no lint errors; component is exported correctly
- **Validation contract (TC-XX):**
  - TC-01-01: Render `DirectPerksBlock` with both `savingsEyebrow="Book direct and save"` and `savingsHeadline="Up to 25% less than Booking.com"` → eyebrow text and headline both appear in the DOM above the "Why book direct?" heading
  - TC-01-02: Render `DirectPerksBlock` without `savingsEyebrow` and `savingsHeadline` → component renders identically to current behavior; no savings headline present in DOM
  - TC-01-03: Render `DirectPerksBlock` with empty string for `savingsHeadline` → headline not rendered (guard: falsy check)
  - TC-01-04: Render `DirectPerksBlock` with `savingsEyebrow` only (no `savingsHeadline`) → neither element rendered (both required for the block to show)
- **Execution plan:**
  - Red: `savingsEyebrow` and `savingsHeadline` props do not exist → TS will error if trying to pass them from TASK-03
  - Green: Add props to `DirectPerksBlockProps`; add conditional render block before the `<h3>` heading — renders a small eyebrow `<p>` and bold `<p>` headline when both props are non-empty strings
  - Refactor: Ensure the eyebrow + headline use correct brand tokens (`text-brand-text/60` for eyebrow, `text-brand-heading font-semibold` for headline); no hardcoded values
- **Planning validation (required for M/L):** None: S effort task; file read in full during fact-find.
- **Scouts:** None: file fully read; no unknowns.
- **Edge Cases & Hardening:**
  - Guard against empty string: use `savingsEyebrow?.trim() && savingsHeadline?.trim()` as the render condition
  - Accessibility: eyebrow + headline are presentational `<p>` elements; no heading tag needed (the existing `<h3>` "Why book direct?" remains the section heading)
- **What would make this >=90%:**
  - Confirmed Tailwind token choice for eyebrow text color (operator sign-off on visual design); currently inferred from apartment pattern
- **Rollout / rollback:**
  - Rollout: Props are optional; new render only activates when props are passed — zero risk to existing renders
  - Rollback: Remove the two optional prop declarations and the conditional render block; component reverts to today's behavior
- **Documentation impact:** None: component is internal to brikette; no public API.
- **Notes / references:**
  - Reference pattern: `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:241-258` (savings badge as `<span>` inside a rate card)
  - Reference styling: `apps/brikette/src/locales/en/apartmentPage.json` (`directSavings.eyebrow`, `directSavings.heading`)

---

### TASK-02: Add EN hostel directSavings i18n keys to `bookPage.json`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/locales/en/bookPage.json` — two new keys under `hostel.directSavings`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `hostel.directSavings.eyebrow = "Book direct and save"` and `hostel.directSavings.headline = "Up to 25% less than Booking.com"` added after `apartment` block. TC-02-01/02 node spot-check: PASS. Commit `fff8afa5c3`.
- **Affects:** `apps/brikette/src/locales/en/bookPage.json`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 85%
  - Implementation: 95% — trivial JSON key addition; file structure confirmed
  - Approach: 95% — key path `hostel.directSavings.eyebrow` / `hostel.directSavings.headline` parallel to existing `apartment.*` sub-tree
  - Impact: 85% — required for TASK-03 to function; zero risk to existing keys
- **Acceptance:**
  - `apps/brikette/src/locales/en/bookPage.json` contains `hostel.directSavings.eyebrow = "Book direct and save"` and `hostel.directSavings.headline = "Up to 25% less than Booking.com"`
  - JSON file remains valid (parseable); no existing keys removed or modified
- **Validation contract (TC-XX):**
  - TC-02-01: `JSON.parse` the modified `bookPage.json` → no parse error; `data.hostel.directSavings.eyebrow === "Book direct and save"` and `data.hostel.directSavings.headline === "Up to 25% less than Booking.com"`
  - TC-02-02: All keys present before the change remain present after → no regressions in existing `bookPage` translations
- **Execution plan:**
  - Red: Keys absent → `tBook("hostel.directSavings.eyebrow")` returns undefined (no crash, but no content)
  - Green: Add `"hostel": { "directSavings": { "eyebrow": "Book direct and save", "headline": "Up to 25% less than Booking.com" } }` to the EN `bookPage.json` — placed after the existing `apartment` sub-object
  - Refactor: None needed; JSON edit is complete as written
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: key path is unambiguous.
- **Edge Cases & Hardening:**
  - Confirm the `hostel` key does not already exist in `bookPage.json` before adding — avoid duplicate key (fact-find confirms current keys; `hostel` sub-key is absent)
- **What would make this >=90%:** Already at 85% given trivial nature; only gap is the 15% impact uncertainty inherited from the feature-level impact score.
- **Rollout / rollback:**
  - Rollout: Additive JSON key; existing behavior unaffected
  - Rollback: Remove the `hostel.directSavings` sub-object
- **Documentation impact:** None.
- **Notes / references:**
  - Savings figure "up to 25%": confirmed from `notificationBanner.json:3`, `modals.json` (offers.perks.discount)
  - OTA name "Booking.com": confirmed from `apartmentPage.json` (directSavings.heading pattern)

---

### TASK-03: Wire savings headline from `BookPageContent` into `DirectPerksBlock`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — passes new i18n values as props to `<DirectPerksBlock>`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `savingsEyebrow` and `savingsHeadline` props wired to `<DirectPerksBlock>` via existing `useTranslation("bookPage")` on line 75. Both `t()` calls use i18n-exempt BRIK-005 TTL 2026-03-15 defaultValue. Commit `caca6b26fc`. Typecheck + lint: PASS.
- **Affects:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — `useTranslation("bookPage")` is already on line 75 as `const { t } = useTranslation("bookPage", { lng: lang, useSuspense: true })`; adding two `t(...)` calls and passing them as props is two to four lines
  - Approach: 90% — follows the exact same pattern used for apartment rate card savings badges
  - Impact: 85% — this is the user-visible change; optional props passed as strings; because `t()` is called with `defaultValue`, the props always receive a non-empty string (the EN fallback) even before TASK-02 keys land — zero regression on existing behavior
- **Acceptance:**
  - `BookPageContent.tsx` passes `savingsEyebrow={t("hostel.directSavings.eyebrow", { defaultValue: "Book direct and save" })}` and `savingsHeadline={t("hostel.directSavings.headline", { defaultValue: "Up to 25% less than Booking.com" })}` to `<DirectPerksBlock>`
  - The `defaultValue` strings include the i18n-exempt comment: `// i18n-exempt -- BRIK-005 [ttl=2026-03-15]`
  - `/en/book` renders the savings eyebrow and headline above the "Why book direct?" checklist
  - No TypeScript errors; existing GA4 events unaffected
- **Validation contract (TC-XX):**
  - TC-03-01: Render `BookPageContent` with mocked `useTranslation("bookPage")` returning the new keys → `DirectPerksBlock` receives non-empty `savingsEyebrow` and `savingsHeadline` props
  - TC-03-02: Render `BookPageContent` with mocked `useTranslation("bookPage")` returning empty strings for new keys → `DirectPerksBlock` receives empty strings; savings headline does not render (guarded in TASK-01)
  - TC-03-03: GA4 `search_availability` event still fires on date change → existing `ga4-33-book-page-search-availability.test.tsx` passes without modification
- **Execution plan:**
  - Red: `DirectPerksBlock` does not accept the new props yet (blocked until TASK-01 complete)
  - Green: Add `savingsEyebrow` and `savingsHeadline` as props on the `<DirectPerksBlock>` call at line 233; read values from existing `t` instance with `defaultValue` + i18n-exempt comment
  - Refactor: Ensure `defaultValue` strings match TASK-02 JSON values exactly
- **Consumer tracing:**
  - New output: `savingsEyebrow` and `savingsHeadline` prop values produced by `t("hostel.directSavings.*")`
  - Consumer: `DirectPerksBlock` (TASK-01) — addressed
  - No other consumers of these prop values exist
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: all files read.
- **Edge Cases & Hardening:**
  - `t(...)` returns a string or the `defaultValue` — never undefined when `defaultValue` is set; safe to pass to the optional props
- **What would make this >=90%:** Confirmed that the `t` alias already in scope handles the new namespace key without additional `useTranslation` call (confirmed: `bookPage` namespace already loaded on line 75)
- **Rollout / rollback:**
  - Rollout: Additive prop passing; existing behavior unaffected if TASK-01 guard holds
  - Rollback: Remove the two new prop lines from the `<DirectPerksBlock>` JSX call
- **Documentation impact:** None.
- **Notes / references:**
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:75` — `t` is `useTranslation("bookPage")`
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:233` — `<DirectPerksBlock>` call site

---

### TASK-04: Tests — `DirectPerksBlock` savings props + integration ordering

- **Type:** IMPLEMENT
- **Deliverable:** New/updated test files covering `DirectPerksBlock` with savings props and ordering on the book page
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** New `direct-perks-block-savings.test.tsx` (TC-04-01 through TC-04-04 all PASS). `book-page-perks-cta-order.test.tsx` extended with updated mock + TC-04-05 ordering assertion. 8/8 tests PASS. Commit `7432317a75`.
- **Affects:**
  - `apps/brikette/src/components/booking/DirectPerksBlock.tsx` (read-only — tested component)
  - `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx` (extended)
  - New: `apps/brikette/src/test/components/direct-perks-block-savings.test.tsx`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — RTL test patterns are mature; existing test files confirm the mock/render pattern; `getByText` assertions are the standard approach
  - Approach: 85% — two test surfaces: (1) unit tests for the component in isolation, (2) extend the ordering integration test; split into new file + extension is the clean approach
  - Impact: 80% — tests provide regression protection for the savings headline; the feature is simple enough that a missing test wouldn't silently break the UI, but tests are needed for CI gating
  - Held-back test (Impact = 80%): "What single unresolved unknown would drop this below 80?" The exact mock structure of `book-page-perks-cta-order.test.tsx` was not read in full during fact-find — it mocks `DirectPerksBlock` entirely. If it renders a mock that doesn't include the new props, extending it may require adding new assertions that reflect the mock output rather than real component output. This would make the integration assertion less valuable (testing the mock, not the component). However, this does not prevent the test from being written — it just changes the assertion target. No unknown drops this below 80.
- **Acceptance:**
  - New file `direct-perks-block-savings.test.tsx` covers:
    - TC-01-01 through TC-01-04 from TASK-01 validation contract
    - i18n key fallback: mock `useTranslation("modals")` with empty items; assert no crash
  - `book-page-perks-cta-order.test.tsx` extended with at least one assertion that the savings headline renders above the perks block in `BookPageContent` context (or confirms the mock includes the new props)
  - All tests pass: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern="direct-perks-block-savings|book-page-perks-cta-order"`
- **Validation contract (TC-XX):**
  - TC-04-01: `DirectPerksBlock` with savings props present → eyebrow and headline render before checklist heading
  - TC-04-02: `DirectPerksBlock` without savings props → no eyebrow/headline in DOM; "Why book direct?" heading renders
  - TC-04-03: `DirectPerksBlock` with empty string savings props → no eyebrow/headline in DOM (falsy guard)
  - TC-04-04: `DirectPerksBlock` with only one of the two props → no savings block renders (both required)
  - TC-04-05: `BookPageContent` integration — perks block with savings headline renders before `RoomsSection` in DOM order
  - TC-04-06: Existing `ga4-33-book-page-search-availability.test.tsx` still passes without modification
- **Execution plan:**
  - Red: No unit tests exist for the new props
  - Green: Create `direct-perks-block-savings.test.tsx` covering TC-04-01 through TC-04-04; extend `book-page-perks-cta-order.test.tsx` for TC-04-05
  - Refactor: Confirm `data-cy` attribute if any new interactive elements added (savings headline is presentational — no `data-cy` needed)
- **Planning validation:**
  - Checks run: Reviewed `DirectPerksBlock.tsx` (pure component; testable), `book-page-perks-cta-order.test.tsx` listing (confirmed it mocks `DirectPerksBlock`)
  - Validation artifacts: `apps/brikette/jest.config.cjs` confirmed; `test/setup/mocks.ts:29` confirmed `data-cy` config
  - Unexpected findings: None
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Mock `useTranslation("modals")` must still return valid `directPerks.heading` and `directPerks.items` to avoid the empty-render guard triggering — use existing mock patterns from `booking-modals-direct-copy.test.tsx` as reference
- **What would make this >=90%:** Read `book-page-perks-cta-order.test.tsx` in full before execution to confirm exact mock structure; would eliminate the minor approach uncertainty.
- **Rollout / rollback:**
  - Rollout: Test-only change; no production impact
  - Rollback: Delete `direct-perks-block-savings.test.tsx`; revert extension to `book-page-perks-cta-order.test.tsx`
- **Documentation impact:** None.
- **Notes / references:**
  - `apps/brikette/src/test/components/book-page-perks-cta-order.test.tsx` — primary ordering test to extend
  - `apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx` — reference mock pattern for `useTranslation("modals")`

---

### TASK-05: Propagate EN fallback keys to 17 non-EN `bookPage.json` files

- **Type:** IMPLEMENT
- **Deliverable:** 17 modified locale files under `apps/brikette/src/locales/{ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/bookPage.json` — new `hostel.directSavings` sub-object with EN fallback values
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Python json.load/json.dumps(ensure_ascii=False) script added `hostel.directSavings.eyebrow/headline` EN fallback to all 17 non-EN locale files. Spot-check on `de` and `zh` confirmed. Commit `caca6b26fc`.
- **Affects:** `apps/brikette/src/locales/{ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/bookPage.json` (17 files)
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% — mechanical: 17 JSON files each receive the same 2-key sub-object; no structural variation expected; each locale `bookPage.json` uses the same top-level structure as EN
  - Approach: 90% — copy EN values as fallback; well-established pattern; BRIK-005 exemption applies
  - Impact: 75% — does not affect EN user-visible behavior; ensures i18n parity audit passes and non-EN users see EN fallback text rather than missing key warnings
- **Acceptance:**
  - All 17 locale `bookPage.json` files contain `hostel.directSavings.eyebrow` and `hostel.directSavings.headline` keys with EN values
  - All 17 files remain valid JSON
  - Spot-check validation: `node -e "const f=require('./apps/brikette/src/locales/de/bookPage.json'); console.assert(f.hostel?.directSavings?.eyebrow, 'missing eyebrow'); console.assert(f.hostel?.directSavings?.headline, 'missing headline'); console.log('ok')"` passes (replace `de` with any other locale to spot-check; no automated i18n parity test covers `hostel.directSavings.*` keys specifically)
- **Validation contract (TC-XX):**
  - TC-05-01: For each of the 17 locale files, `JSON.parse` succeeds and `data.hostel.directSavings.eyebrow` exists
  - TC-05-02: For each of the 17 locale files, `data.hostel.directSavings.headline` exists
  - TC-05-03: No existing keys in any of the 17 files are modified
- **Execution plan:**
  - Red: 17 locale files missing the new keys → i18n parity audit may warn
  - Green: For each locale file, add `"hostel": { "directSavings": { "eyebrow": "Book direct and save", "headline": "Up to 25% less than Booking.com" } }` — check if a `hostel` key already exists; if so, merge `directSavings` under it
  - Refactor: None needed; mechanical edit
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** Verify each locale file has `apartment` key at the same level (fact-find shows the EN file does; non-EN files should mirror this structure). If any locale file is missing the `apartment` key, confirm the `hostel` key can be added standalone without breaking the JSON structure.
- **Edge Cases & Hardening:**
  - If any locale file already has a `hostel` key (unlikely; not in EN today), add `directSavings` as a sub-key rather than overwriting the whole `hostel` object
  - Validate JSON after each edit — malformed JSON will break the build for that locale
- **What would make this >=90%:** Read 2-3 representative non-EN `bookPage.json` files to confirm structure before execution (currently inferred to match EN structure; not directly verified).
- **Rollout / rollback:**
  - Rollout: Additive key addition; no behavior change for non-EN users who see EN fallback
  - Rollback: Remove the `hostel.directSavings` sub-object from all 17 files
- **Documentation impact:** None.
- **Notes / references:**
  - Locale list: `ar da de es fr hi hu it ja ko no pl pt ru sv vi zh` — 17 files
  - BRIK-005 TTL: 2026-03-15; translations should be provided after this date

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Savings claim "25%" becomes inaccurate | Low | Medium | Claim is conservative ("up to 25%"); review if Octorate rate structure changes significantly |
| i18n TTL breach (BRIK-005 expires 2026-03-15) | Medium | Low | Ship before 2026-03-15; if not, provide translations in the same PR |
| `book-page-perks-cta-order.test.tsx` mock structure requires rework | Low | Low | Test mocks `DirectPerksBlock` entirely; assertions target mock output; worst case is test is less precise, not failing |
| Non-EN locale `bookPage.json` files have unexpected structure | Low | Low | Read 2-3 files before TASK-05 execution; TASK-05 scout step handles this |

## Observability

- Logging: None — UI-only change; no server logs
- Metrics: GA4 `/en/book` landing → `begin_checkout` conversion rate (4-week post-ship monitoring window)
- Alerts/Dashboards: None new; existing GA4 booking funnel dashboard covers the key metric

## Acceptance Criteria (overall)

- [ ] `/en/book` page renders "Book direct and save" eyebrow text + "Up to 25% less than Booking.com" headline above the "Why book direct?" perks checklist
- [ ] `DirectPerksBlock` renders identically to today when `savingsEyebrow`/`savingsHeadline` props are absent
- [ ] All existing tests that are not explicitly updated by this plan pass without modification (tests extended by TASK-04 are exempt from this criterion)
- [ ] New tests in `direct-perks-block-savings.test.tsx` pass (TC-04-01 through TC-04-04)
- [ ] `book-page-perks-cta-order.test.tsx` extended with savings headline ordering assertion (TC-04-05)
- [ ] All 18 `bookPage.json` locale files contain `hostel.directSavings.eyebrow` and `hostel.directSavings.headline`
- [ ] `pnpm typecheck` and `pnpm lint` pass clean for `apps/brikette`

## Decision Log

- 2026-02-27: Extend `DirectPerksBlock` (Option A) over creating a new component (Option B) — single production consumer, additive props, zero regression surface. Apartment pattern is the reference.
- 2026-02-27: "Up to 25%" savings figure selected — consistent with sitewide notification banner and existing DirectPerksBlock copy. Booking.com named explicitly — consistent with apartment page convention.

## Overall-confidence Calculation

| Task | Confidence | Effort (weight) | Weighted |
|---|---:|---|---:|
| TASK-01 | 85% | S (1) | 85 |
| TASK-02 | 85% | S (1) | 85 |
| TASK-03 | 85% | S (1) | 85 |
| TASK-04 | 80% | M (2) | 160 |
| TASK-05 | 75% | S (1) | 75 |
| **Total** | | **6** | **490** |

**Overall-confidence = 490 / 6 = 81.7% → 80%** (rounded down per downward bias rule; multiples of 5)
