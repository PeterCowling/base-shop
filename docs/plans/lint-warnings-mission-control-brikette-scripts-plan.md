---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-01-16
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# Lint Warnings for Restored Mission Control and Brikette Scripts

## Problem
Targeted ESLint on the restored files fails with warnings treated as errors. The warnings are:
- `ds/no-hardcoded-copy` on Brikette CLI scripts (diagnostic strings).
- `react-hooks/exhaustive-deps` and `ds/min-tap-size` in Mission Control UI.

These are spread across more than 10 files, so we need a plan before applying fixes.

## Goals
- Restore lint‑clean status for the restored Mission Control UI and Brikette scripts.
- Preserve the intent of copy rules while acknowledging non‑UI CLI diagnostics.

## Plan
1. Decide how to handle CLI script strings:
   - Option A: add `// i18n-exempt file -- <TICKET> [ttl=YYYY-MM-DD]` at the top of each script.
   - Option B: update `eslint.config.mjs` to disable `ds/no-hardcoded-copy` under `apps/brikette/scripts/**`.
2. Fix Mission Control hook warnings:
   - Add missing dependencies to `useEffect`/`useCallback` in `apps/product-pipeline/src/app/mission-control/MissionControlClient.tsx`.
3. Fix Mission Control tap-size warnings:
   - Apply DS tokenized sizing (`min-h-10 min-w-10` or equivalent) to flagged controls in `LootDropsPanel.tsx`, `MissionsPanel.tsx`, and `PipelineMap3D.tsx`.
4. Re-run targeted ESLint on the staged files.
5. Re-stage and commit the changes.

## Decisions
- Chosen approach for CLI scripts: Option B (disable `ds/no-hardcoded-copy` under `apps/brikette/scripts/**`).

## Risks / Considerations
- Broad exemptions can hide genuine user-facing copy. Keep scope limited to script paths.
- Hook dependency changes could alter timing of effects; verify behavior if possible.

## Validation
- `pnpm exec eslint --fix --max-warnings=0 <restored-files>`

## Active tasks

- **LINT-WARN-01** - Fix Mission Control hook warnings and tap-size warnings
