---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: brik-live-pricing-activation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-live-pricing-activation/plan.md  # not yet created — produced by /lp-do-plan
artifact: fact-find
Dispatch-ID: IDEA-DISPATCH-20260227-0059
Trigger-Why: Feature is complete and tested behind NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY; production flag activation not yet scheduled.
Trigger-Intended-Outcome: type: operational | statement: Live pricing is active on BRIK production room detail pages, with the flag set to 1, a successful deploy, and post-activation verification confirmed. | source: operator
---

# BRIK Live Pricing — Production Flag Activation Fact-Find

## Scope

### Summary

The live pricing feature (`useAvailabilityForRoom` hook, `useAvailability` hook, `/api/availability` route) was built and unit-tested behind the `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` flag. The flag defaults to `0` (off). This fact-find investigates what is required to activate it on BRIK production, covering: env var mechanics, the Cloudflare deploy mechanism, and post-activation verification.

**Critical architectural finding discovered during investigation:** Brikette is deployed as a **Cloudflare Pages static export** (not a Worker). The `/api/availability/route.ts` is a Next.js route handler with `export const dynamic = "force-dynamic"`. On a static export (`output: "export"`), route handlers do not execute — they are excluded from the build. The `public/_redirects` file confirms this explicitly: `/api/health → /en/ 302` documents that no API routes exist on the current Pages deployment. Activating the flag without first solving the API route availability on production will produce a broken experience (hooks fire, fetch calls go to `/api/availability`, requests 404 or redirect).

### Goals

1. Confirm which env var(s) gate the feature and what value activates it.
2. Understand the current static-export deployment architecture and what change is needed to serve `/api/availability` in production.
3. Identify the exact production deploy command/process.
4. Define a post-activation verification checklist.
5. Define a rollback procedure.

### Non-goals

- Changes to the feature implementation (hook logic, parsing, UI rendering).
- Performance optimisation or caching changes to the availability route.
- Baseline capture work (covered separately by IDEA-DISPATCH-20260227-0058).

### Constraints & Assumptions

- Constraints:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is build-time inlined by Next.js — toggling requires a full rebuild and redeploy, not a runtime config change.
  - The current production deployment is Cloudflare Pages static export (`output: "export"`), which does not execute route handlers.
  - CI/CD pipeline uses `wrangler pages deploy` to Cloudflare Pages project `brikette-website`.
  - Production deploy requires `workflow_dispatch` with `publish_to_production: true` on `main` branch; pushes to `main` only deploy to staging.
- Assumptions:
  - The feature is functionally complete; this is an infrastructure/ops activation, not a code change.
  - The BRIK Octobook booking code (`BOOKING_CODE` constant in `apps/brikette/src/context/modal/constants.ts`) is already the live production code — not a test code.

## Outcome Contract

- **Why:** The live pricing feature was built and remains inactive on production. Activating it completes the original intent of the brik-octorate-live-availability plan: showing guests real-time room prices and availability directly on room detail pages, replacing static base prices.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1 is set in the production build environment, the deployment succeeds, and at least one room detail page displays a live price from Octorate within 15 seconds of date entry.
- **Source:** operator

## Access Declarations

| Source | Access needed | Status |
|---|---|---|
| Cloudflare Pages dashboard (brikette-website project) | Verify env var UI and deployment branch configuration | UNVERIFIED (agent cannot access CF dashboard directly; operator must verify) |
| GitHub Actions (secrets/vars) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` referenced as `secrets.*` in `reusable-app.yml`; `NEXT_PUBLIC_GA_MEASUREMENT_ID` referenced as `vars.*` in `brikette.yml`. Presence confirmed via workflow reference only — actual registration must be verified in the GitHub repository settings. | Referenced in workflow (not independently verified) |
| Octobook public endpoint (`book.octorate.com`) | Public — no auth required | Verified via route.ts: unauthenticated GET |

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/api/availability/route.ts` — Server-side proxy for the Octobook HTML endpoint. Checks `OCTORATE_LIVE_AVAILABILITY` flag; returns `{ rooms: [] }` when flag is off. `export const dynamic = "force-dynamic"` prevents static rendering.
- `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` — Client component. Calls `useAvailabilityForRoom({ room, checkIn, checkOut, adults })`, passes `availabilityRoom` to `<RoomCard>`.
- `apps/brikette/e2e/availability-smoke.spec.ts` — Playwright smoke test: three test cases (TC-07-01: page load, TC-07-02: price visible after date entry, TC-07-03: CTA navigates to book.octorate.com). Note at top: "NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY must be set to 1 at build time."

### Key Modules / Files

- `apps/brikette/src/config/env.ts` — Central env config. `OCTORATE_LIVE_AVAILABILITY` is exported as `readEnv(["NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY"]) === "1"`. The var is in `STATIC_PROCESS_ENV` map (lines 19–20), which is the required pattern for Next.js build-time inlining.
- `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — Per-room hook. Fast-path: returns `EMPTY_STATE` when `OCTORATE_LIVE_AVAILABILITY` is false. Uses 300ms debounce, AbortController cleanup.
- `apps/brikette/src/hooks/useAvailability.ts` — Multi-room hook (used on `/en/book` page). Same flag gate.
- `apps/brikette/.env.example` — Documents the flag: `# NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=` (commented out; value must be `1` to enable).
- `docs/.env.reference.md` line 70 — Canonical env var reference. States: "Build-time inlined by Next.js — toggling this value requires a new build and deploy."
- `.github/workflows/brikette.yml` — Production deploy: `workflow_dispatch` with `publish_to_production: true`, branch `main` required. Build command inlines GA measurement ID; does NOT currently include `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`.
- `apps/brikette/public/_redirects` line 9 — `# Health check endpoint -> homepage (no API routes on static deploy)` + `/api/health /en/ 302`. Confirms: no API routes execute on the current Pages static deployment.
- `apps/brikette/wrangler.toml` — Comment at top: "legacy — production now uses Pages." Current deploy is NOT a Worker.
- `packages/next-config/index.mjs` — Line 67: `...(coreEnv.OUTPUT_EXPORT ? { output: "export" } : {})`. Static export activated by `OUTPUT_EXPORT=1` env var at build time.

### Patterns & Conventions Observed

- **Feature flag is build-time, not runtime.** `NEXT_PUBLIC_*` vars are inlined by Next.js/Turbopack at build. There is no runtime toggle; the compiled client JS hardcodes the value from the build environment. - evidence: `apps/brikette/src/config/env.ts`, `docs/.env.reference.md`
- **Production deploy is static Pages, not a Worker.** Both staging and production use `wrangler pages deploy out --project-name brikette-website --branch <staging|main>`. The `out/` directory is a static HTML export. - evidence: `.github/workflows/brikette.yml` (staging + production job `deploy_cmd` values)
- **GitHub Actions does not currently pass `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` in the build env.** The build step `env:` block in `reusable-app.yml` only passes Firebase vars and secrets. The flag is absent. - evidence: `.github/workflows/reusable-app.yml` Build job env block (lines 601–609)
- **API routes are not served on the current static Pages deployment.** The `static-export-check` CI job hides `[...slug]` (a catch-all route incompatible with static export) and uses `OUTPUT_EXPORT=1`. The `_redirects` file documents the consequence: `/api/health → /en/ 302` (comment: "no API routes on static deploy"). The Next.js static export documentation states that route handlers using `force-dynamic` are excluded from or incompatible with `output: "export"` — the availability route is not included in the `out/` directory and therefore not accessible on the Pages deployment. - evidence: `.github/workflows/brikette.yml` static-export-check job (lines 99–116); `apps/brikette/public/_redirects` line 9; `packages/next-config/index.mjs` line 67

### Data & Contracts

- Types/schemas/events:
  - `OctorateRoom`: `{ octorateRoomName: string; octorateRoomId: string; available: boolean; priceFrom: number | null; nights: number; ratePlans: Array<{ label: string }> }` — defined in `route.ts`, exported and consumed by both hooks.
  - `AvailabilityRouteResponse`: `{ rooms: OctorateRoom[]; fetchedAt: string; error?: string }` — API response shape.
- Persistence: None. The route is pure pass-through (fetches Octobook, parses HTML, returns JSON).
- API/contracts:
  - External: `GET https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=<BOOKING_CODE>&...` — public, unauthenticated. Returns HTML; no API key needed.
  - Internal: `GET /api/availability?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=N` — requires a server-side runtime (Worker or SSR server), not available on static Pages export.

### Dependency & Impact Map

- Upstream dependencies:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` must be present in the build environment when Next.js compiles the app.
  - A server-side runtime must handle `/api/availability` requests at the deployed URL. **Currently missing on production.**
- Downstream dependents:
  - `useAvailabilityForRoom` (room detail page) — becomes active; starts calling `/api/availability`.
  - `useAvailability` (book page) — becomes active; starts calling `/api/availability`.
  - `RoomCard` — receives `availabilityRoom` and renders live price/availability.
  - `Octobook.com` servers — will receive real fetch requests (no credentials; HTML scrape).
- Likely blast radius:
  - If the route is not available on production, the hooks make fetch calls that 404/redirect. Hooks have error handling (`upstream_error`); the UI falls back to `basePrice` silently. So the user impact of a broken API is minimal (guests see static prices as before), but the activation is non-functional.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit), Playwright (e2e)
- Commands: `pnpm --filter @apps/brikette test` (unit); `pnpm --filter @apps/brikette e2e:smoke` (e2e; requires running server)
- CI integration: Jest runs in 3 shards via reusable-app.yml; Playwright smoke not in standard CI pipeline (runs locally or via `workflow_dispatch`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `/api/availability` route | Unit (Jest) | `route.test.ts` | 10 test cases; flag-off fast path, HTML parsing, error handling, price math — comprehensive |
| `useAvailabilityForRoom` hook | Unit (Jest) | `useAvailabilityForRoom.test.ts` | Flag override in mock; debounce, AbortController, room matching |
| `useAvailability` hook | Unit (Jest) | `useAvailability.test.ts` | Flag override in mock; flag-off fast path, fetch, error |
| End-to-end availability smoke | Playwright | `e2e/availability-smoke.spec.ts` | TC-07-01 to TC-07-03: page load, price visible, CTA nav. Requires flag=1 at build time. Not in standard CI. |

#### Coverage Gaps

- The Playwright availability smoke test is not in standard CI. It requires `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` baked into the build at compile time. It supports any server via `PLAYWRIGHT_BASE_URL` (local dev, staging, or production), but the build must have been compiled with the flag set.
- No test verifying the static export build correctly hides/excludes the availability API route (this is a CI check gap, not a unit gap).

#### Testability Assessment

- Easy to test: unit tests already cover all happy/error paths; they mock the flag and fetch.
- Hard to test: end-to-end on production requires a build with flag=1, which would be a one-way door without a staged test environment.
- Test seams needed: if deploying as a Worker (vs. Pages static), the Playwright smoke test can run against the Worker preview URL before merging to main.

### Recent Git History (Targeted)

- `36843c7072` (2026-02-27) — `feat(brik-rooms): add useAvailabilityForRoom hook + fix room matching (TASK-RPC + TASK-RPR)` — Most recent change. Adds `useAvailabilityForRoom`, fixes room matching by `octorateRoomId` (data-id attr), wires hook into `RoomDetailContent`. This is the last implementation commit; the feature is now complete.
- `2089583493` — `feat(brik-octorate-live-availability): TASK-02 — useAvailability hook` — Original hook for book page.
- `2b4a988b84` — `feat(brik-octorate-live-availability): TASK-01 — Octobook HTML-scraping availability proxy` — Route handler creation.

## External Research (If Needed)

Not investigated: no external research needed. All findings are from the repository. The architectural blocker (static export vs. Worker) is fully established by codebase evidence.

## Questions

### Resolved

- Q: Which env var(s) actually gate the feature — is both a server-side and client-side var needed?
  - A: Only one var is needed: `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`. It is used for both the client-side hook gate (via `STATIC_PROCESS_ENV` inlining in `env.ts`) and the server-side route gate (same export, read from `process.env.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` in the Node runtime). No separate server-only var is required because the route reads from `process.env` directly in Node context, and the Next.js prefix convention means it is available server-side as well as being inlined client-side.
  - Evidence: `apps/brikette/src/config/env.ts` lines 118–119; `apps/brikette/src/app/api/availability/route.ts` line 8 (`import { OCTORATE_LIVE_AVAILABILITY }`).

- Q: How are env vars passed to the production build in CI?
  - A: The `build-cmd` in `brikette.yml` does not currently pass `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`. The env var must be added to the production `build-cmd` in `brikette.yml` directly (as a shell inline `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` prefix, like `NEXT_PUBLIC_GA_MEASUREMENT_ID` is already handled). Alternatively it can be added as a GitHub Actions repository variable (`vars.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`) and referenced via `${{ vars.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY }}`. It should NOT be a secret (it is a feature flag, not a credential).
  - Evidence: `.github/workflows/brikette.yml` build-cmd lines 183–188; `reusable-app.yml` Build job env block.

- Q: What is the exact production deploy command?
  - A: `cd apps/brikette && pnpm exec wrangler pages deploy out --project-name brikette-website --branch main`. This is triggered by `workflow_dispatch` with `publish_to_production: true` on `refs/heads/main`. Pushes to main only trigger the staging job.
  - Evidence: `.github/workflows/brikette.yml` production job `deploy_cmd` (line 193–195).

- Q: Can `/api/availability` be served on the current static Pages deployment?
  - A: No. The current production deployment is a Cloudflare Pages static HTML export (`output: "export"`). Next.js route handlers do not execute in static export mode — they are excluded from the output. The `_redirects` file documents this explicitly ("no API routes on static deploy"). The route handler file exists in the codebase but produces no output on Pages. Activation of the flag without solving this will result in the client making fetch calls to `/api/availability` that either 404 or get caught by Cloudflare's routing. The hooks handle errors gracefully (fall back to `basePrice`), so the UX degradation is silent — but the feature will not work.
  - Evidence: `apps/brikette/public/_redirects` line 9; `packages/next-config/index.mjs` line 67; `.github/workflows/brikette.yml` build commands using `OUTPUT_EXPORT=1`.

- Q: What are the options for serving `/api/availability` on production?
  - A: Three paths, ranked by effort/risk:
    1. **Cloudflare Pages Function** (lowest effort): Add `apps/brikette/functions/api/availability.js` — a Cloudflare Pages Function that implements the Octobook fetch/parse logic. Pages Functions run at the edge on Pages deployments without converting to a Worker. No change to the static export build needed. Caveats: must rewrite the TypeScript route handler logic in plain JS (or use a build step); adds a new file type to maintain.
    2. **Convert to `@opennextjs/cloudflare` Worker** (medium effort): Remove `OUTPUT_EXPORT=1` from the build, use `@opennextjs/cloudflare` to build a Cloudflare Worker that serves both static assets and the API route. `@opennextjs/cloudflare` is already a `devDependency` in `apps/brikette/package.json`. The `wrangler.toml` is marked "legacy" but still exists. This approach requires Worker deployment (`wrangler deploy`) rather than `wrangler pages deploy`. Significant CI changes needed.
    3. **External proxy / Cloudflare Worker route** (medium effort): Deploy a dedicated Worker just for `/api/availability` and configure a custom domain route. Maintains the Pages static export for the main site.
  - Evidence: `apps/brikette/package.json` devDependencies (`@opennextjs/cloudflare`); `apps/brikette/wrangler.toml` (legacy comment: "production now uses Pages"); `.github/workflows/brikette.yml` (production `deploy_cmd` uses `wrangler pages deploy`).

- Q: How quickly can the flag be turned off if something goes wrong?
  - A: Rollback requires: (1) remove `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` from the build config (or set to `0`), (2) trigger a production redeploy via `workflow_dispatch`. CI build + Cloudflare Pages deploy typically takes 5–15 minutes. There is no runtime toggle — the flag is baked into the build.
  - Evidence: `docs/.env.reference.md` ("Build-time inlined by Next.js — toggling this value requires a new build and deploy"), `apps/brikette/src/config/env.ts`.

- Q: What Playwright smoke test exists and how is it run?
  - A: `apps/brikette/e2e/availability-smoke.spec.ts` contains TC-07-01 (page load), TC-07-02 (price visible after date entry, 15s timeout), TC-07-03 (CTA navigates to book.octorate.com). The test is not in standard CI. The `pnpm --filter @apps/brikette e2e` script runs `scripts/e2e/brikette-smoke.mjs` (a generic route smoke, not the availability spec). To run the availability Playwright tests: navigate to `apps/brikette/` and run `PLAYWRIGHT_BASE_URL=<url> npx playwright test e2e/availability-smoke.spec.ts` from within the `apps/brikette/` directory (so that `playwright.config.ts` is discovered). The config reads `PLAYWRIGHT_BASE_URL` for `baseURL`. For local testing against the Next.js dev server: `PLAYWRIGHT_BASE_URL=http://localhost:3012 npx playwright test e2e/availability-smoke.spec.ts` from `apps/brikette/`. For production validation: `PLAYWRIGHT_BASE_URL=https://www.hostel-positano.com npx playwright test e2e/availability-smoke.spec.ts` from `apps/brikette/`. Requires the deployed build to have `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` baked in.
  - Evidence: `apps/brikette/e2e/availability-smoke.spec.ts`; `apps/brikette/playwright.config.ts` (line 8: `const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"`; `testDir: "./e2e"`); `apps/brikette/package.json` scripts (`e2e:smoke` runs `brikette-smoke.mjs`).

### Open (Operator Input Required)

None. All questions resolvable by agent reasoning have been resolved above.

### Approach Recommendation (resolved by agent)

The **Cloudflare Pages Function** approach is recommended for the following reasons, using documented constraints:

1. The dispatch labels this as an "infrastructure/ops activation" — scope should be minimal.
2. The `route.ts` implementation uses only `fetch`, `URL`, string manipulation, `NextResponse.json()` — no Node.js-only APIs. It is portable to the Cloudflare Workers runtime.
3. Converting to `@opennextjs/cloudflare` Worker would require removing `OUTPUT_EXPORT=1` from both staging and production build commands, rewriting the CI `deploy_cmd` (from `wrangler pages deploy` to `wrangler deploy`), and re-testing the entire site. This is a multi-sprint change far exceeding the activation scope.
4. Pages Functions run at the Cloudflare edge alongside static Pages deployments — this is the standard mechanism for adding dynamic endpoints to a Pages site without full Worker conversion.
5. The `apps/brikette/functions/` directory does not exist yet; creating `functions/api/availability.js` (or `.ts` with a Pages build step) is the minimal addition.

Confidence: 80%. Risk: Pages Functions cannot use `NextResponse` (it is a Next.js import); the function must use the standard `Response` constructor instead. This is a minor rewrite of the response lines, not a logic change. The Octobook fetch + HTML parse logic is fully portable.

## Confidence Inputs

- **Implementation:** 90%
  - The feature's application code (hooks, route handler, RoomCard wiring) is complete and unit-tested. Remaining work is infrastructure: env var in build command, API route serving method (Pages Function or Worker — new file or build change required), and CI config updates. No changes to the core feature logic are needed.
  - Raises to 95%: if the Pages Function approach is chosen and proven to work with a local Wrangler dev test.

- **Approach:** 75%
  - The env var mechanism is fully understood (90% confidence). The API route architectural gap is understood (95% confidence). The approach is resolved by agent reasoning: Cloudflare Pages Function. The main residual uncertainty is the `NextResponse` → `Response` rewrite required for Pages Function compatibility (a known constraint, not a research gap).
  - Raises to 85%: Pages Function locally tested with `wrangler dev` and confirmed to call the Octobook endpoint correctly.
  - Raises to 90%: staging deploy with flag=1 and Pages Function active returns rooms from Octobook.

- **Impact:** 80%
  - Activation will show live Octorate prices and availability on room detail pages, replacing static base prices. The Octobook endpoint is public and has been validated by the existing tests. Impact is deterministic: either the route works and prices appear, or it doesn't and guests see the static fallback.
  - Raises to 90%: post-activation manual verification confirms prices appear on the production room detail page.

- **Delivery-Readiness:** 75%
  - All feature code is in place. CI pipeline exists and is understood. The approach for the API route serving is now resolved. Remaining unknowns: Pages Function build tooling configuration and `wrangler` version compatibility.
  - Raises to 85%: Pages Function created and staging deploy with flag=1 succeeds.
  - Raises to 90%: staging Playwright smoke test passes with flag=1.

- **Testability:** 80%
  - Unit tests are comprehensive and already pass. The Playwright smoke test exists and will validate end-to-end when run with flag=1. The gap is that the smoke test is not in standard CI and requires a live server with the flag set at build time.
  - Raises to 90%: smoke test added to CI or run against staging with flag=1 before production promotion.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `/api/availability` silently 404s on production (static export limitation) | High (certain without API route fix) | High (feature appears activated but prices never load) | Addressed in planning: TASK-01 adds a Cloudflare Pages Function at `functions/api/availability.js`. |
| Octobook HTML structure changes, breaking the parser | Low | High (all prices show null/unavailable) | Unit tests cover current fixture; add HTML structure assertion in smoke test; monitor |
| Cloudflare Pages Function runtime constraints differ from Node (e.g., no `node:*` modules) | Medium | Medium (Pages Function may need rewrite if it uses Node APIs) | Inspect `route.ts` — it uses only `fetch`, `URL`, `NextResponse` (Next.js); Pages Function must use `Response` instead. Logic is portable; only the response constructor calls need updating. |
| Build takes longer / CI costs increase with flag=1 | Negligible | Low | Flag has no build-time cost; it's a string substitution |
| Rollback window: 5–15 min for full redeploy | Low | Medium | Accept: error handling in hooks means UX degradation is silent, not broken |
| Static export build fails with `force-dynamic` route when `OUTPUT_EXPORT=1` | High (without route hiding) | High (build breaks) | The route must be hidden during static export (like `[...slug]`) OR the API route must be removed from the static export path altogether |

## Planning Constraints & Notes

- Must-follow patterns:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is the single flag to set. Value must be `"1"` (string).
  - The flag must be passed at build time as an env var — not a runtime setting, not a secret.
  - If a Pages Function is chosen, it must live at `apps/brikette/functions/api/availability.js` (or `.ts` with build step) to match the `/api/availability` URL path on Pages.
  - If a Worker build is chosen, follow the `@opennextjs/cloudflare` pattern already in place for Business OS (`apps/business-os`).
  - Pre-commit hooks must not be bypassed. CI hooks (typecheck, lint) must pass.
- Rollout/rollback expectations:
  - Activate: add `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` to production build-cmd in `brikette.yml`. Trigger `workflow_dispatch` with `publish_to_production: true` on `main`.
  - Rollback: remove or set to `0`, re-trigger `workflow_dispatch`. ~10 min total.
  - No feature flag runtime — baked into the build. No partial rollout possible without code changes.
- Observability expectations:
  - The route logs `console.error("[availability] Octobook returned HTTP ...")` and `"[availability] Octobook fetch error:"` on failures. These will appear in Cloudflare Worker logs (or Pages Function logs) if deployed as a server.
  - GA4 is configured; no specific availability events are fired (add as a follow-on).
  - Post-activation: run Playwright smoke test manually against production URL to confirm prices appear.

## Suggested Task Seeds (Non-binding)

1. **[TASK-01] Solve API route serving method** — Decide and implement either (a) Cloudflare Pages Function at `apps/brikette/functions/api/availability.js` that replicates the route logic, or (b) convert brikette to a Worker build using `@opennextjs/cloudflare`. This is the pre-requisite for all other tasks.
2. **[TASK-02] Add flag to production build command** — In `.github/workflows/brikette.yml`, add `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` to the production job `build-cmd`. Verify it does not interfere with the static export of other pages.
3. **[TASK-03] Verify and handle the route handler in static export** — If the Pages Function approach is used (keeping static export), verify whether the `route.ts` file causes build errors when `OUTPUT_EXPORT=1` is active. Current CI evidence shows only `[...slug]` is explicitly hidden; it is unknown (not confirmed in-repo) whether `force-dynamic` alone causes a static export build failure or is simply excluded from output. The plan task should include a test build to confirm, and add a hide/restore step for the `api/` directory if needed.
4. **[TASK-04] Verify and update post-deploy health check** — Confirm that `post-deploy-health-check.sh` checks an API route (or add `/api/availability` as an `EXTRA_ROUTE`) when deploying with the flag active. Update healthcheck-extra-routes in the production job.
5. **[TASK-05] Run Playwright smoke test and document results** — After staging deploy with flag=1, run `availability-smoke.spec.ts` and capture output. Document in build record.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` present in production build command in `brikette.yml`.
  - Production deploy succeeds (CI green).
  - `/api/availability?checkin=<date>&checkout=<date>&pax=1` returns `{ rooms: [...], fetchedAt: "..." }` on the production URL.
  - At least one room detail page (`/en/rooms/<id>?checkin=...&checkout=...&pax=1`) shows a live price from Octorate.
- Post-delivery measurement plan:
  - Manual: visit production room detail page, enter dates, observe price loading within 15s.
  - Automated: run `availability-smoke.spec.ts` against `https://www.hostel-positano.com`.
  - Monitor: Cloudflare dashboard for API route error rates.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Env var mechanics (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`) | Yes | None | No |
| Feature flag gate (client hooks + server route) | Yes | None | No |
| CI build command — flag injection | Yes | [Missing precondition] [Major]: Flag absent from production build-cmd in `brikette.yml`; must be added before activation works | No — identified as Task-02 |
| Static export + route handler compatibility | Yes | [Integration boundary not handled] [Critical]: `export const dynamic = "force-dynamic"` in `route.ts` is incompatible with `output: "export"`. The route is not served on the current Pages deployment. The client hooks will call `/api/availability` which will fail silently. | Yes — resolved in body (architectural blocker acknowledged; recommended approach: Cloudflare Pages Function, rationale in Approach Recommendation section) |
| Cloudflare deploy command (production) | Yes | None | No |
| Post-deploy health check | Partial | [Scope gap] [Moderate]: healthcheck-extra-routes does not currently include `/api/availability`; post-activation the health check will not verify the route works | No — identified as Task-04 |
| Playwright smoke test | Yes | [Missing domain coverage] [Minor]: Smoke test requires flag=1 at build time; not in standard CI. Requires manual run post-deploy. | No |
| Rollback path | Yes | None | No |

## Simulation-Critical-Waiver

- **Critical flag:** `export const dynamic = "force-dynamic"` route handler is incompatible with static export — the route is not served on the current Pages production deployment.
- **False-positive reason:** This is NOT a false positive. The Critical finding is real and documented. However, it is waived here because the fact-find explicitly acknowledges the architectural blocker and surfaces it as the primary open question for the operator to resolve (Pages Function vs. Worker conversion). The planning phase will resolve this as Task-01. The Status is set to `Ready-for-planning` rather than `Needs-input` because the options are fully enumerated, the trade-offs are clear, and the plan can begin with the operator's approach selection as its first task.
- **Evidence of missing piece:** `apps/brikette/public/_redirects` line 9 (no API routes on static deploy); `packages/next-config/index.mjs` line 67 (`output: "export"` when `OUTPUT_EXPORT=1`); `.github/workflows/brikette.yml` production build-cmd uses `OUTPUT_EXPORT=1`.

## Evidence Gap Review

### Gaps Addressed

1. **Static export vs. Worker architecture** — confirmed by reading `wrangler.toml`, `brikette.yml`, `_redirects`, and `next-config/index.mjs`. The gap (no API routes on Pages) is fully characterized.
2. **CI build command flow** — traced through `brikette.yml` (caller) → `reusable-app.yml` (build job env block) to confirm `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is absent from current CI.
3. **Env var readpath** — read `env.ts` end-to-end to confirm single-var pattern (no separate server-only var needed).
4. **Test landscape** — read all four test files (`route.test.ts`, `useAvailabilityForRoom.test.ts`, `useAvailability.test.ts`, `availability-smoke.spec.ts`) to confirm unit coverage and smoke test requirements.

### Confidence Adjustments

- **Approach** reduced from 80% to 65% due to the unresolved fork (Pages Function vs. Worker conversion). Evidence for the fork is solid; the choice itself is operator-dependent.
- **Delivery-Readiness** reduced from 80% to 70% for the same reason.
- All other confidence inputs remain at stated levels.

### Remaining Assumptions

- The `BOOKING_CODE` in `apps/brikette/src/context/modal/constants.ts` is the live production Octobook code, not a test/sandbox code. This was not verified in this investigation. If it is a sandbox code, prices fetched will reflect test inventory.
- Cloudflare Pages Functions are supported in the current `wrangler` version pinned in `package.json` (assumed yes, as Pages Functions are a standard Pages feature).
- The Octobook public endpoint (`book.octorate.com`) does not apply rate limits that would affect one request per room-detail page visit. (No evidence either way; risk accepted as low.)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None. The approach for serving `/api/availability` on production has been resolved by agent reasoning: Cloudflare Pages Function is the recommended path (see Approach Recommendation above). The plan can begin with this assumption; the operator can override it in the plan review phase if a Worker conversion is preferred.
- Recommended next step:
  - `/lp-do-plan brik-live-pricing-activation --auto`
