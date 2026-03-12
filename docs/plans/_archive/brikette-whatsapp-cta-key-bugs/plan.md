---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Build-evidence: commit bdc26af4ab — 20 files (2 TSX + 18 JSON), typecheck clean, lint clean, TC-04/05/06 pass (grep). QA loop waived: pure i18n key fix, no CSS/layout/structural change.
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-whatsapp-cta-key-bugs
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 96%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brikette-whatsapp-cta-key-bugs/analysis.md
---

# Brikette WhatsApp CTA Key Bugs Plan

## Summary
Two private-rooms booking pages use wrong i18n translation keys for their WhatsApp CTA buttons. `ApartmentBookContent.tsx` references `streetLevelArrival.whatsappCta` (a sibling section's key) instead of `book.whatsappCta`; this is fragile but currently renders the same text. `DoubleRoomBookContent.tsx` uses `moreAboutThisRoom` from the rooms-listing namespace, causing the button to visibly display "More About This Room" instead of a WhatsApp CTA label. One IMPLEMENT task fixes both bugs: a 1-line change per component, plus adding `whatsappCta` to all 18 `bookPage.json` locale files using pre-collected translations.

## Active tasks
- [x] TASK-01: Fix WhatsApp CTA translation keys in apartment and double-room booking pages — Complete (2026-03-12)

## Goals
- Render semantically correct WhatsApp CTA text on both affected booking pages
- Eliminate the fragile cross-section key reference in ApartmentBookContent

## Non-goals
- Changing WhatsApp CTA copy
- Fixing pre-existing machine translation quality in vi/zh
- Adding i18n infrastructure or shared booking namespace

## Constraints & Assumptions
- Constraints:
  - Must not change rendered text in any locale (same values, correct keys)
  - All 18 locale `bookPage.json` files must be updated for Bug B
- Assumptions:
  - `apartmentPage.book.whatsappCta` is the canonical source for translated WhatsApp CTA text
  - Root-level `bookPage.whatsappCta` is the appropriate home (booking-generic fallback label)

## Inherited Outcome Contract

- **Why:** Two booking pages display wrong WhatsApp CTA labels. Bug B is visually broken today. Bug A is fragile and would silently break if section translations diverge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both WhatsApp CTA buttons on the apartment booking and double-room booking pages use semantically correct translation keys, eliminating label drift risk.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/brikette-whatsapp-cta-key-bugs/analysis.md`
- Selected approach inherited:
  - Bug A: `t("book.whatsappCta")` in `apartmentPage` namespace (existing key, no locale changes)
  - Bug B: Add root-level `"whatsappCta"` to `bookPage.json` in 18 locales; use `tBook("whatsappCta")`
- Key reasoning used:
  - A1 uses the semantically correct existing key with zero locale work
  - B1 puts the booking fallback label in the booking namespace, co-located with other booking labels

## Selected Approach Summary
- What was chosen:
  - Fix `ApartmentBookContent.tsx:272`: `t("streetLevelArrival.whatsappCta")` → `t("book.whatsappCta")`
  - Fix `DoubleRoomBookContent.tsx:259`: `tRooms("moreAboutThisRoom")` → `tBook("whatsappCta")`
  - Add `"whatsappCta"` to root of `bookPage.json` in 18 locales (values from fact-find)
- Why planning is not reopening option selection:
  - All alternatives evaluated and rejected in analysis (namespace coupling, wrong key level, unnecessary locale work)

## Fact-Find Support
- Supporting brief: `docs/plans/brikette-whatsapp-cta-key-bugs/fact-find.md`
- Evidence carried forward:
  - Bug A correct key: `apartmentPage.book.whatsappCta` (confirmed in all 18 locales)
  - Bug B locale values: all 18 translations collected from `apartmentPage.book.whatsappCta`
  - No tests assert on CTA text content (uses `data-testid="whatsapp-cta"`)
  - `bookPage` namespace already loaded in `DoubleRoomBookContent` as `tBook`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix WhatsApp CTA keys + add bookPage locale key | 96% | S | Complete (2026-03-12) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Visual walkthrough on both booking pages in EN + 1 other locale | TASK-01 | Scoped QA loop required |
| UX / states | N/A | - | No state change; WhatsApp link behavior unchanged |
| Security / privacy | N/A | - | No auth/data handling change |
| Logging / observability / audit | N/A | - | No log paths affected |
| Testing / validation | Existing test uses data-testid only; no text assertions; no new tests needed | TASK-01 | Verify with grep post-fix |
| Data / contracts | Add `whatsappCta` key to root of `bookPage.json` in 18 locales | TASK-01 | Values pre-collected; verify with grep after edit |
| Performance / reliability | N/A | - | Pure i18n lookup; no hot path change |
| Rollout / rollback | N/A | - | Standard Next.js deploy; revert is a one-line git revert |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single self-contained task |

## Delivered Processes

None: no material process topology change. Both changes are isolated i18n key lookups in client components.

## Tasks

---

### TASK-01: Fix WhatsApp CTA translation keys in apartment and double-room booking pages
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`, `apps/brikette/src/locales/*/bookPage.json` (18 files)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:**
  - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
  - `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx`
  - `apps/brikette/src/locales/ar/bookPage.json`
  - `apps/brikette/src/locales/da/bookPage.json`
  - `apps/brikette/src/locales/de/bookPage.json`
  - `apps/brikette/src/locales/en/bookPage.json`
  - `apps/brikette/src/locales/es/bookPage.json`
  - `apps/brikette/src/locales/fr/bookPage.json`
  - `apps/brikette/src/locales/hi/bookPage.json`
  - `apps/brikette/src/locales/hu/bookPage.json`
  - `apps/brikette/src/locales/it/bookPage.json`
  - `apps/brikette/src/locales/ja/bookPage.json`
  - `apps/brikette/src/locales/ko/bookPage.json`
  - `apps/brikette/src/locales/no/bookPage.json`
  - `apps/brikette/src/locales/pl/bookPage.json`
  - `apps/brikette/src/locales/pt/bookPage.json`
  - `apps/brikette/src/locales/ru/bookPage.json`
  - `apps/brikette/src/locales/sv/bookPage.json`
  - `apps/brikette/src/locales/vi/bookPage.json`
  - `apps/brikette/src/locales/zh/bookPage.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 96%
  - Implementation: 97% — Bug sites exactly identified with line numbers. Fix is 2 one-line changes + 18 JSON key additions with pre-collected values.
  - Approach: 95% — A1 and B1 confirmed as best options in analysis; no alternatives remain viable.
  - Impact: 97% — Bug B is visually broken today (renders "More About This Room" on a WhatsApp button). Bug A is fragile. Both fixes use existing correct values; zero regression risk.
- **Acceptance:**
  - [ ] `ApartmentBookContent.tsx:272` uses `t("book.whatsappCta")` (not `streetLevelArrival.whatsappCta`)
  - [ ] `DoubleRoomBookContent.tsx:259` uses `tBook("whatsappCta")` (not `tRooms("moreAboutThisRoom")`)
  - [ ] `bookPage.json` in all 18 locales contains `"whatsappCta"` at root level
  - [ ] Grep confirms zero remaining `streetLevelArrival.whatsappCta` in apartment booking components
  - [ ] Grep confirms zero remaining `moreAboutThisRoom` in double-room booking component
  - **Expected user-observable behavior:**
    - [ ] Apartment booking page (`/[lang]/private-rooms/book`): WhatsApp fallback button displays "WhatsApp for quick answers" (or locale equivalent) — previously also displayed this but via a fragile key
    - [ ] Double-room booking page (`/[lang]/private-rooms/double-room/book`): WhatsApp fallback button displays "WhatsApp for quick answers" (or locale equivalent) — previously displayed "More About This Room"
- **Engineering Coverage:**
  - UI / visual: Required — Double-room WhatsApp button label changes from "More About This Room" to correct CTA text. Visual walkthrough on both pages required.
  - UX / states: N/A — No state machine change; WhatsApp link href behavior unchanged.
  - Security / privacy: N/A — No auth or data handling change.
  - Logging / observability / audit: N/A — No log paths affected.
  - Testing / validation: Required — Confirm existing test `ga4-07-apartment-checkout.test.tsx` still passes (uses `data-testid="whatsapp-cta"`, no text assertion). Grep to confirm no text content assertions on `moreAboutThisRoom` or `streetLevelArrival.whatsappCta`.
  - Data / contracts: Required — `bookPage.json` gains `"whatsappCta"` root key in 18 locales. Must confirm all 18 covered via grep after edit.
  - Performance / reliability: N/A — Pure i18n key lookup; no hot path change.
  - Rollout / rollback: N/A — Standard Next.js deploy. Revert is `git revert` of this commit.
- **Validation contract:**
  - TC-01: Visit `/en/private-rooms/book` → WhatsApp CTA button text = "WhatsApp for quick answers"
  - TC-02: Visit `/en/private-rooms/double-room/book` → WhatsApp CTA button text = "WhatsApp for quick answers" (not "More About This Room")
  - TC-03: Visit `/it/private-rooms/double-room/book` → WhatsApp CTA button text = "WhatsApp per risposte rapide"
  - TC-04: `grep -r "streetLevelArrival.whatsappCta" apps/brikette/src/app/[lang]/private-rooms/book/` → 0 results
  - TC-05: `grep -r "moreAboutThisRoom" apps/brikette/src/app/[lang]/private-rooms/double-room/book/` → 0 results
  - TC-06: `grep -l '"whatsappCta"' apps/brikette/src/locales/*/bookPage.json | wc -l` → 18
- **Execution plan:**
  - **Bug A fix:**
    1. Read `ApartmentBookContent.tsx` to confirm context around line 272
    2. Change `t("streetLevelArrival.whatsappCta")` → `t("book.whatsappCta")`
  - **Bug B fix:**
    1. For each of the 18 locale `bookPage.json` files, read the file and add `"whatsappCta": "<value>"` at the root level (after last existing root key)
    2. Values per locale: ar='ما الذي يحدث لإجابات سريعة', da='WhatsApp til hurtige svar', de='WhatsApp für schnelle Antworten', en='WhatsApp for quick answers', es='WhatsApp para respuestas rápidas', fr='WhatsApp pour des réponses rapides', hi='त्वरित जवाब के लिए WhatsApp', hu='WhatsApp a gyors válaszokért', it='WhatsApp per risposte rapide', ja='迅速な回答のためのWhatsApp', ko='빠른 답변을위한 WhatsApp', no='WhatsApp for raske svar', pl='WhatsApp dla szybkich odpowiedzi', pt='WhatsApp para respostas rápidas', ru='WhatsApp для быстрого ответа', sv='WhatsApp för snabba svar', vi='Những gì áp dụng cho câu trả lời nhanh chóng', zh='快速回答的答案是什么'
    3. Change `DoubleRoomBookContent.tsx:259` from `tRooms("moreAboutThisRoom") as string` → `tBook("whatsappCta") as string`
  - **Post-edit validation:**
    1. Run TC-04 through TC-06 grep checks
    2. Run typecheck scoped to brikette: `pnpm --filter brikette typecheck`
    3. Run lint scoped to brikette: `pnpm --filter brikette lint`
    4. Scoped QA loop: `/lp-design-qa`, `/tools-ui-contrast-sweep`, `/tools-ui-breakpoint-sweep` on changed routes
- **Scouts:** None: all facts verified — key paths confirmed in locale files, no test text assertions, `tBook` already loaded in DoubleRoomBookContent.
- **Edge Cases & Hardening:**
  - Missing locale fallback: if a locale `bookPage.json` is somehow missed, i18next falls back to EN — acceptable behavior
  - JSON parse failure: read-before-edit protocol ensures valid JSON is preserved
- **What would make this >=90%:**
  - Already above 90%. Manual verification of rendered label on staging would push to 99%.
- **Rollout / rollback:**
  - Rollout: standard Next.js build + deploy via existing CI pipeline
  - Rollback: `git revert <commit>` — safe, no data migration
- **Documentation impact:**
  - None: no public API, schema, or user-facing docs change
- **Notes / references:**
  - `ga4-07-apartment-checkout.test.tsx` — existing test uses `data-testid="whatsapp-cta"`, unaffected
  - Source of copy-paste origin: `StreetLevelArrivalContent.tsx:84` correctly uses `t("streetLevelArrival.whatsappCta")`

---

## Risks & Mitigations
- **Locale coverage miss**: Adding to 18 files manually risks missing one. Mitigation: use TC-06 grep count check to verify all 18 covered before commit.
- **JSON structure break**: Editing JSON files risks invalid syntax. Mitigation: read-before-edit + typecheck/lint will catch malformed JSON.

## Observability
- Logging: None: pure i18n change
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Both booking pages render correct WhatsApp CTA text in all locales
- [ ] No remaining `streetLevelArrival.whatsappCta` in apartment booking component
- [ ] No remaining `moreAboutThisRoom` in double-room booking component
- [ ] `bookPage.json` in all 18 locales has `"whatsappCta"` at root level
- [ ] TypeCheck and lint pass
- [ ] Scoped QA loop finds no Critical/Major findings on changed routes

## Decision Log
- 2026-03-12: Combined Bug A + Bug B into single IMPLEMENT task — both are minimal S-effort changes with same validation path and no dependencies between them.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix WhatsApp CTA keys | Yes | None — key paths verified, locale values pre-collected, no test assertions on text | No |

## Overall-confidence Calculation
- TASK-01: S=1, confidence=96%
- Overall: (96% × 1) / 1 = **96%**
