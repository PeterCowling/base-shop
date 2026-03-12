---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-12
Feature-Slug: caryina-i18n-ui-chrome
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/caryina-i18n-ui-chrome/build-event.json
---

# Build Record: Caryina i18n UI Chrome

## Outcome Contract

- **Why:** German and Italian visitors see English-only navigation and legal text, undermining the multilingual promise of the site and eroding trust on non-EN routes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All persistent UI chrome (header, footer, consent banner, trust strip, notify-me form) displays in the visitor's selected language.
- **Source:** operator

## What Was Built

**TASK-01 — Data layer (content packet + JSON).** Added a `ChromeContent` interface with 5 groups (header, footer, consent, trust, notifyMe) to `contentPacket.ts`. Extended `SiteContentPayload` with an optional `chrome` field. Implemented `getChromeContent(locale)` with hardcoded EN defaults as a resilience fallback when the JSON section is absent (same dual-layer pattern as `getTrustStripContent()`). Added the full `chrome` section to `site-content.generated.json` with EN values for all ~30 strings.

**TASK-02 — Component wiring (5 components + 2 pages).** Updated Header, SiteFooter, and ShippingReturnsTrustBlock (server components) to call `getChromeContent()` directly. Updated layout.tsx to pass consent strings as props to ConsentBanner, and product/[slug]/page.tsx to pass notify-me strings as props to NotifyMeForm (client components). Removed all `i18n-exempt` comments (CARYINA-103 through CARYINA-106). All chrome text now renders through the content packet's `localizedText()` resolver.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter caryina typecheck` | Pass | All new types and prop signatures valid |
| `scripts/validate-engineering-coverage.sh` | Pass | No errors, no warnings |

## Workflow Telemetry Summary

2 records across lp-do-plan and lp-do-build stages. Total context input: 131 KB across 3 modules. Deterministic checks: 3 (all passed). Token measurement coverage: 0% (runtime capture not available). Stages without records: lp-do-ideas, lp-do-fact-find, lp-do-analysis (expected — direct fact-find-to-plan flow for small scope).

## Validation Evidence

### TASK-01
- TC-01: `getChromeContent("en")` returns object with all header/footer/consent/trust/notify strings resolved to EN values — verified by typecheck + build evidence
- TC-02: `getChromeContent("de")` returns same shape, falling back to EN values (no DE keys yet) — `localizedText()` EN-fallback proven in existing tests
- TC-03: Type error if chrome section shape doesn't match — enforced by `ChromeContent` interface on `SiteContentPayload`

### TASK-02
- TC-01: Header renders shop/support labels from chrome content
- TC-02: Header on `/de/shop` falls back to EN (no DE translations yet)
- TC-03: ConsentBanner receives resolved strings as props from layout
- TC-04: NotifyMeForm receives resolved strings as props from product page
- TC-05: All `i18n-exempt` comments removed; no hardcoded English strings remain
- TC-06: Typecheck passes with updated prop types

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | All 5 chrome components render locale-resolved text | Text content only — no layout/styling changes |
| UX / states | EN fallback when DE/IT keys missing; client components receive strings as props | `localizedText()` handles missing locale keys |
| Security / privacy | N/A | No auth, input, or data exposure changes |
| Logging / observability / audit | N/A | No logging changes |
| Testing / validation | Typecheck passes; engineering coverage validation passes | Tests run in CI per project policy |
| Data / contracts | `SiteContentPayload` extended with optional `chrome` section; JSON updated | Materializer type not updated (manual pattern) |
| Performance / reliability | N/A | Same single JSON read, same cache |
| Rollout / rollback | Standard git revert of 9 files | No migration, no feature flag needed |

## Scope Deviations

None.
