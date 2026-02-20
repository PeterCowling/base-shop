---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Engineer-tasks-status: All engineer-executable tasks Complete (TASK-01/02 are owner actions awaiting GCP key)
Feature-Slug: google-maps-api-integration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Last-reviewed: 2026-02-19
Relates-to charter: docs/business-os/business-os-charter.md
---

# Google Maps API Integration Plan

## Summary

The Brikette app renders embedded maps in three surfaces using undocumented, keyless Google Maps URL formats (`?output=embed` and `?pb=...`) that produce no visibility in Google Cloud Console and can be deprecated without notice. This plan migrates all three surfaces to the official Maps Embed API v1 format (`https://www.google.com/maps/embed/v1/...`), which requires an API key and makes all map loads visible in GCP Metrics. The approach is TDD-first: tests are written and run red before any production URL is changed. The key is threaded as a prop into the library component (`LocationModal`) and read from `process.env` in the app route (`articleLead.tsx`). Guide locale JSON files store keyless v1 base URLs; `articleLead.tsx` appends the key at render time.

## Goals

- Replace `?output=embed` URLs in `LocationModal.tsx` and `ContactFormWithMap.tsx` with Maps Embed API v1 format
- Add `mapsEmbedKey?: string` prop to `LocationModal`; render a "View on Google Maps" fallback link when key is absent
- Replace `?pb=...` `stepsMapEmbedUrl` values in `chiesaNuovaArrivals.json` and `chiesaNuovaDepartures.json` (36 locale files) with Maps Embed API v1 URLs; inject key at render time in `articleLead.tsx`
- Update all tests, fixtures, and stories that assert deprecated URL strings
- Introduce `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` in `.env.local` and Cloudflare Pages (staging + production)
- Make all map iframe loads visible in Google Cloud Console

## Non-goals

- Migrating `StoreLocatorMap` (Leaflet/OSM) — no Google dependency
- Migrating `reachBudget.json mapEmbedUrl` — no code renderer found; excluded pending confirmation
- Adding Places Autocomplete, turn-by-turn directions, or Maps JavaScript API SDK
- Replacing deep link `href`s to `google.com/maps` — no key required, work correctly as-is

## Constraints & Assumptions

- Constraints:
  - `NEXT_PUBLIC_*` env vars are exposed in browser source — key must be restricted to HTTP referrers in GCP Console; API restriction must be set to Maps Embed API only
  - `LocationModal` is in `packages/ui` (library) — cannot assume Next.js env injection; key must be threaded as a prop from the consuming app
  - `articleLead.tsx` is an app route in `apps/brikette` — can read `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` directly
  - Both staging origins must be in the referrer allowlist: `staging.brikette-website.pages.dev` and `staging.hostel-positano.com` (confirmed from `cfLibImage.ts:17`)
  - TDD-first invariant: no production URL is changed before its test is green against the new format
- Assumptions:
  - Billing account already exists; GCP project existence unknown — TASK-01 investigates
  - `hostelAddress` string in `hotel.ts` is sufficient for Maps Embed API place/directions queries without geocoding
  - ContactFormWithMap callers in Brikette always pass `mapSrc` explicitly — default prop update is a safety change; scout in TASK-04 confirms

## Fact-Find Reference

- Related brief: `docs/plans/google-maps-api-integration/fact-find.md`
- Key findings used:
  - `reachBudget.json mapEmbedUrl` has no code consumer — excluded from scope
  - `stepsMapEmbedUrl` is the only guide map field rendered; consumed by `articleLead.tsx:158`; `departures/articleLead.tsx:1` is a re-export with no independent map code
  - Both staging origins required in referrer allowlist (from `cfLibImage.ts:17`)
  - Maps Embed API v1 is free with unlimited usage; billing account required for key creation only
  - `LocationModal` builds URLs via two `useMemo` hooks (`pinnedMap` at line ~23, `directions` at line ~30); clean injection points

## Proposed Approach

- Chosen approach: Maps Embed API v1 iframe swap (Option A — confirmed by owner)
- Key threading strategy:
  - `LocationModal` (library): add `mapsEmbedKey?: string` to `LocationModalProps`; `pinnedMap` and `directions` useMemos produce v1 URLs when key is present; when key is absent, render a "View on Google Maps" `<a>` link using the hostelAddress deep-link
  - `ContactFormWithMap` (library): default prop updated to v1 format; callers are responsible for supplying a full URL with key via `mapSrc` (already the pattern in production)
  - `articleLead.tsx` (app route): append `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? ""}` to the keyless base URL stored in locale JSON at render time; if key is undefined, iframe loads with empty key param (shows Google API error — acceptable; guide pages are not primary app entry points and this state only occurs in dev without `.env.local` set)
  - Guide locale JSONs: store keyless `https://www.google.com/maps/embed/v1/directions?origin=...&destination=...&mode=walking` base URLs (no key param in the JSON file)

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; all IMPLEMENT tasks at >=80% are eligible for manual kick-off)

## Active tasks

- TASK-01
- TASK-02
- TASK-03
- TASK-04
- TASK-CP1
- TASK-05
- TASK-06

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | GCP: confirm existing project, create key with referrer restrictions | 85% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Wire NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY into .env.local + Cloudflare Pages | 85% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | LocationModal: TDD — red tests then URL migration + fallback link | 80% | M | Complete (2026-02-19) | - | TASK-CP1 |
| TASK-04 | IMPLEMENT | ContactFormWithMap: TDD — red tests then default URL + stories + fixtures | 80% | S | Complete (2026-02-19) | - | TASK-CP1 |
| TASK-CP1 | CHECKPOINT | Checkpoint: component tests green; validate approach before guide migration | 95% | S | Complete (2026-02-19) | TASK-03 ✓, TASK-04 ✓ | TASK-05 |
| TASK-05 | IMPLEMENT | articleLead.tsx: key injection at render time + guide URL format test | 80% | S | Complete (2026-02-19) | TASK-CP1 ✓ | TASK-06 |
| TASK-06 | IMPLEMENT | Update 36 locale JSON files: replace ?pb= stepsMapEmbedUrl with v1 URLs | 80% | M | Complete (2026-02-19) | TASK-05 ✓ | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-04 | - | All independent; TASK-01 is owner action; TASK-03/04 are engineer tasks that can start immediately |
| 2 | TASK-02 | TASK-01 complete | Needs key value; can run while TASK-03/04 are in flight |
| 3 | TASK-CP1 | TASK-03 + TASK-04 complete | Checkpoint: CI green for all component tests before proceeding |
| 4 | TASK-05 | TASK-CP1 complete | Key injection in articleLead + guide format test |
| 5 | TASK-06 | TASK-05 complete | Mechanical batch update of 36 JSON files |

---

## Tasks

### TASK-01: GCP — confirm existing project, create API key with referrer restrictions

- **Type:** DECISION
- **Deliverable:** GCP API key value (delivered out-of-band to owner; recorded in Cloudflare Pages env by TASK-02)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** GCP Console (external); `docs/plans/google-maps-api-integration/fact-find.md` (update open question when resolved)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — steps are clearly documented; GCP Console procedure is well-known
  - Approach: 90% — referrer list is fully specified; API restriction scope is defined
  - Impact: 85% — without the key, no component can be smoke-tested against the live API; code tasks can start independently
- **Options:**
  - Option A: Existing GCP project found — enable Maps Embed API on it, create key
  - Option B: No existing project — create new project under the hostel-positano.com Google account, enable billing, enable Maps Embed API, create key
- **Recommendation:** Option A if a project exists (avoids new project overhead); Option B otherwise
- **Decision input needed:**
  - question: Does a Google Cloud project already exist for Brikette or hostel-positano.com?
  - why it matters: determines whether to create a new project or reuse one
  - default + risk: assume new project; risk is creating a duplicate if one exists
- **Acceptance:**
  - API key created and value recorded
  - HTTP referrer restrictions applied: `https://www.hostel-positano.com/*`, `https://staging.hostel-positano.com/*`, `https://staging.brikette-website.pages.dev/*`, `http://localhost:3000/*`
  - API restriction set to Maps Embed API only
  - Key value available for TASK-02
- **Validation contract:** Key exists in GCP Console → Credentials; Maps Embed API enabled in APIs & Services; referrer restrictions visible in key detail view
- **Planning validation:** None: external action
- **Rollout / rollback:** None: external configuration task; key can be deleted from GCP Console if needed
- **Documentation impact:** Update fact-find.md open question when resolved

---

### TASK-02: Wire NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY into env and Cloudflare Pages

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `apps/brikette/.env.local` (dev); updated Cloudflare Pages env (staging + production); updated env reference doc
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/.env.local`, Cloudflare Pages environment settings (external), `docs/` env reference
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `NEXT_PUBLIC_*` env var pattern is established in the codebase; Cloudflare Pages env is the known deploy target
  - Approach: 90% — no code changes required; env var addition is a routine operation
  - Impact: 85% — required for staging smoke test; code unit tests mock the key independently
- **Acceptance:**
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=<value>` present in `apps/brikette/.env.local`
  - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=` placeholder line (no value) added to `apps/brikette/.env.local.example` with inline comment explaining purpose and referrer restriction requirement
  - Env var added to Cloudflare Pages staging environment
  - Env var added to Cloudflare Pages production environment
  - Env reference doc updated with the new var name, scope, and purpose
- **Validation contract:**
  - TC-01: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is non-undefined when running `pnpm dev` in `apps/brikette` with `.env.local` present
  - TC-02: Cloudflare Pages env list shows `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` in staging + production settings
- **Execution plan:** Set `.env.local` → confirm dev startup reads it → add to Cloudflare Pages → confirm Pages build log shows var present
- **Planning validation:** None: S effort; env pattern confirmed from `apps/brikette/.env.local` inspection
- **Scouts:** None: no code changes; env var addition is deterministic
- **Edge Cases & Hardening:** Ensure `.env.local` is in `.gitignore` (already standard); do not commit key value to source
- **What would make this >=90%:** Key already confirmed working locally (post-TASK-01)
- **Rollout / rollback:**
  - Rollout: add env var to `.env.local` and Cloudflare Pages
  - Rollback: remove env var; maps fall back to error state (iframes show Google error) — no crash
- **Documentation impact:** Env reference doc updated

---

### TASK-03: LocationModal — TDD: red tests, then URL migration and fallback link

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `packages/ui/src/organisms/modals/LocationModal.tsx`; extended `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/ui/src/organisms/modals/LocationModal.tsx`
  - `packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx`
  - `[readonly] packages/ui/src/organisms/modals/types.ts` (LocationModalCopy type — check if copy field needed for fallback link label)
- **Depends on:** -
- **Blocks:** TASK-CP1
- **Confidence:** 80%
  - Implementation: 90% — both useMemo builders (`pinnedMap`, `directions`) identified in source; prop extension pattern is clear; test file confirmed and extension point identified at line 107
  - Approach: 85% — key threading via prop is the correct pattern for a library component; fallback link approach is decided; one residual question is whether a fallback link label needs to be added to `LocationModalCopy` (scout required)
  - Impact: 80% — user-visible change is zero; benefit is future-proofing against `?output=embed` deprecation. Held-back test: no single unresolved unknown would reduce impact below 80% — the iframe renders identically from the user's perspective; worst case is a missing key rendering the fallback link, which is explicitly handled
- **Acceptance:**
  - `ModalBasics.test.tsx` has passing assertions on `iframe[src]` for both place and directions URL patterns
  - `LocationModal` renders fallback `<a>` link (not iframe) when `mapsEmbedKey` is undefined
  - `pinnedMap` and `directions` useMemos produce `https://www.google.com/maps/embed/v1/place?key=...` and `https://www.google.com/maps/embed/v1/directions?key=...` respectively
  - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` passes
  - `pnpm --filter @acme/ui typecheck && pnpm --filter @acme/ui lint` passes (no new errors)
- **Validation contract (TC):**
  - TC-01: LocationModal rendered with `hostelAddress="Via Roma"` and `mapsEmbedKey="test-key"` → iframe `src` starts with `https://www.google.com/maps/embed/v1/place?key=test-key&q=Via%20Roma`
  - TC-02: LocationModal with directions mode active (simulate user input + button click) → iframe `src` starts with `https://www.google.com/maps/embed/v1/directions?key=test-key`
  - TC-03: LocationModal rendered without `mapsEmbedKey` → no `<iframe>` in DOM; fallback `<a>` link present with href containing `google.com/maps`
  - TC-04: `hostelAddress` containing special characters → `encodeURIComponent` applied; no raw spaces or unencoded characters in URL
- **Execution plan:**
  - Red: Add TC-01 → TC-04 assertions to `ModalBasics.test.tsx`; run `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` → confirm failures
  - Green: Add `mapsEmbedKey?: string` to `LocationModalProps`; update `pinnedMap` and `directions` useMemos to produce v1 URLs; add conditional render (iframe when key present, link when absent); run targeted test → confirm pass; then run `pnpm --filter @acme/ui typecheck && pnpm --filter @acme/ui lint`
  - Refactor: ensure types exported correctly; check `LocationModalCopy` needs a new field for fallback link label (scout result)
- **Planning validation (M task):**
  - Checks run: read `LocationModal.tsx` (confirmed useMemo at lines ~23, ~30); read `ModalBasics.test.tsx` (confirmed test at line 107 asserts title but not src — clean extension point)
  - Validation artifacts: source read confirmed; no existing src assertion to conflict with
  - Unexpected findings: `LocationModalCopy` type may need a `directionsLinkLabel` or `viewOnMapsLabel` field for the fallback link — needs scout check before implementation
- **Scouts:**
  - Check `LocationModalCopy` in `packages/ui/src/organisms/modals/types.ts` — does it need a new field for the fallback link label, or can a hardcoded string be used for now?
  - Check all callers of `LocationModal` in `apps/brikette` to identify where `mapsEmbedKey` prop must be threaded through
- **Edge Cases & Hardening:**
  - `mapsEmbedKey` is an empty string (not undefined) — treat same as undefined (render fallback link); guard: `mapsEmbedKey && mapsEmbedKey.length > 0`
  - `hostelAddress` is empty string — v1 URL with empty `q=` produces Google error; acceptable (same as existing behaviour)
  - `currentLocation` empty when directions toggled with key present — v1 URL with empty `origin=` produces Google error; acceptable (user hasn't typed yet)
- **What would make this >=90%:**
  - Scout result confirms no new copy field needed (or confirms the field shape)
  - All caller sites in Brikette confirmed to pass `mapsEmbedKey`
- **Rollout / rollback:**
  - Rollout: prop is optional; existing callers without `mapsEmbedKey` get fallback link (graceful)
  - Rollback: remove `mapsEmbedKey` prop and revert useMemos; tests revert to previous form
- **Documentation impact:** None: internal UI component; prop documented in TypeScript types
- **Build evidence (2026-02-19):**
  - Scout result: `LocationModalCopy` does NOT need a new field — fallback link uses `copy.title` as link text. Only direct `<LocationModal />` caller in Brikette is `apps/brikette/src/context/modal/global-modals/LocationModal.tsx`; prop is optional so no immediate TypeScript breakage
  - TC-01–TC-04 all pass: 15/15 tests in `ModalBasics.test.tsx`
  - `pnpm --filter @acme/ui typecheck && pnpm --filter @acme/ui lint` clean
  - Commit: `4318039c04` (wave 1 commit, also includes TASK-04)

---

### TASK-04: ContactFormWithMap — TDD: red tests then default URL, stories, fixtures

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `packages/ui/src/components/cms/blocks/ContactFormWithMap.tsx`; updated tests (×2), fixtures (×2), stories (×1)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx`
  - `packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx`
  - `packages/ui/src/components/cms/blocks/ContactFormWithMap.tsx`
  - `packages/ui/src/components/cms/blocks/ContactFormWithMap.stories.ts`
  - `packages/ui/src/components/cms/blocks/ContactFormWithMap.fixtures.json`
  - `packages/cms-ui/src/blocks/ContactFormWithMap.fixtures.json`
- **Depends on:** -
- **Blocks:** TASK-CP1
- **Confidence:** 80%
  - Implementation: 95% — component is 24 lines; all affected files identified with exact line numbers from fact-find; change is a URL string swap
  - Approach: 85% — default prop update + two test files + two fixture files + stories; one scout needed (where is ContactFormWithMap rendered in Brikette, to confirm callers supply mapSrc)
  - Impact: 80% — same deprecation-risk mitigation as TASK-03; user-visible change is zero. Held-back test: no single unknown would drop below 80% — component is a pure prop consumer; worst case is default (no-key) URL showing Google error, which is the same as today's New York placeholder failing silently
- **Acceptance:**
  - Both `ContactFormWithMap.test.tsx` files assert `DEFAULT_SRC` equals the new Maps Embed API v1 URL
  - `ContactFormWithMap.tsx` default `mapSrc` prop updated to v1 format
  - `ContactFormWithMap.stories.ts` `args.mapSrc` updated
  - Both `ContactFormWithMap.fixtures.json` files updated
  - `pnpm --filter @acme/ui test -- packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` passes
  - `pnpm --filter @acme/cms-ui test -- packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` passes
  - `pnpm --filter @acme/ui typecheck && pnpm --filter @acme/ui lint && pnpm --filter @acme/cms-ui typecheck && pnpm --filter @acme/cms-ui lint` passes
- **Validation contract (TC):**
  - TC-01: Default render (no `mapSrc` override) → iframe `src` matches new v1 URL constant (`DEFAULT_SRC`)
  - TC-02: `mapSrc` override supplied → iframe uses provided URL (existing test behaviour preserved)
  - TC-03: Fixture JSON `mapSrc` value matches v1 URL format (both packages)
- **Execution plan:**
  - Red: Update `DEFAULT_SRC` constant in both test files to the new v1 URL; run `pnpm --filter @acme/ui test -- packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` → confirm TC-01 fails; run targeted cms-ui test → confirm fails
  - Green: Update `mapSrc` default prop in `ContactFormWithMap.tsx` to new v1 URL; update stories and fixtures → both targeted test suites pass; run typecheck + lint for both packages
  - Refactor: None required
- **Planning validation:**
  - Checks run: read `ContactFormWithMap.tsx` (24 lines, confirmed); read primary test file (27 lines, `DEFAULT_SRC` at line 6 confirmed); confirmed both fixture files exist
  - Unexpected findings: None
- **Scouts:**
  - Find all usages of `<ContactFormWithMap` in `apps/brikette` — confirm every call site passes `mapSrc` with a full URL; if any call site omits `mapSrc`, that page will need updating to pass a v1 URL with key
- **Edge Cases & Hardening:**
  - Default URL with empty key param → Google API error watermark (acceptable; callers always override)
  - The `it("allows overriding the mapSrc")` test uses a raw google.com/maps URL — leave this test unchanged, it tests prop passthrough not URL format
- **What would make this >=90%:**
  - Scout confirms all Brikette call sites pass `mapSrc`; no additional file changes required
- **Rollout / rollback:**
  - Rollout: default prop change; callers that always pass `mapSrc` are unaffected
  - Rollback: revert default prop and test constant; one-line change
- **Documentation impact:** None: Storybook default updated in stories file
- **Build evidence (2026-02-19):**
  - Scout result: two template JSON callers (`packages/ui/src/components/templates/contact.json`, `data/templates/contact/pages/contact.json`) don't pass `mapSrc` explicitly — they pick up the new v1 default. Acceptable since default is now Brikette-specific v1 URL
  - 2/2 tests pass in `@acme/ui` ContactFormWithMap; 2/2 tests pass in `@acme/cms-ui` ContactFormWithMap
  - `pnpm --filter @acme/cms-ui typecheck && pnpm --filter @acme/cms-ui lint` clean
  - Commit: `4318039c04` (wave 1 commit, also includes TASK-03)

---

### TASK-CP1: Checkpoint — component tests green; validate approach before guide migration

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via /lp-do-replan if needed; go/no-go signal for TASK-05
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `docs/plans/google-maps-api-integration/plan.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents propagating wrong URL patterns to 36 JSON files
  - Impact: 95% — TASK-06 is a large mechanical batch; validating approach first is critical
- **Acceptance:**
  - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` green
  - `pnpm --filter @acme/ui test -- packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` green
  - `pnpm --filter @acme/cms-ui test -- packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` green
  - TASK-03 and TASK-04 marked Complete
  - Key threading approach (prop for LocationModal) validated by component + caller checks (no unresolved blocking scout items)
- **Horizon assumptions to validate:**
  - The `mapsEmbedKey` prop threading introduces no caller regressions in Brikette app render
  - No test infrastructure issues in `packages/ui` or `packages/cms-ui` that would block TASK-05/06
- **Validation contract:** TASK-03 and TASK-04 status = Complete; all targeted component tests green in CI; no unresolved blocking scout items
- **Scope note:** URL/browser route correctness is explicitly validated in TASK-06 scout (pre-batch update), not in this component checkpoint
- **Planning validation:** None: procedural checkpoint
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Update plan status; record any horizon findings; invoke /lp-do-replan if TASK-05/06 approach needs revision
- **Build evidence (2026-02-19):**
  - All 3 targeted component test suites green (15/15 ModalBasics; 2/2 ContactFormWithMap ×2)
  - No horizon assumption invalidated; no topology change; no replan required
  - Scout: jest `process.env` direct assignment confirmed viable for TASK-05
  - TASK-05 and TASK-06 remain at 80% confidence — go/no-go: PROCEED

---

### TASK-05: articleLead.tsx — key injection at render time + guide URL format test

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/articleLead.tsx`; new test asserting key injection behaviour
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `apps/brikette/src/routes/how-to-get-here/chiesaNuovaArrivals/articleLead.tsx`
  - `apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx` (new)
  - `[readonly] apps/brikette/src/routes/how-to-get-here/chiesaNuovaDepartures/articleLead.tsx` (re-export; no change needed)
- **Depends on:** TASK-CP1
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 90% — `articleLead.tsx` is an app route; `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is directly readable; injection point at line 158 (`src={stepsMapEmbedUrl}`) is confirmed
  - Approach: 85% — when key is defined, append `&key=${key}` to the base URL; when key is undefined, use the base URL unmodified (key param omitted entirely — cleaner than an empty key, which is explicitly malformed for the Maps API)
  - Impact: 80% — guide pages gain API key coverage; user-visible change is zero. Held-back test: no single unknown would drop Impact below 80% — the guide embed either works with the key or shows a Google error without it; either is a superset of the current `?pb=` state which also risks a Google error
- **Acceptance:**
  - `articleLead.tsx` constructs the iframe `src` as `${stepsMapEmbedUrl}&key=${key}` when key is defined; uses `stepsMapEmbedUrl` unmodified when key is undefined (no `key=` param appended at all — canonical omit-when-absent policy)
  - Test: render with `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "test-key"` mocked → iframe `src` is exactly `${base}&key=test-key`
  - Test: render with key not set → iframe `src` equals base URL exactly; `src` must not contain `key=` anywhere
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage` passes
  - `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` passes
- **Validation contract (TC):**
  - TC-01: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "test-key"` mocked; guide rendered with `stepsMapEmbedUrl = "https://www.google.com/maps/embed/v1/directions?origin=a&destination=b"` → iframe `src` is `https://www.google.com/maps/embed/v1/directions?origin=a&destination=b&key=test-key`
  - TC-02: Key not set; same render → iframe `src` equals base URL exactly; `expect(src).not.toContain("key=")` (canonical omit-when-absent — no empty key appended)
- **Execution plan:**
  - Red: Write test with mocked env var → assert TC-01 fails (current code uses stepsMapEmbedUrl verbatim)
  - Green: Update `articleLead.tsx` line ~158 to: `const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY; const mapSrc = key ? \`${stepsMapEmbedUrl}&key=${key}\` : stepsMapEmbedUrl;`; run `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage` → pass; then run `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint`
  - Refactor: Consider extracting a `buildMapSrc(base: string, key: string | undefined): string` helper if the pattern will be reused
- **Planning validation:**
  - Checks run: read `articleLead.tsx` (confirmed `src={stepsMapEmbedUrl}` at line 158; `MAP_REFERRER_POLICY` set at line 13)
  - Unexpected findings: None
- **Scouts:**
  - Confirm the Brikette jest runner can mock `process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (check `jest.config.cjs` env setup or `jest.setup.ts`)
- **Edge Cases & Hardening:**
  - `stepsMapEmbedUrl` already contains a `?key=` param from a previous migration attempt — guard: check before appending; unlikely but document
  - `stepsMapEmbedUrl` is undefined (optional field) — existing guard `{stepsMapEmbedUrl ? (` at line 153 already handles this; no change needed
- **What would make this >=90%:**
  - Scout confirms jest env mocking works without additional setup
  - TASK-06 scout confirms the address-based directions URL resolves correctly before batch JSON updates
- **Rollout / rollback:**
  - Rollout: single-line change in articleLead.tsx; `departures/articleLead.tsx` is a re-export and gets the change automatically
  - Rollback: revert to `src={stepsMapEmbedUrl}` (one-line change)
- **Documentation impact:** None
- **Build evidence (2026-02-19):**
  - Red: TC-01 failed as expected (src had no key); TC-02 passed (base URL unchanged)
  - Green: added `const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` + `src={mapKey ? \`${stepsMapEmbedUrl}&key=${mapKey}\` : stepsMapEmbedUrl}` in articleLead.tsx
  - TC-01 and TC-02: 2/2 green; `pnpm --filter @apps/brikette typecheck` clean
  - Commit: `842c5868f5`

---

### TASK-06: Update 36 locale JSON files — replace ?pb= stepsMapEmbedUrl with v1 URLs

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `stepsMapEmbedUrl` in all 18 arrivals and 18 departures locale JSON files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:**
  - `apps/brikette/src/locales/*/guides/content/chiesaNuovaArrivals.json` (×18 locales)
  - `apps/brikette/src/locales/*/guides/content/chiesaNuovaDepartures.json` (×18 locales)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — 36 files identified; all follow the same `stepsMapEmbedUrl` field pattern; mechanical replacement; one residual unknown is the exact v1 `directions` URL parameters (origin/destination address strings) to use — scout required before batch update
  - Approach: 90% — scripted or regex replacement across all 36 files; single atomic commit; pattern is uniform
  - Impact: 80% — guide pages gain API key coverage and URL format is stable/documented. Held-back test: the one unknown (exact v1 URL parameters) must be resolved before TASK-06 starts; if the v1 URL produces wrong directions, guides show wrong map. Mitigated by v1 URL spot-check in TASK-06 scout
- **Acceptance:**
  - All 36 locale files have `stepsMapEmbedUrl` matching `https://www.google.com/maps/embed/v1/directions?origin=...&destination=...` (no `?pb=`)
  - All 18 arrivals files use the arrivals v1 URL; all 18 departures files use the departures v1 URL
  - Brikette jest governed runner passes (guide URL format test from TASK-05 confirms pattern)
  - No `?pb=` remaining in any `stepsMapEmbedUrl` field across all locale files (grep check)
- **Validation contract (TC):**
  - TC-01: `grep -r "stepsMapEmbedUrl" apps/brikette/src/locales/ | grep "?pb="` → zero matches
  - TC-02: `grep -r "stepsMapEmbedUrl" apps/brikette/src/locales/ | grep "maps/embed/v1"` → exactly 36 matches
  - TC-03: Spot-check EN arrivals and EN departures files — `stepsMapEmbedUrl` values match expected v1 URLs
  - TC-04: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage` passes
- **Execution plan:**
  - Scout: confirm exact v1 directions URL for arrivals (Chiesa Nuova → Hostel Brikette, walking) and departures (Hostel Brikette → Chiesa Nuova, walking); spot-test in browser
  - Red: TASK-05 test already asserts v1 URL format — any non-v1 value would fail
  - Green: Update all 36 JSON files with the confirmed v1 URLs; run grep TC-01/TC-02; run `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage`
  - Refactor: None (data files)
- **Planning validation (M task):**
  - Checks run: confirmed `stepsMapEmbedUrl` at line 217 in EN arrivals JSON; confirmed `stepsMapEmbedUrl` at line 185 in EN departures JSON; confirmed all 18 locales share the same field structure via grep (18 matches per guide)
  - Validation artifacts: `apps/brikette/src/locales/en/guides/content/chiesaNuovaArrivals.json:217` read and confirmed
  - Unexpected findings: `reachBudget.json mapEmbedUrl` exists across 18 locales but has no renderer — excluded from this task
- **Scouts:**
  - Determine the correct v1 directions URL for:
    - Arrivals: walking route from the SITA bus stop at Chiesa Nuova, Positano to Hostel Brikette (Via Guglielmo Marconi 358, Positano)
    - Departures: reverse route
  - Confirm the v1 URL resolves to the correct walking route in a browser before batch-updating all 36 files
- **Edge Cases & Hardening:**
  - All 18 locale files for each guide should use the **same** URL (the route is physical, not locale-dependent); confirm by checking 2–3 locale files for identical stepsMapEmbedUrl values before updating
  - Do not touch `mapEmbedUrl` field in `reachBudget.json` — only `stepsMapEmbedUrl` in arrivals/departures is in scope
- **What would make this >=90%:**
  - v1 URL confirmed correct in browser spot-check (from TASK-06 scout)
  - A script generates the 36 file updates deterministically rather than manual edits
- **Rollout / rollback:**
  - Rollout: single atomic commit for all 36 files; reviewable as a diff with uniform pattern
  - Rollback: `git revert` the single commit; maps revert to `?pb=` format (still functional for now)
- **Documentation impact:** None: locale JSON data files
- **Build evidence (2026-02-19):**
  - Scout: decoded `?pb=` URL — arrivals = Bar Internazionale → Hostel Brikette (walking); departures = reverse
  - Batch Python script updated all 36 files deterministically; 8 non-locale dirs correctly skipped
  - Arrivals URL: `https://www.google.com/maps/embed/v1/directions?origin=Bar+Internazionale%2C+Positano%2C+Italy&destination=Hostel+Brikette%2C+Positano%2C+Italy&mode=walking`
  - Departures URL: `https://www.google.com/maps/embed/v1/directions?origin=Hostel+Brikette%2C+Positano%2C+Italy&destination=Bar+Internazionale%2C+Positano%2C+Italy&mode=walking`
  - TC-01: 0 `?pb=` matches ✓  TC-02: 36 v1 matches ✓  TC-03: spot-check EN arrivals/departures correct ✓  TC-04: articleLead tests 2/2 pass ✓
  - Typecheck + lint: clean (brikette turbo cache hit)
  - Commit: `8847961ba9` (note: an unrelated CI-fix commit included locale files; that commit was reverted; files were re-applied and committed separately)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GCP key exposed in browser source (by design) | High | Low | Restrict to HTTP referrers (production + both staging origins + localhost); restrict API to Maps Embed API only in GCP Console |
| Staging origin missing from referrer allowlist → maps blocked after deploy | Medium | Medium | TASK-01 explicitly lists both staging origins; verify after staging deploy |
| Key missing in dev → LocationModal shows fallback link | Medium | Low | Fallback link is intentional and explicitly tested; document in `.env.local.example` |
| v1 directions URL for guides produces wrong route | Medium | Medium | TASK-06 scout explicitly requires browser spot-check before 36-file batch update |
| 36 JSON file atomic commit causes merge conflicts | Medium | Low | Single commit from clean branch; run `git fetch origin && git pull --ff-only origin dev` before starting TASK-06 |
| `reachBudget.json mapEmbedUrl` silently becomes rendered in future | Low | Low | Noted in fact-find and plan; if a renderer is added, re-open scope |

## Observability

- Map load quota: GCP Console → APIs & Services → Maps Embed API → Metrics (visible after first production deploy with key)
- Referrer restriction errors: GCP Console → Maps Embed API → Errors tab (surfaces if any origin is missing from allowlist)
- Test coverage (targeted):
  - `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx`
  - `pnpm --filter @acme/ui test -- packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx`
  - `pnpm --filter @acme/cms-ui test -- packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx`
  - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage`

## Acceptance Criteria (overall)

- [ ] All `?output=embed` URLs replaced with Maps Embed API v1 format in `LocationModal.tsx` and `ContactFormWithMap.tsx`
- [ ] All `?pb=...` `stepsMapEmbedUrl` values replaced across 36 locale files (arrivals + departures)
- [ ] `LocationModal` renders fallback link when `mapsEmbedKey` is undefined
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` env var present in `.env.local` and Cloudflare Pages (staging + production)
- [ ] `pnpm --filter @acme/ui test -- packages/ui/src/organisms/modals/__tests__/ModalBasics.test.tsx` passes
- [ ] `pnpm --filter @acme/ui test -- packages/ui/src/components/cms/blocks/__tests__/ContactFormWithMap.test.tsx` passes
- [ ] `pnpm --filter @acme/cms-ui test -- packages/cms-ui/src/blocks/__tests__/ContactFormWithMap.test.tsx` passes
- [ ] `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --runTestsByPath apps/brikette/src/test/routes/how-to-get-here/__tests__/chiesaNuovaArticleLead.mapSrc.test.tsx --no-coverage` passes
- [ ] `pnpm --filter @acme/ui typecheck && pnpm --filter @acme/ui lint` passes
- [ ] `pnpm --filter @acme/cms-ui typecheck && pnpm --filter @acme/cms-ui lint` passes
- [ ] `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` passes
- [ ] `apps/brikette/.env.local.example` updated with `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=` placeholder
- [ ] `grep -r "output=embed" packages/ui/src apps/brikette/src` → zero matches
- [ ] `grep -r "stepsMapEmbedUrl" apps/brikette/src/locales | grep "?pb="` → zero matches
- [ ] GCP Console shows Maps Embed API requests after first post-deploy page load

## Decision Log

- 2026-02-19: Option A (Embed API v1 iframe swap) selected; B/C deferred
- 2026-02-19: Guide JSON migration confirmed; TDD-first approach confirmed
- 2026-02-19: Fallback link in `LocationModal` confirmed
- 2026-02-19: Key threading via prop for `LocationModal` (library); via `process.env` for `articleLead.tsx` (app route)
- 2026-02-19: `reachBudget.json` excluded — no code renderer found for `mapEmbedUrl` field
- 2026-02-19: Missing-key policy for guide iframes: omit `key=` param entirely (not append empty value); canonical assertion: `expect(src).not.toContain("key=")`

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 80% × M(2) = 160
- TASK-04: 80% × S(1) = 80
- TASK-CP1: 95% × S(1) = 95
- TASK-05: 80% × S(1) = 80
- TASK-06: 80% × M(2) = 160
- Total weight: 9 | Weighted sum: 745 | Raw: 82.8% → **Overall-confidence: 80%**
