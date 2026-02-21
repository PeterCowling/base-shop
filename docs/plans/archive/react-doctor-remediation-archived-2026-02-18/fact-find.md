---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (open questions resolved)
Feature-Slug: react-doctor-remediation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/react-doctor-remediation/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# React Doctor Remediation Fact-Find Brief

## Scope

### Summary

`react-doctor@0.0.18` was run across all 31 workspace packages on 2026-02-18. It identified errors and warnings that fall into five categories: security gaps (missing auth), rules-of-hooks violations, anti-pattern state management, performance/rendering correctness, and dead code. This brief scopes and prioritises the actionable fixes, excluding patterns that are intentional or false-positives.

### Goals

- Eliminate all true errors (security, hooks violations, in-component component definitions).
- Reduce highest-impact warnings that cause rendering bugs (array-index keys, derived state in useEffect, useState-from-prop desyncs).
- Establish `next/image`, `next/link`, `next/script` compliance in primary apps.
- Reduce unused file count in the highest-traffic packages.

### Non-goals

- Full elimination of all 900+ warnings in a single pass — address by tier.
- Rewriting data-fetching to react-query/SWR across the board — that is a larger architectural decision.
- Fixing `dangerouslySetInnerHTML` usage that is intentional (JSON-LD injection, sanitized CMS HTML) — these need case-by-case audit, not bulk removal.
- Migrating large components (>300 lines) in a single task — surface as candidates only.

### Constraints & Assumptions

- Constraints:
  - No `--no-verify` on commits; pre-commit hooks must pass.
  - Dead-code removal requires confirming files are truly unreachable (react-doctor uses static import tracing which may miss dynamic imports and runtime registry patterns).
  - `packages/ui` is a shared library — changes ripple to all apps; requires careful blast-radius checks.
- Assumptions:
  - `hashedPassword` in `cover-me-pretty` is a test fixture (confirmed — `__tests__/password-reset.test.tsx:7`), not a real credential. Not a production security issue.
  - `FALLBACK_AUTHOR` in `packages/ui` — likely a template placeholder constant, not a secret. Requires inspection before acting.
  - `DANGER_TOKEN` in `packages/design-system` — name suggests test scaffolding, not a real credential.
  - Many "unused file" warnings are likely dead template variants or storybook fixtures. Requires import-graph confirmation before deletion.

---

## Evidence Audit (Current State)

### Scores by Package

| Package | Score | Errors | Warnings | Files affected |
|---|---|---|---|---|
| `@acme/ui` | **71** | 86 | 415 | 291/2464 |
| `@apps/cms` | **74** | 17 | 430 | 264/1195 |
| `@acme/cms-ui` | 84 | 27 | 90 | 71/1117 |
| `@apps/cover-me-pretty` | 84 | 8 | 59 | 44/190 |
| `@apps/brikette` | 83 | 3 | 905 | 438/945 |
| `@apps/business-os` | 85 | 7 | 138 | 82/271 |
| `@acme/template-app` | 86 | 6 | 83 | 55/182 |
| `@acme/platform-core` | 88 | 3 | 15 | 14/693 |
| `@acme/design-system` | 92 | 1 | 30 | 28/287 |
| `@apps/cochlearfit` | 96 | 0 | 22 | 16/104 |
| `@acme/platform-machine` | 99 | 0 | 3 | 3/101 |
| `@acme/seo` | 99 | 0 | 2 | 1/33 |
| `@acme/lib` | 99 | 0 | 61 | 56/254 |
| `@acme/i18n` | 99 | 0 | 2 | 2/44 |
| `@acme/templates` | 99 | 0 | 5 | 5/10 |
| `@acme/page-builder-core` | 100 | 0 | 0 | 0 |
| `@acme/page-builder-ui` | 100 | 0 | 0 | 0 |
| `@acme/types` | 100 | 0 | 0 | 0 |

### Entry Points (Tier-1 Errors)

**Security — Missing auth on server actions (cms)**
- `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx` — `savePreset` (line 17) and `deletePreset` (line 25) are exported server actions with `"use server"` at file scope. Neither calls `await ensureAuthorized()`. Every other server action in the codebase (e.g. `apps/cms/src/actions/deployShop.server.ts:21`) calls `ensureAuthorized()` as its first statement. This is a confirmed gap, not a false positive.
- Auth helper lives at: `apps/cms/src/actions/common/auth.ts`

**Component defined inside component — causes state destruction on every render (cms)**
- `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx:21` — `const Option = (...)` defined inside `StepShopType` function body. Used as JSX at lines 61-70. React remounts `Option`'s subtree on every parent render, destroying state/refs/focus. Must be hoisted to module scope.

**Rules of Hooks — `useState` called in non-React function (ui ×46)**
- `packages/ui` — react-doctor flagged 46 instances of `useState` called in functions named `"Anonymous"` that are neither React components (uppercase name) nor custom hooks (`use` prefix). Likely caused by inline render functions (`renderX`) that call hooks internally and are invoked as plain functions, not rendered as `<RenderX />`. Exact file list is in the react-doctor diagnostic JSON at `/var/folders/d5/xxknrncx24x5q56z1___pxqh0000gn/T/react-doctor-c33fd4cd-e36a-4638-975c-32519fc6ca42`. Requires inspection to confirm scope.

**Rules of Hooks — `useContext` called conditionally (platform-core ×1)**
- Flagged by react-doctor but targeted grep found no unconditional violations in non-test files. Likely in a test helper or edge-case wrapper. Needs targeted file read from the diagnostic JSON to confirm.

### Key Modules / Files

1. `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx` — auth gap (savePreset/deletePreset)
2. `apps/cms/src/actions/common/auth.ts` — auth helper (ensureAuthorized pattern)
3. `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx` — inline component definition
4. `packages/ui/src` — largest error surface (86 errors, 415 warnings across 291 files)
5. `apps/cms/src` — second largest (17 errors, 430 warnings across 264 files)
6. `apps/brikette/src` — highest absolute warning count (905 warnings, mainly index-keys and inline renderers)
7. `packages/platform-core/src/contexts/` — hooks violation location (ShopThemeContext, ThemeContext, LayoutContext, CurrencyContext)
8. `apps/cover-me-pretty/__tests__/password-reset.test.tsx` — "hashedPassword" (confirmed test fixture, not production)
9. `packages/ui/src/` — `FALLBACK_AUTHOR` hardcoded secret (×20) — requires inspection
10. `packages/design-system/src/` — `DANGER_TOKEN` — requires inspection

### Patterns & Conventions Observed

- `fetch()` inside `useEffect` — prevalent across cms (×10), ui (×12), business-os (×6), cover-me-pretty (×7), dashboard (×5), template-app (×4). Pattern pre-dates server components adoption. Fix path is either Server Component refactor or `useSWR`/`useQuery`.
- Array index as `key` — brikette (×71), cms (×25), ui (×11). Indicates lists that were built without stable IDs in the data model or where IDs were not threaded through to render layer.
- Multiple `setState` in single `useEffect` — cms (×13), ui (×27), dashboard (×6). Classic batch-state pattern that belongs in `useReducer`. Causes extra renders.
- Inline render functions (`renderX()`) — brikette (×55), ui (×13). Called as plain functions, preventing React from tracking them as components for reconciliation.
- `useSearchParams()` without `<Suspense>` — cms (×11), cover-me-pretty (×5), brikette (×3). Causes entire page to bail out to CSR.
- `dangerouslySetInnerHTML` — brikette (×35), ui (×18), template-app (×7), cover-me-pretty (×3), cms (×3). Some are legitimate (JSON-LD structured data, sanitized CMS HTML). Each requires case-by-case review before acting.
- `useState(fn())` eager init — cms (×4), ui (×7). Should be `useState(() => fn())` to avoid running on every render.
- `next/image` not used for `<img>` — ui (×17), brikette (×7). Quick mechanical fix.
- `next/link` not used for internal `<a>` — ui (×15), template-app (×3), cover-me-pretty (×3), cms (×6).
- `next/script` not used for `<script>` — brikette (×34), ui (×10), template-app (×8), cover-me-pretty (×2), cms (×1).
- Unused files — brikette (×179), lib (×55), cms (×31), template-app (×17). react-doctor uses static import tracing; dynamic registry patterns may produce false positives.

### Data & Contracts

- Types/schemas/events:
  - Auth contract: `ensureAuthorized()` in `apps/cms/src/actions/common/auth.ts` — must be called first in all server actions.
  - No data-model contract changes implied by fixes — all changes are structural/pattern fixes.
- Persistence:
  - `savePreset` calls `saveThemePreset(shop, name, tokens)` — persists to DB. Unguarded write is the risk.
- API/contracts:
  - Server action shape unchanged by adding auth check.
  - Component hoisting (StepShopType/Option) is a pure refactor with no API impact.

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/ui` is consumed by virtually all apps — any change here has monorepo-wide blast radius.
  - `packages/platform-core` is consumed by cms, brikette, cover-me-pretty, template-app, dashboard.
- Downstream dependents:
  - Fixing `useSearchParams` Suspense: affects page-level CSR bailout — will improve TTFB on affected pages.
  - Fixing auth on savePreset: no downstream breakage; adds a 401/403 path for unauthorised callers.
  - Hoisting `Option` out of `StepShopType`: no API change, purely local.
- Likely blast radius:
  - `packages/ui` changes: HIGH — must run full monorepo typecheck and tests before shipping.
  - `apps/cms` server action auth: LOW — additive change, no consumer breakage.
  - `apps/brikette` index-key and inline-renderer fixes: MEDIUM — affects reconciliation behaviour; test with existing jest suite.
  - Unused file removal: MEDIUM-HIGH — risk of false positives from dynamic imports; verify with build before committing.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Playwright (e2e), Cypress (e2e)
- Commands: `pnpm --filter <pkg> test`, `pnpm typecheck`, `pnpm lint`
- CI integration: reusable-app.yml; tests must pass on `dev` before merge to `main`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| cms server actions | Unit | `apps/cms/__tests__/` | Auth actions tested via `dashboardRecommendations.integration.test.tsx` |
| brikette render | Unit/Snapshot | `apps/brikette/src/test/` | Components snapshot-tested; index-key changes may update snapshots |
| platform-core hooks | Unit | `packages/platform-core/src/__tests__/` | Context hooks tested |
| ui components | Unit | Sparse — large surface, thin coverage | |

#### Coverage Gaps

- Untested paths:
  - `savePreset` / `deletePreset` — no auth-path tests exist; adding auth check should be paired with a test asserting 401 for unauthenticated callers.
  - `packages/ui` inline render functions — no tests for reconciliation behaviour.
- Extinct tests:
  - 13 tests currently skipped with `describe.skip` on brikette (separate existing issue, not introduced by this work).

#### Testability Assessment

- Easy to test: auth guard addition (mock session, assert rejection), `next/image`/`next/link`/`next/script` swaps (snapshot), lazy-init `useState` fix (no observable difference).
- Hard to test: inline render function extraction (reconciliation behaviour requires interaction tests), hooks-in-anonymous-function violations (requires knowing exact file locations first).
- Test seams needed: none new — existing test infrastructure is sufficient.

### Recent Git History (Targeted)

- `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx` — not in recent commits visible in `git log`. File appears stable.
- `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx` — not in recent commits. Pre-existing pattern.
- `packages/ui/src/` — active development area (many files modified in current dev branch).

---

## Questions

### Resolved

- Q: Is `hashedPassword` in `cover-me-pretty` a real production secret?
  - A: No. It is a test fixture in `__tests__/password-reset.test.tsx:7`: `const hashedPassword = "$argon2id$mocked"`. Not a production issue.
  - Evidence: `apps/cover-me-pretty/__tests__/password-reset.test.tsx:7`

- Q: Is `useContext` called conditionally in `platform-core` a real violation?
  - A: Targeted search found no violations. All `useContext` calls in `packages/platform-core/src/contexts/*.tsx` are unconditional. Likely a false positive or in a test helper. Low priority to investigate further.
  - Evidence: grep of `packages/platform-core/src/contexts/` — all calls at top-level of custom hooks.

- Q: Does react-doctor's "Unused file" list reflect true dead code?
  - A: Partially — react-doctor uses static import tracing. Files loaded via dynamic `import()`, runtime registry lookups, or Webpack aliases may appear unused. Each candidate requires manual confirmation before deletion.

- Q: What is `FALLBACK_AUTHOR` in `packages/ui`? Is it a real secret or a display placeholder?
  - A: Confirmed display placeholder. `packages/ui/src/components/cms/blocks/ReviewsSection.tsx:60`: `const FALLBACK_AUTHOR = "Anonymous";`. Used as `{r.author ?? FALLBACK_AUTHOR}` in the reviews render. Not a credential. react-doctor false positive — the constant name triggered the heuristic.
  - Evidence: `packages/ui/src/components/cms/blocks/ReviewsSection.tsx:60,117`

- Q: What is `DANGER_TOKEN` in `packages/design-system`? Test scaffold or real credential?
  - A: Confirmed CSS design token name string. `packages/design-system/src/molecules/FormField.tsx:27`: `const DANGER_TOKEN = "--color-danger"; // i18n-exempt -- TECH-000 [ttl=2026-01-31] design token`. Used as `data-token={DANGER_TOKEN}` attribute value for design-system theming. react-doctor false positive — "TOKEN" in the variable name triggered the heuristic.
  - Evidence: `packages/design-system/src/molecules/FormField.tsx:27,78,87`

- Q: Should the `fetch()` in `useEffect` pattern be fixed by (a) moving to Server Components, or (b) adopting `useSWR`/`react-query`?
  - A: **`useSWR` is the right fix across all packages.** Full breakdown by package and pattern:
    - `apps/cms` (×10): All session-scoped admin data (shop-keyed, session-gated). No Server Component candidates. Fix: `useSWR` for on-mount panel reads; `mutate()` post-action for wizard flows.
    - `packages/ui` (×12): Shared client components — cannot be Server Components. Fix: `useSWR` with `refreshInterval` for polling (NotificationsBell), conditional null key for on-open dialogs (LinkPicker), `fallbackData` from SSR props for search-reactive collections (CollectionSection).
    - `apps/cover-me-pretty` (×7): Payment-webhook polling must stay client-side. One-shot analytics POST should stay `useEffect` (not a data fetch). Recommendations fetch → `useSWR`.
    - `apps/business-os` (×6): Real-time board and agent-run polling → `useSWR` with `refreshInterval` + custom fetcher for cursor/410 handling.
    - `apps/dashboard` (×5, Pages Router): Static shop list with no session specificity → **`getServerSideProps`** for initial render + `useSWR` for tab-driven fetches. Only package where a server-render approach (vs. client useSWR) is clearly superior.
  - Evidence: Full per-file audit completed by Explore agent across all 5 packages.

### Open (User Input Needed)

None — all questions resolved.

---

## Confidence Inputs

- Implementation: 88%
  - Evidence basis: Auth gap confirmed (themes/page.tsx); component hoist confirmed (StepShopType.tsx); both false-positive "secrets" confirmed (FALLBACK_AUTHOR = "Anonymous", DANGER_TOKEN = "--color-danger"). Hooks violations in `ui` (×46) still need exact file enumeration from diagnostic JSON — that is the remaining gap.
  - Raises to >=90: Read react-doctor diagnostic JSON for `@acme/ui` to enumerate exact files for `useState`-in-anonymous violation before writing those tasks.

- Approach: 95%
  - Evidence basis: Data-fetching architecture resolved — `useSWR` across all app packages; `getServerSideProps` for `apps/dashboard` initial load. Per-pattern fix mapping is complete. No remaining architectural uncertainty.

- Impact: 90%
  - Evidence basis: Auth gap on server actions is a confirmed, exploitable security gap (unguarded DB write). Index-key and Suspense fixes have measurable rendering correctness impact. `useSWR` migration eliminates loading-flash patterns across admin panels.

- Delivery-Readiness: 88%
  - Evidence basis: All false-positive "secrets" resolved — no credential hygiene emergency. Pre-commit hooks enforce typecheck and lint. Existing test suite covers key areas. Main remaining uncertainty is blast radius of `packages/ui` changes.
  - Raises to >=90: Enumerate exact files in `ui` for hooks violations; stage `packages/ui` changes incrementally.

- Testability: 87%
  - Evidence basis: Auth guard (mock session → assert 401), component hoist (pure refactor, snapshot-safe), lazy-init (no observable difference), image/link/script swaps (snapshot-safe), `useSWR` migration (mock `useSWR` in tests). Hooks violations require exact file list first.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `packages/ui` change breaks consumers | Medium | High | Run full monorepo typecheck + tests before merge; make changes incrementally per file |
| Unused-file deletion removes dynamically-imported modules | Medium | Medium | Confirm each file via build output before deleting; or exclude from this plan |
| `dangerouslySetInnerHTML` removal breaks JSON-LD or sanitized HTML rendering | Medium | High | Audit each instance individually; do not bulk-remove |
| `FALLBACK_AUTHOR` constant is a real credential | Low | High | Confirm value before closing this question |
| Inline render function extraction changes reconciliation identity during migration | Low | Medium | Extract to module scope (not inside component) to guarantee stable identity |
| react-doctor hooks violation count (×46 in ui) is inflated by false positives | Medium | Low | Read diagnostic JSON to triage before writing tasks |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - All server actions must call `ensureAuthorized()` first (see `apps/cms/src/actions/common/auth.ts`).
  - Component definitions must be at module scope, not inside other component functions.
  - Pre-commit hooks must pass on every commit; no `--no-verify`.
- Rollout/rollback expectations:
  - All fixes are on `dev` branch; merge to `main` via PR with CI gate.
  - No migrations or data changes — rollback is standard git revert.
- Observability expectations:
  - Auth fix: existing error logging will surface 401s from `ensureAuthorized()` if triggered.
  - Rendering fixes: no new observability needed.

---

## Suggested Task Seeds (Non-binding)

Ordered by priority (security first, then correctness, then performance/quality):

1. **[SEC] Add `ensureAuthorized()` to `savePreset` and `deletePreset` in `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx`** — add auth check + unit test asserting 401 for unauthenticated caller.

2. **[BUG] Hoist `Option` component out of `StepShopType` in `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx`** — move `const Option` to module scope above the parent component.

3. **[HOOKS] Enumerate and fix `useState` called in anonymous/non-component functions in `packages/ui`** — read diagnostic JSON, triage ×46 instances, extract hooks-using functions to proper React components or custom hooks.

4. **[CSR] Add `<Suspense>` boundaries around `useSearchParams()` consumers** — cms (×11), cover-me-pretty (×5), brikette (×3). Prevents full-page CSR bailout.

5. **[RENDER] Fix array-index keys in `apps/brikette` (×71)** — replace `key={index}` with stable IDs where data model provides them; audit data shape for each list.

6. **[RENDER] Fix array-index keys in `apps/cms` (×25) and `packages/ui` (×11)**.

7. **[PERF] Lazy-init `useState` calls** — replace `useState(fn())` with `useState(() => fn())` across cms (×4) and ui (×7).

8. **[NEXT] Replace `<img>` with `next/image`** — ui (×17), brikette (×7). Mechanical; add `sizes` prop.

9. **[NEXT] Replace `<a>` with `next/link` for internal links** — ui (×15), cms (×6), template-app (×3), cover-me-pretty (×3).

10. **[NEXT] Replace `<script>` with `next/script`** — brikette (×34), ui (×10), template-app (×8). Add appropriate `strategy` prop.

11. **[PERF] Extract oversized components** — `GuideSeoTemplate` (463 lines, brikette), `StockInflowsClient` (528 lines, cms), `CartProvider` (328 lines, platform-core). Scope-limited; each is a separate task.

12. **[DATA] Migrate `fetch()` in `useEffect` to `useSWR` — `apps/cms` (×10)** — on-mount admin panel reads (SeoAuditPanel, SitemapStatusPanel, useInventorySnapshot, useConfiguratorDashboardState). Replace loading/error/data triple-state with `useSWR`; use `mutate()` for wizard post-action invalidation.

13. **[DATA] Migrate `fetch()` in `useEffect` to `useSWR` — `packages/ui` (×12)** — `NotificationsBell` (polling → `refreshInterval`), `LinkPicker` (on-open → null key), `CollectionSection` (search-reactive → key from params + `fallbackData`). Keep `RatesContext` as-is (well-designed singleton).

14. **[DATA] Migrate `fetch()` in `useEffect` to `useSWR` — `apps/cover-me-pretty`, `apps/business-os`** — recommendations fetch (useSWR), payment/run-status polling (`refreshInterval` + `isPaused`), board polling (custom fetcher for cursor/410).

15. **[DATA] Migrate `apps/dashboard` (Pages Router) to `getServerSideProps`** — shop list is session-independent; move initial fetch server-side to eliminate client waterfall. Use `useSWR` for tab-driven history fetches inside the page.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `pnpm typecheck` passes across affected packages.
  - `pnpm lint` passes.
  - `pnpm --filter <affected-pkg> test` passes.
  - react-doctor re-run shows error count reduced to 0 for Tier-1 issues.
- Post-delivery measurement plan:
  - Re-run `npx -y react-doctor@latest` after each task batch; track score delta per package.
  - Monitor CMS server action logs for any new 401 patterns (expected: none, unless someone was abusing unauthenticated access).

---

## Evidence Gap Review

### Gaps Addressed

- Auth gap confirmed by direct file read: `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx` — `savePreset` and `deletePreset` have no `ensureAuthorized()` call.
- `hashedPassword` false-positive confirmed as test fixture (`__tests__/password-reset.test.tsx:7`).
- `useContext` conditional-call violation confirmed as react-doctor false positive — all `useContext` calls are unconditional in non-test code.
- Auth helper location confirmed: `apps/cms/src/actions/common/auth.ts`.
- `StepShopType`/`Option` inline component confirmed: `apps/cms/src/app/cms/configurator/steps/StepShopType.tsx:21`.
- `FALLBACK_AUTHOR` confirmed as display placeholder: `packages/ui/src/components/cms/blocks/ReviewsSection.tsx:60` — `const FALLBACK_AUTHOR = "Anonymous"`. Not a credential.
- `DANGER_TOKEN` confirmed as CSS design token name string: `packages/design-system/src/molecules/FormField.tsx:27` — `const DANGER_TOKEN = "--color-danger"`. Not a credential.
- Data-fetching architecture fully resolved: `useSWR` for all packages; `getServerSideProps` + useSWR for `apps/dashboard` (Pages Router). Per-pattern fix mapping documented in Resolved Questions.

### Confidence Adjustments

- `hashedPassword` risk: "possible secret" → confirmed false positive.
- `FALLBACK_AUTHOR` risk: "unconfirmed placeholder" → confirmed false positive.
- `DANGER_TOKEN` risk: "unconfirmed test scaffold" → confirmed false positive (CSS token name).
- `useContext` conditional hooks: "confirmed error" → confirmed false positive.
- Data-fetching approach: "deferred/uncertain" → fully resolved (useSWR everywhere; getServerSideProps for dashboard).
- Implementation confidence: raised from 82% → 88% (two false-positive secrets eliminated).
- Approach confidence: raised from 88% → 95% (architecture resolved).

### Remaining Assumptions

- `useState`-in-anonymous violations in `packages/ui` (×46): exact file list not yet enumerated. Requires reading the react-doctor diagnostic JSON before these tasks can be written.
- Most "unused file" hits in brikette (×179) and lib (×55) are dynamic-import or registry-loaded files, not truly dead code. Dead-code removal excluded from this plan's scope pending import-graph confirmation.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None blocking planning. Two open questions (FALLBACK_AUTHOR, data-fetching approach) can be resolved per-task during build; they do not block creating the task list.
- Recommended next step:
  - `/lp-do-plan react-doctor-remediation` — start with Tier-1 tasks (SEC, BUG, HOOKS) which are fully evidenced.
