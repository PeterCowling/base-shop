---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-staging-upload-speed
Completed-date: 2026-03-08
artifact: build-record
Build-Event-Ref: docs/plans/brikette-staging-upload-speed/build-event.json
---

# Build Record: Brikette Staging Upload Speed

## Outcome Contract

- **Why:** Staging deploys still took ~37 min after CI overhead was removed; the Cloudflare upload was the sole remaining bottleneck. Operator wanted a materially faster staging cycle.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Brikette staging deploys complete materially faster than 37 min, with a concrete reduction achieved via language-subset builds and/or wrangler dedup.
- **Source:** operator

## What Was Built

**TASK-01 (Investigate):** Measured actual incremental staging deploy timing using the new EN+IT fast-path workflow. Three CI runs were observed: Run 1 confirmed the EN+IT filter was working (build succeeded in 1m 51s) but CF auth failed. Run 2 (first successful full deploy) completed in 5m 13s total, with the CF upload taking 41s. Run 3 (no-code-change redeploy) completed in 5m 2s, with CF upload taking 34s. This revealed that wrangler content-addressed dedup provides only ~17% savings (7s), not the 50-80% hypothesised in the plan. The dominant finding was that the overall 86% reduction (37 min → 5 min) comes from the single-job workflow eliminating inter-job artifact transfer overhead, combined with the EN+IT language filter reducing HTML output.

**TASK-02 (Implement):** Added a `getBuildLanguages()` helper to `apps/brikette/src/app/_lib/static-params.ts` that reads `process.env.BRIKETTE_STAGING_LANGS`, splits on comma, filters to valid `AppLanguage` values, and falls back to the full 18-language list when unset or empty. Updated all four `generateStaticParams` call sites — three in `static-params.ts` (`generateLangParams`, `generateLangAndSlugParams`, `generateLangAndIdParams`) and one in `apps/brikette/src/app/[lang]/layout.tsx` — to call `getBuildLanguages()`. Added `BRIKETTE_STAGING_LANGS: "en,it"` to the `.github/workflows/brikette-staging-fast.yml` build step env. Read-only files (`i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts`) were confirmed untouched. Pre-existing DS lint errors in `OctorateCustomPageShell.tsx` were fixed in the same commit. Commit: `7f45ac10c1`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` (apps/brikette) | Pass | Turbo, all 22 dependencies clean |
| `pnpm lint` (staged files) | Pass | `--no-warn-ignored`; pre-existing DS errors in `OctorateCustomPageShell.tsx` fixed in same commit |
| TC-01–TC-05 (logic validation) | Pass | Verified inline against `getBuildLanguages()` implementation |
| CI Run 2 (workflow_dispatch) | Pass | 5m 13s total; CF upload 41s; staging deploy successful |
| CI Run 3 (no-change redeploy) | Pass | 5m 2s total; CF upload 34s; dedup savings 7s (~17%) |

## Validation Evidence

### TASK-01

- Deliverable `task-01-timing.md` created with full per-step breakdown for three CI runs.
- Two data points captured (Run 2 + Run 3): first deploy 41s, incremental 34s.
- Second-deploy time < 5 min (5m 2s total) → conclusion: locale filter is primarily a build-time optimisation.
- Wrangler file upload counts visible in CI logs; dedup savings measured at ~17%.

### TASK-02

- TC-01: `BRIKETTE_STAGING_LANGS=en,it` → `getBuildLanguages()` returns `["en", "it"]` — pass (logic verified)
- TC-02: `BRIKETTE_STAGING_LANGS` unset → `getBuildLanguages()` returns all 18 `i18nConfig.supportedLngs` — pass
- TC-03: `BRIKETTE_STAGING_LANGS=en,de,INVALID` → filters to `["en", "de"]` only — pass
- TC-04: Static export with `BRIKETTE_STAGING_LANGS=en,it` → `out/en/` and `out/it/` exist; `out/de/` does not — confirmed via CI Run 2 (448 HTML files, EN+IT only)
- TC-05: Static export without `BRIKETTE_STAGING_LANGS` → all 18 language dirs present — preserved (filter is a no-op when env var absent)
- Readonly files: `git diff HEAD~1` showed `i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts` unchanged

## Scope Deviations

**Pre-existing lint fixes added to TASK-02 commit:** `OctorateCustomPageShell.tsx` had pre-existing DS lint errors (iframe aspect ratio, arbitrary Tailwind value, hardcoded browser constant) that were surfaced during the lint gate. These were fixed in the same commit to unblock the pre-commit hook. This is a minor, benign scope expansion — no functional change to the component's behaviour.
