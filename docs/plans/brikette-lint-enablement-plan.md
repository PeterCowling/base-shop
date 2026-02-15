---
Type: Plan
Status: Active
Domain: Repo
Workstream: Engineering
Created: 2026-01-26
Last-updated: 2026-02-15
Last-reviewed: 2026-02-15
Relates-to charter: docs/runtime/runtime-charter.md
Feature-Slug: brikette-lint-enablement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-refactor, lp-replan, lp-sequence
Overall-confidence: 70
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
---

# Brikette Lint Enablement Plan

## Summary
Re-enable automated linting for `@apps/brikette` by remediating the current ESLint error and warning backlog under `apps/brikette/src`, then replacing the package's no-op `lint` script with a strict eslint invocation.

Baseline as of **2026-02-15**:
- `pnpm --filter @apps/brikette exec eslint src --no-fix` reports **419 problems (254 errors, 165 warnings)**.
- `apps/brikette/package.json` `lint` script is a no-op.

## Goals
- `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- `pnpm --filter @apps/brikette lint` is a real eslint invocation and passes.
- Brikette's lint run is type-aware where intended, without TypeScript project-service warnings like `project service could not find file`.

## Non-goals
- Large-scale UX/product changes unrelated to lint compliance.
- Repo-wide rule weakening to make Brikette lint pass.

## Constraints & Assumptions
- Constraints:
  - The backlog is large. Work must be phased and checkpointed to avoid thrash.
  - Prefer fixing root causes. Overrides are allowed only when the rule is genuinely inapplicable to the scoped code (example: security lint on filesystem-walking tests).
- Assumptions:
  - Brikette's translation source of truth is `apps/brikette/src/locales/**` (not `packages/i18n`), even if some lint messages reference `packages/i18n`.

## Operational Notes (Do Not Skip)
- Any command path containing `[lang]` must be quoted or escaped (shell glob metacharacters):
  - Good: `eslint "src/app/[lang]/bar-menu/BarMenuContent.tsx"`
  - Bad: `eslint src/app/[lang]/bar-menu/BarMenuContent.tsx`
- Do not use non-core formatters (for example `--format unix` is not part of ESLint core). Prefer core `stylish` (default) or `json`.

## Evidence Snapshot (2026-02-15)
Representative failures confirmed via file-scoped lint runs:
- `max-lines-per-function`:
  - `src/app/[lang]/bar-menu/BarMenuContent.tsx` (313 > configured 200)
  - `src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx` (227 > configured 200)
- `complexity`:
  - `src/components/guides/GenericContent.tsx` (34 > configured 20)
  - `src/utils/ensureGuideContent.ts` (42 > configured 20)
  - `src/utils/routeHead.ts` (`buildRouteMeta` 27 > configured 20)
  - `src/utils/loadI18nNs.ts` (27 > configured 20)
- DS/layout rules:
  - `src/app/[lang]/assistance/layout.tsx` fails `ds/container-widths-only-at`
  - `src/components/footer/FooterNav.tsx` fails `ds/enforce-layout-primitives`
  - `src/app/[lang]/experiences/ExperienceFeatureSection.tsx` fails `ds/no-raw-typography`
- Copy:
  - `src/components/guides/GuideCollectionWithSearch.tsx` fails `ds/no-hardcoded-copy`
- Warnings that will block strict lint (`--max-warnings=0`):
  - Multiple files warn on restricted imports from `@acme/ui/atoms/*` (including `CfImage` / `CfResponsiveImage`).
  - Restricted imports must be addressed by migrating to supported entrypoints where available, or by a narrowly-scoped exception justified in-plan (only if no safe entrypoint exists).

## Proposed Approach
1. Ledger first: generate a diffable lint ledger (top rules + top files, separately for errors and warnings), and explicitly detect infra/noise.
2. Early sequencing gate: immediately re-sequence based on ledger distribution (not preselected refactors).
3. Fix infra/noise early (TypeScript project-service wiring) only if it is present in the evidence.
4. Treat warnings as first-class: strict `--max-warnings=0` means warnings must be planned, not deferred to the end.
5. Enable lint last: only flip `apps/brikette` `lint` script once strict lint is green.

## Lint Drift Guardrail (During Remediation)
Because `@apps/brikette lint` is currently a no-op, new violations can accumulate during remediation. During this plan:
- Policy: any PR touching `apps/brikette/src/**` must not increase total lint errors/warnings vs the most recent ledger snapshot recorded in this plan.
- If drift becomes a real problem, promote one of these to an explicit enablement change:
  - Baseline cap in CI: allow failing lint, but fail if counts exceed the snapshot.
  - Changed-files lint in CI: only lint changed Brikette files (prevents new debt; does not address backlog).

## Lint Ledger (2026-02-15)
Artifacts:
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.json`
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.stderr` (empty; no infra/noise detected)

Note: this ledger run included an untracked file in the working tree:
- `apps/brikette/src/test/content-readiness/i18n/i18n-raw-keys.enforce.test.ts` (eslint reported 1 error, 1 warning)

Totals (this run):
- 255 errors, 166 warnings (421 total)

Top rules by count (errors):
| Count | Rule |
|---:|---|
| 115 | `@typescript-eslint/no-explicit-any` |
| 49 | `complexity` |
| 28 | `ds/no-hardcoded-copy` |
| 11 | `max-lines-per-function` |
| 10 | `@typescript-eslint/no-unused-vars` |
| 9 | `ds/container-widths-only-at` |
| 5 | `ds/enforce-layout-primitives` |
| 4 | `react-hooks/rules-of-hooks` |
| 4 | `react-hooks/error-boundaries` |
| 3 | `ds/require-disable-justification` |

Top rules by count (warnings):
| Count | Rule |
|---:|---|
| 76 | `ds/no-hardcoded-copy` |
| 29 | `security/detect-non-literal-fs-filename` |
| 20 | `no-restricted-imports` |
| 12 | `security/detect-unsafe-regex` |
| 10 | `security/detect-non-literal-regexp` |
| 6 | `ds/min-tap-size` |
| 5 | `(no-rule)` |
| 3 | `react-hooks/exhaustive-deps` |
| 2 | `jsx-a11y/alt-text` |
| 1 | `@next/next/no-img-element` |

Top 20 files by error count:
| Errors | File |
|---:|---|
| 31 | `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderFallbackContent.tsx` |
| 30 | `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderPrimaryContent.tsx` |
| 17 | `apps/brikette/src/routes/guides/guide-seo/components/fallback/renderAliasFaqsOnly.tsx` |
| 15 | `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/_articleLead.tsx` |
| 12 | `apps/brikette/src/routes/how-to-get-here/transformRouteToGuide.ts` |
| 11 | `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderStructuredFallback.tsx` |
| 8 | `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderGenericFastPaths.tsx` |
| 6 | `apps/brikette/src/components/assistance/quick-links-section/index.tsx` |
| 6 | `apps/brikette/src/lib/seo-audit/index.ts` |
| 5 | `apps/brikette/src/app/[lang]/experiences/ExperiencesHero.tsx` |
| 4 | `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx` |
| 4 | `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx` |
| 4 | `apps/brikette/src/routes/guides/guide-seo/template/useAdditionalScripts.tsx` |
| 3 | `apps/brikette/src/app/[lang]/experiences/ExperiencesCtaSection.tsx` |
| 3 | `apps/brikette/src/i18n.ts` |
| 3 | `apps/brikette/src/routes/guides/guide-seo/components/structured-toc/StructuredTocFaqSection.tsx` |
| 3 | `apps/brikette/src/routes/guides/guide-seo/template/useStructuredFallbackState.ts` |
| 3 | `apps/brikette/src/utils/loadI18nNs.ts` |
| 2 | `apps/brikette/src/app/cookie-policy/page.tsx` |
| 2 | `apps/brikette/src/app/page.tsx` |

Triage buckets (from this run):
- Infra/noise: No infra/noise strings found in stderr (`project service could not find file`, `The file must be included in at least one of the projects provided`).
- Mechanical/low-risk: `@typescript-eslint/no-unused-vars`, `ds/require-disable-justification` (some instances may be better solved by removing disables vs adding tickets).
- UI/UX-sensitive: `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, `ds/min-tap-size`, `@next/next/no-img-element`, `jsx-a11y/alt-text`.
- Copy/localization: `ds/no-hardcoded-copy` (errors + warnings).
- Deeper refactors: `@typescript-eslint/no-explicit-any`, `complexity`, `max-lines-per-function`, `react-hooks/*`.

## Lint Ledger (Post TASK-07, 2026-02-15)
Artifacts:
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.json`
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.stderr` (empty; no infra/noise detected)

Totals (this run):
- 239 errors, 166 warnings (405 total)
- Delta vs 2026-02-15 baseline ledger: **-16 errors**, **+0 warnings**

Top rules by count (errors, unchanged ordering):
- `@typescript-eslint/no-explicit-any`: 115
- `complexity`: 43 (down from 49)
- `ds/no-hardcoded-copy`: 28
- `max-lines-per-function`: 8 (down from 11)

## Lint Ledger (Post TASK-09 + TASK-13, 2026-02-15)
Artifacts:
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.post-task-13-09.json`
- `docs/plans/_artifacts/brikette-eslint.2026-02-15.post-task-13-09.stderr` (empty; no infra/noise detected)

Totals (this run):
- 173 errors, 164 warnings (337 total)
- Delta vs Post TASK-07 ledger: **-66 errors**, **-2 warnings**

Top rules by count (errors):
| Count | Rule |
|---:|---|
| 59 | `@typescript-eslint/no-explicit-any` |
| 40 | `complexity` |
| 27 | `ds/no-hardcoded-copy` |
| 8 | `ds/container-widths-only-at` |
| 6 | `@typescript-eslint/no-unused-vars` |
| 6 | `max-lines-per-function` |
| 4 | `ds/enforce-layout-primitives` |
| 4 | `react-hooks/rules-of-hooks` |
| 4 | `react-hooks/error-boundaries` |
| 3 | `max-depth` |

Top rules by count (warnings):
| Count | Rule |
|---:|---|
| 76 | `ds/no-hardcoded-copy` |
| 29 | `security/detect-non-literal-fs-filename` |
| 19 | `no-restricted-imports` |
| 12 | `security/detect-unsafe-regex` |
| 10 | `security/detect-non-literal-regexp` |
| 6 | `ds/min-tap-size` |
| 3 | `react-hooks/exhaustive-deps` |
| 2 | `jsx-a11y/alt-text` |
| 1 | `@next/next/no-img-element` |

Notes (evidence used for replan decomposition):
- `ds/no-hardcoded-copy`: 27 errors in 11 files; 76 warnings in 14 files.
- `no-restricted-imports`: 19 warnings in 18 files.
- Security warnings are dominated by tests (`apps/brikette/src/test/**`), but also include code under `apps/brikette/src/lib/seo-audit/index.ts`.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build lint ledger (errors + warnings + infra noise) | 95% | S | Complete (2026-02-15) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Sequencing gate: replan tasks 3+ based on ledger distribution + set drift policy | 95% | S | Complete (2026-02-15) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Fix TypeScript project-service wiring (no infra/noise warnings) (conditional) | 80% | M | Complete (2026-02-15) | TASK-02 | TASK-12 (conditional) |
| TASK-04 | IMPLEMENT | Remove ds/require-disable-justification error in i18n types helper | 90% | S | Complete (2026-02-15) | TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Mechanical cleanup tranche (unused vars, duplicates, import sorting) | 82% | M | Complete (2026-02-15) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Reduce complexity hotspots in i18n + SEO/head utilities (configured thresholds) | 80% | M | Complete (2026-02-15) | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Refactor max-lines-per-function offenders (configured thresholds) | 80% | M | Complete (2026-02-15) | TASK-06 | TASK-08 |
| TASK-08 | CHECKPOINT | Horizon checkpoint: rerun lint, replan remaining remediation batches | 95% | S | Complete (2026-02-15) | TASK-07 | TASK-09, TASK-10, TASK-11, TASK-13 |
| TASK-09 | IMPLEMENT | Fix DS/layout primitive errors in top-offender UI files | 82% | M | Complete (2026-02-15) | TASK-08 | TASK-12 |
| TASK-10 | IMPLEMENT | Remove ds/no-hardcoded-copy errors using Brikette locales strategy | 78% | M | Superseded (decomposed; see TASK-19, TASK-20) | TASK-08 | TASK-12 |
| TASK-11 | IMPLEMENT | Drive warning count to zero (restricted imports, tap size, migration-test security warnings) | 70% | L | Superseded (decomposed; see TASK-21..TASK-25) | TASK-08 | TASK-12 |
| TASK-13 | IMPLEMENT | Remove `@typescript-eslint/no-explicit-any` errors in guide-seo hotspots (top offenders) | 75% | L | Complete (2026-02-15) | TASK-08 | TASK-12 |
| TASK-14 | IMPLEMENT | Fix remaining `ds/container-widths-only-at` errors (post-task-13-09 ledger) | 85% | S | Complete (2026-02-15) | TASK-08 | TASK-12 |
| TASK-15 | IMPLEMENT | Fix remaining `ds/enforce-layout-primitives` errors (post-task-13-09 ledger) | 85% | S | Ready | TASK-08 | TASK-12 |
| TASK-16 | IMPLEMENT | Fix remaining react-hooks error rules + `max-depth` errors (post-task-13-09 ledger) | 80% | M | Ready | TASK-08 | TASK-12 |
| TASK-17 | IMPLEMENT | Fix remaining `max-lines-per-function` errors (post-task-13-09 ledger) | 82% | M | Ready | TASK-08 | TASK-12 |
| TASK-18 | IMPLEMENT | Fix remaining `@typescript-eslint/no-unused-vars` errors (post-task-13-09 ledger) | 90% | S | Ready | TASK-08 | TASK-12 |
| TASK-19 | INVESTIGATE | i18n/copy strategy check (coverage/parity tests + locale policy) | 90% | S | Complete (2026-02-15) | TASK-08 | TASK-20 |
| TASK-20 | IMPLEMENT | Remove `ds/no-hardcoded-copy` errors in redirect stubs (cookie-policy, privacy-policy) | 85% | S | Complete (2026-02-15) | TASK-19 | TASK-12 |
| TASK-29 | IMPLEMENT | Remove remaining `ds/no-hardcoded-copy` errors (and as many warnings as feasible) | 74% | L | Blocked | TASK-19 | TASK-12 |
| TASK-21 | INVESTIGATE | Restricted-imports audit (verify supported entrypoints + migration map) | 85% | S | Ready | TASK-08 | TASK-22 |
| TASK-22 | IMPLEMENT | Eliminate `no-restricted-imports` warnings in Brikette | 74% | L | Blocked | TASK-21 | TASK-12 |
| TASK-23 | IMPLEMENT | Remediate security warnings to reach `--max-warnings=0` (tests + seo-audit) | 78% | L | Ready | TASK-08 | TASK-12 |
| TASK-24 | IMPLEMENT | Fix `ds/min-tap-size` warnings (apartment tranche + SkipLink) | 82% | M | Complete (2026-02-15) | TASK-14 | TASK-12 |
| TASK-30 | IMPLEMENT | ExperiencesHero lint remediation (tap-size + coupled warnings) | 78% | M | Ready | TASK-08 | TASK-12 |
| TASK-31 | IMPLEMENT | HowToGetHereIndexContent warnings (tap-size + unsafe-regex) | 85% | S | Complete (2026-02-15) | TASK-08 | TASK-12 |
| TASK-25 | IMPLEMENT | Fix remaining a11y/Next/react-hooks warnings (alt-text, no-img-element, exhaustive-deps) | 85% | S | Ready | TASK-08 | TASK-12 |
| TASK-26 | INVESTIGATE | `no-explicit-any` remaining offenders: type strategy + call-site map | 85% | M | Ready | TASK-08 | TASK-27 |
| TASK-27 | IMPLEMENT | Remove remaining `@typescript-eslint/no-explicit-any` errors (post-task-13-09 ledger) | 74% | L | Blocked | TASK-26 | TASK-12 |
| TASK-28 | IMPLEMENT | Reduce remaining `complexity` errors to configured thresholds (post-task-13-09 ledger) | 74% | L | Ready | TASK-08 | TASK-12 |
| TASK-12 | IMPLEMENT | Re-enable `@apps/brikette` lint script (strict) + final validation | 85% | S | Blocked | TASK-09, TASK-14, TASK-15, TASK-16, TASK-17, TASK-18, TASK-20, TASK-22, TASK-23, TASK-24, TASK-25, TASK-30, TASK-31, TASK-27, TASK-28, TASK-29 (+ TASK-03 if applicable) | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)
## Parallelism Guide
Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Produce evidence + triage (errors vs warnings vs infra) |
| 2 | TASK-02 | TASK-01 | Re-sequence tasks based on distribution evidence + set drift policy |
| 3 | TASK-03 (conditional) + TASK-04 | TASK-02 | TASK-03 only if infra/noise exists; TASK-04 can proceed if TASK-03 is N/A |
| 4 | TASK-05 -> TASK-06 -> TASK-07 | TASK-04 | Sequential refactor tranches; keep diffs small |
| 5 | TASK-08 | TASK-07 | Re-measure + replan |
| 6 | TASK-09 + TASK-14..TASK-18 + TASK-19..TASK-31 | TASK-08 | Post-checkpoint remediation in small batches; each blocks TASK-12 |
| 7 | TASK-12 | TASK-09, TASK-14..TASK-18, TASK-20, TASK-22, TASK-23..TASK-25, TASK-27, TASK-28, TASK-30, TASK-31 (+ TASK-03 if applicable) | Enable strict lint last |

**Max parallelism:** 4 (post-checkpoint) | **Total tasks:** 31

## Tasks

### TASK-01: Build lint ledger (errors + warnings + infra noise)
- **Type:** INVESTIGATE
- **Deliverable:** Add a `## Lint Ledger (YYYY-MM-DD)` section to this plan including:
  - Totals (errors, warnings)
  - Top 10 rules by count (errors and warnings separately)
  - Top 20 files by error count
  - Optional (recommended): top 20 files by total findings (errors + warnings)
  - Triage buckets:
    - Infra/noise (project-service, parser/runtime)
    - Mechanical/low-risk (unused vars, duplicates, import sort)
    - UI/UX-sensitive (tap size, layout primitives, typography)
    - Copy/localization
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`, `docs/plans/_artifacts/brikette-eslint.*.json`, `docs/plans/_artifacts/brikette-eslint.*.stderr`, `[readonly] eslint.config.mjs`, `[readonly] apps/brikette/src/**/*`, `[readonly] apps/brikette/package.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% - core eslint supports `--format json` and `--output-file`
  - Approach: 90% - evidence-first prevents wasted refactors
  - Impact: 95% - read-only
- **Acceptance:**
  - Ledger includes the breakdowns above and explicitly identifies warning classes that must be resolved to reach `--max-warnings=0`.
  - Ledger explicitly reports whether infra/noise strings occur (see validation).
- **Validation contract:**
  - TC-01: Generate durable, diffable artifacts (capture both JSON and stderr):
    - `mkdir -p docs/plans/_artifacts`
    - `LEDGER_DATE="$(date +%F)"`
    - `pnpm --filter @apps/brikette exec eslint src --no-fix -f json -o "docs/plans/_artifacts/brikette-eslint.${LEDGER_DATE}.json" 2> "docs/plans/_artifacts/brikette-eslint.${LEDGER_DATE}.stderr" || true`
  - TC-02: Detect infra/noise strings (portable; search the captured stderr):
    - `grep -nE "project service could not find file|The file must be included in at least one of the projects provided" "docs/plans/_artifacts/brikette-eslint.${LEDGER_DATE}.stderr" || true`
- **Execution plan:** Red -> Green -> Refactor
  - Red: confirm lint fails with non-zero exit
  - Green: produce ledger + triage
  - Refactor: convert triage into concrete batches and unblock TASK-02
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Execution notes:** Ledger run intentionally proceeded despite a dirty working tree; untracked file `apps/brikette/src/test/content-readiness/i18n/i18n-raw-keys.enforce.test.ts` was included in the lint run and is documented in the ledger above.
- **Validation evidence:**
- Ran: `pnpm --filter @apps/brikette --silent exec -- eslint src --no-fix -f json > docs/plans/_artifacts/brikette-eslint.2026-02-15.json 2> docs/plans/_artifacts/brikette-eslint.2026-02-15.stderr || true`
- Infra/noise grep: no matches in `docs/plans/_artifacts/brikette-eslint.2026-02-15.stderr`

### TASK-02: Sequencing gate: replan tasks 3+ based on ledger distribution + set drift policy
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan tasks after TASK-02 are re-sequenced and (if needed) decomposed based on ledger evidence, plus an explicit drift policy for the remediation window.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on tasks after this checkpoint.
  - Reorder/replace tasks 3+ so the first remediation tranche targets the highest-count rules and highest-error files.
  - Pull infra/noise and high-leverage warning blockers earlier if they dominate the distribution.
  - Decide and record the drift guardrail to use during remediation:
    - Minimum: "PRs touching Brikette must not increase error/warn counts vs the latest ledger snapshot."
    - Optional: implement a baseline-cap or changed-files lint gate in CI if drift becomes problematic.
  - If dependency topology changes, run `/lp-sequence` before proceeding to build.
- **Validation contract:**
  - TC-01: Updated task order + `Depends on` / `Blocks` are internally consistent.
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Sequencing decision (evidence-driven):** The highest-count error rule is `@typescript-eslint/no-explicit-any` (115 errors) and the top error files are concentrated under `apps/brikette/src/routes/guides/guide-seo/**`. Early remediation must focus on these hotspots without weakening repo rules.
- **Infra/noise:** Absent in this ledger run (stderr empty; no infra/noise strings), so TASK-03 is expected to be `N/A` unless a future run shows project-service noise.
- **Drift guardrail decision:** Minimum policy applies: PRs touching `apps/brikette/src/**` must not increase total errors/warnings vs the 2026-02-15 snapshot captured above.

### TASK-03: Fix TypeScript project-service wiring (no infra/noise warnings) (conditional)
- **Type:** IMPLEMENT
- **Deliverable:** Code/config change so eslint type-aware runs do not emit TypeScript project-service warnings for Brikette source files.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/tsconfig.json`, `apps/brikette/tsconfig.scripts.json` (if needed), `eslint.config.mjs` (only if required)
- **Depends on:** TASK-02
- **Blocks:** TASK-12 (only if infra/noise exists)
- **Confidence:** 80%
  - Implementation: 85% - likely tsconfig include/exclude mismatch if the warning exists
  - Approach: 80% - fix wiring rather than weakening type-aware lint
  - Impact: 80% - config blast radius; must validate carefully
- **Acceptance:**
  - If TASK-01 finds no infra/noise strings, mark TASK-03 as `Complete (YYYY-MM-DD)` with note: `N/A: no infra/noise detected in ledger`, then proceed.
  - If infra/noise is present, lint output contains no TypeScript project-service warnings after the fix.
- **Validation contract:**
  - TC-01: No infra/noise strings in eslint output:
    - `if pnpm --filter @apps/brikette exec eslint src --no-fix 2>&1 | grep -nE "project service could not find file|The file must be included in at least one of the projects provided"; then echo "ERROR: infra/noise still present" >&2; exit 1; fi`
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: minimal config change scoped to Brikette.
  - Rollback: revert config change and replan if it impacts other scopes.
- **Documentation impact:** None
- **Planning validation:** (M-effort)
  - Evidence gathered in TASK-01 determines whether this is a real blocker or can be N/A.

#### Build Completion (2026-02-15)
- **Status:** Complete (N/A)
- **Reason:** TASK-01 ledger stderr (`docs/plans/_artifacts/brikette-eslint.2026-02-15.stderr`) was empty and contained no infra/noise strings, so no project-service wiring work is required at this time.
- **Validation evidence:** `grep -nE "project service could not find file|The file must be included in at least one of the projects provided" docs/plans/_artifacts/brikette-eslint.2026-02-15.stderr` returned no matches.

### TASK-04: Remove ds/require-disable-justification error in i18n types helper
- **Type:** IMPLEMENT
- **Deliverable:** Code change; remove the eslint-disable and satisfy lint without adding fake tickets.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/utils/i18n-types.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% - replace unsafe `Function` typing with a safe callable type and remove the disable
  - Approach: 90% - remove the disable rather than justifying it
  - Impact: 90% - isolated helper file
- **Acceptance:**
  - `apps/brikette/src/utils/i18n-types.ts` has no eslint-disable directives for unsafe function typing.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/utils/i18n-types.ts --no-fix --max-warnings=0` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `33af1144e4` (note: commit subject is unrelated; change landed opportunistically in that commit)
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/i18n-types.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS

### TASK-05: Mechanical cleanup tranche (unused vars, duplicates, import sorting)
- **Type:** IMPLEMENT
- **Deliverable:** Code changes that eliminate mechanical lint failures and reduce churn for later refactors.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/components/assistance/quick-links-section/normalise.ts`, `apps/brikette/src/test/helpers/hydrationTestUtils.ts`, `apps/brikette/src/lib/metrics/smoothed-metrics.ts`, `apps/brikette/src/components/seo/TravelHelpStructuredData.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 85% - mechanical fixes are straightforward
  - Approach: 80% - reduce diff noise before deeper refactors
  - Impact: 82% - some changes touch UI, keep them surgical
- **Acceptance:**
  - Mechanical rule errors for the selected batch are eliminated.
- **Validation contract:**
  - TC-01: File-scoped lint passes for each changed file with `--max-warnings=0`.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `0972be5e44`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src/components/assistance/quick-links-section/normalise.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/test/helpers/hydrationTestUtils.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/lib/metrics/smoothed-metrics.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/components/seo/TravelHelpStructuredData.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
- **Implementation notes:**
  - Removed unused constants/variables/imports; no behavior changes intended.

### TASK-06: Reduce complexity hotspots in i18n + SEO/head utilities (configured thresholds)
- **Type:** IMPLEMENT
- **Deliverable:** Refactors that reduce complexity under configured eslint thresholds without changing behavior.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/utils/loadI18nNs.ts`, `apps/brikette/src/utils/ensureGuideContent.ts`, `apps/brikette/src/utils/routeHead.ts`, `apps/brikette/src/utils/testHeadFallback.ts`, `apps/brikette/src/utils/tags/normalizers.ts`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 85% - extract small pure helpers
  - Approach: 80% - keep contracts stable
  - Impact: 80% - utilities affect routing/SEO; validate carefully
- **Acceptance:**
  - `complexity` lint errors are eliminated in the selected files (per configured thresholds).
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each affected file.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `c95ce07620`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/loadI18nNs.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/ensureGuideContent.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/routeHead.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/testHeadFallback.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/utils/tags/normalizers.ts --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
- **Implementation notes:** Extracted helper functions to reduce per-function complexity while keeping behavior unchanged.

### TASK-07: Refactor max-lines-per-function offenders (configured thresholds)
- **Type:** IMPLEMENT
- **Deliverable:** Refactors that bring function length under configured thresholds while preserving UI output.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/bar-menu/BarMenuContent.tsx`, `apps/brikette/src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx`, `apps/brikette/src/components/guides/GenericContent.tsx`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% - split render helpers/subcomponents
  - Approach: 80% - reduce size/complexity without semantic changes
  - Impact: 80% - UI regression risk; keep changes minimal
- **Acceptance:**
  - `max-lines-per-function` errors are eliminated for the selected files (per configured thresholds).
  - `GenericContent` complexity errors are eliminated.
- **Validation contract:**
  - TC-01: Quote `[lang]` paths in eslint commands:
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/bar-menu/BarMenuContent.tsx" --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx" --no-fix --max-warnings=0`
  - TC-02: `pnpm --filter @apps/brikette exec eslint src/components/guides/GenericContent.tsx --no-fix --max-warnings=0`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `0582fb7fe9`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/bar-menu/BarMenuContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/components/guides/GenericContent.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
- **Implementation notes:** Converted repetitive menu JSX to data-driven rendering; decomposed `GenericContent` logic and rendering into helper functions to stay under both `max-lines-per-function` and `complexity` thresholds without changing behavior.

### TASK-08: Horizon checkpoint: rerun lint, replan remaining remediation batches
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan for remaining remediation, driven by fresh ledger data after the first tranche.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`
- **Depends on:** TASK-07
- **Blocks:** TASK-09, TASK-14..TASK-28
- **Confidence:** 95%
- **Acceptance:**
  - Rerun `pnpm --filter @apps/brikette exec eslint src --no-fix` and capture new counts.
  - Run `/lp-replan` on tasks after TASK-08 with updated evidence.
  - If tasks are split/added/removed, run `/lp-sequence` before continuing build.
- **Validation contract:**
  - TC-01: Updated counts and deltas are recorded in this plan.
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Artifacts:**
  - `docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.json`
  - `docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.stderr` (empty)
- **Updated counts:** 239 errors, 166 warnings (405 total), delta vs baseline (2026-02-15): -16 errors / +0 warnings.
- **Validation evidence:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src --no-fix -f json > docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.json 2> docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.stderr || true`
  - Infra/noise grep: no matches in `docs/plans/_artifacts/brikette-eslint.2026-02-15.task-08.stderr`

### TASK-13: Remove `@typescript-eslint/no-explicit-any` errors in guide-seo hotspots (top offenders)
- **Type:** IMPLEMENT
- **Deliverable:** Replace `any` with concrete types (or `unknown` + narrowing) in the highest-error guide SEO rendering path(s) until `@typescript-eslint/no-explicit-any` errors drop materially.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderFallbackContent.tsx`, `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderPrimaryContent.tsx`, plus additional guide-seo files selected from the post-checkpoint ledger
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 70% - types may be under-specified; expect some discovery
  - Approach: 80% - prefer real types over `as any`; use `unknown` with guards where needed
  - Impact: 75% - affects SEO content rendering; verify via targeted tests
- **Acceptance:**
  - `@typescript-eslint/no-explicit-any` errors are eliminated for the selected batch.
  - No new `eslint-disable` directives are introduced to bypass `no-explicit-any`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): targeted guide/SEO tests:
    - `pnpm --filter @apps/brikette test -- --testPathPattern "guide-seo|guides" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `40319fd6bd`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src/routes/guides/guide-seo/components/generic-or-fallback/renderFallbackContent.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/routes/guides/guide-seo/components/generic-or-fallback/renderPrimaryContent.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "guide-seo|guides" --maxWorkers=2 --passWithNoTests` — PASS

### TASK-09: Fix DS/layout primitive errors in top-offender UI files
- **Type:** IMPLEMENT
- **Deliverable:** Code changes that eliminate DS/layout primitive errors in a targeted batch.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/assistance/layout.tsx`, `apps/brikette/src/components/footer/FooterNav.tsx`, `apps/brikette/src/app/[lang]/experiences/ExperienceFeatureSection.tsx`, plus additional files selected from the post-checkpoint ledger
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 82%
  - Implementation: 85% - replace banned patterns with allowed primitives/tokens
  - Approach: 80% - align with DS rules rather than silencing
  - Impact: 82% - localized UI changes; verify layout
- **Acceptance:**
  - Errors like `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, and `ds/no-raw-typography` are eliminated for the batch.
- **Validation contract:**
  - TC-01: Quote `[lang]` paths in eslint commands:
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/assistance/layout.tsx" --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperienceFeatureSection.tsx" --no-fix --max-warnings=0`
  - TC-02: `pnpm --filter @apps/brikette exec eslint src/components/footer/FooterNav.tsx --no-fix --max-warnings=0`
  - TC-03 (best-effort): targeted tests for touched areas:
    - `pnpm --filter @apps/brikette test -- --testPathPattern "assistance|footer|experiences" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `8c999689ea`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/assistance/layout.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/components/footer/FooterNav.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperienceFeatureSection.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "assistance|footer|experiences" --maxWorkers=2 --passWithNoTests` — PASS

### TASK-10: Remove ds/no-hardcoded-copy errors using Brikette locales strategy
- **Type:** IMPLEMENT
- **Status:** Superseded (2026-02-15) — decomposed into `TASK-19` (strategy) + `TASK-20` (implementation batch).
- **Deliverable:** Code + locale updates that eliminate hardcoded copy errors.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/locales/**`, plus code files from the post-checkpoint ledger that fail `ds/no-hardcoded-copy`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 78%
  - Implementation: 80% - replace literals with `t()` keys and add keys to locale JSON
  - Approach: 75% - align with Brikette-local locale storage; avoid writing to `packages/i18n`
  - Impact: 78% - user-visible copy; translation hygiene required
- **Copy strategy (explicit):**
  - Add new keys to `apps/brikette/src/locales/en/**`.
  - For non-English locales, rely on i18next fallback to `en` unless an existing coverage check requires explicit keys. If coverage checks fail, extend the task scope to add keys (or stubs) to required locales.
- **Acceptance:**
  - `ds/no-hardcoded-copy` errors are eliminated for the selected batch.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02 (best-effort): targeted i18n/locale tests:
    - `pnpm --filter @apps/brikette test -- --testPathPattern "i18n|locale|translation|copy" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-11: Drive warning count to zero (restricted imports, tap size, migration-test security warnings)
- **Type:** IMPLEMENT
- **Status:** Superseded (2026-02-15) — decomposed into `TASK-21..TASK-25` (+ `TASK-23` for security warnings).
- **Deliverable:** Warning remediation so `--max-warnings=0` is feasible.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** Brikette files from the post-checkpoint ledger; `eslint.config.mjs` (only for narrowly-scoped overrides if necessary)
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 70%
  - Implementation: 80% - warnings can be addressed in batches, but volume/UX sensitivity is unknown until ledger
  - Approach: 65% - must avoid broad rule weakening; overrides must be narrow and justified
  - Impact: 70% - may touch lint config; verify it does not affect other apps
- **Acceptance:**
  - Restricted-import warnings (for example, `@acme/ui/atoms/CfImage`) are eliminated by migrating imports to supported entrypoints (preferred) or by a narrowly-scoped exception justified in-plan (only if no safe entrypoint exists).
  - `security/detect-non-literal-fs-filename` warnings in Brikette migration tests are addressed via the narrowest correct method (prefer a scoped config override over inline disables).
  - `ds/min-tap-size` warnings are resolved (required for `--max-warnings=0`).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` warning count decreases toward zero; delta recorded.
  - TC-02 (if `eslint.config.mjs` changes): lint the config file itself to catch syntax/scope mistakes:
    - `pnpm exec eslint eslint.config.mjs --no-fix --max-warnings=0`
  - TC-03 (best-effort): targeted migration/test warnings:
    - `pnpm --filter @apps/brikette test -- --testPathPattern "migration|machine-docs-contract|performance" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: apply warning fixes in small batches; keep overrides scoped to Brikette.
  - Rollback: revert scoped overrides if they impact other apps.
- **Documentation impact:** None

### TASK-12: Re-enable `@apps/brikette` lint script (strict) + final validation
- **Type:** IMPLEMENT
- **Deliverable:** Package script change; lint is enabled and green.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/package.json`
- **Depends on:** TASK-09, TASK-14, TASK-15, TASK-16, TASK-17, TASK-18, TASK-20, TASK-22, TASK-23, TASK-24, TASK-25, TASK-30, TASK-31, TASK-27, TASK-28 (+ TASK-03 if applicable)
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - swap the script once strict lint is green
  - Approach: 85% - align the script with the goal command (`eslint src --max-warnings=0`) and repo conventions
  - Impact: 85% - package-scoped; should not change root lint behavior beyond making Brikette lint real again
- **Acceptance:**
  - `apps/brikette/package.json` `lint` is a real eslint invocation and passes.
  - `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette lint` passes.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: use a strict command aligned with goals, for example:
    - `eslint src --cache --cache-location .eslintcache --max-warnings=0`
  - Rollback: revert the script change only if CI is blocked; do not leave it disabled long-term.
- **Documentation impact:** None

### TASK-14: Fix remaining `ds/container-widths-only-at` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** DS/container compliance changes that eliminate `ds/container-widths-only-at` errors in the remaining offender set.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/experiences/ExperiencesCtaSection.tsx`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 90% - prior DS/layout tranche (TASK-09) established patterns for this repo
  - Approach: 85% - replace raw max-width classes with DS container primitives where required
  - Impact: 85% - localized layout changes; validate key routes render
- **Acceptance:**
  - `ds/container-widths-only-at` errors are eliminated for the file in `Affects`.
  - No new `eslint-disable` directives are introduced for DS/layout rules.
- **Validation contract:**
  - TC-01: File-scoped eslint passes (with `--max-warnings=0`), quoting `[lang]`:
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperiencesCtaSection.tsx" --no-fix --max-warnings=0`
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): targeted tests:
    - `pnpm --filter @apps/brikette test -- --testPathPattern \"experiences\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `dc68819502`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperiencesCtaSection.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "experiences" --maxWorkers=2 --passWithNoTests` — PASS

### TASK-15: Fix remaining `ds/enforce-layout-primitives` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Replace remaining non-DS layout primitives in the offender set until `ds/enforce-layout-primitives` errors are eliminated.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/app/page.tsx` *(has `ds/no-hardcoded-copy` error; defer until TASK-20)*
  - `apps/brikette/src/routes/how-to-get-here/_galleries.tsx`
  - `apps/brikette/src/routes/how-to-get-here/sections.tsx`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 90% - typically mechanical replacement with DS `Grid`/`Stack` primitives
  - Approach: 85% - keep semantics/layout unchanged; avoid new disables
  - Impact: 80% - visible layout; validate route-level smoke tests
- **Acceptance:**
  - `ds/enforce-layout-primitives` errors are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`), quoting `[lang]` paths:
    - `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperiencesCtaSection.tsx" --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint src/app/page.tsx --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint src/routes/how-to-get-here/_galleries.tsx --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint src/routes/how-to-get-here/sections.tsx --no-fix --max-warnings=0`
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"experiences|how-to-get-here\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-16: Fix remaining react-hooks error rules + `max-depth` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Code refactors that eliminate remaining `react-hooks/rules-of-hooks`, `react-hooks/error-boundaries`, and `max-depth` errors.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/components/assistance/quick-links-section/index.tsx` (react-hooks/rules-of-hooks)
  - `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualString.tsx` (react-hooks/error-boundaries)
  - `apps/brikette/src/routes/guides/guide-seo/components/structured-toc/StructuredTocFaqSection.tsx` (react-hooks/error-boundaries)
  - `apps/brikette/src/routes/guides/guide-seo/meta-resolution/descriptionResolver.ts` (max-depth)
  - `apps/brikette/src/routes/guides/guide-seo/components/generic/fallbackDetection.ts` (max-depth)
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 80%
  - Implementation: 80% - hooks fixes can require small component reshapes
  - Approach: 80% - keep behavior stable; remove rule violations rather than disabling rules
  - Impact: 80% - assistance + SEO paths; validate via targeted tests and typecheck
- **Acceptance:**
  - All listed error rules are eliminated for the files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"assistance|guide-seo|guides\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-17: Fix remaining `max-lines-per-function` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Refactors that bring remaining offender functions under the configured `max-lines-per-function` threshold without changing runtime behavior.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/components/guides/generic-content/buildContent.ts`
  - `apps/brikette/src/routes/guides/guide-seo/components/FaqStructuredDataBlock.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualObject.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/translations.ts`
  - `apps/brikette/src/routes/guides/guide-seo/useGuideContent.ts`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 82%
  - Implementation: 80% - refactor-only; may require helper extraction
  - Approach: 85% - prior max-lines remediation (TASK-07) established safe patterns
  - Impact: 82% - guide rendering; validate via targeted tests
- **Acceptance:**
  - `max-lines-per-function` errors are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"guide-seo|guides\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-18: Fix remaining `@typescript-eslint/no-unused-vars` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Mechanical cleanup that removes remaining unused vars without changing behavior.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/components/guides/GuideCollectionWithSearch.tsx`
  - `apps/brikette/src/lib/seo-audit/index.ts`
  - `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderStructuredFallback.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/utils/fallbacks.ts`
  - `apps/brikette/src/routes/how-to-get-here/transformRouteToGuide.ts`
  - `apps/brikette/src/test/utils/detectRenderedI18nPlaceholders.ts`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 95% - straightforward edits
  - Approach: 90% - prefer removing dead code; keep semantics
  - Impact: 85% - low risk; validate with typecheck + targeted tests
- **Acceptance:**
  - `@typescript-eslint/no-unused-vars` errors are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"guide-seo|guides|how-to-get-here|i18n\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-19: i18n/copy strategy check (coverage/parity tests + locale policy)
- **Type:** INVESTIGATE
- **Deliverable:** A documented decision (in this plan) for how ds/no-hardcoded-copy remediations should add keys across locales without breaking i18n coverage/parity checks.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`, `[readonly] apps/brikette/src/test/content-readiness/i18n/**`, `[readonly] apps/brikette/src/locales/**`, `[readonly] apps/brikette/src/i18n.ts`
- **Depends on:** TASK-08
- **Blocks:** TASK-20, TASK-29
- **Confidence:** 90%
  - Implementation: 90% - static audit of tests/scripts + a single targeted jest run if needed
  - Approach: 90% - pick the narrowest strategy that keeps parity checks happy
  - Impact: 90% - no code changes; output is decision-quality
- **Acceptance:**
  - The plan explicitly states which locales must receive new keys when remediating hardcoded copy (all supported locales vs fallback allowed), and why.
  - The plan explicitly calls out which tests/scripts enforce the policy (or confirms they are warn-only in default runs).
- **Validation contract:**
  - TC-01: Identify enforcement points by reading:
    - `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`
    - `apps/brikette/src/test/content-readiness/i18n/i18n-render-audit.test.ts`
    - `apps/brikette/src/test/content-readiness/i18n/check-i18n-coverage.test.ts`
  - TC-02 (optional): run a targeted jest subset to confirm default strictness:
    - `pnpm --filter @apps/brikette test -- --testPathPattern \"i18n-parity-quality-audit|i18n-render-audit|check-i18n-coverage\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Decision (locale policy):**
  - Brikette uses `fallbackLng: "en"` (see `apps/brikette/src/i18n.config.ts`).
  - For UI copy remediations: add new keys to `apps/brikette/src/locales/en/**` and rely on i18next fallback for other locales.
  - Rationale: Brikette's i18n content readiness checks are warn-only by default and only become failing in strict mode when env vars are set (for example `CONTENT_READINESS_MODE=fail`, `I18N_MISSING_KEYS_MODE=fail`, `I18N_PARITY_MODE=fail`, `ENGLISH_FALLBACK_MODE=fail`). This keeps remediation work small and avoids creating “English duplicates” across non-en locales.
- **Validation evidence:**
  - Read: `apps/brikette/src/i18n.config.ts`, `apps/brikette/package.json`, `apps/brikette/src/test/content-readiness/i18n/*`, `apps/brikette/src/locales/__tests__/english-fallback.test.ts`
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "i18n-parity-quality-audit|i18n-render-audit|check-i18n-coverage" --maxWorkers=2 --passWithNoTests` — PASS

### TASK-20: Remove `ds/no-hardcoded-copy` errors in redirect stubs (cookie-policy, privacy-policy)
- **Type:** IMPLEMENT
- **Deliverable:** Redirect fallback pages comply with lint by removing hardcoded UI copy and using container primitives correctly.
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/app/cookie-policy/page.tsx`
  - `apps/brikette/src/app/privacy-policy/page.tsx`
- **Depends on:** TASK-19
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 90% - small, localized change
  - Approach: 85% - remove/avoid hardcoded UI strings in redirect fallbacks
  - Impact: 80% - redirect behavior must remain correct
- **Acceptance:**
  - `ds/no-hardcoded-copy` errors are eliminated for both redirect pages in `Affects`.
  - `ds/container-widths-only-at` errors are eliminated for both redirect pages in `Affects`.
  - Redirect behavior remains unchanged (immediate redirect + noscript fallback).
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`):
    - `pnpm --filter @apps/brikette exec eslint src/app/cookie-policy/page.tsx --no-fix --max-warnings=0`
    - `pnpm --filter @apps/brikette exec eslint src/app/privacy-policy/page.tsx --no-fix --max-warnings=0`
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `72ce9b0fea`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint src/app/cookie-policy/page.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/app/privacy-policy/page.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS

### TASK-29: Remove remaining `ds/no-hardcoded-copy` errors (and as many warnings as feasible)
- **Type:** IMPLEMENT
- **Deliverable:** Copy localization changes that eliminate remaining `ds/no-hardcoded-copy` errors (and reduce warnings materially).
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/locales/**` plus the remaining offender files identified in the post-task-13-09 ledger:
  - `apps/brikette/src/routes/how-to-get-here/briketteToFerryDock/_articleLead.tsx`
  - `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx`
  - `apps/brikette/src/components/assistance/quick-links-section/index.tsx`
  - `apps/brikette/src/app/[lang]/experiences/ExperiencesHero.tsx`
  - `apps/brikette/src/app/page.tsx`
  - `apps/brikette/src/components/guides/GuideCollectionWithSearch.tsx`
  - `apps/brikette/src/components/guides/GuideSearchBar.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/components/StructuredTocBlock.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/components/structured-toc/StructuredTocSections.tsx`
- **Depends on:** TASK-19
- **Blocks:** TASK-12
- **Confidence:** 74% (→ 82% conditional on TASK-19)
  - Implementation: 80% - replace literals with `t()` keys and add keys to locale JSON
  - Approach: 75% - locale policy is now fixed by TASK-19; remaining uncertainty is batch size/churn
  - Impact: 74% - user-visible copy across many pages; keep diffs small and validate with tests
- **Acceptance:**
  - `ds/no-hardcoded-copy` errors are eliminated for the selected batch; repeat in follow-up batches until `ds/no-hardcoded-copy` is 0 for Brikette.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`), quoting `[lang]` paths.
  - TC-02: Targeted i18n tests:
    - `pnpm --filter @apps/brikette test -- --testPathPattern \"i18n\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-21: Restricted-imports audit (verify supported entrypoints + migration map)
- **Type:** INVESTIGATE
- **Deliverable:** A migration map (in this plan) for each `no-restricted-imports` offender: what supported import to switch to, or what repo change is required if no supported entrypoint exists.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`, `[readonly] eslint.config.mjs`, `[readonly] apps/brikette/src/**/*`, `[readonly] packages/ui/**/*` (if present)
- **Depends on:** TASK-08
- **Blocks:** TASK-22
- **Confidence:** 85%
- **Acceptance:**
  - For each offender, the plan records the replacement import (or explicitly flags “no supported entrypoint; requires follow-up decision”).
- **Validation contract:**
  - TC-01: Confirm which rule(s)/patterns are restricted by reading `eslint.config.mjs`.
  - TC-02: Confirm whether restricted atoms (e.g. `CfImage`) have supported exports via `rg` in the relevant UI package(s).
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

### TASK-22: Eliminate `no-restricted-imports` warnings in Brikette
- **Type:** IMPLEMENT
- **Deliverable:** Import migrations that eliminate `no-restricted-imports` warnings in the offender set.
- **Execution-Skill:** lp-build
- **Affects:** Offender set from the post-task-13-09 ledger (19 warnings, 18 files) plus any shared helper files required by the migration.
- **Depends on:** TASK-21
- **Blocks:** TASK-12
- **Confidence:** 74% (→ 82% conditional on TASK-21)
- **Acceptance:**
  - `no-restricted-imports` warnings are eliminated for the offender set.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` warning count decreases and `no-restricted-imports` is 0.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-23: Remediate security warnings to reach `--max-warnings=0` (tests + seo-audit)
- **Type:** IMPLEMENT
- **Deliverable:** Warning remediation for `security/*` rules so strict lint can pass.
- **Execution-Skill:** lp-build
- **Affects:** Offender set from the post-task-13-09 ledger, including:
  - `apps/brikette/src/test/**`
  - `apps/brikette/src/lib/seo-audit/index.ts`
  - `apps/brikette/src/routes/how-to-get-here/transformRouteToGuide.ts`
  - `apps/brikette/src/locales/locale-loader.guides.ts`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 78%
  - Implementation: 80% - tests can often be updated to use literal paths/regexes or narrowly justified disables
  - Approach: 75% - must avoid broad rule weakening; overrides (if used) must be extremely narrow
  - Impact: 78% - touches tests and a few runtime paths; verify test behavior
- **Acceptance:**
  - `security/*` warnings are eliminated (or reduced to 0 via the narrowest correct mechanism) without weakening the rule globally.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` shows 0 `security/*` warnings.
  - TC-02 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"migration|content-readiness|machine-docs-contract|seo-audit\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-24: Fix `ds/min-tap-size` warnings (apartment tranche + SkipLink)
- **Type:** IMPLEMENT
- **Deliverable:** UI changes that eliminate `ds/min-tap-size` warnings in a low-coupling offender subset.
- **Execution-Skill:** lp-build
- **Affects:**
  - `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx`
  - `apps/brikette/src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx`
  - `apps/brikette/src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx`
  - `apps/brikette/src/components/common/SkipLink.tsx`
- **Depends on:** TASK-14
- **Blocks:** TASK-12
- **Confidence:** 82%
- **Acceptance:**
  - `ds/min-tap-size` warnings are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`), quoting `[lang]` paths.
  - TC-02 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern "apartment|skip" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `5cf98e360b`
- **Notes:**
  - Brikette tap-size minimum is configured as `min: 44` in `eslint.config.mjs` for Brikette scope (so `min-h-11 min-w-11` is required; `-10` is insufficient).
  - `SkipLink` is `sr-only` by default; `ds/min-tap-size` is a false-positive in the hidden state. A narrowly-scoped disable was applied for the hidden state with a TTL.
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/apartment/ApartmentPageContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/apartment/private-stay/PrivateStayContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/apartment/street-level-arrival/StreetLevelArrivalContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette exec eslint src/components/common/SkipLink.tsx --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "ApartmentStructureAndLinks" --maxWorkers=2` — PASS

### TASK-30: ExperiencesHero lint remediation (tap-size + coupled warnings)
- **Type:** IMPLEMENT
- **Deliverable:** Reduce blocker findings in `ExperiencesHero` so strict lint can progress (tap-size plus any directly coupled warnings/errors that prevent isolated fixes).
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/experiences/ExperiencesHero.tsx`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 78%
  - Implementation: 80% - single-file remediation, but multiple rule families may be present
  - Approach: 75% - fix violations rather than disabling; only use narrowly-scoped disables when truly unavoidable
  - Impact: 78% - user-visible hero; validate via targeted tests/typecheck
- **Acceptance:**
  - `ds/min-tap-size` warnings in `ExperiencesHero` are eliminated.
  - Any additional warnings/errors in `ExperiencesHero` that block a clean file-scoped lint run are eliminated or explicitly routed to the owning tranche task (copy, restricted imports, DS/layout) with a plan note.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/experiences/ExperiencesHero.tsx" --no-fix --max-warnings=0` passes.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern "experiences" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-31: HowToGetHereIndexContent warnings (tap-size + unsafe-regex)
- **Type:** IMPLEMENT
- **Deliverable:** Eliminate the warning set in `HowToGetHereIndexContent` needed for `--max-warnings=0`.
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 85% - localized changes
  - Approach: 85% - fix warning root causes; do not globally weaken `security/*` rules
  - Impact: 85% - user-visible page; validate quickly
- **Acceptance:**
  - `security/detect-unsafe-regex` warning is eliminated in the file.
  - `ds/min-tap-size` warning is eliminated in the file.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx" --no-fix --max-warnings=0` passes.
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern "how-to-get-here" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** `117e191493`
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette exec eslint "src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx" --no-fix --max-warnings=0` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern "how-to-get-here" --maxWorkers=2 --passWithNoTests` — PASS

### TASK-25: Fix remaining a11y/Next/react-hooks warnings (alt-text, no-img-element, exhaustive-deps)
- **Type:** IMPLEMENT
- **Deliverable:** Warning remediation for the remaining small warning set so strict lint can pass.
- **Execution-Skill:** lp-build
- **Affects:** Offender set from the post-task-13-09 ledger:
  - `apps/brikette/src/test/components/careers-hero.test.tsx` (`jsx-a11y/alt-text`)
  - `apps/brikette/src/test/components/guide-collection-card.test.tsx` (`jsx-a11y/alt-text`)
  - `apps/brikette/src/components/landing/LocationMiniBlock.tsx` (`@next/next/no-img-element`)
  - `apps/brikette/src/components/guides/GuideCollectionCard.tsx` (`react-hooks/exhaustive-deps`)
  - `apps/brikette/src/context/modal/global-modals/LanguageModal.tsx` (`react-hooks/exhaustive-deps`)
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (`react-hooks/exhaustive-deps`)
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 85%
- **Acceptance:**
  - The listed warnings are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes (if any TS/React changes).
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-26: `no-explicit-any` remaining offenders: type strategy + call-site map
- **Type:** INVESTIGATE
- **Deliverable:** A call-site map and type strategy that makes the remaining `no-explicit-any` offender set implementable without “spray unknown everywhere” regressions.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`, `[readonly] apps/brikette/src/routes/guides/guide-seo/**`, `[readonly] apps/brikette/src/routes/how-to-get-here/**`, `[readonly] apps/brikette/src/lib/seo-audit/**`
- **Depends on:** TASK-08
- **Blocks:** TASK-27
- **Confidence:** 85%
- **Acceptance:**
  - The plan records, per offender file, what concrete types or narrowing strategy will replace `any`.
- **Validation contract:**
  - TC-01: Identify remaining offender files and confirm their `any` surfaces via `eslint` output (ledger) + local file reads.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

### TASK-27: Remove remaining `@typescript-eslint/no-explicit-any` errors (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Type remediations that eliminate the remaining `@typescript-eslint/no-explicit-any` errors (59 errors across 9 files in the post-task-13-09 ledger).
- **Execution-Skill:** lp-build
- **Affects:** Remaining offender set (post-task-13-09 ledger):
  - `apps/brikette/src/routes/guides/guide-seo/components/fallback/renderAliasFaqsOnly.tsx`
  - `apps/brikette/src/routes/how-to-get-here/transformRouteToGuide.ts`
  - `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderStructuredFallback.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/components/generic-or-fallback/renderGenericFastPaths.tsx`
  - `apps/brikette/src/routes/guides/guide-seo/template/useAdditionalScripts.tsx`
  - `apps/brikette/src/lib/seo-audit/index.ts`
  - `apps/brikette/src/routes/guides/guide-seo/template/useStructuredFallbackState.ts`
  - `apps/brikette/src/routes/guides/guide-seo/template/resolveShouldRenderGenericContent.ts`
  - `apps/brikette/src/routes/guides/guide-seo/template/useGuideTocOptions.ts`
- **Depends on:** TASK-26
- **Blocks:** TASK-12
- **Confidence:** 74% (→ 82% conditional on TASK-26)
- **Acceptance:**
  - `@typescript-eslint/no-explicit-any` errors are eliminated for all files in `Affects`.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"guide-seo|guides|how-to-get-here|seo-audit\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

### TASK-28: Reduce remaining `complexity` errors to configured thresholds (post-task-13-09 ledger)
- **Type:** IMPLEMENT
- **Deliverable:** Refactors that bring remaining `complexity` offenders under the configured threshold, prioritising the multi-count hotspots.
- **Execution-Skill:** lp-build
- **Affects:** Remaining offender set (post-task-13-09 ledger; 40 errors across 36 files), starting with:
  - `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx` (3)
  - `apps/brikette/src/routes/guides/guide-seo/components/generic/translatorWrapper.ts` (2)
  - `apps/brikette/src/routes/guides/guide-seo/toc.ts` (2)
  - plus long-tail singletons listed in the ledger
- **Depends on:** TASK-08
- **Blocks:** TASK-12
- **Confidence:** 74%
  - Implementation: 75% - long-tail breadth likely requires iterative decomposition
  - Approach: 75% - keep diffs small and behavior-preserving; avoid rule disables
  - Impact: 74% - touches SEO rendering paths; validate with targeted tests
- **Acceptance:**
  - `complexity` errors are eliminated for the selected batch. Continue in follow-up batches until `complexity` is 0 for Brikette.
- **Validation contract:**
  - TC-01: File-scoped eslint passes for each changed file (with `--max-warnings=0`).
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes.
  - TC-03 (best-effort): `pnpm --filter @apps/brikette test -- --testPathPattern \"guide-seo|guides\" --maxWorkers=2 --passWithNoTests`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** N/A
- **Documentation impact:** None

## Risks & Mitigations
- Risk: Sequencing based on preselected refactors wastes time.
  - Mitigation: TASK-02 sequencing gate is mandatory after the ledger.
- Risk: Infra/noise warnings block strict lint after lots of remediation.
  - Mitigation: TASK-01 makes infra/noise detection explicit; TASK-03 is a tracked deliverable when needed.
- Risk: Strict `--max-warnings=0` fails late because warnings were deferred.
  - Mitigation: TASK-01 explicitly splits warnings by class; TASK-11 is treated as a primary track.
- Risk: Lint debt grows while lint is disabled.
  - Mitigation: drift guardrail policy (see "Lint Drift Guardrail" section); consider baseline-cap or changed-files lint if drift becomes a problem.

## Pending Audit Work
- Confirm sequencing changes needed based on the ledger distribution (TASK-02).
- Decide whether TASK-03 should be marked N/A (ledger suggests infra/noise is absent).

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- [ ] `pnpm --filter @apps/brikette lint` passes with a real eslint invocation.
- [ ] All commands in this plan are runnable (quoted `[lang]` paths).
- [ ] Copy/localization changes land in `apps/brikette/src/locales/**` and are wired through `useTranslation`.

## Decision Log
- 2026-02-15: Revised plan based on execution hazards: added explicit sequencing gate (TASK-02), explicit infra/noise task (TASK-03), and fixed command footguns for `[lang]` paths.
