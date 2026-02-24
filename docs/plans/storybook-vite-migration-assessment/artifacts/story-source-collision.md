---
Type: Investigation
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-24
Related-Task: TASK-02
---

# Story Source Collision Investigation (TASK-02)

## Execution Status
- Completed on 2026-02-23.
- Task objective met: identified duplicate story source collisions, confirmed scope of impact, and selected canonical dedupe strategy mapped to exact config edits.

## Inputs
- [plan.md](/Users/petercowling/base-shop/docs/plans/storybook-vite-migration-assessment/plan.md)
- [main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/main.ts)
- [main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook-ci/main.ts)
- [package.json](/Users/petercowling/base-shop/apps/storybook/package.json)
- Build logs:
  - `/tmp/sb-build-full.log` (`pnpm --filter @apps/storybook run build:full`)
  - `/tmp/sb-build-ci.log` (`pnpm --filter @apps/storybook run build:ci`)

## Scope
- In scope: story source collision root-cause analysis for Storybook full build and migration planning impact.
- Out of scope: applying dedupe code changes (handled by TASK-03).

## Command Evidence
- `pnpm --filter @apps/storybook run build:full` -> exit `1` (duplicate story IDs during story indexing).
- `pnpm --filter @apps/storybook run build:ci` -> exit `0`.

## Findings
### 1) Collision inventory (full build)
- Duplicate rows captured: `840`
- Unique story IDs impacted: `237`
- Unique source-path pairs: `167`
- Full row-level map (story_id + path_a + path_b): [story-duplicate-map.tsv](/Users/petercowling/base-shop/docs/plans/storybook-vite-migration-assessment/artifacts/story-duplicate-map.tsv)

### 2) Collision family breakdown
- `476` rows: `ui_node_modules_ds -> design_system_src`
- `364` rows: `ui_node_modules_ds -> ui_src`

Interpretation:
- Every duplicate collision includes `packages/ui/node_modules/@acme/design-system/...` as one side.
- The other side is either:
  - `packages/design-system/src/...`, or
  - `packages/ui/src/components/...`.

### 3) Why `build:ci` passes while `build:full` fails
- `build:full` uses [main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/main.ts), which currently includes broad glob:
  - `path.resolve(__dirname, "../../../packages/ui/**/*.stories.@(ts|tsx)")`
- That broad glob traverses `packages/ui/node_modules/@acme/design-system/...` and duplicates IDs already present in canonical source trees.
- `build:ci` uses [main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook-ci/main.ts) and targets `packages/ui/src/components/...` explicitly; it does not use the broad `packages/ui/**/*.stories...` glob.

### 4) Top repeated collision pairs (sample)
```text
40  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx	../../packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.stories.tsx
40  ../../packages/ui/node_modules/@acme/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx	../../packages/design-system/src/atoms/StatusIndicator/StatusIndicator.stories.tsx
16  ../../packages/ui/node_modules/@acme/design-system/src/molecules/Stepper.stories.tsx	../../packages/design-system/src/molecules/Stepper.stories.tsx
16  ../../packages/ui/node_modules/@acme/design-system/src/molecules/DatePicker.stories.tsx	../../packages/design-system/src/molecules/DatePicker.stories.tsx
14  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx	../../packages/ui/src/components/atoms/ThemeToggle.stories.tsx
14  ../../packages/ui/node_modules/@acme/design-system/src/atoms/ThemeToggle.stories.tsx	../../packages/design-system/src/atoms/ThemeToggle.stories.tsx
10  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx	../../packages/ui/src/components/atoms/shadcn/Button.stories.tsx
10  ../../packages/ui/node_modules/@acme/design-system/src/shadcn/Button.stories.tsx	../../packages/design-system/src/shadcn/Button.stories.tsx
10  ../../packages/ui/node_modules/@acme/design-system/src/primitives/drawer.stories.tsx	../../packages/design-system/src/primitives/drawer.stories.tsx
10  ../../packages/ui/node_modules/@acme/design-system/src/primitives/combobox.stories.tsx	../../packages/design-system/src/primitives/combobox.stories.tsx
```

## Canonical Dedupe Strategy (initial selection, later corrected)
- Canonical source rule:
  - Treat `packages/design-system/src/...` and `packages/ui/src/components/...` as canonical story sources.
  - Treat `packages/ui/node_modules/@acme/design-system/...` as non-canonical (must be excluded from Storybook discovery).

- Exact config edit mapping for TASK-03:
1. In [main.ts](/Users/petercowling/base-shop/apps/storybook/.storybook/main.ts), replace:
   - `path.resolve(__dirname, "../../../packages/ui/**/*.stories.@(ts|tsx)")`
   with:
   - `path.resolve(__dirname, "../../../packages/ui/src/**/*.stories.@(ts|tsx)")`
2. Keep existing explicit `packages/design-system/src/**/*.stories.@(ts|tsx)` entry.
3. Do not change `.storybook-ci/main.ts` story globs unless validation shows missed intended coverage.

## Post-TASK-03 Validation Correction (2026-02-24)
- After replacing the broad `packages/ui/**/*.stories...` glob with `packages/ui/src/**/*.stories...`, `build:full` still produced duplicate IDs between:
  - `packages/ui/src/components/.../*.stories.tsx`
  - `packages/design-system/src/.../*.stories.tsx`
- Final canonical full-build rule for TASK-03:
  - Use `packages/ui/src/**/*.stories.@(ts|tsx)` as the single package source for component stories in `.storybook/main.ts`.
  - Do not include `packages/design-system/src/**/*.stories.@(ts|tsx)` in full-build discovery.
- This correction cleared duplicate-index failures in `build:full` while keeping `build:ci` behavior unchanged.

## Validation Matrix for TASK-03
- Pre-fix baseline (captured in this investigation):
  - `build:full` fails (duplicate story IDs).
  - `build:ci` passes.
- Post-fix expected:
  - `build:full` passes with no duplicate story ID index errors.
  - `build:ci` still passes.
  - `storybook:smoke:ui` and `test-storybook:runner` remain unchanged by `.storybook/main.ts` edits; any `.storybook-ci` runner failures are tracked separately from duplicate-index fixes.

## Open Risks / Notes
- Narrowing to `packages/ui/src/**/*.stories...` is expected to remove non-canonical duplicates, but can still hide intentionally colocated non-`src` stories if any exist.
- TASK-03 should include a quick story-count delta sanity check to confirm intentional coverage is unchanged.
