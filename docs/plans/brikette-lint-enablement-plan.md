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
Overall-confidence: 72
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
---

# Brikette Lint Enablement Plan

## Summary
Re-enable automated linting for `@apps/brikette` by remediating the current ESLint error and warning backlog under `apps/brikette/src`, then replacing the package’s no-op `lint` script with a real eslint invocation.

Baseline as of **2026-02-15**:
- `pnpm --filter @apps/brikette exec eslint src --no-fix` reports **419 problems (254 errors, 165 warnings)**.
- Lint script is currently a no-op in `apps/brikette/package.json` (`echo 'Lint temporarily disabled...'`).

## Goals
- `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- `pnpm --filter @apps/brikette lint` is a real eslint invocation and passes.
- Brikette’s lint run is type-aware where intended, without “project service could not find file” noise.

## Non-goals
- Large-scale UX or product changes.
- Broad, repo-wide lint rule changes not justified by Brikette’s use case.

## Constraints & Assumptions
- Constraints:
  - The current backlog is large (254 errors / 165 warnings). The plan must be phased and checkpointed to avoid thrash.
  - Avoid “turning off” rules as a primary tactic. Exceptions must be scoped, justified, and only when the rule is genuinely inapplicable (e.g., security lint in filesystem-walking tests).
- Assumptions:
  - Brikette’s translation source of truth is under `apps/brikette/src/locales/**` (not `packages/i18n`).

## Existing System Notes
- Repo lint config: `eslint.config.mjs` (flat config, type-aware).
  - Apps are warned on direct imports from `@acme/ui/atoms/*` (e.g. `CfImage`). See `eslint.config.mjs` “Deprecate presentation imports from @acme/ui”.
  - Brikette has DS raw-tailwind-color enforcement enabled (errors/warnings vary by rule).
- Brikette lint script is currently disabled: `apps/brikette/package.json`.

## Proposed Approach
1. **Inventory first**: generate a stable lint ledger (top rules and top offending files) so remediation is measurable.
2. **Fix “structural” blockers early**: utility complexity hotspots and rule-justification violations that block broad progress.
3. **Batch remediation by class**: DS rules, copy localization, layout primitives, import sorting, then remaining warnings.
4. **Enable lint last**: only flip `apps/brikette`’s `lint` script once strict lint is green.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Build lint ledger (rules + top offending files) | 95% | S | Pending | - | TASK-02, TASK-07 |
| TASK-02 | IMPLEMENT | Remove ds/require-disable-justification violation by eliminating unsafe `Function` typing | 90% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Reduce complexity/import-no-duplicates in i18n loader utilities | 82% | M | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Reduce complexity hotspots in SEO/head utilities | 80% | M | Pending | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Refactor max-lines-per-function offenders in menu/content components | 80% | M | Pending | TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Horizon checkpoint: rerun lint, replan remaining remediation batches | 95% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Fix DS rule errors in top-offender UI files (layout primitives, container widths, typography) | 82% | M | Blocked | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Fix ds/no-hardcoded-copy errors in top-offender files + add translation keys | 78% ⚠️ | M | Blocked | TASK-06 | TASK-09 |
| TASK-09 | IMPLEMENT | Address warning backlog (security rules in filesystem tests, min tap size, restricted imports) | 70% ⚠️ | L | Blocked | TASK-06 | TASK-10 |
| TASK-10 | IMPLEMENT | Re-enable `@apps/brikette` lint script and validate strict lint in monorepo sweep | 75% ⚠️ | S | Blocked | TASK-07, TASK-08, TASK-09 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide
Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Establish the ledger and prioritize work |
| 2 | TASK-02 | TASK-01 | Small, surgical unblocks |
| 3 | TASK-03 | TASK-02 | Utility refactors |
| 4 | TASK-04 | TASK-03 | Utility refactors |
| 5 | TASK-05 | TASK-04 | UI refactors with regression risk |
| 6 | TASK-06 | TASK-05 | CHECKPOINT and replanning boundary |

**Max parallelism:** 1 | **Critical path:** Waves 1-6 | **Total tasks:** 10

## Tasks

### TASK-01: Build lint ledger (rules + top offending files)
- **Type:** INVESTIGATE
- **Deliverable:** Lint ledger section added to this plan (top rules, top offending files, prioritized batches)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `[readonly] eslint.config.mjs`, `[readonly] apps/brikette/src/**/*`, `[readonly] apps/brikette/package.json`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-07
- **Confidence:** 95%
  - Implementation: 95% — commands and inventory format are clear
  - Approach: 90% — inventory-first reduces thrash and rework
  - Impact: 95% — read-only evidence capture
- **Acceptance:**
  - Ledger includes total error/warn counts and at least top 10 rules by occurrence.
  - Ledger lists top 20 files by error count.
  - Ledger proposes concrete remediation batches (file lists per batch).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src --no-fix` output captured (counts + representative errors) → ledger updated.
  - TC-02: Ledger includes a deterministic rerun command set (no non-core formatters like `unix`) → rerun instructions work.
- **Execution plan:** Red → Green → Refactor
  - Red: run lint and confirm non-zero exit with errors/warnings
  - Green: produce ledger with prioritized batches
  - Refactor: tighten batches to be build-safe (explicit file lists)
- **Rollout / rollback:** N/A
- **Documentation impact:** This plan only.

### TASK-02: Remove ds/require-disable-justification violation by eliminating unsafe `Function` typing
- **Type:** IMPLEMENT
- **Deliverable:** Code change; lint no longer errors on `ds/require-disable-justification` in Brikette utils
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/utils/i18n-types.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — can replace `Function` with a safe callable type to avoid eslint-disable
  - Approach: 90% — remove the disable rather than adding a fake ticket
  - Impact: 90% — isolated helper file; type-level change
- **Acceptance:**
  - No `ds/require-disable-justification` errors in `apps/brikette/src/utils/i18n-types.ts`.
  - No behavior change for translator tagging in tests.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/utils/i18n-types.ts --no-fix --max-warnings=0` → PASS
  - TC-02: `pnpm --filter @apps/brikette test -- --testPathPattern \"i18n\" --maxWorkers=2` → PASS (or nearest existing i18n test subset)
- **Rollout / rollback:** N/A
- **Documentation impact:** None.

### TASK-03: Reduce complexity/import-no-duplicates in i18n loader utilities
- **Type:** IMPLEMENT
- **Deliverable:** Code change; complexity errors reduced under threshold; duplicate imports eliminated
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/utils/loadI18nNs.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 82%
  - Implementation: 85% — refactor into smaller helpers and remove duplicate imports
  - Approach: 80% — keep semantics; improve structure without changing API
  - Impact: 82% — used by app initialization; requires careful validation
- **Acceptance:**
  - `import/no-duplicates` errors are eliminated.
  - `complexity` is reduced to ≤20.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/utils/loadI18nNs.ts --no-fix --max-warnings=0` → PASS
  - TC-02: `pnpm --filter @apps/brikette typecheck` → PASS
  - TC-03: Targeted tests covering i18n init continue passing (`pnpm --filter @apps/brikette test -- --testPathPattern \"i18n|loadI18n\" --maxWorkers=2`)
- **Execution plan:** Red → Green → Refactor
  - Red: confirm `import/no-duplicates` and `complexity` failures via eslint on this file
  - Green: refactor into helpers until eslint passes
  - Refactor: simplify without changing behavior; keep tests passing
- **Planning validation:** (M-effort)
  - Checks run (2026-02-15): `pnpm --filter @apps/brikette exec eslint src/utils/loadI18nNs.ts --no-fix` — FAIL (expected: duplicate import + complexity)
- **Rollout / rollback:** N/A
- **Documentation impact:** None.
- **What would make this ≥90%:**
  - Add/extend a focused unit test for `loadI18nNs` behavior (namespaces loaded, fallbacks).

### TASK-04: Reduce complexity hotspots in SEO/head utilities
- **Type:** IMPLEMENT
- **Deliverable:** Code change; complexity errors reduced under threshold
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/utils/ensureGuideContent.ts`, `apps/brikette/src/utils/routeHead.ts`, `apps/brikette/src/utils/testHeadFallback.ts`, `apps/brikette/src/utils/tags/normalizers.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% — extraction into helpers is straightforward
  - Approach: 80% — keep contracts stable; prefer small pure helpers
  - Impact: 80% — SEO/head logic touches rendering and metadata; regressions possible
- **Acceptance:**
  - `complexity` lint errors for these utilities are eliminated (≤20).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/utils --no-fix --max-warnings=0` → PASS (for affected files)
  - TC-02: `pnpm --filter @apps/brikette test -- --testPathPattern \"routeHead|seo|guide\" --maxWorkers=2` → PASS (or nearest available subset)
  - TC-03: `pnpm --filter @apps/brikette typecheck` → PASS
- **Execution plan:** Red → Green → Refactor
  - Red: confirm complexity failures in each target file with file-scoped eslint runs
  - Green: extract helpers until complexity thresholds are met
  - Refactor: remove duplication and clarify naming while keeping validations green
- **Planning validation:** (M-effort)
  - Checks run (2026-02-15): `pnpm --filter @apps/brikette exec eslint src --no-fix` — FAIL (expected: complexity errors in listed utilities)
- **Rollout / rollback:** N/A
- **Documentation impact:** None.
- **What would make this ≥90%:**
  - Add/extend a test that asserts key route meta outputs for a representative route.

### TASK-05: Refactor max-lines-per-function offenders in menu/content components
- **Type:** IMPLEMENT
- **Deliverable:** Code change; max-lines-per-function errors eliminated
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/bar-menu/BarMenuContent.tsx`, `apps/brikette/src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx`, `apps/brikette/src/components/guides/GenericContent.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — split render helpers / subcomponents; keep props stable
  - Approach: 80% — reduce cyclomatic complexity and function length without altering output
  - Impact: 80% — UI regressions possible; requires verification
- **Acceptance:**
  - `max-lines-per-function` errors eliminated (≤200).
  - `GenericContent` complexity reduced to ≤20.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/app/[lang]/bar-menu/BarMenuContent.tsx --no-fix --max-warnings=0` → PASS
  - TC-02: `pnpm --filter @apps/brikette exec eslint src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx --no-fix --max-warnings=0` → PASS
  - TC-03: `pnpm --filter @apps/brikette exec eslint src/components/guides/GenericContent.tsx --no-fix --max-warnings=0` → PASS
  - TC-04: `pnpm --filter @apps/brikette typecheck` → PASS
- **Execution plan:** Red → Green → Refactor
  - Red: confirm max-lines-per-function / complexity failures via file-scoped eslint runs
  - Green: split into subcomponents/helpers until thresholds are met
  - Refactor: tighten types and naming; avoid logic changes
- **Planning validation:** (M-effort)
  - Checks run (2026-02-15): file-scoped eslint confirms:
    - `BarMenuContent` max-lines-per-function FAIL (313 > 200)
    - `BreakfastMenuContent` max-lines-per-function FAIL (227 > 200)
    - `GenericContent` max-lines-per-function + complexity FAIL
- **Rollout / rollback:** N/A
- **Documentation impact:** None.
- **What would make this ≥90%:**
  - Add a minimal render test per component (or snapshot) for one representative locale.

### TASK-06: Horizon checkpoint: rerun lint, replan remaining remediation batches
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan: remaining tasks re-scoped based on fresh ledger data
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/brikette-lint-enablement-plan.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 95%
- **Acceptance:**
  - Rerun `pnpm --filter @apps/brikette exec eslint src --no-fix` and capture new counts.
  - Run `/lp-replan` on tasks after this checkpoint with updated evidence.
  - If tasks are split/added/removed, run `/lp-sequence` before continuing build.
- **Validation contract:**
  - TC-01: Lint rerun count delta recorded in this plan → PASS (evidence present)
  - TC-02: `/lp-replan` applied to post-checkpoint tasks → PASS (plan updated)
- **Rollout / rollback:** N/A
- **Documentation impact:** Update this plan only.

### TASK-07: Fix DS rule errors in top-offender UI files (layout primitives, container widths, typography)
- **Type:** IMPLEMENT
- **Deliverable:** Code change; DS rule errors eliminated in selected files
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/app/[lang]/assistance/layout.tsx`, `apps/brikette/src/components/footer/FooterNav.tsx`, `apps/brikette/src/app/[lang]/experiences/ExperienceFeatureSection.tsx`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 85% — use existing Brikette container primitives (`Page`, local `Section`/`Container`) and DS layout primitives where required
  - Approach: 80% — align with DS rules (Grid/Stack/etc) rather than silencing
  - Impact: 82% — localized UI changes; verify layout
- **Acceptance:**
  - `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, and `ds/no-raw-typography` errors eliminated for these files.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/app/[lang]/assistance/layout.tsx --no-fix --max-warnings=0` → PASS
  - TC-02: `pnpm --filter @apps/brikette exec eslint src/components/footer/FooterNav.tsx --no-fix --max-warnings=0` → PASS
  - TC-03: `pnpm --filter @apps/brikette exec eslint src/app/[lang]/experiences/ExperienceFeatureSection.tsx --no-fix --max-warnings=0` → PASS
  - TC-04: `pnpm --filter @apps/brikette typecheck` → PASS
- **Execution plan:** Red → Green → Refactor
  - Red: confirm each DS rule violation via file-scoped eslint runs
  - Green: migrate to allowed primitives/tokens until eslint passes
  - Refactor: ensure layout/typography is still correct and minimal
- **Planning validation:** (M-effort)
  - Checks run (2026-02-15): file-scoped eslint confirms:
    - `ds/container-widths-only-at` failure in assistance layout
    - `ds/enforce-layout-primitives` failure in footer nav
    - `ds/no-raw-typography` failure in ExperienceFeatureSection
- **Rollout / rollback:** N/A
- **Documentation impact:** None.

### TASK-08: Fix ds/no-hardcoded-copy errors in top-offender files + add translation keys
- **Type:** IMPLEMENT
- **Deliverable:** Code + locale updates; hardcoded copy errors eliminated in selected files
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/src/components/guides/GuideCollectionWithSearch.tsx`, `apps/brikette/src/locales/en/**/*.json`, `apps/brikette/src/i18n.namespaces.ts` (as needed)
- **Depends on:** TASK-06
- **Blocks:** TASK-09
- **Confidence:** 78% ⚠️
  - Implementation: 80% — replace literals with `t()` and add keys
  - Approach: 75% — rule message references `packages/i18n`, but Brikette uses local locales; may require nuanced handling
  - Impact: 78% — touches user-facing copy; requires translation hygiene
- **Acceptance:**
  - `ds/no-hardcoded-copy` errors eliminated for selected files.
  - New keys added to Brikette locales and wired via `useTranslation`.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/components/guides/GuideCollectionWithSearch.tsx --no-fix --max-warnings=0` → PASS
  - TC-02: `pnpm --filter @apps/brikette test -- --testPathPattern \"i18n\" --maxWorkers=2` → PASS
- **Execution plan:** Red → Green → Refactor
  - Red: confirm `ds/no-hardcoded-copy` and related errors via file-scoped eslint runs
  - Green: move copy behind `t()` keys and update locale JSON
  - Refactor: ensure key names are stable and translation coverage checks remain green
- **Planning validation:** (M-effort)
  - Checks run (2026-02-15): file-scoped eslint confirms `ds/no-hardcoded-copy` error in `GuideCollectionWithSearch.tsx`.
- **Rollout / rollback:** N/A
- **Documentation impact:** None (no standing docs), but locale changes must be recorded in PR description.
- **What would make this ≥90%:**
  - Expand ledger to include all ds/no-hardcoded-copy offenders and batch them with explicit file lists (post-checkpoint).

### TASK-09: Address warning backlog (security rules in filesystem tests, min tap size, restricted imports)
- **Type:** IMPLEMENT
- **Deliverable:** ESLint warning counts reduced; warning classes addressed with correct scoping
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `eslint.config.mjs`, `apps/brikette/src/test/migration/no-legacy-guides-path.test.ts`, `apps/brikette/src/test/migration/no-shared-module-regressions.test.ts`, `apps/brikette/src/test/migration/url-inventory.test.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 70% ⚠️
  - Implementation: 80% — add a scoped override for security rule in filesystem-walking tests; fix small warning classes as they surface
  - Approach: 65% — remaining warnings include DS min-tap-size and restricted imports that may require broader UI tweaks
  - Impact: 70% — touches lint config; risk of affecting other scopes
- **Acceptance:**
  - `security/detect-non-literal-fs-filename` no longer emits warnings for Brikette migration tests, via a scoped lint config override.
  - Top warning classes are tracked in the ledger with an explicit plan.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette exec eslint src/test/migration --no-fix --max-warnings=0` → PASS (for affected rule(s))
  - TC-02: Root lint still parses and runs (`pnpm lint` remains viable once Brikette is re-enabled).
- **Execution plan:** Red → Green → Refactor
  - Red: confirm warning classes via scoped lint runs (tests, affected UI files)
  - Green: apply the narrowest correct fix (scoped config override for tests; tokenized sizing for UI)
  - Refactor: avoid weakening repo-wide rules; keep overrides scoped to Brikette
- **Planning validation:** (L-effort)
  - Checks run (2026-02-15): `pnpm --filter @apps/brikette exec eslint src --no-fix` tail confirms `security/detect-non-literal-fs-filename` warnings in migration tests.
- **Rollout / rollback:**
  - Rollout: add narrowly-scoped eslint config overrides (Brikette test-only) and fix warnings in batches.
  - Rollback: revert the scoped override block(s) if it impacts other scopes.
- **Documentation impact:** None.

### TASK-10: Re-enable `@apps/brikette` lint script and validate strict lint in monorepo sweep
- **Type:** IMPLEMENT
- **Deliverable:** Package script change; lint is enabled and green
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** lp-build
- **Affects:** `apps/brikette/package.json`
- **Depends on:** TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 75% ⚠️
  - Implementation: 85% — swap no-op for `eslint` invocation with `--max-warnings=0`
  - Approach: 75% — strictness depends on warning remediation completeness
  - Impact: 75% — affects repo-wide lint sweeps
- **Acceptance:**
  - `pnpm --filter @apps/brikette lint` passes.
  - `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/brikette lint` → PASS
  - TC-02: `pnpm --filter @apps/brikette typecheck` → PASS
- **Execution plan:** Red → Green → Refactor
  - Red: confirm lint script is currently a no-op and strict lint fails
  - Green: switch script to strict eslint once the backlog is cleared
  - Refactor: keep lint command consistent with repo norms (cache, max warnings, paths)
- **Planning validation:** (S-effort)
  - Checks run (2026-02-15): `apps/brikette/package.json` `lint` script is an informational no-op.
- **Rollout / rollback:**
  - Rollout: change `apps/brikette/package.json` `lint` script to `eslint \"src/**/*.{ts,tsx}\" --cache --cache-location .eslintcache --max-warnings=0` (or equivalent repo-standard command).
  - Rollback: revert to no-op `lint` script if CI is blocked (temporary; do not leave it long-term).
- **Documentation impact:** None.

## Risks & Mitigations
- Risk: Lint backlog is larger than the initial offender list.
  - Mitigation: TASK-01 ledger + CHECKPOINT + `/lp-replan` to avoid blind batching.
- Risk: Refactors for complexity/length introduce regressions.
  - Mitigation: Keep refactors extraction-only; run targeted tests; avoid semantic changes.

## Pending Audit Work
- Identify the top 20 error-producing files and top 10 rules by count (TASK-01).
- Determine whether restricted `@acme/ui/atoms/*` warnings should be eliminated by migrating imports, by publishing safe entrypoints, or by scoped overrides (post-checkpoint evidence).

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/brikette exec eslint src --no-fix --max-warnings=0` passes.
- [ ] `pnpm --filter @apps/brikette lint` passes with a real eslint invocation.
- [ ] Brikette’s translation changes land in `apps/brikette/src/locales/**` and are wired through `useTranslation`.

## Decision Log
- 2026-02-15: Plan converted to `/lp-plan` canonical format and checkpointed due to large lint backlog (254 errors / 165 warnings).
