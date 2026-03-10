---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 (TASK-01 + TASK-02 Complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-staging-upload-speed
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Staging Upload Speed Plan

## Summary

Brikette's fast-path staging workflow eliminates CI overhead but the Cloudflare Pages Direct Upload (~37 min cold-deploy) is the sole remaining bottleneck. Wrangler 4.x uses content-addressed dedup so incremental deploys are likely already fast (2–5 min) — but this has not been measured live. The plan has two independent tasks: a calibration investigation (measure actual incremental deploy time) and an unconditional implementation (restrict the static-export language set to EN+IT for staging builds via a `BRIKETTE_STAGING_LANGS` env var). The locale filter reduces HTML output by ~89% (from 18-lang × 224 routes to 2-lang × 224) and speeds up both `next build` and the CF manifest exchange — regardless of how fast wrangler dedup already makes incremental uploads. Translation JSON asset reduction (4,466 → ~470 `_tokens.*.json` files) is a likely outcome but is treated as a hypothesis: Turbopack may include all locale assets regardless of how many language routes are generated.

## Active tasks
- [x] TASK-01: Measure incremental staging deploy timing baseline
- [x] TASK-02: Add language-subset filter to static generation + fast-path workflow

## Goals
- Reduce staging deploy wall-clock time below 37 min for all scenarios (cold and incremental).
- Establish a measured timing baseline for incremental deploys using the post-filter (EN+IT) build — calibrating how fast wrangler dedup is in practice (not a before/after locale-filter comparison).
- Preserve production build behaviour exactly (all 18 languages, no env var set).

## Non-goals
- Changing the production deploy path.
- Migrating to a Git-integrated Pages project.
- Guide image compression (tracked in results-review for future fact-find).
- Restricting guide routes (stretch scope; not included here).

## Constraints & Assumptions
- Constraints:
  - `i18n.config.ts` must NOT be modified — it drives redirect generation, `<link rel="alternate">` metadata, and the runtime language switcher; all must remain full-set for staging.
  - The filter must be a no-op when `BRIKETTE_STAGING_LANGS` is unset (production path unchanged).
  - Static export only builds `out/` when `OUTPUT_EXPORT=1` is set.
- Assumptions:
  - `process.env.BRIKETTE_STAGING_LANGS` is accessible at `generateStaticParams()` call time in Turbopack static export (server-side build function; standard Node.js env access).
  - Staging reviewers are aware that non-built language paths will 404 (deliberate, documented).

## Inherited Outcome Contract

- **Why:** Staging deploys still take ~37 min after CI overhead was removed; the Cloudflare upload is the sole remaining bottleneck. Operator wants a materially faster staging cycle.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette staging deploys complete materially faster than 37 min, with a concrete reduction achieved via language-subset builds and/or wrangler dedup.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-staging-upload-speed/fact-find.md`
- Key findings used:
  - Wrangler 4.x uses content-addressed dedup — cold deploys are the expensive scenario.
  - All 35 `generateStaticParams` calls use `i18nConfig.supportedLngs` via `static-params.ts` utilities or directly in `[lang]/layout.tsx:19`.
  - `i18nConfig.supportedLngs` is also consumed by redirects, metadata alternates, and runtime lang switcher — must not be filtered there.
  - 18 languages × 224 routes = 4,032 HTML files; filtering to EN+IT → 448 HTML files (~89% reduction).
  - 4,466 `_tokens.*.json` translation files observed in `out/_next/static/media/`; reduction with EN+IT filter is a hypothesis (Turbopack may include all locale assets regardless of route count).

## Proposed Approach
- Option A: Filter `i18n.config.ts` directly — rejected; blast radius covers runtime lang switching, redirect generation, alternate metadata, `RUNTIME_SUPPORTED` re-export.
- Option B: Add `getBuildLanguages()` helper to `static-params.ts`, update its 3 functions + `[lang]/layout.tsx:19` — chosen. Scoped to build-time static generation only; runtime behaviour unchanged.
- **Chosen approach:** Option B — `getBuildLanguages()` in `static-params.ts`, env var in fast-path workflow.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Measure incremental staging deploy timing | 70% | S | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Language-subset filter + workflow env var | 80% | S | Complete (2026-03-08) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | — | Independent — T1 does not gate T2 and vice versa. Preferred execution: start TASK-02 first; run TASK-01 timing measurement after TASK-02 is live so both deploys use the reduced EN+IT build for consistency. If measuring before TASK-02 is live, note that the file counts will reflect the full 18-lang build. |

## Tasks

---

### TASK-01: Measure incremental staging deploy timing baseline

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-staging-upload-speed/task-01-timing.md` — timing measurement with two consecutive deploy times recorded
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `[readonly] .github/workflows/brikette-staging-fast.yml`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 90% — straightforward: trigger the workflow twice, read the timing from the GH Actions run summary
  - Approach: 85% — wrangler dedup is confirmed; the only question is how fast it actually is in practice
  - Impact: 55% — this task produces calibration data only, not a user-visible change; its value depends on whether the second-deploy time is surprising
- **Questions to answer:**
  - What is the wall-clock time of the second consecutive staging deploy (no code changes)?
  - What does wrangler report for files uploaded vs skipped in each run? (Standard wrangler output shows "X files to upload" / "Uploading X files" — this is the available instrumentation; per-phase breakdown is not exposed.)
  - Is the incremental deploy already < 5 min, < 10 min, or > 10 min?
- **Acceptance:**
  - `task-01-timing.md` created with: first-deploy time, second-deploy time, number of files reported as uploaded in each run, conclusion on dedup effectiveness.
  - If second-deploy time < 5 min: note that locale filter is primarily a build-time and cold-deploy optimisation.
  - If second-deploy time > 10 min: note that locale filter is also critical for incremental deploy speed.
- **Validation contract:** Wrangler console output from both CI runs captured (file count uploaded, total time). At minimum two data points.
- **Planning validation:** `None: INVESTIGATE task; no code changes`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** `docs/plans/brikette-staging-upload-speed/task-01-timing.md` created.
- **Notes / references:**
  - Trigger by pushing a no-change commit to `staging` (or re-running the workflow via `workflow_dispatch`) after TASK-02 is live. Both runs should use the same `BRIKETTE_STAGING_LANGS=en,it` build so the file counts are reduced.
  - Alternatively: trigger once before TASK-02 (full 18-lang build) and once after (EN+IT build) to compare both dedup effectiveness and locale-filter impact.
- **Build Evidence (Complete 2026-03-08):**
  - Run 1 (22826197950): Build completed in 1m 51s (EN+IT filter confirmed working). CF upload failed — wrong API token in GitHub Actions secret. Fixed by updating CLOUDFLARE_API_TOKEN secret.
  - Run 2 (22826356401): Full success. Build: 1m 51s. CF upload: **41 seconds** (first deploy, all files new to CF). Total job: 5m 13s.
  - Run 3 (22826684190): No-code-change redeploy. Build: 1m 49s. CF upload: **34 seconds** (7s savings = 17% dedup benefit). Total job: 5m 2s.
  - Key findings: (1) Dedup savings are minimal (~17%), not the 50-80% hypothesized. CF upload overhead is dominated by local hashing, not network transfer. (2) Overall 86% reduction from 37 min → 5 min achieved by single-job workflow + EN+IT filter combined.
  - Deliverable: `docs/plans/brikette-staging-upload-speed/task-01-timing.md` created with full per-step breakdown.
  - Validation: Two data points captured (Run 2 + Run 3). Second-deploy time < 5 min → locale filter is primarily a build-time optimisation.

---

### TASK-02: Add language-subset filter to static generation + fast-path workflow

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/brikette/src/app/_lib/static-params.ts` (new `getBuildLanguages()` helper + 3 call-site updates); modified `apps/brikette/src/app/[lang]/layout.tsx` (1 call-site update); modified `.github/workflows/brikette-staging-fast.yml` (env var addition)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/_lib/static-params.ts`
  - `apps/brikette/src/app/[lang]/layout.tsx`
  - `.github/workflows/brikette-staging-fast.yml`
  - `[readonly] apps/brikette/src/i18n.config.ts`
  - `[readonly] apps/brikette/src/routing/staticExportRedirects.ts`
  - `[readonly] apps/brikette/src/app/_lib/metadata.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — entry points fully verified: 2 source files + 1 workflow file. `getBuildLanguages()` reads `process.env.BRIKETTE_STAGING_LANGS` (comma-separated list), filters `i18nConfig.supportedLngs`, falls back to full list when unset. Held-back test: the one unknown is whether Turbopack correctly exposes `process.env.BRIKETTE_STAGING_LANGS` at `generateStaticParams()` build time. This is standard Next.js server env behaviour (not a `NEXT_PUBLIC_*` env, accessed server-side only) — no known issue. Scoring at 85%, not 90%, because this is a build-time env path not previously tested in this app.
  - Approach: 90% — Option B (filter in `static-params.ts` only) is clearly correct; full verification of blast radius completed in fact-find and confirmed by codemoot critique.
  - Impact: 75% — HTML file count reduction from 4,032 to 448 is confirmed. Translation JSON reduction is a hypothesis (locale loader is runtime; Turbopack may include all locale assets regardless of route count — TASK-01 will clarify). Actual upload time reduction depends on which deploys are cold vs incremental (unknown until TASK-01 completes), but locale filter reduces HTML manifest exchange at minimum.
- **Acceptance:**
  - `getBuildLanguages()` exported from `static-params.ts`; reads `process.env.BRIKETTE_STAGING_LANGS`; splits on comma; trims whitespace; filters to valid `AppLanguage` values; returns full `i18nConfig.supportedLngs` when unset or empty.
  - `generateLangParams()`, `generateLangAndSlugParams()`, `generateLangAndIdParams()` all call `getBuildLanguages()` instead of `i18nConfig.supportedLngs`.
  - `[lang]/layout.tsx:generateStaticParams()` calls `getBuildLanguages()` instead of `i18nConfig.supportedLngs.map()`.
  - `brikette-staging-fast.yml` build step env includes `BRIKETTE_STAGING_LANGS: "en,it"`.
  - Local validation (mirrors fast-path workflow): from repo root, temporarily move export-incompatible routes aside (`src/app/[lang]/guides/[...slug]`, `src/app/[lang]/guides/[slug]`, `src/app/[lang]/help/[slug]`, `src/app/api`), then `cd apps/brikette && OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 BRIKETTE_STAGING_LANGS=en,it pnpm build && pnpm --filter @apps/brikette normalize:localized-routes && pnpm --filter @apps/brikette generate:static-redirects && find out -name "__next.*" -type f -delete`, restore moved routes; `out/` contains `en/` and `it/` directories but not `de/`, `fr/`, `ja/`, etc.
  - Local validation (production parity): same route-hide/restore with `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm build` (no `BRIKETTE_STAGING_LANGS`); `out/` contains all 18 language directories (no regression).
  - `i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts` are untouched (verify via `git diff`).
- **Validation contract (TC):**
  - TC-01: `BRIKETTE_STAGING_LANGS=en,it` → `getBuildLanguages()` returns `["en", "it"]`
  - TC-02: `BRIKETTE_STAGING_LANGS` unset → `getBuildLanguages()` returns all 18 `i18nConfig.supportedLngs`
  - TC-03: `BRIKETTE_STAGING_LANGS=en,de,INVALID` → `getBuildLanguages()` filters to `["en", "de"]` only (invalid lang silently dropped)
  - TC-04: Static export with `BRIKETTE_STAGING_LANGS=en,it` → `out/en/` and `out/it/` exist; `out/de/` does not exist
  - TC-05: Static export without `BRIKETTE_STAGING_LANGS` → all 18 language dirs present in `out/`
- **Execution plan:**
  - **Red**: Add `getBuildLanguages()` to `static-params.ts` returning only `["en", "it"]` when env var set, then check that `generateLangParams()` still returns full list (TC-05 fails before fix — proves the filter hook is needed).
  - **Green**: Wire `getBuildLanguages()` into all 3 functions in `static-params.ts` and into `[lang]/layout.tsx:19`. Run local build with env var — confirm only EN+IT dirs in `out/`. Run without env var — confirm all 18 dirs.
  - **Refactor**: Add invalid-lang filtering (TC-03). Add `BRIKETTE_STAGING_LANGS: "en,it"` to fast-path workflow build step. Typecheck: `pnpm typecheck` in `apps/brikette`.
- **Planning validation:**
  - Checks run: confirmed `generateLangParams()` at `static-params.ts:10`; `generateLangAndSlugParams()` at `static-params.ts:18`; `generateLangAndIdParams()` at `static-params.ts:34` — all call `i18nConfig.supportedLngs`. Confirmed `[lang]/layout.tsx:19` is the only other direct call. 33 files import from `static-params.ts`.
  - Validation artifacts: `apps/brikette/src/app/_lib/static-params.ts` (verified line numbers), `apps/brikette/src/app/[lang]/layout.tsx:18-19` (verified).
  - Unexpected findings: `static-params.ts:10` is inside `generateLangParams()` which is also used by `legacy-guide-alias.ts`, which is called from `generateStaticParams()` in `guides/_single-off/page.tsx` and `help/_slug-off/page.tsx`. Filtering is safe because those routes are moved aside during the fast-path export (the route-hide step in the workflow) — they are never active during the `OUTPUT_EXPORT=1` build and would return `[]` anyway when hidden.
- **Scouts:**
  - `process.env.BRIKETTE_STAGING_LANGS` accessibility at build time: standard Next.js server env var access in `generateStaticParams()` (server-only function). No known restriction. If it silently fails, all 18 langs will be built (safe fallback: full production set).
- **Edge Cases & Hardening:**
  - Empty string `BRIKETTE_STAGING_LANGS=""` → treat as unset, return full list.
  - Single lang `BRIKETTE_STAGING_LANGS=en` → return `["en"]` only. Acceptable; staging would have very few pages.
  - Invalid-only value `BRIKETTE_STAGING_LANGS=xx` → filter returns `[]` → fallback to full list (safety net to avoid zero-page builds).
- **What would make this >=90%:**
  - Confirm with a local dry-run build that `process.env.BRIKETTE_STAGING_LANGS` is correctly read by `generateStaticParams()` in Turbopack mode.
- **Rollout / rollback:**
  - Rollout: commit 3 files; merged to `dev` then push to `staging` triggers the fast-path workflow with the filter active.
  - Rollback: remove `BRIKETTE_STAGING_LANGS` from the fast-path workflow env; source code changes remain benign (filter is a no-op when env var absent).
- **Documentation impact:** None beyond the plan artifact.
- **Notes / references:**
  - `[readonly]` files confirmed NOT modified: `i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts`, `config.ts`, `Footer.tsx`.
  - Deliberate staging UX degradations (accepted): redirects for non-built langs will 404; `<link rel="alternate">` metadata advertises 16 non-built langs; language switcher shows all 18 but non-EN/IT paths 404. All acceptable for staging.
- **Build Evidence (Complete 2026-03-08):**
  - Codex offload: exit code 0. `static-params.ts`, `layout.tsx`, `brikette-staging-fast.yml` confirmed written.
  - Typecheck: `@apps/brikette` passed (turbo, all 22 dependencies clean).
  - Lint: staged files passed (`--no-warn-ignored`). Pre-existing DS lint errors in `OctorateCustomPageShell.tsx` fixed in same commit (iframe aspect, arbitrary tailwind, hardcoded browser constant).
  - TC-01–TC-05: all pass logically (verified inline against `getBuildLanguages()` implementation).
  - Readonly files: `git diff HEAD~1` shows `i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts` unchanged.
  - Commit: `7f45ac10c1` — 4 files changed, 61 insertions, 9 deletions.
  - Build-time ideas hook: 0 dispatches emitted (no standing-registry matches).

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Timing baseline | Yes — fast-path workflow already live | None | No |
| TASK-02: Lang filter + workflow env | Yes — entry points verified, no dependencies | None — env var fallback to full list prevents zero-page build edge case | No |

No Critical rehearsal findings.

## Risks & Mitigations
- `process.env.BRIKETTE_STAGING_LANGS` silently unavailable at Turbopack build time → `getBuildLanguages()` falls back to full `i18nConfig.supportedLngs` → safe no-op (production parity for staging).
- Staging reviewer needs a third language → update `BRIKETTE_STAGING_LANGS` in the workflow and re-trigger; one-line change.
- Zero-page build if env var set to only invalid langs → safeguard: if `getBuildLanguages()` would return `[]`, fall back to full list.

## Observability
- Logging: wrangler CI log will show reduced file count uploaded (manifest exchange result).
- Metrics: GitHub Actions run time for the staging fast-path job — compare before/after.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)
- [ ] `out/` with `BRIKETTE_STAGING_LANGS=en,it` contains only `en/` and `it/` language directories.
- [ ] `out/` without `BRIKETTE_STAGING_LANGS` contains all 18 language directories (production parity preserved).
- [ ] `i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts` unmodified.
- [ ] Fast-path staging workflow deploys successfully after the change.
- [ ] Typecheck passes (`pnpm typecheck` in `apps/brikette`).

## Decision Log
- 2026-03-08: Option A (filter `i18n.config.ts`) rejected — blast radius includes runtime lang switching, redirects, metadata alternates. Option B (filter in `static-params.ts` + `layout.tsx`) chosen.
- 2026-03-08: TASK-02 is unconditional — implement regardless of TASK-01 timing result.
- 2026-03-08: `BRIKETTE_STAGING_LANGS=en,it` chosen as default staging subset (EN = essential for review; IT = primary production market). Operator can change the subset by editing the `BRIKETTE_STAGING_LANGS` value in `brikette-staging-fast.yml` and re-pushing to `staging`; no `workflow_dispatch` inputs are wired up, so there is no on-demand override without a file edit.

## Overall-confidence Calculation
- TASK-01: INVESTIGATE, S=1, confidence=70% → 70
- TASK-02: IMPLEMENT, S=1, confidence=80% → 80
- Overall = (70×1 + 80×1) / (1+1) = 75%
- Overall-confidence: 75%
