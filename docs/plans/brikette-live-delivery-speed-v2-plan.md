---
Type: Plan
Last-reviewed: 2026-02-09
Status: Active
Domain: Brikette
Created: 2026-02-09
Last-updated: 2026-02-10
Feature-Slug: brikette-live-delivery-speed-v2
Overall-confidence: 86%
Remaining-confidence: 87% (excluding optional TASK-07)
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Relates-to charter: none
Predecessor: docs/plans/archive/brikette-live-delivery-speed-plan.md
Tasks-complete: 0/7
---

# Brikette — Live Delivery Speed Plan (v2)

Continuation of the original Brikette Live Delivery Speed plan. The original plan completed 12 of 19 tasks (P0 performance wins). This v2 covers the remaining 7 tasks: cache header deployment, GA4 setup, LHCI budgets, and chunk reduction investigation.

## Active tasks

No active tasks at this time.

## Summary

**Predecessor plan completed (12 tasks):**
- Layout bundle reduced from ~12MB to 28KB (99.8% reduction)
- Always-on modal/swiper prefetch removed
- Rates.json lazy-loaded on demand
- Global i18n preload replaced with core-only
- Prefetch fan-out reduced on experiences/assistance/how-to
- Icon imports consolidated
- GA Web Vitals wired (GA-only, no /api/rum)
- Telemetry decision: keep disabled
- Chunk explosion diagnosed (4,088 chunks, 97.4% JSON translation)

**This plan covers:**
1. **Fix `_headers` deployment** (TASK-01, parent tracker): Staging has only 2 static-asset rules in `_headers` (no caching on HTML/JSON). 22-rule version exists on dev — PR #7201 targets staging.
2. **Deploy 22-rule `_headers` to staging** (TASK-02): PR #7201 (`fix/staging-headers-v2` → `staging`) ready for merge.
3. **Verify production cache headers** (TASK-03): curl verification after TASK-02 fix is deployed.
4. **GA4 setup + verification** (TASK-04): create GA4 property, configure env vars in Cloudflare Pages, verify Web Vitals + booking events.
5. **LHCI budgets** (TASK-05): add Lighthouse CI with budgets derived from post-fix baselines (depends on TASK-03).
6. **Translation chunk investigation** (TASK-06): investigate chunking approach given CF free-tier constraints, guide draft→publish flow, and i18n architecture complexity. Stop before implementing.
7. **Optional stopgap** (TASK-07): webpack splitChunks config (only if TASK-06 investigation recommends it).

## Goals (inherited from v1)
- Enable edge caching for HTML and static JSON so repeat visits hit Cloudflare cache.
- Add automated performance budgets for Brikette (LHCI) to catch regressions.
- Set up GA4 analytics for production Web Vitals monitoring.
- Investigate and plan chunk count reduction (baseline: 4,088 chunks, target <200).

## Non-goals
- Re-implementing any of the completed P0 work (layout split, lazy rates, prefetch gating).
- Building a full analytics pipeline for RUM.
- Implementing chunk reduction without investigation first.

## Constraints & Assumptions
- **Deployment:** Cloudflare Pages (supports `public/_headers`). CF Pages has a **100-rule limit** on `_headers` files.
- **App shape:** Next.js App Router, extensive SSG (~3,947 prerendered routes — 218 per locale × 18 locales), 18 locales.
- **Staging:** Static export (`OUTPUT_EXPORT=1`) → `out/` → Cloudflare Pages. URL: `staging.brikette-website.pages.dev`
- **Production:** `@opennextjs/cloudflare` → Worker build → `wrangler deploy`. URL: `www.hostel-positano.com`
- **Quality gates:** Brikette lint is currently disabled; validation gate is typecheck + targeted Jest + perf checks.

## Baseline → Targets

| Area | Baseline (current) | Target | Measure |
|---|---|---|---|
| Edge caching | HTML/JSON `max-age=0` and `cf-cache-status: DYNAMIC` (headers silently ignored) | Headers set + cacheable routes returning `HIT`/`REVALIDATED` | curl headers |
| Total chunk count | 4,088 chunks (27.1 MB) | `< 200` via namespace bundling (investigation first) | `node apps/brikette/scripts/perf/analyze-chunks.mjs` |
| Web Vitals monitoring | No GA configured | GA4 property with Web Vitals events | GA4 Realtime |
| CI performance regression | No LHCI for Brikette | LHCI with enforced script-size budgets | CI workflow |

## Cache Policy Model (from v1)

- **Cacheable HTML (edge):** guides, experiences, assistance, how-to-get-here, static marketing pages.
  - `s-maxage=600` + `stale-while-revalidate=86400`
- **Booking/sensitive HTML:** `/[lang]/book` and locale equivalents.
  - `no-store`
- **Static assets:** `/_next/static/**` → `max-age=31536000, immutable`
- **Static JSON:** `/data/rates.json` → `s-maxage=300` + `stale-while-revalidate=86400`

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | TRACKER | Fix `_headers` caching policy (parent tracker) | 90% | S | ⚠️ In progress | - |
| TASK-02 | IMPLEMENT | Deploy 22-rule `_headers` to staging (PR #7201) | 92% | S | ⬜ Pending (blocker) | TASK-01 |
| TASK-03 | INVESTIGATE | Verify cache headers working in production (curl checks) | 90% | S | ⬜ Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Set up GA4 property + configure env vars + verify Web Vitals | 85% | M | ⬜ Pending | TASK-02 |
| TASK-05 | IMPLEMENT | Add Brikette to Lighthouse CI (budgets + workflow) | 84% | M | ⬜ Pending | TASK-03 |
| TASK-06 | INVESTIGATE | Investigate chunk reduction approach | 88% | M | ⬜ Pending | - |
| TASK-07 | INVESTIGATE/EXPERIMENT | webpack splitChunks stopgap (optional) | 70% ⚠️ | S | ⬜ Optional | TASK-06 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Recommended Execution Priority

**Wave 1 — Blockers (parallel):**
1. **TASK-02** (merge 22-rule `_headers` to staging) — PR #7201 ready for merge
2. **TASK-06** (investigate chunk reduction) — highest-priority investigation

**Wave 2 — After TASK-02 deploys (parallel):**
3. **TASK-03** (verify production cache headers) — curl checks
4. **TASK-04** (GA4 setup + verify) — create GA property, configure env vars

**Wave 3 — CI Guardrails:**
5. **TASK-05** (LHCI budgets) — depends on TASK-03

**Wave 4 — After TASK-06 investigation:**
6. New IMPLEMENT task (from TASK-06 output) or **TASK-07** (splitChunks stopgap)

## Tasks

### TASK-01: Fix Cloudflare Pages `_headers` caching policy (parent tracker)
- **Type:** TRACKER (parent for TASK-02 + TASK-03)
- **Affects:** `apps/brikette/public/_headers`
- **Depends on:** -
- **Status:** ⚠️ In progress — PR #7201 open, awaiting merge to staging
- **Confidence:** 90%
  - Implementation: 95% — the 22-rule `_headers` on `dev` is correct and within CF Pages limits. PR #7201 adds exactly these rules.
  - Approach: 90% — root cause fully understood. Staging currently has only **2 rules** (static assets). Commit `c68b59f774` moved the expanded rules to `config/_headers` for Worker mode, leaving `public/_headers` minimal. PR #7201 restores 22 rules (well within CF Pages 100-rule limit).
  - Impact: 88% — cache headers have never taken effect on staging due to the minimal 2-rule `_headers`. Fix is straightforward merge.
- **Root cause (corrected after re-plan investigation):**
  - Staging branch `_headers` has **2 rules** (not 311 as previously claimed). The 311-rule version was the original `public/_headers` before commit `c68b59f774` moved it to `config/_headers`.
  - After that commit, `public/_headers` was left with only `/_next/static/*` and `/img/*` immutable rules.
  - The `config/_headers` (24 rules) is parsed by `next.config.mjs:110-119` for Worker/dev mode but is **completely ignored** in static export mode (staging).
  - PR #7201 adds the 22-rule condensed version back to `public/_headers` for the static export path.
  - CF Pages 100-rule limit remains relevant context: the original 311-rule version would have been silently ignored if deployed.
- **Acceptance:**
  - `_headers` deployed to staging with 22 rules matching the Cache Policy Model.
  - Verified via curl checks (TASK-03).
- **Test contract:**
  - Delegated to TASK-02 (staging) and TASK-03 (production).
  - **TC-01:** `curl -I https://staging.brikette-website.pages.dev/en/experiences` → includes `s-maxage=600`.
  - **TC-02:** `curl -I https://staging.brikette-website.pages.dev/en/book` → `cache-control: no-store`.
  - **TC-03:** `curl -I https://staging.brikette-website.pages.dev/data/rates.json` → includes `s-maxage=300`.
  - **Test type:** contract
  - **Test location:** staging/production URL
  - **Run:** curl checks after deployment

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 75%
- **Updated confidence:** 90%
  - **Evidence class:** E1 (git show, PR diff, code audit of next.config.mjs)
  - Implementation: 95% — PR #7201 exists, diff reviewed (`gh pr diff 7201`), adds exactly 22 rules.
  - Approach: 90% — root cause corrected. Staging has 2 rules (not 311). `git show origin/staging:apps/brikette/public/_headers | grep -c "^/"` → 2. The `config/_headers` (24 rules) is only used in Worker mode via `next.config.mjs:110-119`; static export ignores it entirely.
  - Impact: 88% — straightforward PR merge. No code changes needed beyond the `_headers` file.
- **Investigation performed:**
  - `gh pr view 7201` → OPEN, targets staging, changes only `apps/brikette/public/_headers`
  - `gh pr diff 7201` → adds 22-rule version (catch-all `/*`, immutable assets, rates.json, 17 booking no-store)
  - `git show origin/staging:apps/brikette/public/_headers | grep -c "^/"` → **2** rules (not 311)
  - `apps/brikette/next.config.mjs:110-119` → `headers()` reads from `config/_headers`, not `public/_headers`; only used in Worker/dev mode
  - `apps/brikette/config/_headers` → 24 rules (includes `/api/*` and `/*/draft*` for Worker mode)
  - `scripts/post-deploy-brikette-cache-check.sh` → exists, ready for verification
- **Decision / resolution:**
  - Type changed from IMPLEMENT to TRACKER. Actual work is TASK-02 (merge PR) and TASK-03 (verify).
  - Root cause narrative corrected: staging has 2 rules, not 311. The 311-rule version was the original before `c68b59f774` moved it to `config/`.
  - SEO postbuild timing removed from scope: investigation confirmed `postbuild` only generates `robots.txt`/`sitemap.xml`/schema files, not `_headers`.
- **Changes to task:**
  - Confidence: 75% → 90% (root cause correction, PR reviewed)
  - Type: IMPLEMENT → TRACKER
  - SEO timing issue removed from TASK-01 and TASK-02 scope

### TASK-02: Deploy the 22-rule `_headers` to staging
- **Type:** IMPLEMENT
- **Affects:** deployment (merge PR #7201 → staging)
- **Depends on:** TASK-01
- **Status:** Pending (blocker)
- **Confidence:** 92%
  - Implementation: 95% — PR #7201 (`fix/staging-headers-v2` → `staging`) exists and is ready to merge. Only changes `apps/brikette/public/_headers`.
  - Approach: 92% — staging currently has only 2 static-asset rules in `public/_headers`. PR adds 22 rules (catch-all, rates, booking no-store). Well within CF Pages 100-rule limit.
  - Impact: 90% — enables cache headers for the first time on staging.
- **Acceptance:**
  - 22-rule `_headers` deployed to staging via PR #7201.
  - Staging curl shows `s-maxage` on cacheable HTML routes.
  - Staging curl shows `no-store` on booking routes.
- **Test contract:**
  - **TC-01:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/en/experiences` → response includes `s-maxage=600` and `stale-while-revalidate`.
  - **TC-02:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/en/book` → `cache-control: no-store`.
  - **TC-03:** After staging deploy: `curl -I https://staging.brikette-website.pages.dev/data/rates.json` → includes `s-maxage=300`.
  - **Acceptance coverage:** TC-01/TC-03 cover caching; TC-02 covers booking no-store.
  - **Test type:** contract
  - **Test location:** staging URL
  - **Run:** merge PR #7201, wait for deploy, then curl checks. Or: `./scripts/post-deploy-brikette-cache-check.sh brikette-website --staging`
- **Rollout / rollback:**
  - Rollout: merge PR #7201 → staging; deploy is automatic.
  - Rollback: revert merge (or deploy previous staging commit).

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 92%
- **Updated confidence:** 92% (no change)
  - **Evidence class:** E1 (PR diff review, staging state verification)
- **Investigation performed:**
  - `gh pr diff 7201` → +46/-3, only changes `apps/brikette/public/_headers`
  - `git show origin/staging:apps/brikette/public/_headers` → 2 rules (immutable static assets only)
  - Staging state confirmed: minimal `_headers`, no caching on HTML/JSON
- **Decision / resolution:**
  - Removed SEO file timing fix from scope. Investigation confirmed `postbuild` script only generates `robots.txt`/`sitemap.xml`/schema — it does not affect `_headers`. SEO files are a separate concern and not blocking cache header deployment.
  - Removed TC-04 (robots.txt check) from test contract — not in scope for this task.
- **Changes to task:**
  - Title: removed "fix SEO file timing"
  - Affects: removed `apps/brikette/package.json` reference
  - Acceptance: removed SEO file criterion
  - Added `post-deploy-brikette-cache-check.sh` as run command option

### TASK-03: Verify cache headers working in production (curl checks)
- **Type:** INVESTIGATE
- **Affects:** production deployment
- **Depends on:** TASK-02
- **Status:** Pending
- **Confidence:** 90%
  - Implementation: 90% — curl checks are straightforward.
  - Approach: 90% — standard verification approach.
  - Impact: 90% — confirms the fix works end-to-end.
- **Acceptance:**
  - `curl -I https://www.hostel-positano.com/en/` (repeat twice) → `cf-cache-status` transitions to `HIT` or `REVALIDATED`.
  - `curl -I https://www.hostel-positano.com/en/book` → `cache-control: no-store`.
  - `curl -I https://www.hostel-positano.com/data/rates.json` (repeat twice) → `cf-cache-status` transitions away from `DYNAMIC`.
- **Test contract:**
  - **TC-01:** `curl -I https://www.hostel-positano.com/en/` (repeat twice) → includes `s-maxage` + `stale-while-revalidate`; `cf-cache-status` becomes `HIT` or `REVALIDATED`.
  - **TC-02:** `curl -I https://www.hostel-positano.com/en/book` → `cache-control: no-store`.
  - **TC-03:** `curl -I https://www.hostel-positano.com/data/rates.json` (repeat twice) → includes `s-maxage=300`; `cf-cache-status` transitions away from `DYNAMIC`.
  - **TC-04:** Pick any `/_next/static/**/*.js` URL → `curl -I` includes `immutable`.
  - **TC-05:** `curl -I https://www.hostel-positano.com/en/experiences` → no `set-cookie` header.
  - **TC-06:** `curl -I https://www.hostel-positano.com/en/book` → `cf-cache-status` is NOT `HIT` or `REVALIDATED`.
  - **Test type:** contract
  - **Test location:** production URL
  - **Run:** `BASE_URL=https://www.hostel-positano.com sh scripts/post-deploy-brikette-cache-check.sh` or manual curls

### TASK-04: Set up GA4 property + configure env vars + verify Web Vitals in production
- **Type:** IMPLEMENT
- **Affects:** GA4 admin (external), Cloudflare Pages env vars (external), production deployment
- **Depends on:** TASK-02
- **Status:** Pending (expanded from verify-only to include GA setup)
- **Confidence:** 85%
  - Implementation: 85% — GA property creation and env var configuration are well-documented steps. Code is already complete (predecessor TASK-12).
  - Approach: 90% — GA4 is the standard approach; brikette code already supports it via `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
  - Impact: 80% — requires Cloudflare Pages redeploy to pick up env vars. Depends on TASK-02 so that `_headers` are also deployed correctly in the same redeploy.
- **Acceptance:**
  - GA4 property exists for `www.hostel-positano.com`.
  - Custom dimensions registered: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type`.
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured in Cloudflare Pages env vars (production scope).
  - After redeploy: `view-source:https://www.hostel-positano.com/en/` shows `gtag.js` script tag with correct measurement ID.
  - GA4 Realtime shows `web_vitals` events arriving from production.
  - Booking flow `begin_checkout` event fires (`apps/brikette/src/app/[lang]/book/BookPageContent.tsx:118-126`).
  - No `/api/rum` requests observed in Network tab.
- **Step-by-step:**
  1. Create GA4 property at analytics.google.com (Property name: "Hostel Brikette", timezone: Europe/Rome, currency: EUR).
  2. Create Web data stream for `https://www.hostel-positano.com` (enable Enhanced Measurement).
  3. Copy Measurement ID (format: `G-XXXXXXXXXX`).
  4. Register custom dimensions in GA4 Admin > Data display > Custom definitions: `metric_id`, `metric_value`, `metric_delta`, `metric_rating`, `navigation_type` (all Event scope).
  5. In Cloudflare Pages dashboard for `brikette-website`: Settings > Environment variables > add `NEXT_PUBLIC_GA_MEASUREMENT_ID = G-XXXXXXXXXX` (Production scope).
  6. Trigger production redeploy (push to `main` or manual workflow dispatch with `publish_to_production: true`).
  7. Verify: visit production site, check GA4 Realtime for `web_vitals` and `begin_checkout` events.
- **Test contract:**
  - **TC-01:** `view-source:https://www.hostel-positano.com/en/` → contains `googletagmanager.com/gtag/js?id=G-` script tag.
  - **TC-02:** Visit `/en/` with GA DebugView enabled → observe `web_vitals` event within ~60s.
  - **TC-03:** Visit `/en/book` and trigger confirm click → observe `begin_checkout` event in GA4 Realtime.
  - **TC-04:** In DevTools Network, filter `rum` → zero `/api/rum` requests.
  - **Acceptance coverage:** TC-01 covers env var + script injection; TC-02 covers Web Vitals; TC-03 covers booking events; TC-04 covers RUM removal.
  - **Test type:** contract
  - **Test location:** GA4 property (DebugView/Realtime) + live site
  - **Run:** manual verification (Chrome DevTools + GA DebugView)
- **Privacy note:** Current implementation has no consent mechanism. GDPR (Italy) requires explicit consent before loading GA. Consider adding cookie banner as follow-up work (not blocking this task — MVP first).
- **Rollout / rollback:**
  - Rollout: configure env var → redeploy → verify.
  - Rollback: remove env var from Cloudflare Pages → redeploy (GA stops loading).

### TASK-05: Add Brikette to Lighthouse CI (budgets + workflow)
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/ci-lighthouse.yml`, `lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`
- **Depends on:** TASK-03
- **Confidence:** 84%
  - Implementation: 88% — workflow + config patterns exist (`.github/workflows/ci-lighthouse.yml:12-85`, `lighthouserc.shop.json:1-50`); Brikette's start port is pinned (`apps/brikette/package.json:5-9`).
  - Approach: 84% — budgets can be strict on script-size (error) while keeping performance score thresholds as warn initially to avoid flake.
  - Impact: 84% — CI-only, but may increase CI time; mitigated via paths-filter + `run-lhci` label escape hatch.
- **Acceptance:**
  - Brikette changes trigger LHCI on PRs (paths-filter includes `apps/brikette/**`).
  - CI builds Brikette for LHCI and runs the new configs (`lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`).
  - LHCI is scoped to a small, representative URL set: `/en/` + `/en/experiences` + `/en/rooms`.
  - Budgets include an **enforced** script-size assertion (level `error`) that catches layout bundle regressions.
  - **Budget values derived from post-fix measured Lighthouse runs** (no `[TBD]` baselines).
  - Use `perf:check-layout-chunk` script for surgical layout regression detection; LHCI for broader page-level budgets.
- **Test contract:**
  - **TC-01:** Local smoke: `pnpm --filter @apps/brikette build` + `pnpm dlx @lhci/cli@0.15.1 autorun --config=lighthouserc.brikette.json` → autorun completes.
  - **TC-02:** Static config check: `jq` confirms `resource-summary:script:size` assertion level is `error` and has `maxNumericValue` set.
  - **TC-03:** Workflow contract: `.github/workflows/ci-lighthouse.yml` paths-filter includes `apps/brikette/**` and matrix includes Brikette configs.
  - **Acceptance coverage:** TC-03 covers criteria 1; TC-01 covers criteria 2; TC-02 covers criteria 3.
  - **Test type:** contract
  - **Test location:** `.github/workflows/ci-lighthouse.yml`, `lighthouserc.brikette.json`, `lighthouserc.brikette.desktop.json`
  - **Run:** `pnpm --filter @apps/brikette build && pnpm dlx @lhci/cli@0.15.1 autorun --config=lighthouserc.brikette.json --upload.target=temporary-public-storage`
- **Rollout / rollback:**
  - Rollout: merge; observe CI run time and flake rate.
  - Rollback: remove brikette from matrix/filters.

### TASK-06: Investigate chunk reduction approach given CF free-tier, guide publishing, and i18n complexity
- **Type:** INVESTIGATE
- **Affects:** `apps/brikette/src/locales/locale-loader.ts`, `apps/brikette/src/locales/locale-loader.guides.ts`, `apps/brikette/src/locales/guides.*.ts`, `apps/brikette/src/routes/how-to-get-here/content-modules.ts`, `apps/brikette/next.config.mjs`
- **Depends on:** - (independent, can start immediately)
- **Status:** Pending (highest remaining priority)
- **Confidence:** 88%
  - Implementation: 88% — investigation scope is clear; key constraint areas identified.
  - Approach: 90% — investigate-before-implement is the right approach given complexity.
  - Impact: 85% — investigation output directly determines whether TASK-07 or a new codegen IMPLEMENT task is the right next step.
- **Context (from predecessor investigation, TASK-08):**
  - **Total chunks:** 4,088 (27.1 MB)
  - **JSON translation chunks:** 3,982 (97.4%, 23.5 MB) — webpack creates separate chunks per dynamically imported JSON file
  - **Source of truth:** `apps/brikette/scripts/perf/analyze-chunks.mjs`
  - **Root cause:** `import()` with `webpackInclude` in `locale-loader.ts:64-66` and `content-modules.ts` → 39 namespaces × 18 languages = 702 chunks + 168 guide content × 18 languages = 3,024 chunks
- **Acceptance:**
  - Produce a written investigation document covering:
    1. **CF Pages free-tier constraints:** 20K file limit, current file count, headroom analysis.
    2. **Guide draft→publish flow compatibility:** How Business OS writes individual guide JSON → whether bundling at build time preserves this workflow.
    3. **i18n loading architecture map:** Full chain from `i18n.ts` → backends → loaders → webpack context.
    4. **Candidate approaches (ranked):** At minimum: (a) codegen bundling, (b) webpack splitChunks, (c) hybrid. For each: pros, cons, estimated chunk reduction, complexity, compatibility with guide publishing.
    5. **Recommended approach with rationale.**
  - Investigation must stop before implementing.
- **Pre-investigation findings (from re-plan):**
  - **CF Pages free-tier:** 20K file limit confirmed. Current ~4K chunks well within limit.
  - **Guide publishing:** Business OS writes individual JSON via `apps/business-os/src/app/api/guides/[guideKey]/route.ts:119`. Bundling at build time does NOT break this.
  - **i18n complexity:** `locale-loader.ts` (client, top-level, one `webpackInclude`), `locale-loader.guides.ts` (server, `fs.readFileSync`, NO webpack), `guides.imports.ts` (client, 3-tier), `content-modules.ts` (client, separate `webpackInclude` for how-to-get-here).
  - **Scale:** 4,419 JSON files, 168 guide content × 18 locales = 3,024 guide chunks, 39 namespaces × 18 = 702 core chunks.
- **Test contract:**
  - **TC-01:** Investigation document addresses all 5 acceptance items.
  - **TC-02:** Each candidate approach includes a chunk count estimate.
  - **TC-03:** Guide publishing compatibility confirmed with evidence.
  - **Test type:** contract (document review)
  - **Test location:** This plan document (TASK-06 section)
  - **Run:** Review investigation output against acceptance criteria.

### TASK-07: webpack splitChunks config to group JSON by language (optional stopgap)
- **Type:** INVESTIGATE/EXPERIMENT
- **Status:** Optional fallback (pending TASK-06 investigation outcome)
- **Affects:** `apps/brikette/next.config.mjs`
- **Depends on:** TASK-06
- **Confidence:** 70% ⚠️
  - Implementation: 75% — standard webpack `splitChunks` config.
  - Approach: 70% — grouping by language reduces chunk count but may bundle more than strictly needed per route.
  - Impact: 70% — affects webpack output shape; needs build artifact validation.
- **Note:** Do not implement unless TASK-06 investigation recommends it as the best approach. TASK-06 may recommend a different solution.
- **Acceptance:**
  - Total chunk count < 500 (baseline: 4,088).
  - JSON chunks grouped by language instead of individual per-namespace-per-language chunks.
  - No increase in layout bundle size.
  - Guide pages load translations correctly across `en`, `de`, `ar`.
- **Test contract:**
  - **TC-01:** `pnpm --filter @apps/brikette build` → chunk count <500 via `analyze-chunks.mjs`.
  - **TC-02:** Layout chunk remains <100KB.
  - **TC-03:** Manual smoke on `/en/experiences`, `/en/assistance`, one guide page → translations render correctly.
  - **Test type:** contract
  - **Test location:** `apps/brikette/next.config.mjs`
  - **Run:** `pnpm --filter @apps/brikette build && node apps/brikette/scripts/perf/analyze-chunks.mjs`
- **Rollout / rollback:**
  - Rollout: land webpack config change; validate on staging.
  - Rollback: remove splitChunks config.

#### Re-plan Update (2026-02-10)
- **Previous confidence:** 70%
- **Updated confidence:** 70% (no change — appropriate for optional INVESTIGATE/EXPERIMENT task)
  - **Evidence class:** E1 (webpack config audit, architecture verification)
- **Investigation performed:**
  - `apps/brikette/next.config.mjs:124-158` — no existing `splitChunks` configuration (clean baseline).
  - Webpack customization is limited to resolve aliases, client-side Node.js fallbacks, and raw JSON-LD imports.
  - Shared base config (`packages/next-config/next.config.mjs`) also has no `splitChunks`.
  - Chunk analysis tool (`analyze-chunks.mjs`) has 7 categories and is ready for before/after comparison.
- **Decision / resolution:**
  - Confidence stays at 70%. This is intentional — TASK-07 is an optional experiment that should only proceed if TASK-06 investigation recommends it. The 70% reflects genuine uncertainty about whether `splitChunks` grouping by language is the right approach (vs codegen bundling or hybrid).
  - Clean webpack baseline is a positive signal (no conflicts), but does not reduce the approach uncertainty.
- **What would make this ≥80%:**
  - TASK-06 investigation recommends `splitChunks` as the best or interim approach.
  - A small spike proving webpack `splitChunks` `cacheGroups` correctly groups locale JSON by language prefix.

## Existing System Notes (relevant to remaining tasks)

- **`_headers` (22-rule version on dev):** Uses `/*` catch-all for HTML caching (`s-maxage=600`), `/_next/static/*` with `immutable`, `/data/rates.json` with `s-maxage=300`, and explicit `no-store` for 17 locale booking routes.
- **GA wiring:** `apps/brikette/src/performance/reportWebVitals.ts` emits via `gtag("event","web_vitals",...)` when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Layout includes gtag script (`apps/brikette/src/app/layout.tsx:102-119`).
- **LHCI patterns:** `.github/workflows/ci-lighthouse.yml` uses matrix-based execution, `pnpm dlx @lhci/cli@0.15.1`, path-based filtering. Existing configs: `lighthouserc.shop.json`, `lighthouserc.shop.desktop.json`, `lighthouserc.skylar.json`. Brikette port: 3012.
- **Perf tooling:** `apps/brikette/scripts/perf/check-layout-chunk.mjs` (layout regression), `apps/brikette/scripts/perf/analyze-chunks.mjs` (chunk categorization).
- **i18n loaders:** `locale-loader.ts` (client, top-level, `webpackInclude`), `locale-loader.guides.ts` (server, `fs.readFileSync`), `guides.imports.ts` (client, 3-tier), `content-modules.ts` (client, `webpackInclude` for how-to-get-here).

## Risks & Mitigations
- **CF 100-rule limit recurrence:** Keep `_headers` under 100 rules by using `/*` catch-all pattern. Add a CI check or build-time assertion.
- **GA without consent:** GDPR risk; add cookie banner as follow-up work post-MVP.
- **LHCI flakes:** Start with `warn` for performance scores, `error` only for deterministic budgets (script-size).
- **Chunk reduction complexity:** Investigation-first approach (TASK-06) prevents premature implementation.

## Acceptance Criteria (overall v2)
- [ ] Production HTML and `rates.json` caching headers deployed and verified (TASK-01/02/03).
- [ ] GA4 property configured and Web Vitals arriving in production (TASK-04).
- [ ] Brikette covered by LHCI with enforced script-size budgets (TASK-05).
- [ ] Chunk reduction approach investigated and documented (TASK-06).

## Decision Log
- 2026-02-09: TASK-06 typed as INVESTIGATE (not IMPLEMENT). I18n loading is more complex than v1 assumed; investigate approach before implementing.
- 2026-02-09: PR #7201 created for 22-rule `_headers` fix (`fix/staging-headers-v2` → `staging`).
- 2026-02-10: TASK-01 root cause corrected. Staging has 2 rules (not 311). The 311-rule version was the pre-`c68b59f774` state; post-commit, `public/_headers` was left minimal. SEO postbuild timing is a separate concern, removed from TASK-01/02 scope.

## Plan Changelog
- 2026-02-09: v2 plan created from archived v1 plan. Extracted 7 incomplete tasks, renumbered TASK-01 through TASK-07. Preserved all task details, test contracts, and investigation findings from v1.
- 2026-02-10: Re-plan (scope: TASK-01, TASK-07, all tasks reviewed). TASK-01 corrected from 75%→90% (staging has 2 rules, not 311; type changed to TRACKER). TASK-02 scope narrowed (removed SEO timing fix — not related to `_headers`). TASK-07 confirmed at 70% (intentional; optional experiment gated by TASK-06). All other tasks verified — no changes needed. Overall confidence 83%→87%.
