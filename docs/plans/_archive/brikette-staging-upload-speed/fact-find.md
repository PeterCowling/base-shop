---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-staging-upload-speed
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-staging-upload-speed/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308163000-7812
Trigger-Why: Staging deploys still take ~37 min after CI overhead was removed; the Cloudflare upload is now the sole bottleneck.
Trigger-Intended-Outcome: type: measurable | statement: Brikette staging deploys complete materially faster than 37 min | source: operator
---

# Brikette Staging Upload Speed Fact-Find

## Scope
### Summary
The fast-path staging workflow removes CI gates but leaves the Cloudflare Pages Direct
Upload (~37 min observed) as the sole bottleneck. This fact-find investigates all
practical levers to reduce that upload time.

### Goals
- Determine whether the 37 min was a cold-deploy floor or the steady-state for incremental deploys.
- Identify the fastest implementable change that materially reduces upload time.
- Confirm the mechanism (wrangler dedup) and the actual file distribution.

### Non-goals
- Changing the production deploy path.
- Migrating to a Git-integrated Pages project (would require a new project; major disruption).
- Image optimisation for production (separate scope).

### Constraints & Assumptions
- Constraints:
  - Direct Upload projects cannot be switched to Git integration later.
  - CF Pages does not support incremental builds.
  - Staging must deploy the same HTML output as production (same build pipeline, different lang subset is acceptable for staging).
- Assumptions:
  - The 37.5 min observation was a near-cold deploy (first or post-many-file-changes deploy).
  - Wrangler 4.x `pages deploy` uses content-addressed dedup (confirmed below).

## Outcome Contract

- **Why:** Staging deploys still take ~37 min after CI overhead was removed; the Cloudflare upload is the sole remaining bottleneck. Operator wants a materially faster staging cycle.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette staging deploys complete materially faster than 37 min, with a concrete reduction achieved via language-subset builds and/or wrangler dedup.
- **Source:** operator

## Access Declarations

- Local `apps/brikette/out/` directory — read-only file system inspection. ✓ Available locally.
- Wrangler CLI (v4.59.1) behavior — from code inspection and Cloudflare public documentation. UNVERIFIED timing for incremental deploy (requires a live CI run).
- Cloudflare Pages project API state (which files CF already has) — not directly inspectable; inferred from dedup behavior.

## Evidence Audit (Current State)

### Entry Points

- `.github/workflows/brikette-staging-fast.yml` — fast-path staging trigger; runs `pnpm build` then `wrangler pages deploy out`
- `apps/brikette/src/app/[lang]/layout.tsx:18` — root `generateStaticParams()` that drives the lang dimension of all static routes
- `apps/brikette/src/app/_lib/static-params.ts` — shared `generateLangParams()` / `generateLangAndSlugParams()` utility consumed by all 35 child `generateStaticParams` calls

### Key Modules / Files

- `apps/brikette/src/app/_lib/static-params.ts` — **the correct filter point**. `generateLangParams()`, `generateLangAndSlugParams()`, and `generateLangAndIdParams()` all call `i18nConfig.supportedLngs`. Adding a `getBuildLanguages()` helper here (filtering by `process.env.BRIKETTE_STAGING_LANGS`) and swapping the call sites in these three functions covers all 34 of the 35 `generateStaticParams` call sites.
- `apps/brikette/src/app/[lang]/layout.tsx:18-19` — the one remaining `generateStaticParams` that calls `i18nConfig.supportedLngs.map()` directly (not via `static-params.ts`). Must also be updated to call `getBuildLanguages()`.
- `apps/brikette/src/i18n.config.ts` — defines `supportedLngs` (18 languages). **Must NOT be modified**: filtering here would also affect redirect generation, alternate-language metadata, runtime language switching, and `SUPPORTED_LANGUAGES` re-export — all of which should remain full-set even for staging.
- `apps/brikette/src/routing/staticExportRedirects.ts:185` — uses `i18nConfig.supportedLngs` to generate redirects for all 18 languages. With only EN+IT built, redirects targeting `/de/`, `/fr/` etc. will 404 on staging. **Deliberate staging degradation — explicitly accepted**: staging is not a SEO surface and redirect 404s do not affect staging review workflows.
- `apps/brikette/src/app/_lib/metadata.ts:121` — uses `i18nConfig.supportedLngs` to populate `<link rel="alternate">` for all 18 langs. Staging pages will advertise 16 alternate-lang URLs that 404. **Accepted**: staging is not indexed; broken alternates have no production consequence.
- `apps/brikette/src/config.ts:17,25` — exports `RUNTIME_SUPPORTED` browser constant. Language switcher in staging shows all 18 langs; non-built ones 404 on navigation. **Accepted**: staging reviewers know the language subset is intentional.
- `.github/workflows/brikette-staging-fast.yml` — target workflow for the `BRIKETTE_STAGING_LANGS` env-var addition to the build step.

### Data & Contracts

**Actual `out/` file count breakdown (measured from local build):**

| Category | File count | Size | Stable between builds? |
|---|---:|---:|---|
| `_next/static/chunks/` JS bundles | 4,572 | 41 MB | Yes (content-hashed) |
| `_next/static/media/` `_tokens.*.json` i18n files | 4,466 | 37 MB | Yes (content-hashed) |
| HTML route files | ~4,465 | ~3 MB (text-only) | Yes when content unchanged |
| Route `.txt` metadata | ~4,465 | small | Yes when content unchanged |
| `_next/static/<build-hash>/` manifests | 3 | tiny | **No — new hash every build** |
| Guide images `out/img/` | 417 | 198 MB | Yes (static assets, never re-hashed) |
| Other static assets | ~8 | 23 MB | Yes |
| **Total (post `__next.*` cleanup)** | **~18,400** | **~2.9 GB\*** | — |

\* 2.9 GB because `out/en/experiences` alone is 72 MB, `out/en` is 129 MB — guide HTML pages are large (rich content + schema markup + full SSR output). Multiplied across 18 languages: ~2.5 GB of HTML.

**Language × route multiplier:**
- 18 supported languages (en, it, de, fr, es, ja, ko, pt, ru, zh, ar, hi, vi, pl, sv, no, da, hu)
- ~224 HTML routes per language (from EN directory inspection)
- Total HTML routes: 18 × 224 ≈ 4,032

**Wrangler dedup behaviour (wrangler 4.59.1):**
- `wrangler pages deploy` computes SHA-256 hash of every file in the output directory.
- Sends the complete manifest (all hashes) to the CF API.
- CF responds with the list of hashes it doesn't yet have.
- Only missing files are uploaded (in parallel batches).
- **Consequence**: the 37.5 min observed was almost certainly a cold deploy (all files new to CF). Incremental deploys — where only a few source files changed — should be dramatically faster because CF already holds the stable files (4,572 chunks, 4,466 token JSONs, 417 images, most HTML pages).

**Translation JSON files:**
- `_next/static/media/_tokens.{hash}.json` — i18n locale tokens served as static JSON assets to the browser via Next.js asset routing. 4,466 files, 37 MB. One set per unique locale namespace × locale. These are content-hashed: if translations don't change, CF already has them after the first deploy.

### Dependency & Impact Map

- Upstream: `i18nConfig.supportedLngs` in `i18n.config.ts` → consumed by all `generateStaticParams` calls → drives HTML route count.
- Downstream: number of HTML files emitted by `next build` → `wrangler pages deploy` manifest size and upload payload.
- Blast radius of locale filter: **staging builds only** (env var controlled). Production unaffected.
- Blast radius of wrangler dedup: already live; no change needed.

### Test Landscape

- No automated tests for CI pipeline timing.
- Validation: the second consecutive deploy with no code changes should complete in < 5 min if dedup is working correctly (all files already in CF).
- Acceptance for locale-filter change: `next build` with `BRIKETTE_STAGING_LANGS=en,it` must emit only `en/` and `it/` language directories in `out/`. Checked by inspecting `out/` contents.

### Recent Git History (Targeted)

- `5c8e17899f` (today) — added `.github/workflows/brikette-staging-fast.yml`; no changes to build output or locale config.

## Questions

### Resolved

- Q: Does wrangler pages deploy use content-addressed deduplication?
  - A: Yes. Wrangler 4.x `pages deploy` computes SHA-256 hashes of all files, sends the manifest to CF, and uploads only files CF doesn't have. Cold deploys upload everything; incremental deploys upload only changed files.
  - Evidence: wrangler source behaviour documented in CF Pages docs; confirmed by file naming patterns (content-hashed chunks, token JSONs).

- Q: What is the actual file count and breakdown?
  - A: ~18,400 files post-cleanup. Dominated by 4,572 JS chunks (41 MB), 4,466 translation JSONs (37 MB), ~4,032 HTML route files (18 langs × 224 routes/lang), and 417 static images (198 MB). Total 2.9 GB, most of which is 18-lang HTML output.
  - Evidence: `du` and `find` on local `out/` directory.

- Q: Does wrangler have concurrency/compression flags that speed upload?
  - A: No user-configurable flags for upload concurrency or compression in `wrangler pages deploy` (v4.59.1). Wrangler uses internal batching. No `--max-direct-upload-size` equivalent for concurrency tuning.
  - Evidence: `wrangler pages deploy --help` and CF Pages CLI docs.

- Q: Would a Git-integrated Pages project help?
  - A: Possibly, but the trade-off is high: requires a new project (the existing Direct Upload project cannot be converted), adds build infrastructure setup, and CF Pages build caching is for node_modules (not the Next.js output itself — incremental builds still not supported). Net gain is modest for a project where the build itself is fast (< 5 min); the upload dominates. Not recommended.
  - Evidence: CF Pages docs on Git integration vs Direct Upload; build caching docs.

- Q: Are there Next.js output options to reduce file count?
  - A: Yes. The most impactful is restricting the language set via `BRIKETTE_STAGING_LANGS` env var. The correct filter point is `apps/brikette/src/app/_lib/static-params.ts` (add a `getBuildLanguages()` helper; swap it into `generateLangParams()`, `generateLangAndSlugParams()`, `generateLangAndIdParams()`), plus `[lang]/layout.tsx:18` (the one direct `i18nConfig.supportedLngs.map()` call). Filtering `i18n.config.ts` itself is NOT safe — `supportedLngs` is also used by redirect generation, alternate-lang metadata, and the runtime language switcher, all of which should remain full-set even on staging builds.
  - Evidence: `apps/brikette/src/app/_lib/static-params.ts`, `apps/brikette/src/app/[lang]/layout.tsx:18-19`, `apps/brikette/src/routing/staticExportRedirects.ts:185`, `apps/brikette/src/app/_lib/metadata.ts:121`, `apps/brikette/src/config.ts:17,25`.

- Q: What is the realistic incremental staging deploy time?
  - A: Unknown precisely, but expected < 5 min. Only the 3 build-hash manifest files are guaranteed new on every build. Changed source files produce new chunk hashes for affected chunks (maybe 10-100 files). CF manifest exchange for 18k files is fast (< 1 min). So incremental deploy = manifest exchange + small upload set.
  - Evidence: Wrangler dedup behaviour; file count analysis. **Requires a live timing test to confirm.**

### Open (Operator Input Required)

- Q: Which languages should staging build?
  - Why operator input is required: depends on which languages are actively used by the team for staging review. EN is essential; IT is the primary production market. Others may be needed for specific tests.
  - Decision impacted: which value to set for `BRIKETTE_STAGING_LANGS` default in the fast-path workflow.
  - Decision owner: operator.
  - Default assumption: `BRIKETTE_STAGING_LANGS=en,it` — reduces to 2 of 18 languages (~89% HTML file count reduction). Risk: if a staging review needs another language, the reviewer must either push a custom branch or the workflow must be re-run with a different value.

## Scope Signal

**Signal: `limited-thinking`**
**Rationale:** The primary change (locale filter) is tightly bounded and high-value. But there are clear adjacent opportunities worth stating explicitly.

**Expansion suggestions:**
1. **Timing baseline measurement** (add before implementing locale filter): trigger the fast-path workflow twice with no code changes and log the second deploy time. If dedup reduces it to < 5 min, the locale filter is low priority. If still > 10 min, implement the filter. This is a 0-code spike task.
2. **Guide image compression** (separate scope): 417 JPEGs in `public/img/`, largest at 8 MB, totalling 198 MB. These never change between builds and CF already has them after first deploy, so they don't affect incremental deploy time. But a first-ever staging-fast deploy still uploads them cold. Compressing to WebP/AVIF would reduce cold-deploy time by ~150 MB.
3. **Staging route subset** (stretch): restrict `generateStaticParams` in experiences/guides to a small subset (e.g., 5 guides instead of 100+) when `BRIKETTE_STAGING_MINIMAL=1`. More invasive but reduces file count further.

## Confidence Inputs

- **Implementation: 88%** — `getBuildLanguages()` helper added to `static-params.ts` (one file) + 4 call-site updates (3 in `static-params.ts`, 1 in `[lang]/layout.tsx`) + env-var addition to the fast-path workflow. `i18n.config.ts` is intentionally left untouched to preserve redirect/metadata/runtime behaviour.
  - Raises to ≥90: confirm locally that `BRIKETTE_STAGING_LANGS=en,it next build` produces only `en/` and `it/` in `out/` without affecting other build outputs.
- **Approach: 90%** — wrangler dedup is confirmed; locale filtering mechanism is clear and uses the existing single source of truth.
  - Raises to ≥90: already at 90.
- **Impact: 78%** — locale filter reduces HTML from ~4,256 to ~448 files (EN+IT), and translation JSONs from 4,466 to ~470. Whether this meaningfully reduces wall-clock time depends on whether the incremental-deploy path is already fast via dedup.
  - Raises to ≥80: run the timing baseline spike first and confirm dedup still leaves > 10 min.
  - Raises to ≥90: confirm CF manifest exchange time is proportional to file count.
- **Delivery-Readiness: 85%** — code location identified, implementation is 2-file change, no dependency on external systems.
- **Testability: 80%** — local build validation (check `out/` only contains `en/` and `it/`). Full timing validation requires a live CI run.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dedup already makes incremental deploys < 5 min, making locale filter less urgent | Medium | Low — locale filter still reduces build time and cold-deploy time; implement regardless | Spike is calibration only; implement filter unconditionally |
| Redirects or metadata reference non-built language routes | Low | Low for staging — redirects for non-built langs will 404 on staging (not a SEO surface); language switcher UI shows all 18 but non-built langs 404 | Filter only in `static-params.ts` and `[lang]/layout.tsx`; leave `i18n.config.ts`, `staticExportRedirects.ts`, and `metadata.ts` untouched |
| Staging reviewer needs a language not in the subset | Medium | Low — easily fixed by updating the workflow env var or triggering manual dispatch | Document the override in the workflow file |
| CF dedup doesn't apply across different project deployments (staging vs prod) | Low | Medium — staging cold deploys would always be full uploads | CF's file store is per-project; staging and prod use the same `brikette-website` project but different branch deployments. Dedup applies within the project regardless of branch. |

## Planning Constraints & Notes

- Must-follow patterns: env-var approach; do not hard-code language subset in source files.
- The filter must apply only when `BRIKETTE_STAGING_LANGS` is set; production builds (no env var) must continue using all 18 languages.
- Rollback: remove env var from fast-path workflow; no source code change needed.

## Suggested Task Seeds (Non-binding)

1. **SPIKE**: Trigger fast-path workflow twice with no code changes; record second-deploy timing. This is for calibration only — the locale filter is worth implementing regardless of the result (see rationale below).
2. **IMPLEMENT**: Add `getBuildLanguages()` helper to `apps/brikette/src/app/_lib/static-params.ts` (filters `i18nConfig.supportedLngs` by `process.env.BRIKETTE_STAGING_LANGS`); update `generateLangParams()`, `generateLangAndSlugParams()`, `generateLangAndIdParams()` to call it; update `[lang]/layout.tsx:19` to call it. Add `BRIKETTE_STAGING_LANGS=en,it` to the build step env in `.github/workflows/brikette-staging-fast.yml`. Validate locally with the full static-export pipeline: `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 BRIKETTE_STAGING_LANGS=en,it pnpm build && pnpm normalize:localized-routes && pnpm generate:static-redirects` — confirm `out/` contains only `en/` and `it/` language directories, no `de/`, `fr/`, etc.

**Decision rule for T2:** implement unconditionally. The locale filter has independent value regardless of incremental deploy timing:
- Reduces build time (fewer pages to render during `next build`)
- Reduces CF manifest exchange time (fewer file hashes to send)
- Reduces cold-deploy time when the staging project has stale content
- Reduces `wrangler` memory/cpu during hashing of ~18k files

If the spike shows incremental deploys are already < 2 min (dedup working well), the locale filter still reduces build time from a few minutes. If the spike shows > 10 min, the locale filter is critical.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Wrangler dedup behaviour | Yes | None | No |
| `i18n.config.ts` as single lang source of truth | Yes | None | No |
| All `generateStaticParams` calls use `i18nConfig.supportedLngs` | Yes (verified `static-params.ts` + 35 call sites) | None | No |
| Cold vs incremental deploy timing | Partial | Impact score uncertain until timing baseline run | No (advisory) |
| Client-side i18next with filtered langs | Partial | Low risk in static export; no runtime server | No (advisory) |

## Evidence Gap Review

### Gaps Addressed
- Wrangler dedup: confirmed via code inspection and CF docs (was open question Q3 in dispatch).
- File count breakdown: measured from local `out/` (was open question Q2).
- `generateStaticParams` cascade: all 35 call sites verified via grep and `static-params.ts` utility.

### Confidence Adjustments
- Impact raised from 72% (dispatch) to 78% because locale filter is confirmed implementable in one file, but timing uncertainty remains until baseline spike.

### Remaining Assumptions
- Incremental deploy time is < 5 min with dedup working (not yet measured live).
- CF manifest exchange time is O(file count) — not O(total bytes) — so locale filter reduces exchange time proportionally.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance:
  - `next build` with `BRIKETTE_STAGING_LANGS=en,it` produces `out/` with only `en/` and `it/` language directories.
  - `wrangler pages deploy` run on the resulting `out/` completes and reports file counts matching the reduced set.
  - No production build affected (env var absent in production workflow).

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan brikette-staging-upload-speed --auto`
  - Task 1: SPIKE — timing baseline (trigger fast-path workflow twice, record second time; calibration only)
  - Task 2: IMPLEMENT — `getBuildLanguages()` in `static-params.ts` + 4 call-site updates + `BRIKETTE_STAGING_LANGS=en,it` in workflow (implement unconditionally)
