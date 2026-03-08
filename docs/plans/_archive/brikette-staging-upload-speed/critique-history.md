# Critique History — brikette-staging-upload-speed

## Round 1 — 2026-03-08

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision
- Critical: 0 | Major: 2 | Minor: 1

Findings:
1. [Major] Blast radius understated — `i18nConfig.supportedLngs` consumed by redirects, metadata alternates, runtime lang resolution, footer, `RUNTIME_SUPPORTED` re-export, not just `generateStaticParams`.
2. [Major] Decision inconsistency — SPIKE seed said "close as no-build-needed if < 5 min" but risk table and Planning Readiness said "implement regardless".
3. [Minor] Language count wrong — 18 not 19.

## Round 2 — 2026-03-08

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision (advisory — no Critical findings)
- Critical: 0 | Major: 2 | Minor: 1

Findings:
1. [Major] Validation command wrong — `BRIKETTE_STAGING_LANGS=en,it next build` doesn't produce `out/` without `OUTPUT_EXPORT=1`; also needs `normalize:localized-routes` and `generate:static-redirects`.
2. [Major] Blast-radius framing still too narrow — should explicitly frame partial locale surface as deliberate accepted degradation in the impact map and acceptance package.
3. [Minor/Positive] Routing call-site analysis materially better — correct that `[lang]/layout.tsx` is the only direct `i18nConfig.supportedLngs.map()` call outside `static-params.ts`.

Post-loop gate: lp_score 4.0, no Critical remaining → **credible**. Fixes applied in-place to fact-find before finalising.

---

## Plan Round 1 — 2026-03-08

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision
- Critical: 0 | Major: 2 | Minor: 1

Findings:
1. [Major] `_tokens.*.json` reduction overclaimed — locale loader is runtime; Turbopack may include all locale assets regardless of route count. Reduction should be hypothesis, not confirmed outcome.
2. [Major] TASK-02 local validation command incomplete — missing route-hide/restore steps and post-build scripts (`normalize:localized-routes`, `generate:static-redirects`, `find __next.*`) that the actual fast-path workflow runs.
3. [Minor] Header `Overall-confidence: 78%` stale — plan's own calculation resolves to 75%.

Fixes applied: (1) Downgraded `_tokens.*.json` reduction to hypothesis in Summary, Fact-Find Reference, and TASK-02 Impact. (2) Updated TASK-02 local validation to mirror the full fast-path workflow including route hide/restore. (3) Fixed header confidence to 75%.

## Plan Round 2 — 2026-03-08

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision
- Critical: 0 | Major: 2 | Minor: 1

Findings:
1. [Major] Sequencing inconsistency — Parallelism Guide says fully independent/parallel but TASK-01 notes say "after TASK-02 is live" as preferred. Inconsistent.
2. [Major] TASK-01 unanswerable question — "manifest exchange vs file upload" breakdown is not available from standard wrangler output; question needs to be reframed or dropped.
3. [Minor] Decision log override claim — "operator can override in workflow env var" implies easy re-run override but no `workflow_dispatch` inputs exist; override requires editing the file.

Fixes applied: (1) Updated Parallelism Guide to note preferred order (T2 first, T1 after) while preserving independence. (2) Reframed unanswerable manifest-exchange question to "wrangler upload count per run" (available from standard output). (3) Clarified decision log: override requires file edit + re-push, no workflow_dispatch input available.

## Plan Round 3 — 2026-03-08

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision (advisory — no Critical findings)
- Critical: 0 | Major: 2 | Minor: 0

Findings:
1. [Major] TASK-01 goal "baseline for locale filter comparison" is inconsistent with preferred execution (post-TASK-02 deployment, not before/after comparison).
2. [Major] `legacy-guide-alias.ts` justification factually wrong — those routes ARE used in `generateStaticParams()` in `_single-off` and `_slug-off` pages, not "read-only". Safety is correct but reasoning was wrong.

Fixes applied: (1) Narrowed Goal-2 to "post-filter dedup calibration" (not before/after locale comparison). (2) Corrected legacy-guide-alias.ts note: routes are moved aside during export, making filtering safe regardless of whether they call `generateStaticParams()`.

Post-loop gate (Round 3 max): lp_score 4.0, no Critical findings → **credible**.
