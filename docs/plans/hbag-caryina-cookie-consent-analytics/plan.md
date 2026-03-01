---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-caryina-cookie-consent-analytics
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: create-ui-component
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG Caryina — Cookie Consent Banner + Analytics Wiring Plan

## Summary

The Caryina app has a complete analytics pipeline (client gate, server route, multi-provider backend) that is silently non-functional for all visitors because no cookie consent banner exists to set the `consent.analytics=true` cookie. This plan adds a bespoke first-party `ConsentBanner` client component to the locale layout, writes unit tests for both the banner and the analytics event route (which lacks tests), and documents the GA4 provider settings wiring for the operator to apply at deployment time. All tasks are S-effort and structurally independent once TASK-01 is complete.

## Active tasks

- [x] TASK-01: Create ConsentBanner.client.tsx component — Complete (2026-03-01)
- [x] TASK-02: Wire ConsentBanner into locale layout — Complete (2026-03-01)
- [x] TASK-03: Unit tests for ConsentBanner — Complete (2026-03-01)
- [x] TASK-04: Unit tests for analytics event route — Complete (2026-03-01)
- [x] TASK-05: Document and wire GA4 settings — Complete (2026-03-01)
- [x] TASK-06: Verify/update privacy policy content — Complete (2026-03-01)

## Goals

- Add a GDPR-compliant first-party cookie consent banner to the Caryina locale layout.
- Ensure `consent.analytics=true` is set when visitors accept, enabling all existing analytics components to fire.
- Close the test coverage gap on `/api/analytics/event/route.ts`.
- Document the two-step GA4 activation (settings.json + env var) for operator application at deploy time.
- Verify that the privacy policy page references analytics use before launch.

## Non-goals

- Full third-party CMP (OneTrust, Cookiebot, vanilla-cookieconsent) — caryina has no `gtag`; a first-party banner with one consent category is legally sufficient and architecturally correct.
- IAB TCF integration.
- Any changes to `packages/platform-core/src/analytics/` — that code is correct and complete.
- Any changes to the four existing `*Analytics.client.tsx` components — they will work automatically once consent is granted.

## Constraints & Assumptions

- Constraints:
  - Cookie name `consent.analytics` must not change — it is a shared literal between `packages/platform-core/src/analytics/client.ts:5` and `apps/caryina/src/app/api/analytics/event/route.ts:26`.
  - Banner must be a `"use client"` component — locale layout is a server component.
  - No npm package additions for consent management — native `document.cookie` API only.
  - GA4 measurement ID is operator-held; the plan documents where to set it but cannot supply it.
- Assumptions:
  - `SameSite=Lax; Path=/; Max-Age=31536000` is the standard cookie attribute set for analytics consent (standard practice; not legal advice).
  - The brikette app's `vanilla-cookieconsent` approach is intentionally not adapted here — caryina does not use `gtag` and its consent gate is a simple cookie check. The brikette component's test structure can be referenced.
  - `analyticsEnabled: true` in `data/shops/caryina/shop.json` requires no change.

## Inherited Outcome Contract

- **Why:** GDPR requires explicit consent before setting analytics cookies for EU visitors. No consent banner means the analytics pipeline is completely non-functional for all new visitors. This blocks operational measurement before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Cookie consent banner is live in the caryina layout. Analytics events are delivered to the configured provider for all consenting visitors. The operator can open GA4 Realtime debug view and see at least one event within 60 seconds of accepting consent on the live site.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/hbag-caryina-cookie-consent-analytics/fact-find.md`
- Key findings used:
  - `consent.analytics` cookie name is a shared literal between client.ts and event/route.ts — must not change.
  - All four `*Analytics.client.tsx` components call `logAnalyticsEvent` which already gates on consent — they need no changes.
  - Event route `/api/analytics/event/route.ts` has no test file — coverage gap to close.
  - `data/shops/caryina/settings.json` has `provider: "console"` — must be changed to `"ga"` with a real measurement ID for the outcome contract to be met.
  - Brikette has a `CookieConsent.tsx` using `vanilla-cookieconsent` — not appropriate for caryina's simpler architecture; build bespoke.
  - Privacy policy content is data-driven from `HBAG-content-packet.md` — analytics mention not directly verified.

## Proposed Approach

- Option A: Adapt brikette's `vanilla-cookieconsent` component — requires installing the npm package, wiring `gtag`, and restructuring consent architecture. Not appropriate for caryina's first-party-only setup.
- Option B (chosen): Build a bespoke first-party `ConsentBanner.client.tsx` using native `document.cookie`. Sets `consent.analytics=true/false`. Suppresses itself when cookie already set. Links to `/${lang}/privacy`. No npm additions. Fully compatible with the existing consent gate in `client.ts` and `event/route.ts`.
- **Chosen approach:** Option B — bespoke first-party banner. Rationale: architecturally correct for caryina (no gtag, no third-party scripts), no new dependencies, cookie contract is already defined and verified, and the test pattern from `client.test.ts` and `NotifyMeForm.client.test.tsx` provides sufficient precedent.

## Plan Gates

- Foundation Gate: Pass
  - Deliverable-Type: code-change ✓
  - Execution-Track: code ✓
  - Primary-Execution-Skill: lp-do-build ✓
  - Startup-Deliverable-Alias: none ✓
  - Delivery-readiness confidence: 85% ✓
  - Test landscape + testability: present ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create ConsentBanner.client.tsx | 85% | S | Complete (2026-03-01) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Wire ConsentBanner into locale layout | 90% | S | Complete (2026-03-01) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Unit tests for ConsentBanner | 80% | S | Complete (2026-03-01) | TASK-01 | - |
| TASK-04 | IMPLEMENT | Unit tests for analytics event route | 75% | S | Complete (2026-03-01) | - | - |
| TASK-05 | IMPLEMENT | Document and wire GA4 settings | 75% | S | Complete (2026-03-01) | - | - |
| TASK-06 | IMPLEMENT | Verify/update privacy policy content | 70% | S | Complete (2026-03-01) | - | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04, TASK-05, TASK-06 | - | TASK-01 creates the banner component; TASK-04/05/06 are fully independent and can run concurrently |
| 2 | TASK-02, TASK-03 | Wave 1: TASK-01 | Both depend on TASK-01 only; run in parallel once TASK-01 is complete |

**Max parallelism:** 4 (Wave 1)
**Critical path:** TASK-01 → TASK-02 (or TASK-03) — 2 waves
**Total tasks:** 6

## Tasks

---

### TASK-01: Create ConsentBanner.client.tsx

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/components/ConsentBanner.client.tsx` — new client component
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/caryina/src/components/ConsentBanner.client.tsx` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — entry point confirmed, cookie name confirmed (`consent.analytics`), component directory confirmed, `"use client"` pattern confirmed across all interactive caryina components. Cookie API is native.
  - Approach: 90% — native `document.cookie` read/write, React `useState` for show/hide, `useEffect` for initial cookie check. Standard pattern; brikette component provides test reference (different mechanism, same test structure approach).
  - Impact: 85% — this component is the critical enabler; without it, all analytics remain silently blocked. Cookie contract verified end-to-end.
- **Acceptance:**
  - Component file exists at `apps/caryina/src/components/ConsentBanner.client.tsx`.
  - Has `"use client"` directive.
  - On mount: reads `consent.analytics` cookie — if present (any value), banner does not render.
  - If cookie absent: banner renders with Accept and Decline buttons and a link to `/${lang}/privacy`.
  - On Accept: sets `consent.analytics=true; SameSite=Lax; Path=/; Max-Age=31536000`; banner hides.
  - On Decline: sets `consent.analytics=false; SameSite=Lax; Path=/; Max-Age=31536000`; banner hides.
  - Component accepts `lang: string` prop for the privacy policy link.
  - No npm packages added.
- **Validation contract (TC):**
  - TC-01: No `consent.analytics` cookie → banner renders with Accept and Decline buttons.
  - TC-02: `consent.analytics=true` cookie already set → banner does not render.
  - TC-03: `consent.analytics=false` cookie already set → banner does not render.
  - TC-04: Click Accept → `consent.analytics=true` cookie written with correct attributes, banner hidden.
  - TC-05: Click Decline → `consent.analytics=false` cookie written with correct attributes, banner hidden.
  - TC-06: Privacy link href is `/${lang}/privacy` for `lang="en"` → `/en/privacy`.
- **Execution plan:**
  - Red: Create `ConsentBanner.client.tsx` with `"use client"`, `useState(null)` for cookie state (null=unknown, true=accepted, false=declined), `useEffect` that reads `document.cookie` on mount to check `consent.analytics` presence, renders `null` when state is not null (cookie already set), renders banner with Accept/Decline buttons and `/${lang}/privacy` link when state is null.
  - Green: Accept handler sets `document.cookie = "consent.analytics=true; SameSite=Lax; Path=/; Max-Age=31536000"` and updates state to hide. Decline handler sets `=false` and updates state to hide.
  - Refactor: Ensure cookie write is extracted to a helper to avoid duplication between accept/decline handlers. Add `aria-label` to banner for accessibility.
- **Planning validation:**
  - None: S-effort task; no M/L planning validation required.
- **Scouts:** None: cookie contract fully verified in fact-find (client.ts:5, event/route.ts:26). Component directory pattern confirmed.
- **Edge Cases & Hardening:**
  - `document` not defined (SSR context): guard with `typeof document === "undefined"` in useEffect (pattern from `client.ts:9`).
  - Cookie string parsing: use `document.cookie.split("; ").some(c => c.startsWith("consent.analytics="))` to check presence — consistent with `client.ts:11` pattern.
- **What would make this >=90%:**
  - Impact at 90 would require GA4 measurement ID confirmed — then analytics events would definitively reach GA4 on acceptance. Currently console provider means events reach console.debug only.
- **Rollout / rollback:**
  - Rollout: additive new file; no existing code changes in this task.
  - Rollback: delete the file; no other code is affected until TASK-02 wires it in.
- **Documentation impact:**
  - None: self-contained component.
- **Notes / references:**
  - Cookie name: `consent.analytics` (must match `client.ts:5` and `event/route.ts:26`).
  - Test structure reference: `apps/brikette/src/test/components/consent/CookieConsent.test.tsx` (different cookie mechanism, same React test patterns).
  - Accessibility: banner should be announced to screen readers — use `role="dialog"` or `role="banner"` with `aria-label`.

---

### TASK-02: Wire ConsentBanner into locale layout

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/[lang]/layout.tsx` — add `<ConsentBanner lang={lang} />` import and render
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/caryina/src/app/[lang]/layout.tsx`, `[readonly] apps/caryina/src/components/ConsentBanner.client.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — locale layout is a 28-line server component; `lang` param is already resolved and in scope; adding one client child component is a single import + JSX expression.
  - Approach: 95% — standard Next.js App Router pattern: server layout renders a client component child. Pattern verified across Header, SiteFooter, CartProvider in same file.
  - Impact: 90% — without this task, the banner is never shown to any visitor.
  - Held-back test (Approach=95): No single unknown could drop below 90 — the layout file is fully read and understood.
- **Acceptance:**
  - `ConsentBanner` is imported in `apps/caryina/src/app/[lang]/layout.tsx`.
  - `<ConsentBanner lang={lang} />` is rendered inside the layout JSX (recommended: after `<SiteFooter />` or as last child of `<CartProvider>`).
  - TypeScript compiles cleanly (`pnpm --filter caryina typecheck`).
- **Validation contract (TC):**
  - TC-01: `layout.tsx` imports `ConsentBanner` from `@/components/ConsentBanner.client`.
  - TC-02: `<ConsentBanner lang={lang} />` appears in the rendered JSX tree.
  - TC-03: `pnpm --filter caryina typecheck` exits 0.
- **Execution plan:**
  - Red: Add `import { ConsentBanner } from "@/components/ConsentBanner.client";` to `layout.tsx`; add `<ConsentBanner lang={lang} />` to the JSX return (after `<SiteFooter />`).
  - Green: Run `pnpm --filter caryina typecheck` to confirm.
  - Refactor: None required — change is minimal.
- **Planning validation:**
  - None: S-effort task.
- **Scouts:** None: layout structure is fully known from fact-find investigation.
- **Edge Cases & Hardening:**
  - `lang` value: `resolveLocale` is already called before `lang` is used in this layout — `ConsentBanner` will always receive a valid locale string.
- **What would make this >=90%:**
  - Already at 90%. To reach 95%: GA4 measurement ID confirmed so the wired banner demonstrably routes events to GA4.
- **Rollout / rollback:**
  - Rollout: one import + one JSX element.
  - Rollback: remove the import and JSX element; delete `ConsentBanner.client.tsx` from TASK-01.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Consumer tracing: `ConsentBanner` receives `lang` prop; produces no output other than side-effect (cookie write + show/hide). No downstream consumer of its return value.

---

### TASK-03: Unit tests for ConsentBanner

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/components/ConsentBanner.client.test.tsx` — new test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/caryina/src/components/ConsentBanner.client.test.tsx` (new), `[readonly] apps/caryina/src/components/ConsentBanner.client.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — `document.cookie` mock pattern is established in `packages/platform-core/src/analytics/client.test.ts` (writable via `Object.defineProperty`). `@testing-library/react` is available (used in `NotifyMeForm.client.test.tsx`). `fireEvent.click` and `screen` patterns confirmed.
  - Approach: 85% — render → spy on `document.cookie` setter → simulate click → assert cookie value and banner visibility. Standard pattern.
  - Impact: 80% — tests are the only automated validation that the cookie is written correctly and the banner hides. Without this, the acceptance criteria have no automated verification.
  - Held-back test (Impact=80): Single unknown that could drop below 80? If `document.cookie` writable mock doesn't work in caryina's jsdom setup. Mitigated by: the existing `client.test.ts` in platform-core already uses `Object.defineProperty(document, "cookie", { writable: true })` and works. However, caryina's jsdom setup may differ. This is the single remaining uncertainty that keeps Impact at 80 rather than 85.
- **Acceptance:**
  - Test file at `apps/caryina/src/components/ConsentBanner.client.test.tsx`.
  - All 6 TCs from TASK-01 have corresponding test cases.
  - `pnpm --filter caryina test -- --testPathPattern=ConsentBanner` passes with 0 failures.
- **Validation contract (TC):**
  - TC-01: No cookie → `getByRole("dialog")` or banner element visible; Accept and Decline buttons present.
  - TC-02: Cookie `consent.analytics=true` pre-set → banner not rendered (`queryByRole` returns null).
  - TC-03: Cookie `consent.analytics=false` pre-set → banner not rendered.
  - TC-04: Click Accept → `document.cookie` contains `consent.analytics=true`; banner element no longer in DOM.
  - TC-05: Click Decline → `document.cookie` contains `consent.analytics=false`; banner element no longer in DOM.
  - TC-06: `lang="en"` → link href `/en/privacy` present in rendered output.
- **Execution plan:**
  - Red: Create test file. In `beforeEach`, set `document.cookie = ""` (clear). For TC-02/03, set cookie before render. For TC-04/05, spy on `document.cookie` assignment.
  - Green: Implement each TC using `render`, `screen`, `fireEvent` from `@testing-library/react`. Use `Object.defineProperty` for cookie spy.
  - Refactor: Extract `setCookieSpy` setup into a helper or `beforeEach`.
- **Planning validation:**
  - None: S-effort task.
- **Scouts:** Cookie mock: `client.test.ts` line 19: `Object.defineProperty(document, "cookie", { writable: true, value: "" })` — this pattern is available and working in the monorepo.
- **Edge Cases & Hardening:**
  - If `document.cookie` mock is read-only in jsdom: use jest `spyOn(document, "cookie", "set")` as an alternative.
- **What would make this >=90%:**
  - Run the tests first (during build) and confirm they pass. Once green, confidence on Impact rises to 90+.
- **Rollout / rollback:**
  - Rollout: new test file only.
  - Rollback: delete test file.
- **Documentation impact:**
  - None.

---

### TASK-04: Unit tests for analytics event route

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/api/analytics/event/route.test.ts` — new test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/caryina/src/app/api/analytics/event/route.test.ts` (new), `[readonly] apps/caryina/src/app/api/analytics/event/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% — `NextRequest` mock pattern is used in `apps/caryina/src/app/admin/api/auth/route.test.ts` and other route tests; `NextResponse` is mockable. `trackEvent` from `@acme/platform-core/analytics` and `getShopSettings` can be mocked via `jest.mock`.
  - Approach: 85% — construct `NextRequest` with cookies, call `POST(req)`, assert response status and body.
  - Impact: 75% — closing a pre-existing test gap; the route already works correctly in production. Tests reduce regression risk but don't deliver new functionality.
- **Acceptance:**
  - Test file at `apps/caryina/src/app/api/analytics/event/route.test.ts`.
  - `pnpm --filter caryina test -- --testPathPattern=analytics/event` passes with 0 failures.
- **Validation contract (TC):**
  - TC-01: Request with no `consent.analytics` cookie → response 202 `{ ok: true, skipped: "no-consent" }`.
  - TC-02: Request with `consent.analytics=false` cookie → response 202 `{ ok: true, skipped: "no-consent" }`.
  - TC-03: Request with `consent.analytics=true` cookie and valid `type: "page_view"` payload → response 200 `{ ok: true }`; `trackEvent` called once.
  - TC-04: Request with `consent.analytics=true` and invalid `type: "unknown_event"` → response 400 `{ error: "Invalid analytics payload" }`.
  - TC-05: `getShopSettings` returns `{ analytics: { enabled: false } }` → response 202 `{ ok: true, skipped: "analytics-disabled" }`.
- **Execution plan:**
  - Red: Create test file. `jest.mock("@acme/platform-core/analytics", () => ({ trackEvent: jest.fn() }))`. `jest.mock("@acme/platform-core/repositories/settings.server", () => ({ getShopSettings: jest.fn() }))`. Construct `NextRequest` with appropriate cookies for each TC.
  - Green: Assert `response.status` and `await response.json()` for each TC.
  - Refactor: Extract `buildRequest(cookieValue, body)` helper.
- **Planning validation:**
  - Checks run: `apps/caryina/src/app/admin/api/auth/route.test.ts` read to confirm `NextRequest` mock pattern is available.
  - Unexpected findings: None.
- **Scouts:** None — route.ts fully read in fact-find; logic is straightforward.
- **Edge Cases & Hardening:**
  - `shop.json` import in route.ts: mock with `jest.mock("../../../../../shop.json", () => ({ id: "caryina" }))`.
- **What would make this >=90%:**
  - Impact would reach 90+ if this task also caught a real bug during the test-writing. As a gap-closure task, 75 is appropriately calibrated.
- **Rollout / rollback:**
  - Rollout: new test file only.
  - Rollback: delete test file.
- **Documentation impact:**
  - None.

---

### TASK-05: Document and wire GA4 settings

- **Type:** IMPLEMENT
- **Deliverable:** `data/shops/caryina/settings.json` — update `analytics.provider` to `"ga"` and `analytics.id` to operator-supplied GA4 measurement ID; `apps/caryina/NOTES.md` — add GA4 wiring instructions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `data/shops/caryina/settings.json`, `apps/caryina/NOTES.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — settings.json schema confirmed (`analytics.provider`, `analytics.id` fields are in the provider resolution logic at `index.ts:122-135`). One-field change once ID is known.
  - Approach: 80% — JSON edit + env var documentation. Straightforward.
  - Impact: 75% — required for the outcome contract (GA4 Realtime validation), but the GA4 measurement ID is operator-held. Plan can document the change but cannot apply the real ID. Confidence is capped by this dependency.
  - Held-back test (Implementation=80): Single unknown? If the settings.json schema has changed and `analytics.id` is no longer the correct field name. Checked: `index.ts:123` reads `analytics.id` — field name is confirmed. Held-back test passes for Implementation.
- **Acceptance:**
  - `data/shops/caryina/settings.json` has `analytics.provider: "ga"` and `analytics.id: "<PLACEHOLDER or real ID>"`.
  - `apps/caryina/NOTES.md` contains a "GA4 Analytics Setup" section explaining: (1) the GA4 measurement ID format, (2) the `GA_API_SECRET` env var requirement, (3) the two fields to set in settings.json, (4) how to verify via GA4 Realtime.
  - If operator has supplied the GA4 measurement ID before this task runs: use the real ID. Otherwise: use `"G-XXXXXXXXXX"` as a placeholder and note in NOTES.md.
- **Validation contract (TC):**
  - TC-01: `data/shops/caryina/settings.json` — `analytics.provider` field is `"ga"`.
  - TC-02: `data/shops/caryina/settings.json` — `analytics.id` field is present and non-empty.
  - TC-03: `apps/caryina/NOTES.md` — contains section heading "GA4 Analytics Setup" with both `settings.json` fields and `GA_API_SECRET` env var documented.
- **Execution plan:**
  - Red: Update `data/shops/caryina/settings.json` — change `"provider": "console"` to `"provider": "ga"`, add `"id": "G-XXXXXXXXXX"` (placeholder).
  - Green: Add "GA4 Analytics Setup" section to `apps/caryina/NOTES.md`.
  - Refactor: None.
- **Planning validation:**
  - None: S-effort; settings.json schema confirmed in fact-find investigation.
- **Scouts:** `providerCache` in `index.ts` is module-level — a server restart is needed after settings.json change for the new provider to activate. Document this in NOTES.md.
- **Edge Cases & Hardening:**
  - If `GA_API_SECRET` is not set at runtime: provider resolution falls back to FileProvider (`index.ts:136`). Document the fallback in NOTES.md so the operator understands the degradation path.
- **What would make this >=90%:**
  - Operator supplies GA4 measurement ID and `GA_API_SECRET` is set in the deployment env. Then Impact rises to 90+.
- **Rollout / rollback:**
  - Rollout: one-field JSON change; operator sets env var at deploy time.
  - Rollback: revert `settings.json` to `"provider": "console"`; remove `"id"` field.
- **Documentation impact:**
  - `apps/caryina/NOTES.md` updated with GA4 setup instructions.

---

### TASK-06: Verify/update privacy policy content

- **Type:** IMPLEMENT
- **Deliverable:** `data/shops/caryina/site-content.generated.json` — confirm or update `policies.privacy.bullets` to include analytics mention; `docs/business-os/startup-baselines/HBAG-content-packet.md` — update source if bullets need changing
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `[readonly] data/shops/caryina/site-content.generated.json`, `docs/business-os/startup-baselines/HBAG-content-packet.md` (conditional)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 90% — read the JSON, check bullets, update content-packet markdown if needed.
  - Approach: 85% — straightforward content verification task.
  - Impact: 70% — legal hygiene; material for EU compliance but the privacy page is live regardless. Low risk if a minor gap exists before the banner is deployed; not a hard blocker for the technical build.
- **Acceptance:**
  - Read `data/shops/caryina/site-content.generated.json` `policies.privacy.bullets` and confirm at least one bullet mentions analytics, cookies, or data measurement.
  - If no such bullet exists: update `docs/business-os/startup-baselines/HBAG-content-packet.md` policies.privacy section to add an analytics bullet; note that `site-content.generated.json` must be regenerated by the startup-loop materializer after the source update.
  - Record finding in a comment in the plan (or in NOTES.md).
- **Validation contract (TC):**
  - TC-01: `data/shops/caryina/site-content.generated.json` `policies.privacy.bullets` contains at least one entry referencing analytics or cookie use.
  - TC-02: If TC-01 fails — `HBAG-content-packet.md` updated with analytics bullet; note added that regeneration is required.
- **Execution plan:**
  - Red: Read `data/shops/caryina/site-content.generated.json` `.policies.privacy.bullets[]` — check each entry for analytics/cookie keywords.
  - Green: If found — document as verified; no further action. If not found — add bullet to `HBAG-content-packet.md` under `policies.privacy.bullets`.
  - Refactor: None.
- **Planning validation:**
  - None: S-effort content verification.
- **Scouts:** `site-content.generated.json` path confirmed at `data/shops/caryina/site-content.generated.json` (read by `contentPacket.ts:67`).
- **Edge Cases & Hardening:**
  - If `site-content.generated.json` is stale/outdated and doesn't reflect the latest content-packet — flag this in NOTES.md; the correct fix is to regenerate, not to edit the generated file directly.
- **What would make this >=90%:**
  - Impact would rise if GDPR compliance review formally required this. For now, it is good practice rather than a hard launch gate.
- **Rollout / rollback:**
  - Rollout: content verification + optional content-packet markdown update.
  - Rollback: revert content-packet markdown change.
- **Documentation impact:**
  - `docs/business-os/startup-baselines/HBAG-content-packet.md` — possibly updated.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create ConsentBanner.client.tsx | Yes — cookie name verified, component directory confirmed, `"use client"` pattern confirmed | None | No |
| TASK-02: Wire ConsentBanner into locale layout | Yes — TASK-01 produces the component file; layout file confirmed at 28 lines; `lang` param in scope | None | No |
| TASK-03: Unit tests for ConsentBanner | Yes — TASK-01 must complete first (dependency declared); `document.cookie` mock pattern confirmed in `client.test.ts` | [Integration boundary] [Minor]: If jsdom in caryina's jest setup treats `document.cookie` as non-writable, mock pattern may need adjustment to `spyOn` approach | No |
| TASK-04: Unit tests for analytics event route | Yes — independent of banner tasks; route.ts fully read; `NextRequest` mock pattern confirmed from existing route tests | None | No |
| TASK-05: Document and wire GA4 settings | Partial — GA4 measurement ID is operator-held; placeholder approach documented | [Missing data dependency] [Moderate]: GA4 measurement ID not in repo; outcome contract cannot be met without it; task produces placeholder only | No — plan handles this with placeholder + documentation |
| TASK-06: Verify/update privacy policy content | Yes — `site-content.generated.json` path confirmed; content-packet source path confirmed | [Missing domain coverage] [Minor]: Generated JSON may be stale if content-packet was recently updated; operator should regenerate before launch if content-packet is modified | No |

No Critical simulation findings. Status: Active eligible.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GA4 measurement ID never supplied — console provider stays active | High | Medium | TASK-05 documents the two-step change; outcome contract notes this is a soft-blocker for GA4 validation |
| `document.cookie` not writable in caryina jsdom setup | Low | Low | TASK-03 notes fallback: `spyOn(document, "cookie", "set")` |
| Privacy policy bullets don't mention analytics — EU compliance gap | Low (unverified) | Medium | TASK-06 reads and patches if needed before launch |
| `providerCache` not invalidated after settings.json change | Low | Low | TASK-05 documents server restart requirement in NOTES.md |
| High visitor decline rate — analytics coverage low post-launch | Medium | Low | Expected and legally required; not a mitigation target |

## Observability

- Logging: `ConsoleProvider` (current) logs `analytics <event>` via `console.debug` server-side. Post-TASK-05 with GA provider: no server log; events reach GA4 Measurement Protocol endpoint.
- Metrics: `data/shops/caryina/analytics-aggregates.json` — `page_view` counts will start accumulating for consenting visitors once banner is live.
- Alerts/Dashboards: GA4 Realtime report — operator validates events within 60 seconds of accepting consent on staging.

## Acceptance Criteria (overall)

- [ ] `ConsentBanner.client.tsx` exists and passes all 6 TCs from TASK-01.
- [ ] Locale layout renders `<ConsentBanner lang={lang} />` and typechecks cleanly.
- [ ] `pnpm --filter caryina test -- --testPathPattern=ConsentBanner` passes (0 failures).
- [ ] `pnpm --filter caryina test -- --testPathPattern=analytics/event` passes (0 failures).
- [ ] `data/shops/caryina/settings.json` has `analytics.provider: "ga"` and `analytics.id` set.
- [ ] `apps/caryina/NOTES.md` contains GA4 setup section.
- [ ] `data/shops/caryina/site-content.generated.json` privacy bullets verified (TASK-06).

## Decision Log

- 2026-02-28: Chose bespoke first-party banner (Option B) over adapting brikette's `vanilla-cookieconsent` (Option A). Rationale: caryina has no `gtag`, consent gate is a plain cookie check, no npm package additions needed. Cookie contract already defined and verified end-to-end.

## Overall-confidence Calculation

- All tasks S=1 (weight 1 each).
- Scores: 85 + 90 + 80 + 75 + 75 + 70 = 475
- Overall = 475 / 6 = 79.2 → **80%** (rounded to nearest 5)
