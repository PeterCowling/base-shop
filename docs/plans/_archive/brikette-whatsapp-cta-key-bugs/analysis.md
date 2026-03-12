---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brikette-whatsapp-cta-key-bugs
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brikette-whatsapp-cta-key-bugs/fact-find.md
Related-Plan: docs/plans/brikette-whatsapp-cta-key-bugs/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Brikette WhatsApp CTA Key Bugs Analysis

## Decision Frame

### Summary
Two private-rooms booking pages use wrong i18n translation keys for their WhatsApp CTA buttons. This analysis selects the fix approach for each bug. Bug A (ApartmentBookContent) is a 1-line key path correction with no locale changes. Bug B (DoubleRoomBookContent) requires choosing how to expose a correct `whatsappCta` key to the component.

### Goals
- Select the cleanest fix for Bug A (wrong key path within correct namespace)
- Select the cleanest fix for Bug B (wrong key in wrong namespace)
- Avoid locale key proliferation or unnecessary namespace loading

### Non-goals
- Changing WhatsApp CTA copy
- Adding a shared i18n infrastructure
- Fixing pre-existing machine translation quality issues in vi/zh

### Constraints & Assumptions
- Constraints:
  - Must not change rendered text in any locale
  - Locale files must be updated consistently across all 18 locales
- Assumptions:
  - `apartmentPage.book.whatsappCta` is the canonical source of translated WhatsApp CTA text
  - Loading an entire namespace for one key is not ideal

## Inherited Outcome Contract

- **Why:** Two booking pages display wrong WhatsApp CTA labels. Bug B is visually broken today. Bug A is fragile and would silently break if section translations diverge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both WhatsApp CTA buttons on the apartment booking and double-room booking pages use semantically correct translation keys, eliminating label drift risk.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-whatsapp-cta-key-bugs/fact-find.md`
- Key findings used:
  - `ApartmentBookContent.tsx` line 272: `t("streetLevelArrival.whatsappCta")` → correct key is `t("book.whatsappCta")` (same text, already in all 18 locale `apartmentPage.json` files)
  - `DoubleRoomBookContent.tsx` line 259: `tRooms("moreAboutThisRoom")` renders "More About This Room" on a WhatsApp link
  - `DoubleRoomBookContent` loads `tBook = bookPage` and `tRooms = roomsPage`; neither has `whatsappCta`
  - `bookPage.json` has `apartment.*` keys already used by the double room page (`tBook("apartment.cta.flex")`)
  - All 18 locale translation values collected from `apartmentPage.book.whatsappCta`

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| No locale changes (Bug A) | Locale edits are error-prone and need 18-file consistency | High |
| Minimal locale changes (Bug B) | Fewer locale files to touch = fewer mistakes | High |
| Semantic correctness | Key name should reflect the feature, not a sibling page | High |
| No unnecessary namespace loading | Loading a large namespace for one key wastes bundle budget | Medium |
| Forward compatibility | Fix should remain correct if CTA copy diverges between room types | Medium |

## Options Considered

### Bug A — ApartmentBookContent.tsx:272

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A1 (chosen) | `t("book.whatsappCta")` — use the `book` section key | Semantically correct; no locale changes needed; key exists in all 18 locales | None | None | Yes |
| A2 | `t("privateStay.whatsappCta")` — use another existing section key | Same text value | Still semantically wrong; same fragility problem | Key drift if copy diverges | No — same problem as current code |
| A3 | Add a top-level `apartmentPage.whatsappCta` key | Clean top-level name | Requires 18 locale edits for no functional benefit | Locale coverage risk | No — unnecessary complexity when A1 exists |

### Bug B — DoubleRoomBookContent.tsx:259

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| B1 (chosen) | Add `whatsappCta` to root of `bookPage.json` in all 18 locales; use `tBook("whatsappCta")` | `tBook` already loaded; semantically correct (booking fallback is booking-generic); clean root-level placement | 18 locale file edits needed | Must cover all 18 locales | Yes |
| B2 | Load `apartmentPage` namespace in DoubleRoomBookContent; use `tApt("book.whatsappCta")` | No new locale keys | Loads entire 6kb+ `apartmentPage` namespace for one key; couples double-room semantics to apartment namespace | Namespace coupling; bundle bloat | No — wrong coupling |
| B3 | Add `whatsappCta` under `bookPage.apartment.*` | Grouped with existing apartment keys in bookPage | Semantically wrong for double-room (not apartment-specific); would require `tBook("apartment.whatsappCta")` | Copy would be semantically tied to apartment | No — should be room-agnostic |
| B4 | Add `whatsappCta` to `roomsPage.json` in 18 locales; use `tRooms("whatsappCta")` | `tRooms` already loaded | `roomsPage` is a room-listing namespace, not booking; semantically wrong home | Future confusion if `roomsPage` is split | No — wrong namespace home |

## Chosen Approach

**Bug A:** Option A1 — Change `t("streetLevelArrival.whatsappCta")` → `t("book.whatsappCta")` in `ApartmentBookContent.tsx:272`. Single-line change, no locale edits.

**Bug B:** Option B1 — Add `"whatsappCta"` at the root of `bookPage.json` in all 18 locales with values sourced from `apartmentPage.book.whatsappCta`. Change `tRooms("moreAboutThisRoom")` → `tBook("whatsappCta")` in `DoubleRoomBookContent.tsx:259`.

**Combined rationale:** A1 requires no locale work and uses the semantically appropriate key already in place. B1 puts a booking-generic fallback label in the booking namespace (`bookPage`), co-located with other booking-page labels, with values already available. The 18 locale file edits are mechanical and safe — the values are pre-collected from the canonical source.

## Rejected Options

- **A2/A3:** Using another existing key (A2) or adding a new top-level key (A3) both either repeat the same fragility or add unnecessary locale work when A1 already exists.
- **B2:** Loading the entire `apartmentPage` namespace for one key is namespace coupling — the double-room page would silently inherit apartment-specific copy if it ever diverges.
- **B3:** Nesting under `bookPage.apartment.*` makes the key semantically apartment-specific when it should be room-agnostic.
- **B4:** `roomsPage` is a listing namespace, not a booking action namespace.

## Engineering Coverage Comparison

| Coverage Area | Option A (wrong namespace loading) | Option B1 (bookPage.whatsappCta) | Chosen implication |
|---|---|---|---|
| UI / visual | Bug B still renders "More About This Room" | Renders correct WhatsApp CTA text | Fix Bug B correctly |
| UX / states | No state change | No state change | N/A |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | Tests unaffected (data-testid) | Tests unaffected (data-testid) | No test changes needed |
| Data / contracts | N/A | 18 locale files gain one root-level key | Must cover all 18 locales |
| Performance / reliability | N/A | N/A | N/A |
| Rollout / rollback | Standard deploy | Standard deploy | N/A |

## Planning Handoff Notes

1. **Bug A task:** Single-line change in `ApartmentBookContent.tsx:272`. No locale changes. Validation: visual walkthrough on apartment booking page (`/[lang]/private-rooms/book`).
2. **Bug B task:**
   - Add `"whatsappCta"` key to root of `bookPage.json` in all 18 locales (ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh)
   - Values sourced from `apartmentPage.book.whatsappCta` in each locale (all values listed in fact-find)
   - Change `DoubleRoomBookContent.tsx:259` from `tRooms("moreAboutThisRoom")` → `tBook("whatsappCta")`
   - Validation: visual walkthrough on double-room booking page (`/[lang]/private-rooms/double-room/book`)
3. Both tasks are S-effort, high-confidence, no dependencies between them — eligible for a single-wave parallel build.
4. No tests need updating — existing test uses `data-testid="whatsapp-cta"` selector only.
5. Consider combining into one IMPLEMENT task since they're both in the "WhatsApp CTA key fix" scope and neither requires research.

## End-State Operating Model

None: no material process topology change. Both changes are isolated i18n key lookups in client components. No workflow, lifecycle state, CI lane, approval path, or operator runbook is affected.

## Planning Handoff

- **Sequencing:** Bug A and Bug B are independent. Both can be executed in a single IMPLEMENT task or as two micro-tasks in the same wave.
- **Validation contract:** Visual walkthrough on `/[lang]/private-rooms/book` (apartment) and `/[lang]/private-rooms/double-room/book` (double room) to confirm CTA labels render correctly in at least two locales.
- **Locale coverage:** All 18 locale `bookPage.json` files must be edited for Bug B. Values are pre-collected in the fact-find; no translation work needed.
- **Risk transfer to plan:** Ensure the locale edit script covers all 18 locales before commit — use a programmatic approach (not manual edits) to guarantee coverage.
- **Engineering coverage carried forward:** `Data / contracts` row requires confirming 18-locale coverage; `UI / visual` row requires visual walkthrough evidence.

## Risks to Carry Forward

| Risk | Severity | Mitigation at build time |
|---|---|---|
| Locale edit misses one or more of the 18 locales | Low | Use a loop/script to add key to all locales in one pass; verify with grep after |
| Key added at wrong nesting level in `bookPage.json` | Low | Verify with JSON parse after edit |
| vi/zh machine translation quality issue (pre-existing) | Info | Out of scope; copy-as-is from `apartmentPage.book.whatsappCta` |

## Planning Readiness

Analysis is ready for planning. Approach is decisive for both bugs. All evidence is complete. No operator-only unknowns remain. Combined execution effort is S.

Critique Round 1 complete (score 4.3/5.0, verdict credible, missing sections added).

## Open Questions

None — all questions resolved in fact-find.
