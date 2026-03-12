---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-12
Feature-Slug: caryina-i18n-hardcoded-english
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/caryina-i18n-hardcoded-english/build-event.json
---

# Build Record: Caryina Chrome i18n

## Outcome Contract

- **Why:** German and Italian visitors get a mixed-language experience — translated product pages but English navigation, consent banner, footer links, and trust strip. This undermines trust, especially on legal pages where language matters.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All persistent UI chrome (header, footer, consent banner, trust strip) displays in the visitor's selected language
- **Source:** operator

## What Was Built

**TASK-01** added German and Italian translations to all 25 chrome strings in the `CHROME_DEFAULTS` constant in `apps/caryina/src/lib/contentPacket.ts`. The constant was renamed from `CHROME_EN_DEFAULTS` to `CHROME_DEFAULTS` and a JSDoc comment was added marking it as the authoritative source of truth for chrome translations. Simultaneously, the `chrome` key was removed from `data/shops/caryina/site-content.generated.json` in the same atomic commit — this ensures `getChromeContent()` falls back to `CHROME_DEFAULTS` and cannot be silently overwritten by a future materializer run. The `_manualExtension` guard in the JSON was updated to document the chrome source-of-truth migration.

**TASK-02** added `apps/caryina/src/lib/contentPacket.test.ts` with 30 locale-resolution assertions covering all 5 chrome groups (header, footer, consent, trust, notifyMe) across all 3 locales (EN/DE/IT). No module mocking was required: after TASK-01 removed the `chrome` key from the JSON, `readPayload().chrome` is `undefined` and `getChromeContent()` activates the `CHROME_DEFAULTS` path automatically.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/caryina typecheck` | Pass | Run locally before commit; CI re-validates |
| `scripts/validate-engineering-coverage.sh docs/plans/caryina-i18n-hardcoded-english/plan.md` | Pass | `{"valid":true,"skipped":false,"track":"code","errors":[],"warnings":[]}` |
| `contentPacket.test.ts` (CI only) | Pending CI | 30 assertions across 3 locales × 5 groups |

## Workflow Telemetry Summary

4 stages recorded (lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build). Total context input: 269 KB across 5 loaded modules. Deterministic checks: 7 (validate-fact-find.sh, validate-engineering-coverage.sh × 3, validate-plan.sh). Token measurement coverage: 0% (Claude session token capture not available in this run). lp-do-ideas stage record gap noted (direct dispatch path, not queue-emitted).

| Stage | Records | Avg Modules | Context Bytes (in) | Artifact Bytes | Token Coverage |
|---|---|---|---|---|---|
| lp-do-fact-find | 1 | 1.00 | 40495 | 20372 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 53644 | 14284 | 0.0% |
| lp-do-plan | 1 | 1.00 | 74242 | 25409 | 0.0% |
| lp-do-build | 1 | 2.00 | 100769 | 0 | 0.0% |

## Validation Evidence

### TASK-01
- TC-01: `getChromeContent("de").footer.terms` → `"AGB"` — confirmed via `CHROME_DEFAULTS.footer.terms.de = "AGB"` in contentPacket.ts
- TC-02: `getChromeContent("it").footer.returnsRefunds` → `"Resi e Rimborsi"` — confirmed in CHROME_DEFAULTS
- TC-03: `getChromeContent("en").header.shop` → `"Shop"` — EN values unchanged
- TC-04: `getChromeContent("de").consent.decline` → `"Ablehnen"` — confirmed in CHROME_DEFAULTS
- TC-05: `getChromeContent("it").notifyMe.submit` → `"Avvisami"` — confirmed in CHROME_DEFAULTS
- TC-06: JSON `site-content.generated.json` does not contain `chrome` key — confirmed by removal in TASK-01 atomic commit

### TASK-02
- TC-01: `getChromeContent("de").footer.terms === "AGB"` — test assertion in contentPacket.test.ts line 48
- TC-02: `getChromeContent("de").footer.returnsRefunds === "Rücksendungen & Erstattungen"` — test assertion line 53
- TC-03: `getChromeContent("it").footer.terms === "Termini"` — test assertion line 74
- TC-04: `getChromeContent("it").consent.decline === "Rifiuta"` — test assertion line 90
- TC-05: `getChromeContent("en").footer.terms === "Terms"` — test assertion line 117
- TC-06: `getChromeContent("de").notifyMe.submit === "Benachrichtige mich"` — test assertion line 68
- TC-07: `getChromeContent("it").trust.shippingLink === "Politica di spedizione"` — test assertion line 98

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | 50 new translation values added across all 5 chrome groups (25 strings × DE + IT) | Header, footer, consent, trust, notifyMe all covered |
| UX / states | DE/IT locale chrome now matches page locale; EN fallback via `localizedText(value, locale)` unchanged | No component changes; locale resolution works at data layer |
| Security / privacy | N/A | No auth, session, or data exposure changes |
| Logging / observability / audit | N/A | Static string constant; no audit trail needed |
| Testing / validation | 30 assertions in `contentPacket.test.ts` covering all 5 groups × 3 locales | Pure function test; no mocking required |
| Data / contracts | `chrome` key removed from `site-content.generated.json`; `CHROME_DEFAULTS` is now sole source; `_manualExtension` note updated | Materializer-durable: JSON chrome key gone, materializer can re-run safely |
| Performance / reliability | N/A | Additive keys in cached constant; zero runtime overhead |
| Rollout / rollback | Atomic commit (constant + JSON removal); rollback: `git revert` restores prior state | No feature flag needed |

## Scope Deviations

None. Both tasks landed exactly as planned. No controlled scope expansions.
