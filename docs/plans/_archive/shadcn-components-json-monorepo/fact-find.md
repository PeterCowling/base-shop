---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: shadcn-components-json-monorepo
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/shadcn-components-json-monorepo/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306213000-1006
Trigger-Why:
Trigger-Intended-Outcome:
---

# shadcn CLI Monorepo — components.json for packages/ui Fact-Find Brief

## Scope

### Summary

The shadcn CLI (v4.0.0) requires a `components.json` at the working directory root to scaffold new
components. Without it, every new shadcn component must be manually copied and adapted. In this
monorepo, components live in `packages/ui/src/components/atoms/shadcn/`, not in any app. The CLI
supports a `--cwd` flag that points it at any directory, enabling `components.json` to live inside
`packages/ui/` directly. The outstanding work is to define the correct `components.json` content
(aliases, CSS path, style choice, tailwind config path) so `npx shadcn@latest add <component>
--cwd packages/ui` writes new components into the right directory and imports resolve correctly.

### Goals

- Establish `packages/ui/components.json` so the shadcn CLI writes components to
  `packages/ui/src/components/atoms/shadcn/`
- Alias `aliases.utils` to the existing `cn` function at `packages/ui/src/utils/style/cn.ts`
- Alias `aliases.components` and `aliases.ui` to the correct component directories
- Choose a style and base color consistent with the existing design system
- Document the `npx shadcn@latest add <component> --cwd packages/ui` workflow for future use
- Avoid introducing Turbopack module identity conflicts

### Non-goals

- Changing how existing shadcn wrappers (`Button`, `Dialog`, `AlertDialog`, etc.) are implemented
- Adopting shadcn's CSS variable theme injection (the repo has its own token system)
- Modifying app-level `globals.css` files or the root `tailwind.config.mjs`
- Installing all available shadcn components (on-demand CLI additions only)

### Constraints & Assumptions

- Constraints:
  - Tailwind v4 is in use; the `tailwind.config.mjs` is a v3 compatibility shim used by some apps
    — `packages/ui` itself has no `tailwind.config.mjs`
  - The `cn` utility in `packages/ui/src/utils/style/cn.ts` uses `extendTailwindMerge` with
    custom THEME_COLOR_TOKENS — not the standard `twMerge(clsx(...))`. shadcn-generated code
    imports `cn` from `@/lib/utils`; the plan must redirect this import to the existing utility.
  - No `class-variance-authority` dependency exists in `packages/ui` or `packages/design-system`.
    New shadcn components (v4 CLI) use `cva` from `class-variance-authority` — this must be added.
  - Turbopack `resolveAlias` cannot use absolute-path aliases for CSS — CSS `@import` does not
    resolve through Turbopack resolveAlias (confirmed in CLAUDE.md). This is not a blocker for
    `components.json` itself but affects how CSS-based theming injected by the CLI is handled.
  - The CLI writes `"use client"` and relative imports. Generated files target the directory
    pointed to by `aliases.ui` or `aliases.components`.
- Assumptions:
  - The shadcn CLI v4.0.0 `--cwd` flag sets the working directory for config resolution and file
    writes during `add`. `components.json` must be created manually (via `init --cwd packages/ui`)
    or written by hand — `add --cwd` reads an existing `components.json` and resolves all alias
    paths relative to that directory's `tsconfig.json` (confirmed by `shadcn info --cwd packages/ui`
    detecting `importAlias: @acme/ui` from tsconfig).
  - The base style choice (`base-nova` or `new-york`) affects only the default component visual
    style, not the alias or path structure — the existing bespoke design system will override anyway.
  - `tailwind.css` path in `components.json` is intentionally unused for injection — set to a
    no-op path, since the repo's CSS token system lives in `packages/themes/base/tokens.css` and
    is imported by each app's `globals.css`.

## Outcome Contract

- **Why:** The shadcn CLI is the fastest path to new components and tracks upstream updates
  automatically, but the monorepo layout (components in `packages/ui`, not any app) makes the
  standard CLI setup inapplicable. A `components.json` pointing the CLI at `packages/ui` needs to
  be designed correctly — the right alias paths and CSS target for this monorepo structure are an
  open question that needs investigation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A working `components.json` established in `packages/ui`; the
  shadcn CLI can install new components directly into
  `packages/ui/src/components/atoms/shadcn/` with correct alias resolution; the approach
  documented for future component additions.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `packages/ui/` — shadcn CLI working directory target; `npx shadcn@latest add <component> --cwd packages/ui`
- `packages/ui/src/components/atoms/shadcn/` — existing ad-hoc shadcn wrappers (Button, AlertDialog, Card, Checkbox, Dialog, Input, Select, Table, Textarea)
- `packages/ui/src/components/atoms/shadcn/index.ts` — barrel export for all shadcn wrappers

### Key Modules / Files

- `packages/ui/src/utils/style/cn.ts` — the `cn` utility (custom `extendTailwindMerge` + `clsx`). This is what `aliases.utils` must point to, but the default shadcn import is `@/lib/utils`. The plan must ensure generated files use `@acme/ui/utils/style` or a local re-export alias.
- `packages/ui/tsconfig.json` — defines `@/*` → `./src/*` and `@acme/ui/*` → `./src/*` and `@ui/*` → `./src/*`. The key alias for shadcn's default `@/lib/utils` is `@/` → `src/`. So `@/lib/utils` must resolve to a `src/lib/utils.ts` re-export of `cn`.
- `packages/config/tsconfig.base.json` — monorepo-wide paths including `@acme/ui` → `packages/ui/src/*`. Not directly used by the CLI (it reads the local `packages/ui/tsconfig.json`).
- `packages/themes/base/tokens.css` — the CSS token file used by all apps. No per-app Tailwind CSS variable injection by shadcn. This is the "CSS" the plan must reference (as informational, not injected by CLI).
- `packages/next-config/next.config.mjs` — Turbopack `resolveAlias` has only `@` and `@themes-local`. No aliases that conflict with `packages/ui` internal paths. Webpack aliases include `@acme/design-system`, `@acme/cms-ui`, `@acme/lib`, `@acme/seo`.
- `packages/ui/src/components/atoms/shadcn/Button.tsx` — example of existing wrapper pattern: uses `cn` via relative import `../../../utils/style`, wraps `BaseButton` from `../primitives/button` (which re-exports from `@acme/design-system/primitives/button`). Not CLI-generated.
- `packages/ui/src/components/atoms/primitives/button.tsx` — thin re-export of design-system primitive. Pattern: primitives layer delegates to design-system; shadcn layer wraps primitives.
- `packages/ui/package.json` — exports map includes `"@acme/ui"`, `"@acme/ui/utils/style"`, and a `"./components/atoms/*"` wildcard. **Known defect:** the wildcard maps `@acme/ui/components/atoms/shadcn` to `dist/components/atoms/shadcn.js` (a non-existent file). The actual built output is `dist/components/atoms/shadcn/index.js`. There is no explicit `"./components/atoms/shadcn"` named export. At least one live consumer (`apps/cms/src/components/cms/media/__tests__/MediaManager.test.tsx:181`) imports the bare barrel path — this export gap is an existing defect that **must** be fixed in the build plan (not optional). Has `shadcn-ui: 0.9.5` (old legacy npm package) and `tailwind-merge`, `clsx`. No `class-variance-authority`.
- `tailwind.config.mjs` (repo root) — v3-compat shim. Maps `destructive` → `hsl(var(--color-danger))`, `primary` → `hsl(var(--color-primary))`, etc. Consumed by apps via `@config` directive. `packages/ui` itself has no tailwind config.

### Patterns & Conventions Observed

- Relative `cn` imports in existing shadcn wrappers use `../../../utils/style` (relative from `src/components/atoms/shadcn/`). shadcn-generated code will default to `@/lib/utils` — a `src/lib/utils.ts` shim re-exporting `cn` is needed.
- Primitives layer (`src/components/atoms/primitives/`) is thin re-exports of `@acme/design-system/primitives/*`. Shadcn wrappers sit above this.
- All existing components use `"use client"` and Radix UI. No CSS module files.
- Color tokens follow `--color-primary`, `--color-danger`, `--color-border`, `--ring` CSS var names — overlapping meaningfully with shadcn's expected token names (`primary`, `destructive`, `border`, `ring`, `input`). Some mismatch: shadcn uses `secondary` (not present), `popover` (not present as standalone token). The existing `cn.ts` THEME_COLOR_TOKENS list explicitly includes `destructive`, `destructive-foreground`, `primary`, `primary-foreground`, `ring`, `border`, `muted`, `muted-foreground`, `card`, `card-foreground`, `popover`, `popover-foreground` — confirming the design system already covers the main shadcn color contract.
- `shadcn info --cwd packages/ui` reports: `importAlias: @acme/ui`, no tailwind config/CSS detected, no `components.json`. CLI detects TypeScript and src directory correctly.

### Data & Contracts

- `components.json` schema (fetched from `https://ui.shadcn.com/schema.json`):
  - Required fields: `style`, `tailwind.config`, `tailwind.css`, `tailwind.baseColor`, `tailwind.cssVariables`, `aliases.utils`, `aliases.components`
  - Optional: `aliases.ui`, `aliases.lib`, `aliases.hooks`, `rsc`, `tsx`, `iconLibrary`
  - Valid `style` values: `new-york`, `default`, `radix-nova`, `radix-vega`, `base-nova`, `base-maia`, `base-lyra`, `base-mira`, `base-vega`, `radix-maia`, `radix-lyra`, `radix-mira`
- shadcn CLI v4.0.0 `add` command supports `--cwd <path>` and `--path <path>`. `--cwd` sets the working directory for config resolution; `--path` overrides where components are written.
- `aliases.utils` must be a module specifier that the compiler can resolve to `cn`. Within `packages/ui`, `@/lib/utils` resolves to `src/lib/utils.ts` (via `@/*` → `src/*` in the local tsconfig). A `src/lib/utils.ts` re-export shim is needed.
- `class-variance-authority` is a peer dep of new shadcn CLI v4 components (used by `button` and similar). It is not currently installed in `packages/ui`. Must be added.

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/ui/src/utils/style/cn.ts` — must be reachable via `aliases.utils` path
  - `packages/themes/base/tokens.css` — provides CSS custom properties; not modified
  - `packages/config/tsconfig.base.json` — provides `@acme/ui` paths; `packages/ui/tsconfig.json` local paths override (compliant, no conflict)
- Downstream dependents:
  - Apps that import from `@acme/ui/components/atoms/shadcn/*` (leaf imports) — unaffected by adding `components.json`
  - `apps/cms/src/components/cms/media/__tests__/MediaManager.test.tsx:181` — imports the bare barrel `@acme/ui/components/atoms/shadcn` (no subpath). This currently works via Jest module resolution but would break in bundler contexts due to the missing named export. **Adding the named export in `packages/ui/package.json` fixes this and is required.**
  - Apps using Turbopack (`brikette`, `reception`, `prime`, `caryina`, `xa-b`) — must not gain new absolute-path `resolveAlias` entries
  - `packages/ui/src/components/atoms/shadcn/index.ts` — new components installed by CLI will need manual addition here unless the plan includes automation
- Likely blast radius:
  - Low. `components.json` is a CLI scaffolding config only. No runtime effect. Adding `src/lib/utils.ts` shim and `class-variance-authority` are the only code changes with potential downstream impact.
  - `class-variance-authority` is a new dependency not currently installed anywhere in the monorepo — must be added explicitly; downstream apps that bundle from src (Turbopack) will include it; apps that consume the built dist are unaffected.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (packages/ui jest.config.cjs), @testing-library/react
- Commands: `pnpm -w run test:governed -- jest -- --config=packages/ui/jest.config.cjs`
- CI integration: CI-only (push and `gh run watch`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| shadcn Button | Unit | `__tests__/Button.test.tsx`, `Button.extra.test.tsx` | Props, variants, click events |
| shadcn Dialog | Behavior | `__tests__/Dialog.behavior.test.tsx` | Open/close interaction |
| shadcn Select | Behavior | `__tests__/Select.behavior.test.tsx` | Item selection |
| shadcn wrappers bundle | Smoke | `__tests__/wrappers.test.tsx` | Card, Checkbox, Dialog, Input, Select, Textarea render |
| cn utility | Unit | `utils/style/__tests__/cn.test.ts` | Tailwind merge and clsx behavior |

#### Coverage Gaps

- No test for `AlertDialog` wrapper (present in index.ts, no dedicated test)
- Any new CLI-installed component will arrive without a test; the build plan must include a test task
- No test for the `src/lib/utils.ts` shim (trivial but should be verified)

#### Testability Assessment

- Easy to test: `src/lib/utils.ts` shim (unit test, checks `cn` is re-exported correctly)
- Easy to test: new CLI-installed components (smoke render test following `wrappers.test.tsx` pattern)
- Hard to test: full CLI invocation in CI (requires `npx shadcn@latest` — network call; use dry-run or skip in CI)

#### Recommended Test Approach

- Unit tests for: `src/lib/utils.ts` shim (re-export correctness)
- Smoke tests for: any component installed by the CLI (follow `wrappers.test.tsx` pattern)
- Manual validation: run `npx shadcn@latest add badge --cwd packages/ui --dry-run` to confirm file paths before actual install

### Recent Git History (Targeted)

- `packages/ui/src/components/atoms/shadcn/` — `1890832c` "feat(ui): add tw-animate-css animation library (shadcn/ui v4 canonical)". First v4-aligned change — confirms the codebase has started transitioning toward CLI-compatible shadcn v4.
- `packages/ui/src/utils/style/cn.ts` — `808688462a` "refactor(ui): replace cn helper with clsx". `cn.ts` was refactored away from a custom helper to clsx + extendTailwindMerge. Current state is confirmed accurate.

## Questions

### Resolved

- Q: Does the shadcn CLI v4 support writing into a non-app package directory (not an app)?
  - A: Yes. The `--cwd <path>` flag sets the working directory for all config and file resolution. Running `npx shadcn@latest add <component> --cwd packages/ui` will use `packages/ui/components.json` as config and write files relative to `packages/ui`. There is no hard requirement that the target be a Next.js/Vite app — the CLI reads tsconfig for alias detection and writes TSX files regardless of framework.
  - Evidence: `npx shadcn@latest add --help` confirms `--cwd` flag; `npx shadcn@latest info --cwd packages/ui` correctly detects `importAlias: @acme/ui`, `srcDirectory: Yes`, `typescript: Yes` — the CLI reads `packages/ui/tsconfig.json` successfully.

- Q: What alias paths does `packages/ui` currently expose?
  - A: The local `packages/ui/tsconfig.json` defines `@/*` → `./src/*`, `@acme/ui/*` → `./src/*`, and `@ui/*` → `./src/*`. The shadcn CLI detects `@acme/ui` as the main import alias. The `aliases.utils` value in `components.json` should be `@/lib/utils` (pointing to `src/lib/utils.ts` which will re-export `cn`). The `aliases.components` should be `@/components` and `aliases.ui` should be `@/components/atoms/shadcn`.
  - Evidence: `packages/ui/tsconfig.json` paths block; `shadcn info --cwd packages/ui` → `importAlias: @acme/ui`

- Q: What CSS file should `components.json` point to?
  - A: `packages/ui` does not have its own CSS file that could serve as the shadcn theme injection target. The best option is a placeholder path, or pointing to `../../packages/themes/base/tokens.css` (relative to `packages/ui/`). The key decision: `tailwind.cssVariables: false` avoids the CLI injecting its own CSS variable block (which would conflict with the existing token system). Alternatively `tailwind.cssVariables: true` with an empty placeholder CSS file inside `packages/ui/src/styles/` prevents any real CSS mutation but satisfies the required schema field.
  - Evidence: Schema requires `tailwind.css` (non-optional); existing apps use `@import "@themes/base/tokens.css"` in `globals.css`; no global CSS file exists inside `packages/ui/src/` that is the canonical token target.
  - Recommendation: Create `packages/ui/src/styles/shadcn-globals.css` as a minimal file with `@import "tailwindcss"` (no token injection), and point `tailwind.css` at it. Set `cssVariables: false` to prevent token conflict.

- Q: What base color and style fits the existing design system?
  - A: `style: "new-york"` is the most mature and complete style. The base color should be `"neutral"` — the shadcn schema accepts any string for `tailwind.baseColor` (no enum constraint confirmed from `https://ui.shadcn.com/schema.json`); `"neutral"` is one of the standard practitioner values (`zinc`, `slate`, `stone`, `gray`, `neutral`) and matches the design system's neutral grey foundation. `cssVariables: false` is correct because the bespoke `packages/themes/base/tokens.css` already provides all semantic tokens; shadcn CSS variable injection would duplicate and conflict.
  - Evidence: `packages/themes/base/tokens.css` uses `--color-bg: var(--token-color-bg, 0 0% 100%)` (neutral white), `--color-fg: var(--token-color-fg, 0 0% 10%)` (near-black) — a neutral palette base. The `tailwind.config.mjs` maps `destructive` to `--color-danger`, `primary` to `--color-primary` — these are already available as Tailwind utility classes. Schema `baseColor` property type is `"string"` with no enum — any well-formed color name is accepted.

- Q: Are there Turbopack `resolveAlias` constraints that would break shadcn CSS imports?
  - A: `components.json` does not affect Turbopack `resolveAlias`. The only risk is if the `tailwind.css` path is a relative path that Turbopack tries to resolve via an alias. Since the shadcn CLI uses `tailwind.css` only for CSS variable injection during `init`, not during runtime bundling, there is no runtime Turbopack concern. The CLAUDE.md constraint ("CSS `@import` does NOT resolve through Turbopack resolveAlias — use relative paths for CSS imports") applies to CSS files imported in component files at runtime, not to `components.json` config fields. No Turbopack change is required.
  - Evidence: `packages/next-config/next.config.mjs` Turbopack `resolveAlias` block — only `@` and `@themes-local`; CLAUDE.md Turbopack note confirmed; CSS `@import` in apps use relative paths (e.g. `@import "../../../../packages/ui/src/styles/builder.css"` in `xa-b globals.css`).

- Q: What is the correct `aliases.utils` path pointing to the `cn` function?
  - A: `"@/lib/utils"`. The local tsconfig resolves `@/*` → `./src/*`, so this points to `packages/ui/src/lib/utils.ts`. A `src/lib/utils.ts` file must be created re-exporting `cn` from `../utils/style/cn`. This is the standard shadcn convention and allows CLI-generated components to import `cn` without needing post-installation edits.
  - Evidence: Existing shadcn wrappers use relative `../../../utils/style` import for `cn`; the tsconfig `@/*` alias enables `@/lib/utils` to resolve to `src/lib/utils.ts`; shadcn CLI generates `import { cn } from "@/lib/utils"` by default.

- Q: Is `class-variance-authority` already available?
  - A: No. It is not installed anywhere in the monorepo — absent from `packages/ui/package.json`, the root `package.json`, and `packages/ui/node_modules`. It is not hoisted. Shadcn CLI v4 components (e.g., `button`) use `cva` from `class-variance-authority`. It must be explicitly added to `packages/ui/package.json` and `pnpm install` run before any CLI-installed component will compile.
  - Evidence: `grep class-variance-authority packages/ui/package.json` → no matches; root `package.json` deps/devDeps → no match; `node_modules/class-variance-authority` → absent; `npx shadcn@latest view button` shows `import { cva } from "class-variance-authority"`.

### Open (Operator Input Required)

- Q: Should newly installed shadcn components replace the current wrapper implementations (e.g., replace the bespoke `Button.tsx` shadcn wrapper with a CLI-installed one)?
  - Why operator input is required: This is an architectural preference, not a technical question. The current wrappers are intentional adaptations of shadcn primitives; replacing them may change behavior and requires a deliberate decision.
  - Decision impacted: scope of TASK-03 in the plan (whether to replace existing or only add new)
  - Decision owner: product/engineering lead
  - Default assumption: CLI is for new additions only; existing wrappers are not touched by this plan. This is the safer, lower-blast-radius default.

## Confidence Inputs

- **Implementation:** 88%
  - Evidence: Full exploration of `components.json` schema, CLI flags, tsconfig aliases, cn utility location. The only remaining implementation unknowns are: exact content of the `src/lib/utils.ts` shim, and whether `tailwind.config` field should be `"tailwind.config.mjs"` (no per-package config exists) or `""`.
  - Raise to ≥90: Confirm via `--dry-run` that CLI resolves paths as expected before committing `components.json`.

- **Approach:** 85%
  - Evidence: `--cwd` flag confirmed functional; `shadcn info --cwd packages/ui` detects correct tsconfig. The `cssVariables: false` + neutral base color approach avoids CSS token conflict.
  - Raise to ≥90: Validate that `tailwind.css` pointing to `src/styles/shadcn-globals.css` does not cause CLI errors.

- **Impact:** 92%
  - Evidence: Low blast radius — this is a scaffolding config only. No runtime behavior change. `src/lib/utils.ts` and `class-variance-authority` are the only additions with downstream effect.
  - Raise to ≥95: Confirm `class-variance-authority` doesn't introduce Turbopack dual-module identity issue (unlikely given it has no workspace package conflict).

- **Delivery-Readiness:** 90%
  - Evidence: All key files located, schema understood, alias strategy clear. Work is well-bounded.
  - Raise to ≥95: Confirm exact `tailwind.config` field value (empty string vs omitted vs path to root config).

- **Testability:** 80%
  - Evidence: Unit tests for `cn` shim are trivial; smoke render test pattern is established (`wrappers.test.tsx`). Full CLI dry-run validation cannot run in CI without network.
  - Raise to ≥90: Add a `--dry-run` CLI invocation to CI as a non-blocking check.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missing named export `"./components/atoms/shadcn"` in `packages/ui/package.json` — wildcard maps to `shadcn.js` (non-existent) not `shadcn/index.js`; live bare-barrel consumer in `apps/cms` | High | Medium | **Required fix in build plan:** add explicit `"./components/atoms/shadcn"` export entry pointing to `dist/components/atoms/shadcn/index.js` and `src/components/atoms/shadcn/index.ts` |
| `tailwind.config` field value causes CLI error (no per-package config exists) | Medium | Low | Try `""` (empty string) or relative path to root `tailwind.config.mjs`; use `--dry-run` to validate before committing |
| CLI-generated components use `cva` before `class-variance-authority` is installed | High if not addressed | Medium | Add to `packages/ui/package.json` deps as first task |
| `src/lib/utils.ts` shim shadows a future non-shadcn utility in that path | Low | Low | Document that `src/lib/` is reserved as the shadcn utilities namespace |
| CSS variable injection conflict if `cssVariables: true` accidentally set | Low | Medium | Set `cssVariables: false` explicitly; document the reason |
| New CLI components use `secondary` or `popover` tokens not defined in `tokens.css` | Medium | Low | The `cn.ts` THEME_COLOR_TOKENS includes `popover` and `popover-foreground`; design system already defines these in the token extension map in `tailwind.config.mjs` — acceptable |
| Turbopack dual-module identity for `class-variance-authority` if workspace resolves src vs dist | Low | Medium | No workspace package named `class-variance-authority`; resolved from `node_modules` after explicit install — no dual identity risk |

## Planning Constraints & Notes

- Must-follow patterns:
  - `components.json` must live at `packages/ui/components.json` (CLI reads from `--cwd` root, not `src/`)
  - `src/lib/utils.ts` must re-export `cn` from the existing `../utils/style/cn` — do not duplicate or move the `cn` implementation
  - `class-variance-authority` must be added to explicit deps in `packages/ui/package.json` (do not rely on hoisting)
  - New installed components must be manually added to `packages/ui/src/components/atoms/shadcn/index.ts` — CLI does not update barrel exports
  - Do not add new `resolveAlias` entries to Turbopack config
  - Do not touch existing wrapper implementations (`Button.tsx`, `AlertDialog.tsx`, etc.)
- Rollout/rollback expectations:
  - Pure scaffolding change; no runtime impact. Rollback = delete `components.json` and `src/lib/utils.ts`
  - `class-variance-authority` removal requires audit of any installed component that used it
- Observability expectations:
  - None at runtime. CI typecheck (`pnpm typecheck`) confirms alias resolution is correct.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `class-variance-authority` to `packages/ui/package.json` deps and run `pnpm install`
- TASK-02: Add explicit `"./components/atoms/shadcn"` named export to `packages/ui/package.json` pointing to `dist/components/atoms/shadcn/index.js` (required — existing bare-barrel consumer in CMS)
- TASK-03: Create `packages/ui/src/lib/utils.ts` re-exporting `cn` from `../utils/style/cn`
- TASK-04: Create `packages/ui/src/styles/shadcn-globals.css` (minimal placeholder, no injected CSS vars)
- TASK-05: Write `packages/ui/components.json` with resolved values for all required fields
- TASK-06: Run `npx shadcn@latest add badge --cwd packages/ui --dry-run` to validate paths
- TASK-07: Add a test for the `src/lib/utils.ts` shim
- TASK-08: Document the `npx shadcn@latest add <component> --cwd packages/ui` workflow in `packages/ui/AGENTS.md`

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `packages/ui/components.json` exists and passes `npx shadcn@latest info --cwd packages/ui` with Tailwind detected
  - `packages/ui/src/lib/utils.ts` exports `cn`
  - TypeScript typecheck passes (`pnpm --filter @acme/ui typecheck`)
  - Dry-run install of a component (`badge`) succeeds without alias errors
- Post-delivery measurement plan:
  - Document in `packages/ui/AGENTS.md` the command for adding new components
  - On first real new component addition, run smoke test following `wrappers.test.tsx` pattern

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CLI `--cwd` flag behaviour and path resolution | Yes | None | No |
| `components.json` required fields and valid values | Yes | None | No |
| Existing `cn` utility location and interface | Yes | None | No |
| tsconfig alias paths (`@/*`, `@acme/ui/*`) | Yes | None | No |
| Missing `src/lib/utils.ts` shim requirement | Yes | Minor: Shim must be created before CLI dry-run; if omitted, generated imports will fail at typecheck | No (plan task seeds cover this) |
| `class-variance-authority` missing dependency | Yes | Moderate: CLI-generated components using `cva` will fail to compile if dep not added first | No (TASK-01 in seeds) |
| Tailwind config field — no per-package `tailwind.config.mjs` | Partial | Minor: Exact value for `tailwind.config` field is unconfirmed (`""` vs root path vs omit) | No (TASK-05 dry-run validates) |
| CSS injection conflict with `cssVariables: true` | Yes | None — resolved by using `cssVariables: false` | No |
| Turbopack `resolveAlias` CSS import constraint | Yes | None | No |
| Barrel export update (`index.ts`) for new components | Yes | Minor: CLI does not update barrel — manual step required per addition | No (documented in non-goals and constraints) |

## Scope Signal

**Signal:** right-sized

**Rationale:** The work is bounded to one package (`packages/ui`), affects only scaffolding config
(no runtime production paths), and all key decisions have been resolved with direct evidence. The
`--cwd` CLI path is confirmed functional, the alias strategy is fully mapped, and the only unresolved
question (`tailwind.config` exact value) is safely verified by a dry-run step in the plan.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `shadcn info --cwd packages/ui` correctly detects the package's tsconfig — CLI is not
  limited to Next.js apps.
- Confirmed the shadcn v4 schema requires `tailwind.config`, `tailwind.css`, `tailwind.baseColor`,
  `tailwind.cssVariables`, `aliases.utils`, `aliases.components` — all resolvable from local evidence.
- Confirmed `class-variance-authority` is absent from the entire monorepo — not in `packages/ui`, `packages/design-system`, root `package.json`, or any hoisted `node_modules`.
- Identified `packages/ui/package.json` export gap: `"./components/atoms/*"` wildcard resolves `shadcn` to `.shadcn.js` rather than `shadcn/index.js`. A named `"./components/atoms/shadcn"` export is missing and should be added in the build plan.
- Confirmed no CSS `@import` Turbopack alias issue — `components.json` is a scaffolding config only.
- Confirmed `src/lib/utils.ts` does not yet exist — must be created.

### Confidence Adjustments

- Implementation confidence raised from estimated ~70% (pre-investigation) to 88% after confirming
  CLI `--cwd` function, alias detection, and exact schema fields.
- Impact confidence at 92% — low blast radius confirmed; no app-level changes required.

### Remaining Assumptions

- `tailwind.config` field accepts an empty string (`""`) or a path to the root `tailwind.config.mjs`
  when no per-package config exists. Dry-run in TASK-05 validates this.
- `cssVariables: false` successfully prevents the CLI from injecting any CSS variable block during
  `add`. If not, a post-install cleanup step will be needed (trivial, low risk).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan shadcn-components-json-monorepo --auto`
