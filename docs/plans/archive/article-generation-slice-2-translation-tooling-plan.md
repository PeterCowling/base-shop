---
Type: Plan
Status: Complete
Domain: Platform/i18n
Created: 2026-02-09
Last-updated: 2026-02-10 (closeout)
Last-reviewed: 2026-02-09
Relates-to charter: none
Feature-Slug: article-generation-slice-2-translation-tooling
Related-Fact-Find: docs/plans/article-generation-pipeline-fact-find.md
Parent-Plan: docs/plans/article-generation-pipeline-plan.md
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: re-plan, safe-commit-push-ci
Overall-confidence: 86%
Confidence-Method: weighted by task effort and execution readiness
Business-Unit: PLAT
---

# Article Generation Slice 2 Translation Tooling Plan

## Summary

Slice 2 extracts reusable translation/validation tooling from Brikette scripts into shared package utilities so guide translation can scale across shops without copying script logic. This plan converts the Slice 2 seeds from `docs/plans/article-generation-pipeline-plan.md` into buildable tasks.

## Goals

- Move duplicated JSON file traversal and content string extraction utilities into `@acme/guides-core`.
- Make guide content validation reusable through schema-injection rather than Brikette-only imports.
- Prepare translation workflows for cross-shop usage by reducing hardcoded locale/source assumptions.
- Keep all changes backward-compatible for Brikette scripts during migration.

## Non-goals

- CMS guide authoring UI or workflows (Slice 3).
- AI draft generation/orchestration (Slice 4).
- Replacing all Brikette translation scripts in one pass.
- Enabling `USE_CENTRAL_GUIDES` rollout decisions (handled in Slice 1 completion flow).

## Validation Foundation Check

Fact-find foundation from `docs/plans/article-generation-pipeline-fact-find.md` is usable for code-track planning:
- Test landscape present (frameworks, coverage, gaps, testability assessment).
- Execution track and deliverable are code-focused for this slice.
- Translation script inventory and extractability assessment are present.

Gap noted:
- Fact-find frontmatter does not yet include newer `Deliverable-Type`/`Execution-Track`/confidence input metadata fields; this plan derives them explicitly from confirmed Slice 2 scope.

## Existing System Notes

- Shared package target: `packages/guides-core/src/index.ts` currently exports URL helper utilities only.
- Duplicated utility patterns (`listJsonFiles`, `readJson`, `extractStringsFromContent`) appear in multiple scripts:
  - `apps/brikette/scripts/validate-guide-content.ts`
  - `apps/brikette/scripts/validate-guide-links.ts`
  - `apps/brikette/scripts/report-guide-coverage.ts`
  - `apps/brikette/scripts/check-i18n-coverage.ts`
- `apps/brikette/scripts/backfill-guides-from-en.ts` currently depends on `i18nConfig` and local locale directory assumptions.
- Script test coverage is minimal: only migration script tests currently exist under `scripts/__tests__/`.

## Active tasks

- S2-01: Extract shared JSON/content traversal utilities to `@acme/guides-core`. (Complete, 2026-02-09)
- S2-02: Adopt shared utilities in validation/report scripts. (Complete, 2026-02-09)
- S2-03: Extract schema-injected guide content validation runner. (Complete, 2026-02-09)
- S2-04: Generalize backfill script to remove Brikette runtime dependency. (Complete, 2026-02-09)
- S2-05: Rewrite translation runner into configurable engine. (Complete, 2026-02-09)
- S2-06: Add drift detection + schemaVersion migration support scaffolding. (Complete, 2026-02-09)
- S2-07: Implement translation drift manifest + check command. (Complete, 2026-02-10)
- S2-08: Implement guide content schema migration runner. (Complete, 2026-02-10)
- S2-09: Decide translation execution policy + provider contract for generic runner. (Complete, 2026-02-09)
- S2-10: Spike generic runner parity using mock provider and token fixtures. (Complete, 2026-02-09)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Build Gate |
|---|---|---|---:|---:|---|---|---|
| S2-01 | IMPLEMENT | Add `listJsonFiles`/`readJson`/`extractStringsFromContent` to `@acme/guides-core` with tests | 88% | M | Complete (2026-02-09) | - | Eligible |
| S2-02 | IMPLEMENT | Replace local utility copies in core Brikette scripts with shared package imports | 84% | M | Complete (2026-02-09) | S2-01 | Eligible |
| S2-03 | IMPLEMENT | Extract reusable validation runner with injected schema and path config | 83% | M | Complete (2026-02-09) | S2-02 | Eligible |
| S2-04 | IMPLEMENT | Refactor `backfill-guides-from-en.ts` to CLI-configurable locale sourcing | 82% | M | Complete (2026-02-09) | S2-01 | Eligible |
| S2-05 | IMPLEMENT | Rewrite `translate-guides.ts` to generic runner (`promptBuilder`, target config, token policy) | 83% | L | Complete (2026-02-09) | S2-01, S2-09, S2-10 | Eligible |
| S2-06 | INVESTIGATE | Define drift detection + schemaVersion migration contracts for Slice 2.5 | 78% | M | Complete (2026-02-09) | S2-02 | N/A |
| S2-07 | IMPLEMENT | Build translation drift manifest/check workflow for guide content and namespace files | 83% | M | Complete (2026-02-10) | S2-02, S2-06 | Eligible |
| S2-08 | IMPLEMENT | Build schemaVersion migration runner for guide content payloads | 81% | M | Complete (2026-02-10) | S2-01, S2-06 | Eligible |
| S2-09 | INVESTIGATE | Resolve translation execution policy and provider abstraction contract | 86% | S | Complete (2026-02-09) | S2-02 | N/A |
| S2-10 | SPIKE | Prove generic translation runner parity with fixture-driven mock provider | 82% | M | Complete (2026-02-09) | S2-09 | N/A |

## Tasks

### S2-01: Extract shared JSON/content traversal utilities to `@acme/guides-core`

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Affects:**
  - `packages/guides-core/src/index.ts`
  - `packages/guides-core/src/fsContent.ts` (new)
  - `packages/guides-core/__tests__/fsContent.test.ts` (new)
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — utility implementations already exist in multiple scripts.
  - Approach: 88% — additive package module + tests, no runtime behavior change in apps yet.
  - Impact: 86% — low blast radius, shared-package export surface change only.
- **Acceptance:**
  - `@acme/guides-core` exports async `listJsonFiles(rootDir, relativeDir?)` returning sorted relative paths.
  - `@acme/guides-core` exports async `readJson(filePath)` returning parsed JSON and surfacing parse errors.
  - `@acme/guides-core` exports `extractStringsFromContent(value)` recursively returning leaf strings.
  - New utilities preserve semantics currently used by Brikette script call sites.
- **Test contract:**
  - TC-01: nested directories return deterministic sorted JSON-relative paths.
  - TC-02: non-JSON files are excluded.
  - TC-03: `readJson` reads valid JSON and throws on invalid JSON.
  - TC-04: `extractStringsFromContent` collects strings from mixed arrays/objects and skips non-strings.
  - Run: `pnpm --filter @acme/guides-core test -- fsContent.test.ts`
- **Validation contract:**
  - package lint + targeted tests.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm --filter @acme/guides-core lint` — PASS (0 errors; 2 non-blocking `security/detect-non-literal-fs-filename` warnings on dynamic path utility functions)
  - Ran: `pnpm --filter @acme/guides-core build` — PASS
  - Ran: `pnpm --filter @acme/guides-core test -- packages/guides-core/__tests__/fsContent.test.ts` — PASS
- **Implementation notes:**
  - Added shared utility module `packages/guides-core/src/fsContent.ts`.
  - Exported `listJsonFiles`, `readJson`, and `extractStringsFromContent` from `packages/guides-core/src/index.ts`.
  - Added `packages/guides-core/__tests__/fsContent.test.ts` covering traversal ordering, JSON parsing, and recursive string extraction.

### S2-02: Adopt shared utilities in validation/report scripts

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Affects:**
  - `apps/brikette/scripts/validate-guide-content.ts`
  - `apps/brikette/scripts/validate-guide-links.ts`
  - `apps/brikette/scripts/report-guide-coverage.ts`
  - `apps/brikette/scripts/check-i18n-coverage.ts`
- **Depends on:** S2-01
- **Confidence:** 84%
- **Acceptance:**
  - Local duplicate utility functions are replaced with imports from `@acme/guides-core`.
  - Existing script CLI behavior remains unchanged.
  - Validation output for representative inputs remains equivalent.
- **Test contract:**
  - TC-01: `validate-guide-content.ts --locale=en --guides=rules` output remains valid.
  - TC-02: `report-guide-coverage.ts` runs with unchanged output schema.
  - TC-03: `check-i18n-coverage.ts` executes without import/runtime errors.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm exec tsx scripts/validate-guide-content.ts --locale=en --guides=rules` (from `apps/brikette`) — PASS
  - Ran: `pnpm exec tsx scripts/report-guide-coverage.ts --locale=en` (from `apps/brikette`) — PASS
  - Ran: `pnpm exec tsx scripts/check-i18n-coverage.ts --locales=it --json` (from `apps/brikette`) — PASS
  - Additional smoke: `pnpm exec tsx scripts/validate-guide-links.ts --locale=en --guides=rules` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette lint` — PASS (`lint` script is currently an informational no-op)
- **Implementation notes:**
  - Replaced duplicated local utility implementations with shared imports from `@acme/guides-core`.
  - Updated scripts:
    - `apps/brikette/scripts/validate-guide-content.ts`
    - `apps/brikette/scripts/validate-guide-links.ts`
    - `apps/brikette/scripts/report-guide-coverage.ts`
    - `apps/brikette/scripts/check-i18n-coverage.ts`
  - Removed now-redundant local helper functions (`listJsonFiles`, `readJson`, `extractStringsFromContent`) from these scripts.

### S2-03: Extract schema-injected guide content validation runner

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-02
- **Confidence:** 83%
  - Implementation: 84% — current `validate-guide-content.ts` logic is already isolated (file walk + schema parse + opt-out handling), requiring extraction not redesign.
  - Approach: 83% — `@acme/guides-core` now has shared FS utilities and package consumers; injection boundary (schema + locale list + root path) is clear.
  - Impact: 83% — primary consumer remains Brikette script; change can be rolled out behind CLI wrapper preserving existing command contract.
- **Acceptance:**
  - Add reusable validation runner in shared package (`@acme/guides-core`) that accepts:
    - schema validator (`safeParse` compatible),
    - content root path,
    - locale list,
    - optional guide key filter,
    - opt-out key handling.
  - `apps/brikette/scripts/validate-guide-content.ts` becomes a thin wrapper around the shared runner.
  - Existing CLI output semantics (`--verbose`, `--fail-on-violation`) remain unchanged.
- **Test contract:**
  - TC-01: valid fixture content across one locale returns `violations=0`.
  - TC-02: invalid fixture content returns deterministic violation entries.
  - TC-03: opt-out marker (`_schemaValidation=false`) skips schema failure for that file.
  - TC-04: guide filter only validates specified guide keys.
  - Test type: unit + script integration.
  - Test location: `packages/guides-core/__tests__/contentValidationRunner.test.ts` (new), plus script smoke on Brikette wrapper.
  - Run: `pnpm --filter @acme/guides-core test -- contentValidationRunner.test.ts` and `pnpm exec tsx scripts/validate-guide-content.ts --locale=en --guides=rules`.

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 79%
- **Updated confidence:** 83%
  - **Evidence class:** E2 (executable verification + static seam audit)
  - Executed: `pnpm exec tsx scripts/validate-guide-content.ts --locale=en --guides=rules --fail-on-violation` — PASS
  - Confirmed script seam after S2-02:
    - shared FS utilities now imported from `@acme/guides-core`,
    - Brikette-specific logic limited to schema + locale sourcing + output formatting.
  - Confidence promoted above gate because blocking unknown ("can this be extracted without behavior drift?") is now closed by runnable current behavior and clear extraction seam.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm --filter @acme/guides-core lint` — PASS (0 errors; non-blocking existing warnings)
  - Ran: `pnpm --filter @acme/guides-core build` — PASS
  - Ran: `pnpm --filter @acme/guides-core test -- packages/guides-core/__tests__/contentValidationRunner.test.ts` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette lint` — PASS (`lint` script is currently an informational no-op)
  - Ran: `pnpm exec tsx scripts/validate-guide-content.ts --locale=en --guides=rules` (from `apps/brikette`) — PASS
- **Implementation notes:**
  - Added reusable validator runner: `packages/guides-core/src/contentValidationRunner.ts`.
  - Added focused runner tests: `packages/guides-core/__tests__/contentValidationRunner.test.ts`.
  - Exported runner and related types from `packages/guides-core/src/index.ts`.
  - Refactored Brikette CLI wrapper to delegate to shared runner while keeping current flags and reporting behavior.

### S2-04: Generalize backfill script locale sourcing

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-01
- **Confidence:** 82%
- **Acceptance:**
  - `backfill-guides-from-en.ts` can run with explicit `--locales` input only, without importing app runtime locale config.
  - Existing default behavior preserved for Brikette via CLI defaults/config.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: S2-04 acceptance checks
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Ran: `pnpm exec eslint apps/brikette/scripts/backfill-guides-from-en.ts` — PASS
  - Ran: `pnpm exec tsx scripts/backfill-guides-from-en.ts --guides=rules --locales=it --dry-run` (from `apps/brikette`) — PASS
- **Implementation notes:**
  - Removed runtime dependency on `apps/brikette/src/i18n.config.ts`.
  - Default locale list now derives from `SUPPORTED_LANGUAGES` in `@acme/guide-system` (excluding `en`).
  - Added `--dry-run` mode for safe validation and planning without file mutation.
  - Preserved existing write behavior when not in dry-run mode.

### S2-05: Rewrite translation runner into configurable engine

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-01, S2-09, S2-10
- **Status:** Complete
- **Confidence:** 83%
  - Implementation: 83% — implemented generic batch runner with source/output path and locale/guide parameterization.
  - Approach: 83% — policy conflict resolved via S2-09 dual-mode contract (fixture default + explicit provider abstraction).
  - Impact: 83% — token preservation and JSON parse invariants enforced per locale via reusable runner contract.
- **Acceptance (post-precursor):**
  - Generic runner supports pluggable provider via interface (`translate({ text, locale, context })`).
  - Runner supports fixture/dry provider mode for deterministic CI validation without external services.
  - Token policy (`%LINK`, `%IMAGE`, `%COMPONENT`) enforced with explicit invariant checks.
  - Runner is configurable for source paths, guide selection, locales, and output root.
- **Test contract (post-precursor):**
  - TC-01: fixture provider translates deterministic payload and preserves JSON validity.
  - TC-02: token invariants fail fast when provider output mutates token ids.
  - TC-03: unchanged source + locale selection yields stable file writes (idempotent output).
  - TC-04: provider error surfaces actionable per-locale failure without aborting full batch.
  - TC-05: dry-run mode emits planned writes with zero file mutation.
  - Test type: integration + contract tests.
  - Test location: `apps/brikette/scripts/__tests__/translate-guides-runner.test.ts` (new) or shared runner tests in package.
  - Run: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translate-guides-runner.test.ts`.

#### Re-plan Update (2026-02-09)
- **Previous confidence:** 74%
- **Updated confidence:** 74% (→ 83% conditional on S2-09, S2-10)
  - **Evidence class:** E2 + E1
  - Executed: `pnpm exec tsx scripts/translate-guides.ts` (from `apps/brikette`) — hard-fails without `ANTHROPIC_API_KEY`.
  - Static conflict evidence:
    - `apps/brikette/scripts/translate-guides.ts` is API-key hardcoded.
    - `apps/brikette/scripts/README-translate-guides.md` documents "Do not obtain or use external API keys".
  - Decision: preserve blocked status and add formal precursors instead of forcing a confidence uplift.

#### Promotion Update (2026-02-09)
- **Previous confidence:** 74%
- **Updated confidence:** 83%
  - **Evidence class:** E2 (completed precursor implementation + executable parity tests)
  - S2-09 complete: canonical policy + provider contract documented in `apps/brikette/scripts/TRANSLATION_EXECUTION_POLICY.md`.
  - S2-10 complete: fixture-based runner spike implemented and validated with token/parse invariants.
  - Decision: task is now build-eligible.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Ran: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translate-guides-runner.test.ts scripts/__tests__/translate-guides-spike.test.ts` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/translate-guides.ts --provider=fixture --fixture-file=<tmp-fixture> --source-root=<tmp-locales> --output-root=<tmp-locales> --guides=demoGuide.json --locales=it --dry-run` — PASS
  - Ran: `pnpm --filter @apps/brikette typecheck` — PASS
  - Ran: `pnpm --filter @apps/brikette lint` — PASS (`lint` script is currently an informational no-op)
- **Implementation notes:**
  - Added reusable batch engine: `apps/brikette/scripts/lib/translate-guides-runner.ts`.
  - Added S2-05 contract tests: `apps/brikette/scripts/__tests__/translate-guides-runner.test.ts`.
  - Rewrote `apps/brikette/scripts/translate-guides.ts` to use pluggable provider mode (`fixture` default, `anthropic` opt-in), configurable source/output roots, locale/guide selection, and `--dry-run`/`--write`.
  - Updated policy/docs to reflect generic runner behavior and fixture-driven default workflow.

### S2-09: Decide translation execution policy + provider contract for generic runner

- **Type:** INVESTIGATE
- **Execution-Skill:** `re-plan`
- **Depends on:** S2-02
- **Confidence:** 86%
- **Acceptance:**
  - Resolve single canonical execution policy for Slice 2 translation runner (API-backed, in-house/manual, or dual-mode with explicit default).
  - Define provider interface contract and failure semantics.
  - Document security/compliance guardrails for translation execution in-script docs.
- **Validation contract:**
  - Evidence artifact in plan Decision Log with explicit command/runtime implications.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: S2-09 acceptance checks
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Added canonical policy and provider contract doc: `apps/brikette/scripts/TRANSLATION_EXECUTION_POLICY.md`.
  - Updated script-facing documentation to align with policy: `apps/brikette/scripts/README-translate-guides.md`.
  - Runtime implications captured with explicit commands in policy doc.
- **Decision:**
  - Selected dual-mode policy: fixture/mock provider as default; optional external provider mode as explicit opt-in.
  - Standardized provider contract input/output and error semantics (`provider_error`, `invalid_source_json`, `invalid_translated_json`, `token_invariant_mismatch`).

### S2-10: Spike generic translation runner parity using mock provider and token fixtures

- **Type:** SPIKE
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-09
- **Confidence:** 82%
- **Acceptance:**
  - Implement throwaway or guarded prototype runner that accepts a mock provider.
  - Run parity fixtures demonstrating token preservation and JSON structure integrity.
  - Produce measured output: pass/fail matrix for token + parse invariants across representative guides/locales.
- **Test contract:**
  - TC-01: fixture with `%LINK` tokens preserves `guideKey` ids.
  - TC-02: fixture with mixed `%IMAGE` and `%COMPONENT` tokens preserves non-translatable segments.
  - TC-03: malformed provider output fails parse and is reported.
  - Run: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translate-guides-spike.test.ts`.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Added guarded spike runner: `apps/brikette/scripts/lib/translation-runner-spike.ts`.
  - Added parity fixture tests: `apps/brikette/scripts/__tests__/translate-guides-spike.test.ts`.
  - Added parity matrix CLI: `apps/brikette/scripts/translate-guides-spike.ts`.
  - Added package script: `apps/brikette/package.json` -> `translate-guides:spike`.
  - Ran: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translate-guides-spike.test.ts` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/translate-guides-spike.ts` — PASS

### S2-06: Drift detection + schemaVersion migration support scaffolding

- **Type:** INVESTIGATE
- **Execution-Skill:** `re-plan`
- **Depends on:** S2-02
- **Confidence:** 78%
- **Deliverable:** follow-on implementation-ready tasks with explicit schema and CLI contracts.

#### Build Completion (2026-02-09)
- **Status:** Complete
- **Investigation summary:**
  - Drift handling is currently fragmented and manual (`apps/brikette/scripts/fix-i18n-drift-locales.ts` hardcodes locale/key patches).
  - Translation checks exist but do not persist source-hash lineage for deterministic stale detection (`apps/brikette/scripts/check-guides-translations.ts`).
  - `schemaVersion` exists in guide publication metadata (`packages/types/src/Guide.ts`) but guide content payloads lack a migration registry/runner.
- **Output handoff (new IMPLEMENT tasks):**
  - S2-07: translation drift manifest/check workflow.
  - S2-08: schemaVersion migration runner for guide content.
- **Recommended contracts:**
  - Drift manifest key: stable content hash of EN source + per-locale hash and timestamp metadata.
  - Migration runner contract: versioned transforms `vN -> vN+1` with dry-run diff report and invariant validation.

### S2-07: Implement translation drift manifest + check command

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-02, S2-06
- **Confidence:** 83%
- **Acceptance:**
  - Add drift-manifest generation command that records source hash and per-locale hash for each guide content file.
  - Add check command that reports stale locales when source hash changes without locale refresh.
  - Output format supports machine-readable JSON for CI/ops.
- **Test contract:**
  - TC-01: unchanged source/locale files produce zero stale entries.
  - TC-02: changing EN source marks all dependent locales stale.
  - TC-03: updating one locale clears staleness for that locale only.
  - TC-04: JSON output schema is stable and includes schemaVersion.

#### Build Completion (2026-02-10)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Added drift manifest generation/check commands:
    - `apps/brikette/scripts/generate-translation-drift-manifest.ts`
    - `apps/brikette/scripts/check-translation-drift-manifest.ts`
  - Added drift manifest logic and test suite:
    - `apps/brikette/scripts/lib/translation-drift-manifest.ts`
    - `apps/brikette/scripts/__tests__/translation-drift-manifest.test.ts`
  - Ran: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translation-drift-manifest.test.ts` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/generate-translation-drift-manifest.ts --locales=it,de --output=/tmp/translation-drift-manifest-test.json` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/check-translation-drift-manifest.ts --manifest=/tmp/translation-drift-manifest-test.json` — PASS
- **Implementation notes:**
  - Drift hashes now use canonical JSON hashing to avoid false-positive drift from key ordering.
  - Manifest/check reports include `schemaVersion` and stable summary fields for CI/ops consumers.

### S2-08: Implement guide content schema migration runner

- **Type:** IMPLEMENT
- **Execution-Skill:** `build-feature`
- **Depends on:** S2-01, S2-06
- **Confidence:** 81%
- **Acceptance:**
  - Add migration registry with explicit `fromVersion`/`toVersion` transforms.
  - Add CLI runner with `--from`, `--to`, and `--dry-run`.
  - Runner validates transformed output with `guideContentSchema`.
  - Runner provides rollback-ready report (files touched + before/after version counts).
- **Test contract:**
  - TC-01: dry-run reports candidate changes without writing files.
  - TC-02: live run updates versioned payloads and preserves JSON validity.
  - TC-03: unsupported version path fails with actionable error.
  - TC-04: idempotent re-run at target version produces zero changes.

#### Build Completion (2026-02-10)
- **Status:** Complete
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Validation:**
  - Added migration registry/runner module:
    - `apps/brikette/scripts/lib/guide-content-migrations.ts`
  - Added migration CLI:
    - `apps/brikette/scripts/migrate-guide-content-schema.ts`
  - Added migration tests:
    - `apps/brikette/scripts/__tests__/guide-content-migrations.test.ts`
  - Added package scripts:
    - `apps/brikette/package.json` -> `migrate-guide-content-schema`
  - Ran: `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/guide-content-migrations.test.ts` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/migrate-guide-content-schema.ts --locales-root=<tmp-locale-root> --locales=en --from=1 --to=2 --dry-run` — PASS
  - Ran: `pnpm --filter @apps/brikette exec tsx scripts/migrate-guide-content-schema.ts --locales-root=<tmp-locale-root> --locales=en --from=1 --to=2 --write` — PASS
- **Implementation notes:**
  - Migration registry is explicit and path-validated (`fromVersion`/`toVersion`).
  - Runner produces rollback-ready report metadata: touched files and before/after schemaVersion counts.
  - Transformed payloads are validated with `guideContentSchema` before write.

## Decision Points

| Condition | Action |
|---|---|
| Any IMPLEMENT task <80% | Run `/re-plan` for that task before build |
| S2-01 complete and validated | Proceed to S2-02 |
| S2-02 reveals shared utility API gaps | Update S2-01 API via additive patch + revalidate |
| S2-06 complete | Proceed to S2-07 and S2-08 |
| S2-09 + S2-10 complete | Promote S2-05 to build-eligible (83%) (completed 2026-02-09) |

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Shared utility behavior drift breaks scripts | Medium | Add focused package tests and preserve sorted path semantics |
| Scope creep into full translation engine rewrite | High | Keep S2-05 scoped to generic runner migration with fixture-first validation contract |
| Sparse script tests hide regressions | Medium | Add targeted script execution checks per task |
| Provider-policy mismatch causes rework | Medium | Resolved by S2-09 policy doc + contract; enforce via S2-10 fixture tests |

## Decision Log

- 2026-02-09: Slice 2 split into six tasks with only S2-01/S2-02/S2-04 currently build-eligible under confidence gate.
- 2026-02-09: S2-03 and S2-05 kept below gate intentionally pending deeper contract work (`/re-plan` required).
- 2026-02-09: Chosen to create a dedicated Slice 2 plan doc rather than overloading Slice 1 plan details.
- 2026-02-09: S2-01 completed with new `@acme/guides-core` file/content utility exports and focused tests.
- 2026-02-09: S2-02 completed; four Brikette scripts now consume shared file/content utilities from `@acme/guides-core`.
- 2026-02-09: S2-04 completed; backfill script no longer imports app runtime i18n config and now supports `--dry-run`.
- 2026-02-09: S2-06 completed; investigation created S2-07 (drift manifest/check) and S2-08 (schemaVersion migration runner) as implementation follow-ons.
- 2026-02-09 (re-plan): S2-03 promoted from 79% to 83% based on executable seam verification and is now build-eligible.
- 2026-02-09 (re-plan): S2-05 remains blocked at 74%; added S2-09 (policy decision) and S2-10 (parity spike) as formal precursors.
- 2026-02-09 (build): S2-03 completed with shared schema-injected validation runner extraction and wrapper-preserving CLI behavior.
- 2026-02-09 (build): S2-09 completed; adopted dual-mode policy (fixture default, explicit provider abstraction contract, guarded external mode).
- 2026-02-09 (build): S2-10 completed; fixture-driven spike runner and parity matrix validated token/JSON invariants.
- 2026-02-09 (build): S2-05 promoted to 83% and build-eligible after S2-09/S2-10 evidence.
- 2026-02-09 (build): S2-05 completed with generic translation batch runner, pluggable providers, dry-run/write modes, and contract tests.
- 2026-02-10 (build): S2-07 completed with drift manifest generation/check commands, canonical JSON hashing, and CI-ready machine-readable report output.
- 2026-02-10 (build): S2-08 completed with schemaVersion migration registry, dry-run/write CLI runner, and idempotence/unsupported-path validation coverage.
