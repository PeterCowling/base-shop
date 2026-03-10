---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO | I18n | Routing
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-guide-ssr-i18n-seeding
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-guide-ssr-i18n-seeding/plan.md
Trigger-Why: Live guide pages leak raw i18n keys into server-rendered HTML, weakening first-pass crawl quality and creating an SSR/client mismatch.
Trigger-Intended-Outcome: type: measurable | statement: Server-rendered guide HTML resolves human-readable guide titles and footer widget copy on first response for representative `/en/experiences/*`, `/en/help/*`, and `/en/how-to-get-here/*` pages. | source: operator
---

# Brikette Guide SSR I18n Seeding Fact-Find Brief

## Scope
### Summary
Investigate and fix guide/article pages whose initial HTML contains raw guide keys and shared widget translation keys even though the hydrated client view is correct. The target is the shared guide render path used by article routes under experiences, assistance/help, and how-to-get-here.

### Goals
- Confirm the live failure pattern with concrete raw HTML evidence.
- Identify the exact SSR/hydration mismatch in the guide rendering stack.
- Fix the shared server render path so human-readable copy is present in initial HTML.
- Add regression coverage for representative guide samples across all three route families.

### Non-goals
- Rewriting guide content or translations.
- Refactoring unrelated sitemap or route canonicalization code.
- Auditing non-guide pages.

### Constraints & Assumptions
- Constraints:
  - Guide pages are rendered through a shared client wrapper and template stack.
  - Local Jest execution is CI-only per repo policy.
  - Live verification beyond the current deployed site is not possible until a deploy occurs.
- Assumptions:
  - The raw key leak is caused by guide bundles being available only after client hydration.
  - Fixing the shared guide wrapper covers `/experiences/*`, `/assistance/*`, and `/how-to-get-here/*` article routes together.

## Outcome Contract
- **Why:** Live guide pages leak raw i18n keys into server-rendered HTML, weakening first-pass crawl quality and creating an SSR/client mismatch.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Server-rendered guide HTML resolves human-readable guide titles and footer widget copy on first response for representative `/en/experiences/*`, `/en/help/*`, and `/en/how-to-get-here/*` pages.
- **Source:** operator

## Access Declarations
- `https://hostel-positano.com` - public read access via `curl` for live HTML verification.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` - experiences article route.
- `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` - help/assistance article route.
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` - transport article route.
- `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx` - shared client wrapper used by all three route families.
- `apps/brikette/src/app/_lib/guide-i18n-bundle.ts` - server bundle loader that prepares guide-specific `guides` bundles.

### Key Modules / Files
- `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`
  - Calls `useTranslation("guides")` before the server bundle is merged into the client i18n store.
  - Seeds `serverGuides` and `serverGuidesEn` only inside a `useEffect`, which does not run during SSR.
- `apps/brikette/src/app/_lib/guide-i18n-bundle.ts`
  - Loads a slim per-guide `guides` bundle for the requested locale and optional English fallback.
- `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - Consumes guide translations synchronously during render via `useGuideTranslations`, `useGuideMeta`, `useDisplayH1Title`, and `useGuideContent`.
- `apps/brikette/src/routes/guides/guide-seo/components/FooterWidgets.tsx`
  - Resolves `content.<guideKey>.planChoiceTitle` and renders `PlanChoice` / `TransportNotice`.
- `apps/brikette/src/components/guides/PlanChoice.tsx`
  - Falls back to raw keys like `components.planChoice.title` and option labels when translations are missing at render time.
- `apps/brikette/src/components/guides/TransportNotice.tsx`
  - Falls back to raw keys like `transportNotice.title` and `transportNotice.items.airlink` when translations are missing at render time.
- `apps/brikette/src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx`
  - Current tests explicitly assert that guide bundles are not seeded before the first translation hook, which matches the broken behavior.

### Patterns & Conventions Observed
- Shared article route families all load guide data server-side, then pass `serverGuides` and `serverGuidesEn` to the same `GuideContent` wrapper.
- Assistance index already uses synchronous render-time seeding of i18n bundles before `useTranslation()` hooks run.
  - Evidence: `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
- Raw-key fallback behavior is intentional in leaf components to degrade gracefully, but it becomes an SEO problem when the store is not primed during SSR.

### Data & Contracts
- Types/schemas/events:
  - `GuideI18nBundle` in `apps/brikette/src/app/_lib/guide-i18n-bundle.ts`
- Persistence:
  - Guide translations live in `apps/brikette/src/locales/*/guides*.json`
- API/contracts:
  - `loadGuideI18nBundle(lang, guideKey)` is the server-side contract for guide page translation seeding.

### Dependency & Impact Map
- Upstream dependencies:
  - `getTranslations(lang, ["guides"])`
  - `extractGuideBundle(lang, guideKey)`
  - `readCentralGuideBundle(lang, guideKey)`
- Downstream dependents:
  - `GuideContent`
  - `GuideSeoTemplate`
  - `PlanChoice`
  - `TransportNotice`
- Likely blast radius:
  - Guide/article SSR only across experiences, help, and how-to-get-here.
  - Existing client hydration behavior tests will need to be updated because they currently enshrine the broken timing.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest + React Testing Library
- Commands:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette lint`
- CI integration:
  - Jest coverage runs in CI only per repo policy.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Guide bundle extraction | Unit | `apps/brikette/src/test/app/experiences/extractGuideBundle.test.ts` | Confirms per-guide bundle includes shared keys and current guide content only. |
| Guide hydration seeding | Unit | `apps/brikette/src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx` | Confirms bundle seeding occurs in `useEffect`; currently asserts no render-phase priming. |
| Placeholder detection utilities | Unit | `apps/brikette/src/test/utils/detectRenderedI18nPlaceholders.ts` | Can be reused to detect raw keys in SSR output. |

#### Coverage Gaps
- No regression test for server-rendered guide HTML containing translated H1/footer widget text.
- No coverage for representative samples across experiences/help/how-to-get-here route families.
- No test that fails when raw keys such as `cheapEats` or `components.planChoice.title` appear in SSR output.

#### Testability Assessment
- Easy to test:
  - Synchronous guide bundle priming behavior.
  - SSR HTML output using `renderToString` with mocked route/template dependencies.
- Hard to test:
  - Full live deployment verification before shipping.
- Test seams needed:
  - A server-render probe around `GuideContent` with real bundle data and minimal mocked layout dependencies.

#### Recommended Test Approach
- Unit tests for:
  - render-phase bundle priming before the first guide translation hook.
  - SSR HTML for representative guide samples across all three route families.
- Validation checks:
  - scoped `typecheck` and `lint`.

## External Research (If Needed)
- Live HTML evidence sampled from:
  - `https://hostel-positano.com/en/experiences/cheap-eats-in-positano`
  - `https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus`

## Questions
### Resolved
- Q: Is the leak route-specific or shared?
  - A: Shared. All three article route families pass through `GuideContent`, which is where bundle seeding happens too late.
  - Evidence: `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx`, `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx`, `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`
- Q: Is the server already loading the right guide bundle?
  - A: Yes. `loadGuideI18nBundle()` prepares the right per-guide data; the problem is when it is merged into the runtime store.
  - Evidence: `apps/brikette/src/app/_lib/guide-i18n-bundle.ts`
- Q: Why does live raw HTML contain `cheapEats` and footer widget keys?
  - A: Because `GuideContent` seeds the `guides` bundle inside `useEffect`, so SSR renders with fallback keys before hydration corrects the view.
  - Evidence: `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`
- Q: Do we already have a working pattern elsewhere in the app?
  - A: Yes. `AssistanceIndexContent` merges server bundles synchronously during render before its translation hooks run.
  - Evidence: `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
- Q: Is the live issue reproducible?
  - A: Yes. `curl` on `cheap-eats-in-positano` returns raw-key matches for `cheapEats`, `components.planChoice.*`, and `transportNotice.*`, and the raw H1 is `cheapEats`.
  - Evidence: local `curl` verification on 2026-03-08

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 91%
  - Evidence basis: one shared wrapper controls the broken timing.
  - What raises this to >=80: already met.
  - What raises this to >=90: ship render-phase seeding and SSR regression tests for sampled guides.
- Approach: 88%
  - Evidence basis: assistance index already uses the same pattern successfully, but guide routes have wider surface area.
  - What raises this to >=80: already met.
  - What raises this to >=90: prove route-family samples pass the SSR placeholder audit.
- Impact: 90%
  - Evidence basis: live HTML already confirms the SEO-facing defect.
  - What raises this to >=80: already met.
  - What raises this to >=90: validate no representative SSR sample leaks raw keys after the fix.
- Delivery-Readiness: 93%
  - Evidence basis: no external dependencies or operator decisions are blocked.
  - What raises this to >=80: already met.
  - What raises this to >=90: complete scoped validation.
- Testability: 87%
  - Evidence basis: SSR probes are possible, but current tests explicitly encode the broken behavior and need reshaping.
  - What raises this to >=80: already met.
  - What raises this to >=90: land a dedicated SSR HTML regression test over representative samples.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Render-time seeding causes duplicate or stale bundle writes on navigation | Medium | Medium | Track bundle priming by guide/lang per component instance and keep merge semantics deterministic. |
| Tests only validate one guide key and miss section-family regressions | Medium | High | Add representative sample coverage across experiences, assistance/help, and how-to-get-here. |
| Shared `guides` store priming affects unrelated components unexpectedly | Low | Medium | Keep scope limited to the existing per-guide slim bundle and English fallback bundle already used in hydration. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Live HTML verification | Yes | None | No |
| Shared guide wrapper and server bundle loader | Yes | None | No |
| Route family entry points | Yes | None | No |
| Footer widget/tokenized content block path | Yes | None | No |
| Existing tests and placeholder detection helpers | Yes | None | No |

## Scope Signal
- Signal: right-sized
- Rationale: The defect is localized to a shared guide render path plus a bounded set of regression tests.

## Evidence Gap Review
### Gaps Addressed
- Verified the live SEO symptom with raw HTML, not only user report.
- Traced all three route families to the same wrapper rather than auditing them independently.
- Confirmed the server bundle loader already provides the needed data.

### Confidence Adjustments
- Reduced testability to 87% because the current hydration test suite explicitly asserts the old broken seeding order and must be rewritten carefully.

### Remaining Assumptions
- The deployed site will reflect the fix without additional CDN/runtime transforms once the app is redeployed.
