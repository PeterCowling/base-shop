---
Type: Plan
Status: Active
Domain: CMS / UI / Platform
Relates-to charter: none
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: guide-system-improvements-phase2
Fact-Find: docs/plans/guide-system-improvements-fact-find.md
Phase-2-confidence: 90%
Phase-3-confidence: 80%
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Guide System Improvements — Phase 2 (Guardrails) + Phase 3 (Bigger Bets)


## Active tasks

No active tasks at this time.

## Summary

This plan keeps the **full breadth** of the guide-system improvements workstream, while making CI an **honest diagnostic**:

- **Phase 2** is “guardrails + operability”: bounded changes we can ship safely and validate quickly.
- **Phase 3** contains larger refactors/migrations that may still be worth doing, but require additional spikes/tests to become high-confidence.

### Phase 2 themes

- tighten and standardize validation (content schema + link tokens),
- surface “English fallback” clearly in authoring/preview,
- reduce block-authoring friction with safe scaffolding,
- add opt-in performance measurement for guide build/render hotspots.

### Phase 3 themes (preserved, not deleted)

- manifest TS → JSON,
- GuideSeoTemplate extraction for testability,
- general-purpose content migration tooling,
- optional dashboards/CI reporting once metrics and validators are stable.

## Notes on “CI”

In this document, **CI** means **Confidence Index** (plan confidence), not CI/CD.

The goal is to **improve** CIs by removing ambiguity and adding evidence/tests. CI ≥90 is a **motivation**, not a constraint: tasks that cannot yet be ≥90 stay below, with a clear “What would make this ≥90%” section.

## Success Signals (What “Good” Looks Like)

- A single, documented command validates guides (schema + link tokens) and is integrated into the repo validation gate.
- In dev/preview, guide pages clearly indicate when content is falling back to English (and how to fix it).
- Adding a new block type has a safe scaffolding path that avoids brittle string edits.
- A script can measure guide-system hotspots and output a machine-readable report (no production instrumentation required).

## Audit Updates (2026-01-27)

Concrete repo facts this plan is based on:

- Guide manifest is large and TypeScript-based:
  - `apps/brikette/src/routes/guides/guide-manifest.ts` (**4404** lines)
- Guide template orchestration is non-trivial:
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (**547** lines)
- Guide blocks exist and are schema-backed, but block composition is currently small and explicit:
  - `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx` (**90** lines)
  - `apps/brikette/src/routes/guides/blocks/types.ts` defines the discriminated union
- Validation tooling already exists and should be treated as the Phase 2 baseline:
  - schema validation: `apps/brikette/src/routes/guides/content-schema.ts`
  - CLI validators:
    - `apps/brikette/scripts/validate-guide-content.ts` (`pnpm --filter @apps/brikette validate-content`)
    - `apps/brikette/scripts/validate-guide-links.ts` (`pnpm --filter @apps/brikette validate-links`)
- Locale support is 18 languages (see `apps/brikette/src/i18n.config.ts`).

## Goals

- Improve guide safety and operability without high-blast-radius refactors.
- Reduce “silent failure” modes (especially English fallback).
- Make it easier to add/iterate on blocks with less manual ceremony.

## Non-goals

- Phase 2 does not require completing all Phase 3 items.
- Phase 2 avoids any change that would require migrating thousands of content files as a prerequisite.

## Task Summary

### Phase 2 (Guardrails) — CI target: ≥90 where credible

| Task ID | Type | Description | CI | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Consolidate and integrate guide validation into the repo validation gate | 90% | M | Pending | - |
| TASK-02 | IMPLEMENT | Dev/preview “English fallback” banner + guidance for authors | 92% | S | Pending | - |
| TASK-03 | IMPLEMENT | Harden link validation: remove regex parsing and rely on typed sources | 90% | M | Pending | TASK-01 |
| TASK-04 | IMPLEMENT | Add safe block scaffolding script (generate files + snippets, no brittle edits) | 92% | M | Pending | - |
| TASK-05 | IMPLEMENT | Add opt-in guide performance measurement script + report format | 90% | M | Pending | TASK-01 |
| TASK-06 | DOC | Write Phase 3 plan doc (turn candidates into scoped work) | 95% | S | Pending | TASK-01–05 |

> Effort scale: S=1, M=2, L=3

### Phase 3 (Bigger Bets) — CI will vary; keep it honest

| Candidate ID | Type | Description | CI (now) | Effort | Depends on |
|---|---|---|---:|---:|---|
| P3-01 | IMPLEMENT | Manifest TS → JSON (schema + loader + parity tests) | 80% | L | TASK-01, TASK-05 |
| P3-02 | IMPLEMENT | GuideSeoTemplate extraction for testability | 78% | L | TASK-01 |
| P3-03 | IMPLEMENT | General-purpose content migration tool (dry-run + rollback + validation) | 85% | M | TASK-01, TASK-03 |
| P3-04 | IMPLEMENT | PR/CI reporting (manifest diffs, validation summaries) | 82% | M | P3-01 or stable manifest contracts |
| P3-05 | IMPLEMENT | Dashboards (guide health, validation) (optional) | 70% | L | TASK-05, P3-03 |

## Milestones

| Milestone | Focus | Tasks | Effort | CI |
|-----------|-------|-------|--------|-----|
| 1 | Validation baseline | TASK-01, TASK-03 | M | **90%** |
| 2 | Authoring feedback + DX | TASK-02, TASK-04 | M | **92%** |
| 3 | Performance measurement | TASK-05 | M | **90%** |
| 4 | Phase 3 planning | TASK-06 | S | **95%** |

## Tasks

### TASK-01: Consolidate and integrate guide validation into the repo validation gate

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `scripts/validate-changes.sh`
  - `apps/brikette/package.json` (optional: a single `validate:guides` script)
  - `apps/brikette/scripts/validate-guide-content.ts` (minor: shared options/exit codes)
  - `apps/brikette/scripts/validate-guide-links.ts` (minor: shared options/exit codes)
- **CI:** 90%
  - Implementation: 90% — Existing validators already run; this task standardizes and wires them into the gate.
  - Approach: 90% — Prefer warning mode by default; allow strict mode via env/flag.
  - Impact: 90% — Validation-only; no runtime rendering changes.
- **Acceptance:**
  - `scripts/validate-changes.sh` runs guide validators when Brikette guide content or guide-system code changes.
  - Clear “warn vs fail” semantics:
    - default: warn on violations (non-blocking)
    - strict: fail on violations (blocking) via `STRICT=1` or an explicit flag
  - Output is readable and grouped by locale/file, with a deterministic exit code.
- **Test plan (targeted):**
  - Run: `pnpm --filter @apps/brikette validate-content -- --locale=en --fail-on-violation`
  - Run: `pnpm --filter @apps/brikette validate-links -- --locale=en`
- **Rollback:**
  - Revert gate integration; validators remain available as manual commands.

### TASK-02: Dev/preview “English fallback” banner + guidance for authors

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx`
  - `apps/brikette/src/utils/guideContentFallbackRegistry.ts` (read-only; used for detection)
  - `apps/brikette/src/routes/guides/README.md` (add authoring guidance)
- **CI:** 92%
  - Implementation: 92% — Fallback detection already exists; this is a conditional UI surface.
  - Approach: 92% — Dev/preview-only to avoid SEO/UX surprises.
  - Impact: 92% — Improves authoring feedback without changing canonical content behaviour.
- **Acceptance:**
  - When the active locale is using an English fallback injection, render a banner above the article body.
  - Banner includes actionable guidance:
    - which locale is missing,
    - where the content file lives (`apps/brikette/src/locales/<lang>/guides/content/<key>.json`),
    - links to validator commands.
  - Banner is suppressed in production builds.
- **Test plan (targeted):**
  - Add a small unit test that exercises the banner gating logic (dev vs prod + fallback vs non-fallback).
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern=\"GuideSeoTemplateBody\" --maxWorkers=2`

### TASK-03: Harden link validation (remove regex parsing, rely on typed sources)

- **Type:** IMPLEMENT
- **Affects:** `apps/brikette/scripts/validate-guide-links.ts`
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — Script is already ESM/tsx; it can import typed sources directly.
  - Approach: 90% — Replace brittle parsing of TS source with imports from existing modules.
  - Impact: 90% — Validation-only change; improves correctness and reduces maintenance risk.
- **Acceptance:**
  - `validate-guide-links.ts` no longer scrapes `generate-guide-slugs.ts` via regex.
  - Guide key set is derived from stable code sources, e.g.:
    - `apps/brikette/src/guides/slugs/keys.ts` (`GUIDE_KEYS_WITH_OVERRIDES`)
    - `apps/brikette/src/data/how-to-get-here/routeGuides.ts` (how-to-get-here slugs)
  - Locale list is sourced from `apps/brikette/src/i18n.config.ts` (no duplicated arrays).
- **Test plan (targeted):**
  - Run: `pnpm --filter @apps/brikette validate-links -- --locale=en`

### TASK-04: Add safe block scaffolding script (generate files + snippets)

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/scripts/scaffold-guide-block.ts` (new)
  - `apps/brikette/package.json` (new script alias, e.g. `scaffold:block`)
  - `apps/brikette/src/routes/guides/blocks/README.md` (or `apps/brikette/src/routes/guides/README.md`) (usage docs)
- **CI:** 92%
  - Implementation: 92% — File generation is straightforward; we avoid brittle multi-file in-place edits.
  - Approach: 92% — Script creates new files and prints exact snippets for the few required manual insertions.
  - Impact: 92% — DX-only; no impact on existing runtime behaviour.
- **Acceptance:**
  - Script prompts for: block id/type name, slot target, options fields (minimal).
  - Script generates:
    - handler file stub in `apps/brikette/src/routes/guides/blocks/handlers/`
    - a test stub under `apps/brikette/src/test/routes/guides/__tests__/`
  - Script prints:
    - the exact `blocks/types.ts` snippet to add (schema + union)
    - the exact `composeBlocks.tsx` switch-case snippet to add
  - Script supports `--dry-run` (default) and `--write` for file creation.

### TASK-05: Add opt-in guide performance measurement script + report format

- **Type:** IMPLEMENT
- **Affects (expected):**
  - `apps/brikette/scripts/measure-guide-performance.ts` (new)
  - `docs/performance/guide-system-metrics.md` (new or existing location)
- **Depends on:** TASK-01
- **CI:** 90%
  - Implementation: 90% — Standalone script avoids production instrumentation risk.
  - Approach: 90% — Output JSON suitable for later dashboards without committing to dashboards now.
  - Impact: 90% — No runtime changes; measurement is opt-in.
- **Acceptance:**
  - Script measures and reports at least:
    - manifest parse time,
    - content bundle load time for a locale,
    - link validation runtime (reusing validator).
  - Outputs a JSON report under `/tmp` (or repo-relative `./.tmp/`), never committing large artifacts.
  - Document how to run it and how to interpret the report.

### TASK-06: Capture Phase 3 candidates (not CI-scored) in a follow-on plan

- **Type:** DOC
- **Depends on:** TASK-01–05
- **CI:** 95%
- **Acceptance:**
  - Create a Phase 3 plan doc that holds longer-horizon items (dashboards, manifest migration, template refactor), with clearly separated “needs-a-spike” items.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Validators become noisy and block commits | Default to warning mode; allow strict mode when the repo is ready. |
| Banner leaks into production | Gate on dev/preview flags and add a test covering prod suppression. |
| Scaffolding script becomes brittle | Keep it “generate + print snippets”; do not edit existing files automatically. |
| Performance measurement adds ongoing maintenance | Keep it standalone and document the contract; avoid production instrumentation. |

## Acceptance Criteria (overall)

- [ ] Phase 2 tasks remain scoped and evidence-backed (no speculative refactors)
- [ ] Phase 2 task CIs are ≥90 where credible; Phase 3 items may be lower but include “what would make this ≥90%”
- [ ] Validation is standardized and integrated into `scripts/validate-changes.sh`
- [ ] Dev/preview shows English fallback clearly, production unaffected
- [ ] Block scaffolding reduces manual ceremony without brittle automation
- [ ] Performance script outputs a stable JSON report format

## Phase 3 Details (What Would Make These ≥90%)

### P3-01: Manifest TS → JSON (CI now: 80%)

**What would make this ≥90%:**
- A parity test that loads TS manifest and JSON manifest and asserts structural equivalence for a representative set of keys (and/or all keys).
- A “shadow loader” period where JSON is produced and validated, but TS remains runtime source of truth.
- Measured editor/tooling impact of a large JSON file (and mitigations: split files, per-area manifests, etc.).

### P3-02: GuideSeoTemplate extraction (CI now: 78%)

**What would make this ≥90%:**
- Add integration tests that assert invariants (meta tags, structured data presence, slot rendering, fallback gating) before any refactor.
- Extract one slice at a time behind identical prop contracts (no behavioural changes per step).
- Lock down a small “golden set” of guides for regression tests.

### P3-03: General-purpose content migration tool (CI now: 85%)

**What would make this ≥90%:**
- Reuse Phase 2 validators as mandatory post-migration checks (schema + links).
- Demonstrate two real migrations end-to-end in PRs (dry-run report + execute + rollback).
- Define a stable “migration contract” (inputs/outputs + backup layout).

### P3-04: PR/CI reporting (CI now: 82%)

**What would make this ≥90%:**
- Ensure the report inputs are stable and deterministic (validator outputs, perf report format).
- Decide whether we’re reporting on TS manifest or a JSON manifest (ties to P3-01).

### P3-05: Dashboards (CI now: 70%)

**What would make this ≥90%:**
- Prove value with a lightweight JSON summary first (no UI), then layer a static HTML UI.
- Confirm data sources (validation + perf) are stable and cheap to generate.
