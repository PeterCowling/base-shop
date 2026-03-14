---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brikette-whatsapp-cta-key-bugs
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/brikette-whatsapp-cta-key-bugs/analysis.md
Trigger-Why: Two private-rooms booking pages display wrong WhatsApp CTA text due to copy-paste of translation keys. One page reads from the wrong i18n section (semantically incorrect, fragile). The other renders a room-listing label on a booking action button (visually wrong for users).
Trigger-Intended-Outcome: type: operational | statement: Both WhatsApp CTA buttons on the apartment booking page and double-room booking page render the correct semantically-scoped translation keys, eliminating the risk of unexpected label drift if section-specific translations diverge. | source: operator
---

# Brikette WhatsApp CTA Key Bugs Fact-Find Brief

## Scope

### Summary
Two private-rooms booking pages use wrong i18n translation keys for their WhatsApp CTA buttons.

- **Bug A (ApartmentBookContent):** Uses `t("streetLevelArrival.whatsappCta")` within the `apartmentPage` namespace. This references a `streetLevelArrival` section key on an apartment booking page. Currently returns the same text ("WhatsApp for quick answers") but is semantically wrong and fragile: if `streetLevelArrival.whatsappCta` is ever made specific to street-level-arrival guidance, the apartment booking page would silently inherit the wrong label. The correct key is `t("book.whatsappCta")`, which maps to `apartmentPage.book.whatsappCta` — an existing key in all 18 locales with the correct value.

- **Bug B (DoubleRoomBookContent):** Uses `tRooms("moreAboutThisRoom")` — a `roomsPage` namespace key meaning "More About This Room" — as the label for a WhatsApp link. This is visually wrong right now: users see a booking fallback action button labeled "More About This Room". The fix is to add a `whatsappCta` key to `bookPage.json` in all 18 locales (values already exist in `apartmentPage.book.whatsappCta`) and use `tBook("whatsappCta")`.

Both bugs trace to copy-paste from the `StreetLevelArrivalContent` (the original source of the WhatsApp CTA pattern), where the key was correct.

### Goals
- Fix `ApartmentBookContent.tsx:272` to use `t("book.whatsappCta")` (correct semantic key, same text, no locale changes needed)
- Fix `DoubleRoomBookContent.tsx:259` to use `tBook("whatsappCta")` after adding the key to `bookPage.json` in all 18 locales

### Non-goals
- Changing any WhatsApp CTA copy
- Fixing the two correct pages (`PrivateStayContent`, `StreetLevelArrivalContent`)
- Adding new translation infrastructure or locale coverage tooling
- Addressing the vi/zh machine translation quality issues (pre-existing)

### Constraints & Assumptions
- Constraints:
  - Must not change rendered text in any locale (same values, just semantically correct keys)
  - Must not break existing tests — tests use `data-testid="whatsapp-cta"` selector, not text content
  - Must add `whatsappCta` to all 18 locale `bookPage.json` files (not just EN)
- Assumptions:
  - `apartmentPage.book.whatsappCta` is the canonical source of the translated WhatsApp CTA text
  - Adding `whatsappCta` at the root of `bookPage.json` is the right scope (generic booking fallback, not room-type-specific)

## Outcome Contract

- **Why:** Two booking pages display wrong WhatsApp CTA labels. Bug B (DoubleRoomBookContent) is visually broken today; Bug A (ApartmentBookContent) is fragile and will break silently if section-specific translations diverge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both WhatsApp CTA buttons on the apartment booking and double-room booking pages use semantically correct translation keys, eliminating label drift risk.
- **Source:** operator

## Current Process Map

None: local code path only. This change affects only i18n key resolution in two client components. No multi-step process, CI/deploy lane, approval path, or operator runbook is affected.

## Evidence Audit (Current State)

### Bug A — ApartmentBookContent.tsx

| Fact | Evidence |
|---|---|
| File | `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` |
| Namespace | `t` = `useTranslation("apartmentPage", { lng: lang })` (line 63) |
| Buggy key | `t("streetLevelArrival.whatsappCta")` at line 272 |
| Correct key | `t("book.whatsappCta")` — resolves to `apartmentPage.book.whatsappCta` |
| Key exists in all locales | Yes — confirmed via grep across 18 locales |
| EN value | "WhatsApp for quick answers" |
| Code change | 1 line |
| Locale changes | None |
| Tests affected | None (test uses `data-testid="whatsapp-cta"`) |

### Bug B — DoubleRoomBookContent.tsx

| Fact | Evidence |
|---|---|
| File | `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` |
| Loaded namespaces | `tBook = bookPage`, `tRooms = roomsPage` (lines 66–67); no `apartmentPage` namespace loaded |
| Buggy key | `tRooms("moreAboutThisRoom")` at line 259 = "More About This Room" (a room-listing label) |
| `bookPage.json` has `whatsappCta`? | No — must add |
| `roomsPage.json` has `whatsappCta`? | No |
| Fix | Add `whatsappCta` to root of `bookPage.json` in all 18 locales; use `tBook("whatsappCta")` |
| Source values | `apartmentPage.book.whatsappCta` in each locale |
| Locale changes | 18 files (`bookPage.json` in ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh) |
| Tests affected | None |

### Locale translation values (from `apartmentPage.book.whatsappCta`)

| Locale | Value |
|---|---|
| ar | 'ما الذي يحدث لإجابات سريعة' |
| da | 'WhatsApp til hurtige svar' |
| de | 'WhatsApp für schnelle Antworten' |
| en | 'WhatsApp for quick answers' |
| es | 'WhatsApp para respuestas rápidas' |
| fr | 'WhatsApp pour des réponses rapides' |
| hi | 'त्वरित जवाब के लिए WhatsApp' |
| hu | 'WhatsApp a gyors válaszokért' |
| it | 'WhatsApp per risposte rapide' |
| ja | '迅速な回答のためのWhatsApp' |
| ko | '빠른 답변을위한 WhatsApp' |
| no | 'WhatsApp for raske svar' |
| pl | 'WhatsApp dla szybkich odpowiedzi' |
| pt | 'WhatsApp para respostas rápidas' |
| ru | 'WhatsApp для быстрого ответа' |
| sv | 'WhatsApp för snabba svar' |
| vi | 'Những gì áp dụng cho câu trả lời nhanh chóng' |
| zh | '快速回答的答案是什么' |

### Correct pages (reference only)

- `PrivateStayContent.tsx:95` — `t("privateStay.whatsappCta")` in `apartmentPage` ns — CORRECT
- `StreetLevelArrivalContent.tsx:84` — `t("streetLevelArrival.whatsappCta")` in `apartmentPage` ns — CORRECT (source of copy-paste)

## Key Files and Roles

1. `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` — Bug A: fix line 272
2. `apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx` — Bug B: fix line 259
3. `apps/brikette/src/locales/*/bookPage.json` (18 files) — add `whatsappCta` key

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Bug B renders "More About This Room" on a WhatsApp button — visually wrong | Users see wrong label on double-room booking page | Confirm rendered label changes correctly post-fix |
| UX / states | N/A | No state change; WhatsApp link behavior unchanged | None | No |
| Security / privacy | N/A | No auth, input, or data handling change | None | No |
| Logging / observability / audit | N/A | No log paths affected | None | No |
| Testing / validation | Required | One test (`ga4-07-apartment-checkout.test.tsx`) uses `data-testid="whatsapp-cta"` — unaffected by key change | No new tests needed; existing test still valid | Confirm no test assertions on text content |
| Data / contracts | Required | `bookPage.json` adds one new root-level key across 18 locales | Must add to all 18 locales; missing key falls back to EN (acceptable) | Ensure all 18 locales covered |
| Performance / reliability | N/A | Pure i18n key lookup; no hot path change | None | No |
| Rollout / rollback | N/A | Standard Next.js deploy; no feature flags needed | None | No |

## Open Questions

All resolved.

1. **What is the correct key for ApartmentBookContent?** Resolved: `t("book.whatsappCta")` in `apartmentPage` namespace — existing key in all 18 locales.
2. **What key should DoubleRoomBookContent use?** Resolved: add `whatsappCta` to root of `bookPage.json` (namespace already loaded as `tBook`) across 18 locales; copy values from `apartmentPage.book.whatsappCta`.
3. **Do any tests assert on the CTA label text?** Resolved: No — only `data-testid` selector used.
4. **Should the double room use a different key from the apartment?** Resolved: Same WhatsApp fallback CTA text is appropriate; `bookPage.whatsappCta` is room-agnostic.

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| vi/zh locale values are questionable quality ("Những gì áp dụng..." for vi, "快速回答的答案是什么" for zh) | Low | Already present | Pre-existing issue in `apartmentPage.json`; copying these values doesn't worsen the situation; out of scope for this fix |
| `bookPage.json` key added at wrong level (nested vs root) | Low | Low | Using root-level `whatsappCta` — plan task will verify structure matches existing key conventions in `bookPage.json` |
| A future locale is added and `bookPage.whatsappCta` is missing | Low | Low | Standard i18n tooling handles missing keys with EN fallback |

## Evidence Gap Review

### Gaps Addressed
- Confirmed correct key path exists in `apartmentPage.json` (`book.whatsappCta`) for all 18 locales
- Confirmed `bookPage.json` has no existing `whatsappCta` key (must add)
- Confirmed `roomsPage.json` has no existing `whatsappCta` key
- Confirmed no test assertions on CTA text content
- Collected all 18 locale translation values from canonical source

### Confidence Adjustments
- None — evidence is complete. Both fixes are fully specified with exact key paths and locale values.

### Remaining Assumptions
- `bookPage.whatsappCta` at root level (not nested under `apartment`) is the right location — rationale: WhatsApp fallback is booking-generic, not room-type-specific.

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 97% | Bug sites exactly identified with line references. Bug A: 1-line change, existing key. Bug B: 1-line change + add key to 18 locale files with pre-collected values. |
| Approach | 95% | No architectural decision needed. Correct key paths are unambiguous. bookPage root-level `whatsappCta` is the natural home for a booking-generic fallback label. |
| Impact | 99% | Bug B is visually broken today. Bug A is fragile. Both fixes are purely additive — no behavior change, same text, just correct keys. Zero regression risk. |
| Delivery-Readiness | 97% | All locale values pre-collected. Key paths verified. No unknowns remain. |
| Testability | 90% | Existing test uses `data-testid` selector — unaffected. Visual walkthrough on booking pages is the validation path. |

**What reaches 80%+:** Already there across all dimensions.
**What would reach 100%:** Manual verification of the rendered label in staging after fix — standard for any UI text change.

## Analysis Readiness

The fact-find is ready for analysis. All minimum evidence requirements are met:

- Both bug sites identified with exact file paths and line numbers
- Root cause established for each (wrong key, wrong namespace)
- Correct fix specified with exact key paths
- All 18 locale values collected from canonical source
- Engineering Coverage Matrix complete with all 8 canonical rows
- Test landscape confirmed: no assertions on text content, no test changes needed
- Scope is narrow: 2 component lines + 18 locale one-liners

No operator-only unknowns remain. Critique Round 1 complete (score 4.2/5.0, verdict credible, 2 minor improvements applied).

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ApartmentBookContent.tsx key path | Yes | None | No |
| DoubleRoomBookContent.tsx key path | Yes | None | No |
| `bookPage.json` locale coverage (18 locales) | Yes | None | No |
| Test impact assessment | Yes | None | No |
| `apartmentPage.json` source value collection | Yes | None | No |

## Scope Signal

Signal: right-sized

Rationale: Two isolated i18n key fixes. One requires no locale changes (existing key), one requires adding a key to 18 files with values already sourced from the existing locale data. No architecture decisions. Clear validation path.

## Access Declarations

None — all evidence is in the local repository.
