---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-12
Feature-Slug: brikette-whatsapp-cta-key-bugs
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/brikette-whatsapp-cta-key-bugs/build-event.json
---

# Build Record: Brikette WhatsApp CTA Key Bugs

## Outcome Contract

- **Why:** Two booking pages display wrong WhatsApp CTA labels. Bug B is visually broken today. Bug A is fragile and would silently break if section translations diverge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both WhatsApp CTA buttons on the apartment booking and double-room booking pages use semantically correct translation keys, eliminating label drift risk.
- **Source:** operator

## What Was Built

**TASK-01 — Fix WhatsApp CTA translation keys (commit `bdc26af4ab`)**

Fixed two copy-paste i18n key bugs in the private-rooms booking pages. In `ApartmentBookContent.tsx`, the WhatsApp CTA button used `t("streetLevelArrival.whatsappCta")` — a sibling section's key — instead of the semantically correct `t("book.whatsappCta")` within the same `apartmentPage` namespace. Both keys held identical text, making this a fragility bug (silent drift risk if section copy ever diverges). Fixed with a 1-line change.

In `DoubleRoomBookContent.tsx`, the WhatsApp CTA button used `tRooms("moreAboutThisRoom")` — a room-listing label from the `roomsPage` namespace — causing the button to visibly render "More About This Room" instead of a WhatsApp CTA prompt. Fixed by adding a root-level `"whatsappCta"` key to `bookPage.json` in all 18 locale files (using values sourced from `apartmentPage.book.whatsappCta`) and updating the component to use `tBook("whatsappCta")`, which was already loaded in the component.

20 files changed total: 2 TSX components + 18 locale JSON files.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter brikette typecheck` | Pass | Clean, no errors |
| `pnpm --filter brikette lint` | Pass | Clean, no warnings |
| `grep -r "streetLevelArrival.whatsappCta" apps/brikette/src/app/[lang]/private-rooms/book/` | Pass (0 results) | TC-04 |
| `grep -r "moreAboutThisRoom" apps/brikette/src/app/[lang]/private-rooms/double-room/book/` | Pass (0 results) | TC-05 |
| `grep -l '"whatsappCta"' apps/brikette/src/locales/*/bookPage.json \| wc -l` | Pass (18) | TC-06 |

## Workflow Telemetry Summary

4-stage pipeline (fact-find → analysis → plan → build) completed for this feature.

| Stage | Runs | Avg Modules | Context Bytes | Artifact Bytes | Token Coverage |
|---|---|---|---|---|---|
| lp-do-fact-find | 1 | 1.00 | 37214 | 13091 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 41163 | 10499 | 0.0% |
| lp-do-plan | 1 | 1.00 | 64823 | 14337 | 0.0% |
| lp-do-build | 1 | 2.00 | 83278 | 0 | 0.0% |

Total context input bytes: 222,478 · Artifact bytes: 37,927 · Modules: 5 · Deterministic checks: 7

Deterministic checks: `validate-fact-find.sh`, `validate-engineering-coverage.sh` (×2), `validate-analysis.sh`, `validate-plan.sh`, `validate-engineering-coverage.sh` (plan), `generate-stage-handoff-packet.sh` (×3).

## Validation Evidence

### TASK-01
- TC-04: `grep -r "streetLevelArrival.whatsappCta" apps/brikette/src/app/[lang]/private-rooms/book/` → 0 results ✓
- TC-05: `grep -r "moreAboutThisRoom" apps/brikette/src/app/[lang]/private-rooms/double-room/book/` → 0 results ✓
- TC-06: `grep -l '"whatsappCta"' apps/brikette/src/locales/*/bookPage.json | wc -l` → 18 ✓
- Typecheck: `pnpm --filter brikette typecheck` → clean ✓
- Lint: `pnpm --filter brikette lint` → clean ✓
- TC-01/TC-02/TC-03 (browser visual): QA loop waived — pure i18n key fix with no CSS/layout/structural change; double-room bug confirmed visually broken prior to fix (label was "More About This Room"); key fix delivers the correct label path. No scoped QA loop gaps identified.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | QA loop waived: pure i18n key fix, no CSS/layout/structural change | Double-room Bug B was visually broken (wrong label); key fix corrects lookup path with no rendering-side change |
| UX / states | N/A — no state machine change | WhatsApp link href behavior unchanged |
| Security / privacy | N/A — no auth or data handling change | Pure i18n key fix |
| Logging / observability / audit | N/A — no log paths affected | Pure i18n lookup |
| Testing / validation | Confirmed: `ga4-07-apartment-checkout.test.tsx` uses `data-testid="whatsapp-cta"` selector only — no text assertions; TC-04/05/06 grep checks pass | No test changes needed |
| Data / contracts | `bookPage.json` gains root-level `"whatsappCta"` in all 18 locales; TC-06 confirms count = 18 | Values sourced from canonical `apartmentPage.book.whatsappCta` per locale |
| Performance / reliability | N/A — pure i18n key lookup, no hot path change | |
| Rollout / rollback | Standard Next.js deploy; rollback = `git revert bdc26af4ab` | No data migration; safe single-commit revert |

## Scope Deviations

None. Build stayed within the 2-file TSX + 18-file JSON scope defined in TASK-01. JSON edits used a Python script to guarantee structural validity and full 18-locale coverage.
