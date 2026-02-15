---
Type: Plan
Status: Draft
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

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build lint ledger (errors + warnings + infra noise) | 95% | S | Pending | - | TASK-02 |
| TASK-02 | CHECKPOINT | Sequencing gate: replan tasks 3+ based on ledger distribution + set drift policy | 95% | S | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Fix TypeScript project-service wiring (no infra/noise warnings) (conditional) | 80% | M | Blocked | TASK-02 | TASK-12 (conditional) |
| TASK-04 | IMPLEMENT | Remove ds/require-disable-justification error in i18n types helper | 90% | S | Blocked | TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Mechanical cleanup tranche (unused vars, duplicates, import sorting) | 82% | M | Blocked | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Reduce complexity hotspots in i18n + SEO/head utilities (configured thresholds) | 80% | M | Blocked | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Refactor max-lines-per-function offenders (configured thresholds) | 80% | M | Blocked | TASK-06 | TASK-08 |
| TASK-08 | CHECKPOINT | Horizon checkpoint: rerun lint, replan remaining remediation batches | 95% | S | Blocked | TASK-07 | TASK-09, TASK-10, TASK-11 |
| TASK-09 | IMPLEMENT | Fix DS/layout primitive errors in top-offender UI files | 82% | M | Blocked | TASK-08 | TASK-12 |
| TASK-10 | IMPLEMENT | Remove ds/no-hardcoded-copy errors using Brikette locales strategy | 78% | M | Blocked | TASK-08 | TASK-12 |
| TASK-11 | IMPLEMENT | Drive warning count to zero (restricted imports, tap size, migration-test security warnings) | 70% | L | Blocked | TASK-08 | TASK-12 |
| TASK-12 | IMPLEMENT | Re-enable `@apps/brikette` lint script (strict) + final validation | 75% | S | Blocked | TASK-09, TASK-10, TASK-11 (+ TASK-03 if applicable) | - |

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
| 6 | TASK-09 + TASK-10 + TASK-11 | TASK-08 | Parallel siblings; each blocks TASK-12 |
| 7 | TASK-12 | TASK-09 + TASK-10 + TASK-11 (+ TASK-03 if applicable) | Enable strict lint last |

**Max parallelism:** 3 (post-checkpoint) | **Total tasks:** 12

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
- **Affects:** `[readonly] eslint.config.mjs`, `[readonly] apps/brikette/src/**/*`, `[readonly] apps/brikette/package.json`
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

### TASK-05: Mechanical cleanup tranche (unused vars, duplicates, import sorting)
- **Type:** IMPLEMENT
- **Deliverable:** Code changes that eliminate mechanical lint failures and reduce churn for later refactors.
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/components/guides/GuideCollectionWithSearch.tsx`, `apps/brikette/src/utils/loadI18nNs.ts` (import/no-duplicates portion), plus additional files selected from the TASK-01 ledger
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

### TASK-08: Horizon checkpoint: rerun lint, replan remaining remediation batches
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan for remaining remediation, driven by fresh ledger data after the first tranche.
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`
- **Depends on:** TASK-07
- **Blocks:** TASK-09, TASK-10, TASK-11
- **Confidence:** 95%
- **Acceptance:**
  - Rerun `pnpm --filter @apps/brikette exec eslint src --no-fix` and capture new counts.
  - Run `/lp-replan` on tasks after TASK-08 with updated evidence.
  - If tasks are split/added/removed, run `/lp-sequence` before continuing build.
- **Validation contract:**
  - TC-01: Updated counts and deltas are recorded in this plan.
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only

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

### TASK-10: Remove ds/no-hardcoded-copy errors using Brikette locales strategy
- **Type:** IMPLEMENT
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
- **Depends on:** TASK-09, TASK-10, TASK-11 (+ TASK-03 if applicable)
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 85% - swap the script once lint is green
  - Approach: 75% - command should match repo norms and goal commands
  - Impact: 75% - affects monorepo lint sweeps
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
- Produce the ledger and triage buckets (TASK-01).
- Confirm whether project-service warnings exist in current lint output (TASK-01) and whether TASK-03 is needed or can be N/A.

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- [ ] `pnpm --filter @apps/brikette lint` passes with a real eslint invocation.
- [ ] All commands in this plan are runnable (quoted `[lang]` paths).
- [ ] Copy/localization changes land in `apps/brikette/src/locales/**` and are wired through `useTranslation`.

## Decision Log
- 2026-02-15: Revised plan based on execution hazards: added explicit sequencing gate (TASK-02), explicit infra/noise task (TASK-03), and fixed command footguns for `[lang]` paths.

