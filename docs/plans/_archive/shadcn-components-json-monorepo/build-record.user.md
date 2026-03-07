---
Type: Build-Record
Status: Complete
Feature-Slug: shadcn-components-json-monorepo
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/shadcn-components-json-monorepo/build-event.json
---

# Build Record: shadcn CLI Monorepo — components.json for packages/ui

## Outcome Contract

- **Why:** The shadcn CLI is the fastest path to new components but the monorepo layout (components live in `packages/ui`, not in an app) makes standard setup inapplicable — every new component had to be manually copied and alias paths manually fixed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A working `components.json` in `packages/ui` so `npx shadcn@latest add <component> --cwd packages/ui` installs new components directly into `packages/ui/src/components/atoms/shadcn/` with correct alias resolution and no manual post-edit needed. Workflow documented in `packages/ui/AGENTS.md`.
- **Source:** operator

## What Was Built

**Wave 1 — Dependency + shims (TASK-01, TASK-03, TASK-04):** Added `class-variance-authority@^0.7.1` to `packages/ui` dependencies (alphabetical between chart.js and clsx). Created `src/lib/utils.ts` as a single-line re-export shim (`export { cn } from "../utils/style/cn"`) so the CLI-generated `import { cn } from "@/lib/utils"` resolves to the existing `extendTailwindMerge`-based implementation. Created `src/styles/shadcn-globals.css` as a comment-only placeholder satisfying the `components.json` `tailwind.css` requirement without injecting CSS variables that would conflict with `packages/themes/base/tokens.css`.

**Wave 2 — Named export fix (TASK-02):** Fixed the `@acme/ui/components/atoms/shadcn` export gap in `packages/ui/package.json`. Node ESM wildcard patterns resolve `shadcn` to `shadcn.js` (non-existent), not `shadcn/index.js`. Added a named subpath entry before the wildcard so `import ... from "@acme/ui/components/atoms/shadcn"` resolves to the barrel's `dist/index.js`.

**Wave 3 — CLI config (TASK-05):** Wrote `packages/ui/components.json` with `style: "new-york"`, `cssVariables: false` (intentional — repo token system handles theming), `tailwind.config: ""` (no per-package Tailwind config; repo root is picked up by apps), `tailwind.baseColor: "neutral"`, and aliases pointing `utils` → `@/lib/utils` and `ui` → `@/components/atoms/shadcn`.

**Wave 4 — Dry-run validation (TASK-06):** Ran `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes`. Exit 0. CLI resolves `tailwindConfig: -` (empty string accepted as "no config"), writes `badge.tsx` to `src/components/atoms/shadcn/`, and the preview file uses `import { cn } from "@/lib/utils"` and `import { cva } from "class-variance-authority"` — both alias dependencies confirmed resolved.

**Wave 5 — Tests + docs (TASK-07, TASK-08):** Added `src/lib/__tests__/utils.test.ts` with two assertions covering the cn shim re-export and Tailwind Merge conflict resolution. Updated `packages/ui/AGENTS.md` with a full "Adding shadcn components" section covering CLI command, post-add steps (barrel, smoke test, exports map), and intent notes for `cssVariables: false`, `tailwind.config: ""`, and the cn alias path.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` | Pass | Exit 0; badge.tsx preview at correct path; both alias imports resolved |
| cn shim unit test (`src/lib/__tests__/utils.test.ts`) | Pass | Two assertions: conflict resolution and custom token handling |
| `pnpm typecheck` (scoped to packages/ui) | Pass | No TS errors introduced |
| Pre-commit hooks (lint-staged, typecheck-staged) | Pass | All waves committed without hook failures after scope cleanup |

## Validation Evidence

### TASK-01
- TC-01-A: `packages/ui/package.json` dependencies block contains `"class-variance-authority": "^0.7.1"` (verified at line 352)
- TC-01-B: `pnpm-lock.yaml` updated with class-variance-authority resolution
- TC-01-C: `pnpm install` completed without errors; no peer dependency warnings

### TASK-02
- TC-02-A: Named export `"./components/atoms/shadcn"` with `types` and `import` fields exists in exports map before the wildcard entry
- TC-02-B: Named before wildcard ordering verified (index 45 named, index 46 wildcard)

### TASK-03
- TC-03-A: `src/lib/utils.ts` exists and contains single-line `export { cn } from "../utils/style/cn"`
- TC-03-B: Relative path resolves; no TypeScript errors

### TASK-04
- TC-04-A: `src/styles/shadcn-globals.css` exists with comment-only content (no CSS variable definitions)

### TASK-05
- TC-05-A: `packages/ui/components.json` schema validates against `https://ui.shadcn.com/schema.json`
- TC-05-B: `cssVariables: false` confirmed
- TC-05-C: `tailwind.config: ""` accepted by CLI (dry-run shows `tailwindConfig: -`)
- TC-05-D: All alias paths verified (`@/lib/utils` → shim, `@/components/atoms/shadcn` → barrel)

### TASK-06
- TC-06-A: `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` exits 0
- TC-06-B: Output path `src/components/atoms/shadcn/badge.tsx` confirmed
- TC-06-C: Generated file preview uses `import { cn } from "@/lib/utils"` — alias resolves
- TC-06-D: Generated file preview uses `import { cva } from "class-variance-authority"` — dep present

### TASK-07
- TC-07-A: `src/lib/__tests__/utils.test.ts` exists with two test cases
- TC-07-B: `cn("px-4", "px-2")` returns `"px-2"` (later class wins, Tailwind Merge conflict resolution)
- TC-07-C: `cn("bg-primary", "bg-accent")` returns `"bg-accent"` (custom token conflict resolution)

### TASK-08
- TC-08-A: "Adding shadcn components" section present in `packages/ui/AGENTS.md`
- TC-08-B: Section includes CLI command, 3-step post-add checklist, and intent notes for all config choices

## Scope Deviations

None. All work stayed within the defined `Affects` files. TASK-06 (dry-run) produced no committed file changes as expected.
