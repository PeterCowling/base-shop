---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: google-maps-api-integration
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: none (plan not yet created; will be produced by /lp-do-plan after scope is confirmed)
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Google Maps API Integration — Fact-Find Brief

## Scope

### Summary

The Brikette app provides "Get Directions" and embedded map experiences using two undocumented, keyless Google Maps embed formats that have no API coverage or quota visibility in Google Cloud Console:

1. **`?output=embed` format** — used in `LocationModal` and `ContactFormWithMap` (2 runtime components + test/fixture/story artifacts)
2. **`?pb=...` (protobuf-encoded) format** — used in 2 guide content JSON files rendered as iframes via `articleLead.tsx` (`chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json`; 2 × 18 locales = 36 locale files). A third guide, `reachBudget.json`, also contains a `mapEmbedUrl` field with a `?pb=...` URL, but **no code consumer for `mapEmbedUrl` was found in any route or component** — `reachBudget.json` is excluded from scope until a renderer is confirmed.

Neither format appears in Google Cloud Console. Both are undocumented and can be restricted by Google without notice. The goal is to migrate to the official Maps Embed API (`https://www.google.com/maps/embed/v1/...`) which requires an API key and is fully monitored.

Whether to migrate the `?pb=` guide URLs is an **open decision** (see Questions — Open). They carry the same deprecation risk as `?output=embed`, but migration requires a code change to `articleLead.tsx` and 36 JSON files. This decision is the primary scope blocker for guide-related tasks.

### Goals

- Replace all `?output=embed` iframe src URLs in `LocationModal.tsx` and `ContactFormWithMap.tsx` with Maps Embed API v1 format
- Replace `?pb=...` `stepsMapEmbedUrl` values in `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (2 × 18 = 36 locale files) with Maps Embed API v1 format; update `articleLead.tsx` to inject the API key at render time (decided)
- Update tests, fixtures, and Storybook stories that hard-assert the deprecated URL string
- Introduce `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` for the components that require it
- Make all map iframe loads visible in Google Cloud Console

### Non-goals

- Migrating `StoreLocatorMap` (Leaflet/OSM) — no Google dependency
- Adding Places Autocomplete to the `LocationModal` location input
- Replacing deep link `href`s to `google.com/maps/...` — those require no key and work correctly
- Turn-by-turn directions rendering (requires Maps JavaScript API SDK)

### Constraints & Assumptions

- Constraints:
  - `NEXT_PUBLIC_*` env vars are exposed in browser source — expected for Maps Embed API; key must be restricted to HTTP referrers in GCP Console
  - Guide JSON files (`?pb=...` format) do not receive an injected API key — the Maps Embed API v1 `place` or `directions` mode URLs must be constructed as static strings baked into the JSON, with the API key added as a query param at render time in `articleLead.tsx`, OR the JSON URLs must be replaced with the keyless `?pb=` format until a server-side substitution approach is in place
  - Brikette is deployed on Cloudflare Pages; the staging environment may surface under both `staging.brikette-website.pages.dev` and `staging.hostel-positano.com` (see `cfLibImage.ts:17`) — **both** staging origins, plus production and localhost, must be in the key's HTTP referrer allowlist, or use env-derived hostname lists to avoid false-blocked maps after deploy
- Assumptions:
  - Owner will create a Google Cloud project with billing enabled (Maps Embed API is free; billing account required for key creation)
  - The `hostelAddress` string is sufficient for Maps Embed API `place` and `directions` queries without geocoding

---

## Evidence Audit (Current State)

### Entry Points

| File | Role |
|---|---|
| `apps/brikette/src/components/landing/LocationMiniBlock.tsx:61` | "Get directions" button → `openModal("location", { hostelAddress })` |
| `packages/ui/src/organisms/modals/LocationModal.tsx` | Renders embed iframe for pin view and directions view |
| `packages/ui/src/components/cms/blocks/ContactFormWithMap.tsx` | CMS block — embed iframe beside contact form |
| `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/articleLead.tsx:90,158` | Destructures (line 90) and renders (line 158) `stepsMapEmbedUrl` from guide JSON as iframe |
| `apps/brikette/src/routes/how-to-get-here/chiesaNuovaDepartures/articleLead.tsx:1` | Re-exports `renderArticleLead` from arrivals — no independent map code |

### Key Modules / Files

| File | Deprecated format | Change needed |
|---|---|---|
| `packages/ui/src/organisms/modals/LocationModal.tsx` | `?output=embed` (lines 30, 38) | Yes — replace both URL builders |
| `packages/ui/src/components/cms/blocks/ContactFormWithMap.tsx` | `?output=embed` (line 7, default prop) | Yes — update default mapSrc |
| `packages/ui/src/components/cms/blocks/ContactFormWithMap.stories.ts` | `?output=embed` (line 10, args.mapSrc) | Yes — update Storybook default |
| `packages/ui/src/components/cms/blocks/ContactFormWithMap.fixtures.json` | `?output=embed` (line 1) | Yes — update fixture |
| `packages/cms-ui/src/blocks/ContactFormWithMap.fixtures.json` | `?output=embed` (line 1) | Yes — mirror update |
| `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` | `?output=embed` (line 6, DEFAULT_SRC const) | Yes — update asserted URL |
| `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` | `?output=embed` (line 6, DEFAULT_SRC const) | Yes — mirror update |
| `apps/brikette/src/locales/en/guides/content/reachBudget.json:83` | `?pb=...` (mapEmbedUrl field) | **No code consumer found** — `mapEmbedUrl` is not read by any route or component; **excluded from scope** pending confirmation of a renderer |
| `apps/brikette/src/locales/en/guides/content/chiesaNuovaArrivals.json:217` | `?pb=...` (stepsMapEmbedUrl field) | Yes — update (×18 locales) |
| `apps/brikette/src/locales/en/guides/content/chiesaNuovaDepartures.json:185` | `?pb=...` (stepsMapEmbedUrl field) | Yes — update (×18 locales) |

**Files not requiring changes:**
- `packages/ui/src/components/organisms/StoreLocatorMap.tsx` — OpenStreetMap/Leaflet, no Google dependency
- `apps/brikette/src/components/landing/LocationMiniBlock.tsx` — deep link only, no embed

### Patterns & Conventions Observed

- `NEXT_PUBLIC_*` prefix for client-side env vars — evidence: `apps/brikette/.env.local`
- `ContactFormWithMap` already accepts `mapSrc` as an overridable prop — key can be injected at page/CMS level
- `LocationModal` builds URL strings via `useMemo` with `encodeURIComponent` — clean injection point
- Guide embed URLs (`stepsMapEmbedUrl`) are stored as opaque strings in locale JSON and consumed verbatim by `articleLead.tsx:158` — no key injection at render time currently. `reachBudget.json` contains a `mapEmbedUrl` field with a `?pb=...` URL but **no runtime renderer for this field was found** in any route or component

### Data & Contracts

- Types/schemas/events:
  - `LocationModalProps.hostelAddress: string` — free-form address used as embed `q=` and `destination=`
  - `ContactFormWithMap` accepts `mapSrc?: string` — caller provides full URL
  - Guide JSON schema — `stepsMapEmbedUrl?: string` (consumed by `articleLead.tsx`; see `types.ts`); `mapEmbedUrl?: string` exists in `reachBudget.json` (all 18 locales) but has no known runtime consumer — not in scope
- Persistence: no persistence; all map state is ephemeral UI
- API/contracts (proposed — Maps Embed API v1):
  - Place mode: `https://www.google.com/maps/embed/v1/place?key=KEY&q=ENCODED_ADDRESS&zoom=13`
  - Directions mode: `https://www.google.com/maps/embed/v1/directions?key=KEY&origin=ENCODED_ORIGIN&destination=ENCODED_DESTINATION`

### Dependency & Impact Map

- Upstream dependencies:
  - `hotel.address` in `apps/brikette/src/config/hotel.ts` — address string for `q=` / `destination=`
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` — new env var; must be set in Cloudflare Pages env (production + staging)
  - Guide locale JSON files — embed URL strings baked in per locale
- Downstream dependents:
  - `LocationMiniBlock` → `LocationModal` (landing page)
  - Any CMS page rendering `ContactFormWithMap`
  - `articleLead.tsx` renders `stepsMapEmbedUrl` from `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (2 guides × 18 locales = 36 locale files); `departures/articleLead.tsx:1` is a re-export of the arrivals component with no independent map code
- Likely blast radius:
  - **Narrow for components** — only `src` attribute changes on existing `<iframe>` elements
  - **Broader for guide locale files** — 36 JSON files to update (`stepsMapEmbedUrl` in arrivals + departures × 18 locales); mechanical change but high file count
  - If key is missing, iframe renders a Google error page — graceful degradation, nothing crashes

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (unit)
- Commands:
  - `packages/ui`: `pnpm --filter @acme/ui test` (uses `packages/ui/jest.config.cjs`)
  - `packages/cms-ui`: `pnpm --filter @acme/cms-ui test`
  - Brikette: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`
- CI integration: reusable-app.yml runs jest on all PRs

#### Existing Test Coverage

| Area | Test Type | Files | Coverage notes |
|---|---|---|---|
| `ContactFormWithMap` | Unit | `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` | Asserts `DEFAULT_SRC` equals current deprecated URL — **test must be updated** |
| `ContactFormWithMap` | Unit | `packages/ui/__tests__/ContactFormWithMap.test.tsx` | Uses custom `/map` src — unaffected by URL change |
| `ContactFormWithMap` | Unit | `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` | Mirrors primary test — `DEFAULT_SRC` const must be updated |
| `LocationModal` | Unit | `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx:107` | `"renders location iframe when open"` — asserts iframe presence but not `src` value; may need extension |
| Guide embed URLs | None | — | No tests assert `stepsMapEmbedUrl` values; `mapEmbedUrl` (`reachBudget.json`) has no renderer and is excluded from scope |

#### Coverage Gaps

- `LocationModal` URL builder logic — `pinnedMap` and `directions` `useMemo` computations are not asserted by existing tests; `ModalBasics.test.tsx` only confirms the iframe renders
- Guide embed URL format — no tests validate the URL strings in locale JSON files

#### Recommended Test Approach

- Unit tests for: extend `ModalBasics.test.tsx` — assert `iframe[src]` contains `https://www.google.com/maps/embed/v1/place` (pin view) and `https://www.google.com/maps/embed/v1/directions` (directions view) with correct encoded params
- Update: `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` and `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` — change `DEFAULT_SRC` constant to the new Maps Embed API v1 URL

### Recent Git History (Targeted)

- `packages/ui/src/organisms/modals/LocationModal.tsx` — 5 commits; oldest: "pullman work pt1" — stable since initial authoring, no recent maps-specific changes
- Guide locale JSON files — not investigated; assumed stable (guide content, not maps-specific)

---

## External Research

- **Maps Embed API pricing**: Free with unlimited usage — no per-load charge, no daily cap. An API key and billing account are required but no cost is incurred regardless of volume. Source: developers.google.com/maps/documentation/embed/usage-and-billing
- **Maps Embed API — place mode**: `https://www.google.com/maps/embed/v1/place?key=KEY&q=QUERY&zoom=13` — accepts address string or Place ID. Host is `www.google.com`, not `maps.googleapis.com`.
- **Maps Embed API — directions mode**: `https://www.google.com/maps/embed/v1/directions?key=KEY&origin=ORIGIN&destination=DESTINATION`
- **`?pb=` format**: The protobuf-encoded embed URL generated by Google Maps "Share → Embed" is also an undocumented keyless format with the same support caveats as `?output=embed`. It must be replaced or accepted as-is with a documented scope exclusion.

---

## Option Comparison

### Option A: Maps Embed API only (Recommended)

**What changes:**
- `LocationModal.tsx` and `ContactFormWithMap.tsx` — URL string builders → Maps Embed API v1
- `ContactFormWithMap.stories.ts`, `ContactFormWithMap.fixtures.json` (×2) — update embed URL strings
- `ContactFormWithMap.test.tsx` (×2) — update `DEFAULT_SRC` constant
- Guide locale JSONs — replace `?pb=...` `stepsMapEmbedUrl` values in `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (36 files × 18 locales); key injected at render time in `articleLead.tsx` (decided)

**Google Cloud Console setup:**
1. APIs & Services → Enable → search "Maps Embed API" → Enable
2. Credentials → Create API Key
3. Restrict key: HTTP referrers → `https://www.hostel-positano.com/*`, `https://staging.hostel-positano.com/*`, `https://staging.brikette-website.pages.dev/*`, `http://localhost:3000/*`; API restriction → Maps Embed API only
4. Add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to Cloudflare Pages env (production + staging) and `apps/brikette/.env.local`

**Effort:** ~4 hours (components + 36 JSON files). **Risk:** Low.

---

### Option B: Maps JavaScript API (Full SDK)

Remove iframe approach entirely; load `@vis.gl/react-google-maps`; render interactive map components with custom markers.

**Additional GCP:** Also enable "Maps JavaScript API".

**Effort:** ~1–2 days. **Risk:** Medium (new SDK, bundle impact, SSR guards).

---

### Option C: Directions API (Server-side)

Server route calls the Directions API backend, returns route steps as text.

**Additional GCP:** Also enable "Directions API" (server-side key — separate from embed key).

**Effort:** ~3–4 days. **Risk:** Higher. **Value:** Marginal for current UX.

---

## Questions

### Resolved

- Q: Do any tests exist for `ContactFormWithMap` or `LocationModal`?
  - A: Yes. Three test files cover `ContactFormWithMap`; `ModalBasics.test.tsx` covers `LocationModal`. See Test Landscape above.
  - Evidence: `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx`, `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx`, `packages/ui/__tests__/ContactFormWithMap.test.tsx`, `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx:107`

- Q: Are there Google Maps API keys elsewhere in the project?
  - A: No Google Maps API keys exist in any env file or config. Other API keys exist in the project (e.g. `STRIPE_SECRET_KEY` in `apps/cms/.env.example`) but are unrelated.
  - Evidence: search across all env files and config

- Q: What is the correct Maps Embed API v1 hostname?
  - A: `https://www.google.com/maps/embed/v1/...` — not `maps.googleapis.com`
  - Evidence: Google Maps Platform docs

- Q: What is the current Maps Embed API billing model?
  - A: Completely free with unlimited requests — no per-load charge, no daily cap. Billing account required for key creation but no cost is incurred.
  - Evidence: developers.google.com/maps/documentation/embed/usage-and-billing

### Resolved (Owner Confirmed)

- Q: Which option to implement — A (Embed API), B (JS API), or C (Directions API)?
  - **Decision: Option A** — Maps Embed API v1 iframe replacement only. No SDK, no server-side routes.

- Q: For guide locale JSON files: migrate or retain `?pb=` format?
  - **Decision: Migrate** — replace `stepsMapEmbedUrl` values in `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (36 locale files) with Maps Embed API v1 URLs; inject API key at render time in `articleLead.tsx`. Approach is **TDD-first**: write and pass tests for each surface before touching production URLs. `reachBudget.json mapEmbedUrl` remains excluded — no code renderer found.

- Q: Should `LocationModal` fall back to a "View on Google Maps" link when `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is undefined?
  - **Decision: Yes** — render a plain link fallback. Prevents broken iframe in dev environments.

### Open (Action Required)

- Q: Is there an existing Google Cloud project for Brikette, or does one need to be created?
  - Why it matters: A project and billing account are prerequisites for key creation (TASK-01). Without the key, TASK-03+ cannot be completed.
  - Action: Check Google Cloud Console for any existing project associated with the Brikette or hostel-positano.com account before creating a new one.
  - Decision owner: Peter Cowling
  - Default assumption: New project needed; billing account already exists.

---

## Confidence Inputs

- **Implementation**: 92% — all affected files identified including tests, fixtures, stories, and guide JSONs; URL format confirmed from official docs.
  - Raises to ≥80: Already met.
  - Raises to ≥90: Met.

- **Approach**: 92% — Maps Embed API v1 is stable and well-documented. Key injection strategy for guide locale JSONs confirmed (render-time injection in `articleLead.tsx`).
  - Raises to ≥80: Already met.
  - Raises to ≥90: Met.

- **Impact**: 70% — benefit is reliability/observability; user-visible change is zero.
  - Raises to ≥80: Owner confirms one of the deprecated formats has actually failed or been rate-limited.
  - Raises to ≥90: Not needed for build eligibility.

- **Delivery-Readiness**: 65% — blocked on GCP key creation (external action).
  - Raises to ≥80: Owner creates key and adds it to Cloudflare Pages env.
  - Raises to ≥90: Key confirmed working locally.

- **Testability**: 85% — existing tests for both components identified; `DEFAULT_SRC` update path is clear. `ModalBasics.test.tsx` needs extension to assert `src` value.
  - Raises to ≥80: Already met.
  - Raises to ≥90: Add src-value assertions to `ModalBasics.test.tsx`.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GCP key exposed in browser source | High (by design) | Low | Restrict to HTTP referrers (production + both staging origins + localhost); use env-derived hostname lists if additional preview origins emerge |
| Key missing causes broken iframe | Medium | Medium | Add env var to Cloudflare Pages; add link fallback when key is undefined |
| Old embed format breaks before migration | Low–Medium | Medium | Proceed with migration promptly |
| 36 guide JSON files introduce merge conflicts | Medium | Low | Mechanical change; run as a single atomic commit |
| `DEFAULT_SRC` tests fail after URL change | Certain (if not updated) | Low | Explicitly seeded as a task |
| Maps Embed API free tier misunderstood causing billing concern | Low | Low | Confirmed free with unlimited usage; billing account required but no charges incurred |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - `NEXT_PUBLIC_` prefix for all client-side env vars
  - API key HTTP referrer restriction is **mandatory** before production deploy
  - `packages/ui` test command is `pnpm --filter @acme/ui test` — not the Brikette jest config
  - `packages/cms-ui` test command is `pnpm --filter @acme/cms-ui test`
- Rollout/rollback: revert URL strings in 2 components + 36 JSON files + remove env var; zero risk to other features
- Observability: map load quota visible in GCP Console → APIs & Services → Metrics after first production deploy

---

## Suggested Task Seeds (Non-binding)

TDD-first ordering: tests are written and run red before the corresponding production change is made. No production URL is changed until its test is green against the new format.

1. **TASK-01** *(owner action)*: Check Google Cloud Console for an existing project associated with Brikette/hostel-positano.com; if none, create one. Enable Maps Embed API, create API key, restrict HTTP referrers to `hostel-positano.com`, `staging.hostel-positano.com`, `staging.brikette-website.pages.dev`, `localhost:3000`; restrict API to Maps Embed API only.
2. **TASK-02**: Add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to `apps/brikette/.env.local` (dev) and Cloudflare Pages env (staging + production); document in env reference. *Can run in parallel with TASK-03+.*
3. **TASK-03** *(TDD)*: Extend `ModalBasics.test.tsx` — add red assertions on `iframe[src]` for `place` and `directions` Maps Embed API v1 URL patterns; then update `LocationModal.tsx` `useMemo` builders to make them green. Add fallback link render when key is undefined.
4. **TASK-04** *(TDD)*: Update `DEFAULT_SRC` in `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` and `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` to the new URL (red); then update `ContactFormWithMap.tsx` default `mapSrc`, `ContactFormWithMap.stories.ts`, and `ContactFormWithMap.fixtures.json` (×2) to make them green.
5. **TASK-05** *(TDD)*: Write a test validating `stepsMapEmbedUrl` format in EN locale JSONs (red); update `articleLead.tsx` to inject API key at render time; replace `?pb=...` `stepsMapEmbedUrl` values in `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (×18 locales = 36 files) to make them green. (`reachBudget.json mapEmbedUrl` excluded — no code renderer found.)

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `LocationModal.tsx` and `ContactFormWithMap.tsx` updated with Maps Embed API v1 URLs
  - Stories and fixtures updated
  - Tests updated and passing — run via `pnpm --filter @acme/ui test` and `pnpm --filter @acme/cms-ui test`
  - Guide locale JSONs updated (`stepsMapEmbedUrl` in arrivals + departures, 36 files)
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` documented in env reference
  - Map iframe confirmed working in staging
- Post-delivery measurement: verify GCP Console → Maps Embed API → Metrics shows requests after first production deploy

---

## Evidence Gap Review

### Gaps Addressed

- Test coverage corrected: three `ContactFormWithMap` test files found; `ModalBasics.test.tsx` confirmed to cover `LocationModal` iframe render
- Artifact inventory expanded: stories (`.stories.ts`), fixtures (`.fixtures.json` ×2), and tests (×2) added to key modules table
- Guide embed surfaces corrected: `articleLead.tsx` renders `stepsMapEmbedUrl` (`?pb=...`) from `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` only (2 × 18 = 36 locale files); `departures/articleLead.tsx:1` is a re-export with no independent map code. `reachBudget.json` contains `mapEmbedUrl` (all 18 locales) but **no code consumer was found** — excluded from scope
- Maps Embed API hostname corrected to `www.google.com/maps/embed/v1/...`
- Billing claim corrected: Maps Embed API is free with unlimited usage (no 28,000/month cap)
- "No API keys" claim narrowed: no *Google Maps* API keys; other unrelated keys present in repo

### Confidence Adjustments

- Testability raised from 80% → 85% (existing tests identified rather than assumed absent)
- Delivery-Readiness remains 65% (external dependency on GCP key unchanged)

### Remaining Assumptions

- GCP project existence unknown — owner to confirm before TASK-01; code tasks (TASK-03–05) can proceed independently

---

## Planning Readiness

- Status: Ready-for-planning
- Resolved blockers:
  - Option A confirmed
  - Guide migration confirmed (TDD-first, key injection at render time)
  - Fallback link in `LocationModal` confirmed
- Remaining open item:
  - GCP project existence unknown — owner must check before TASK-01 can be completed; code tasks (TASK-03–05) can proceed in parallel since they don't require the live key
- Recommended next step: `/lp-do-plan`
