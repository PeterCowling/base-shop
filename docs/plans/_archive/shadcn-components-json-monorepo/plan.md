---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06 (Wave 1 complete: TASK-01, TASK-03, TASK-04)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: shadcn-components-json-monorepo
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# shadcn CLI Monorepo — components.json for packages/ui

## Summary

`packages/ui` has no `components.json`, so every new shadcn component must be manually copied.
The shadcn CLI v4's `--cwd` flag supports writing into non-app packages, enabling
`components.json` to live at `packages/ui/components.json` and point the CLI at
`packages/ui/src/components/atoms/shadcn/`. This plan establishes the config file, the required
`src/lib/utils.ts` shim for the `cn` alias, installs the missing `class-variance-authority`
dependency, fixes an existing named export gap in `packages/ui/package.json` for the
`@acme/ui/components/atoms/shadcn` bare barrel path, and validates the full setup with a dry-run.

## Active tasks

- [x] TASK-01: Add `class-variance-authority` dependency
- [x] TASK-02: Fix `@acme/ui/components/atoms/shadcn` named export gap
- [x] TASK-03: Create `src/lib/utils.ts` cn shim
- [x] TASK-04: Create `src/styles/shadcn-globals.css` placeholder
- [x] TASK-05: Write `packages/ui/components.json`
- [x] TASK-06: Validate with CLI dry-run
- [x] TASK-07: Add utils shim test + update wrappers smoke test
- [x] TASK-08: Document workflow in `packages/ui/AGENTS.md`

## Goals

- Establish `packages/ui/components.json` so `npx shadcn@latest add <component> --cwd packages/ui` works without manual edits to generated files
- Fix the existing `@acme/ui/components/atoms/shadcn` export gap (live consumer in CMS)
- Install `class-variance-authority` (new shadcn v4 components depend on it)
- Provide the `src/lib/utils.ts` shim so CLI-generated `import { cn } from "@/lib/utils"` resolves correctly
- Document the developer workflow for future component additions

## Non-goals

- Replacing existing shadcn wrapper implementations (`Button.tsx`, `AlertDialog.tsx`, etc.)
- Adopting shadcn CSS variable theme injection (repo uses its own token system)
- Modifying any app-level `globals.css` or `tailwind.config.mjs`
- Installing all available shadcn components (on-demand only)
- Adding Turbopack `resolveAlias` entries

## Constraints & Assumptions

- Constraints:
  - `components.json` must live at `packages/ui/components.json` — CLI reads from `--cwd` root
  - `tailwind.cssVariables: false` — prevents CSS variable injection that would conflict with `packages/themes/base/tokens.css`
  - `src/lib/utils.ts` must re-export from `../utils/style/cn` — do not duplicate or move `cn`
  - No new Turbopack `resolveAlias` entries allowed
  - `pnpm install` must run after adding `class-variance-authority`
- Assumptions:
  - `tailwind.config` field in `components.json` accepts `""` (empty string) when no per-package config exists — validated by TASK-06 dry-run
  - `tailwind.css` pointing to `src/styles/shadcn-globals.css` satisfies the required schema field without triggering unwanted CSS injection when `cssVariables: false`
  - CLI-generated files import `cn` from `@/lib/utils` by default; the `@/*` → `./src/*` alias makes this resolve to `src/lib/utils.ts`

## Inherited Outcome Contract

- **Why:** The shadcn CLI is the fastest path to new components and tracks upstream updates
  automatically, but the monorepo layout (components in `packages/ui`, not any app) makes the
  standard CLI setup inapplicable. A `components.json` pointing the CLI at `packages/ui` needs to
  be designed correctly — the right alias paths and CSS target for this monorepo structure are an
  open question that needs investigation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A working `components.json` established in `packages/ui`; the
  shadcn CLI can install new components directly into `packages/ui/src/components/atoms/shadcn/`
  with correct alias resolution; the approach documented for future component additions.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/shadcn-components-json-monorepo/fact-find.md`
- Key findings used:
  - `shadcn info --cwd packages/ui` detects tsconfig correctly — CLI is not app-only
  - `@/*` → `./src/*` in `packages/ui/tsconfig.json` makes `@/lib/utils` → `src/lib/utils.ts`
  - `class-variance-authority` is absent from the entire monorepo — must be added explicitly
  - `packages/ui/package.json` `./components/atoms/*` wildcard does not cover bare barrel `@acme/ui/components/atoms/shadcn` — maps to non-existent `.shadcn.js`; live consumer in CMS test
  - `cssVariables: false` + `style: "new-york"` + `baseColor: "neutral"` is the correct combination to avoid CSS token conflict

## Proposed Approach

- Option A: Write `components.json` by hand with known field values, validate via dry-run.
- Option B: Run `npx shadcn@latest init --cwd packages/ui` interactively to generate `components.json`.
- Chosen approach: **Option A** — hand-write `components.json` with the values derived during
  fact-find. Interactive `init` would require a TTY and could overwrite files. Hand-writing gives
  precise control, and the dry-run in TASK-06 validates the result non-destructively.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes (re-run 2026-03-06 — file overlap dep added: TASK-02 depends on TASK-01)
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID  | Type      | Description                                          | Confidence | Effort | Status  | Depends on                       | Blocks                    |
|----------|-----------|------------------------------------------------------|:----------:|:------:|---------|----------------------------------|---------------------------|
| TASK-01  | IMPLEMENT | Add `class-variance-authority` dep + pnpm install   | 95%        | S      | Complete (2026-03-06) | -                                | TASK-02, TASK-05, TASK-06 |
| TASK-02  | IMPLEMENT | Fix `./components/atoms/shadcn` named export gap    | 90%        | S      | Complete (2026-03-06) | TASK-01 (file overlap: package.json) | TASK-05, TASK-06, TASK-07 |
| TASK-03  | IMPLEMENT | Create `src/lib/utils.ts` cn shim                   | 95%        | S      | Complete (2026-03-06) | -                                | TASK-05, TASK-06          |
| TASK-04  | IMPLEMENT | Create `src/styles/shadcn-globals.css` placeholder  | 90%        | S      | Complete (2026-03-06) | -                                | TASK-05                   |
| TASK-05  | IMPLEMENT | Write `packages/ui/components.json`                 | 85%        | S      | Complete (2026-03-06) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06                 |
| TASK-06  | IMPLEMENT | Validate with CLI dry-run + typecheck               | 85%        | S      | Complete (2026-03-06) | TASK-01, TASK-02, TASK-03, TASK-05 | TASK-07, TASK-08        |
| TASK-07  | IMPLEMENT | Add utils shim test + update wrappers smoke test    | 90%        | S      | Complete (2026-03-06) | TASK-02, TASK-06                 | -                         |
| TASK-08  | IMPLEMENT | Document workflow in `packages/ui/AGENTS.md`        | 95%        | S      | Complete (2026-03-06) | TASK-06                          | -                         |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks                        | Prerequisites                       | Notes                                                        |
|------|------------------------------|-------------------------------------|--------------------------------------------------------------|
| 1    | TASK-01, TASK-03, TASK-04    | -                                   | Independent; TASK-01 installs dep, TASK-03/04 create new files |
| 2    | TASK-02                      | TASK-01                             | Must follow TASK-01 due to shared `package.json` file overlap |
| 3    | TASK-05                      | TASK-01, TASK-02, TASK-03, TASK-04  | Writes `components.json` — all prerequisite files must exist  |
| 4    | TASK-06                      | TASK-01, TASK-02, TASK-03, TASK-05  | CLI dry-run validation; all config in place                   |
| 5    | TASK-07, TASK-08             | TASK-06                             | Tests + docs after validation passes; run in parallel         |

**Max parallelism:** 3 (Wave 1: TASK-01, TASK-03, TASK-04)
**Critical path:** TASK-01 → TASK-02 → TASK-05 → TASK-06 → TASK-07 (5 waves)
**Total tasks:** 8

## Tasks

---

### TASK-01: Add `class-variance-authority` dependency

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/ui/package.json` with `class-variance-authority` in `dependencies`; `pnpm-lock.yaml` updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/ui/package.json`, `pnpm-lock.yaml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-05, TASK-06
- **Build evidence (2026-03-06):**
  - Route: Codex offload (CODEX_OK=1); exit code 0
  - `class-variance-authority: ^0.7.1` added to `dependencies` at line 352 (alphabetical between chart.js and clsx)
  - `pnpm install` completed: `Packages: +1`, no peer conflict errors
  - TC-01: `grep class-variance-authority packages/ui/package.json` → matches dependencies block ✓
  - TC-02: `packages/ui/node_modules/class-variance-authority/dist/index.js` exists ✓
  - TC-03: `pnpm --filter @acme/ui typecheck` → 0 errors ✓
  - Post-build validation: Mode 2 (Data Simulation) — Pass, attempt 1
  - Commit: c89ce82ad9 (Wave 1 with TASK-03, TASK-04)
- **Confidence:** 95%
  - Implementation: 95% — adding a dep to package.json is a mechanical operation; `class-variance-authority` is a well-known stable package
  - Approach: 95% — explicit dep declaration is the only correct approach (hoisting not reliable)
  - Impact: 95% — low blast radius; new dep available to downstream apps via Turbopack src bundling
- **Acceptance:**
  - `class-variance-authority` appears in `packages/ui/package.json` `dependencies` block
  - `pnpm install` completes without errors
  - `node_modules/class-variance-authority` exists and has a `dist/index.js`
- **Validation contract (TC-XX):**
  - TC-01: `grep class-variance-authority packages/ui/package.json` → matches in `"dependencies"` block
  - TC-02: `ls packages/ui/node_modules/class-variance-authority/dist/index.js` → file exists (or via root hoisted location)
  - TC-03: `pnpm --filter @acme/ui typecheck` after adding dep → no new type errors related to `cva`
- **Execution plan:** Add `"class-variance-authority": "^0.7.1"` (latest stable) to `dependencies` in `packages/ui/package.json` → run `pnpm install` from repo root → verify installation
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Check latest version: `npm show class-variance-authority version` before pinning
- **Edge Cases & Hardening:** If pnpm refuses install due to peer dep conflict, check `@radix-ui` peer constraints — `cva` has no Radix peer deps, so conflict is unlikely
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: `pnpm install` from repo root
  - Rollback: remove `class-variance-authority` entry from `packages/ui/package.json` and re-run `pnpm install`
- **Documentation impact:** None at this step; covered by TASK-08
- **Notes / references:** Latest stable as of 2026-03-06 is `^0.7.1`; the shadcn v4 button component uses it directly.

---

### TASK-02: Fix `@acme/ui/components/atoms/shadcn` named export gap

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/ui/package.json` with explicit `"./components/atoms/shadcn"` named export entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/package.json`
- **Depends on:** TASK-01 (file overlap: `packages/ui/package.json` — both tasks edit the same file; TASK-01 must complete first)
- **Blocks:** TASK-05, TASK-06, TASK-07
- **Build evidence (2026-03-06):**
  - Route: Codex offload (CODEX_OK=1); exit code 0
  - Named entry `"./components/atoms/shadcn"` added at JSON key index 45, before wildcard at index 46
  - TC-01: `node -e "require('./packages/ui/package.json').exports['./components/atoms/shadcn']"` → returns `{types: ..., import: ...}` (not undefined) ✓
  - TC-02: `pnpm --filter @acme/ui typecheck` → 0 errors ✓
  - TC-03: CMS MediaManager.test.tsx resolution fix will be confirmed in CI
  - Post-build validation: Mode 2 (Data Simulation) — Pass, attempt 1
  - Commit: 3e4ed20ccb (Wave 2)
- **Confidence:** 90%
  - Implementation: 90% — adding a named export entry to `package.json` is mechanical; exact paths confirmed in fact-find
  - Approach: 95% — named export is the correct fix; wildcard `./components/atoms/*` cannot resolve directory index files
  - Impact: 90% — fixes existing defect; CMS test consumer (`MediaManager.test.tsx:181`) will benefit; no other callers broken
- **Acceptance:**
  - `packages/ui/package.json` contains explicit `"./components/atoms/shadcn"` entry with `types: "./dist/components/atoms/shadcn/index.d.ts"` and `import: "./dist/components/atoms/shadcn/index.js"`
  - `pnpm --filter @acme/ui typecheck` passes
  - Importing `@acme/ui/components/atoms/shadcn` in a test resolves to `dist/components/atoms/shadcn/index.js`
- **Validation contract (TC-XX):**
  - TC-01: `node -e "require('./packages/ui/package.json').exports['./components/atoms/shadcn']"` → returns the export object (not `undefined`)
  - TC-02: `pnpm --filter @acme/ui typecheck` → no errors related to `shadcn` subpath
  - TC-03: `apps/cms` Jest run for `MediaManager.test.tsx` → passes without mock resolution error
- **Execution plan:** Open `packages/ui/package.json`; in the `exports` map, add a named entry `"./components/atoms/shadcn"` before the existing `"./components/atoms/*"` wildcard entry (named entries take precedence over wildcards in Node.js). Entry:
  ```json
  "./components/atoms/shadcn": {
    "types": "./dist/components/atoms/shadcn/index.d.ts",
    "import": "./dist/components/atoms/shadcn/index.js"
  }
  ```
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Verify that `dist/components/atoms/shadcn/index.js` exists at build time — it does (confirmed in fact-find via `ls packages/ui/dist/components/atoms/shadcn/index.js`).
- **Edge Cases & Hardening:** The named export must be placed before the wildcard `"./components/atoms/*"` in the JSON object to take precedence. Verify ordering after edit.
- **What would make this >=90%:** Already at 90%. Raise to 95% by confirming no other bare barrel imports exist beyond the known CMS consumer (`grep -r "@acme/ui/components/atoms/shadcn\"" apps/`).
- **Rollout / rollback:**
  - Rollout: JSON edit only; no install step needed
  - Rollback: remove the added entry from `package.json`
- **Documentation impact:** None at this step
- **Notes / references:** Node.js resolves named exports before wildcard patterns — placement order matters in the JSON map only in legacy CJS contexts; ESM export map uses object key order for matching, so named must precede wildcard.

---

### TASK-03: Create `src/lib/utils.ts` cn shim

- **Type:** IMPLEMENT
- **Deliverable:** New file `packages/ui/src/lib/utils.ts` that re-exports `cn` from `../utils/style/cn`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/ui/src/lib/utils.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-05, TASK-06
- **Build evidence (2026-03-06):**
  - Route: Inline (trivial single-line file create)
  - File created with: `export { cn } from "../utils/style/cn";`
  - TC-01: `pnpm --filter @acme/ui typecheck` → 0 errors ✓
  - TC-02: Unit test in TASK-07 will confirm cn("a", "b") → "a b" via shim
  - TC-03: Typecheck with relative import confirmed via pre-commit hook turbo typecheck
  - Post-build validation: Mode 2 (Data Simulation) — Pass, attempt 1
  - Commit: c89ce82ad9 (Wave 1 with TASK-01, TASK-04)
- **Confidence:** 95%
  - Implementation: 95% — trivial single-line re-export; `cn` is already exported from `../utils/style/cn`
  - Approach: 95% — shadcn convention is `@/lib/utils`; `@/*` → `src/*` in local tsconfig makes this the correct location
  - Impact: 95% — only adds a new re-export; does not change `cn` implementation
- **Acceptance:**
  - `packages/ui/src/lib/utils.ts` exports `cn`
  - `import { cn } from "@/lib/utils"` (within `packages/ui/src/`) resolves to the existing `extendTailwindMerge`-based function
  - `pnpm --filter @acme/ui typecheck` passes
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @acme/ui typecheck` → no errors on the new file
  - TC-02: Unit test in TASK-07 confirms `cn("a", "b")` returns `"a b"` via the shim
  - TC-03: CLI-generated component that imports `@/lib/utils` typechecks without TS2307 errors
- **Execution plan:**
  ```ts
  // packages/ui/src/lib/utils.ts
  export { cn } from "../utils/style/cn";
  ```
  Single re-export. The `../utils/style/cn` path is relative from `src/lib/` → `src/utils/style/cn.ts` which exports `cn`.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Confirm `src/utils/style/cn.ts` exports `cn` as a named export (confirmed in fact-find — `export function cn(...)`).
- **Edge Cases & Hardening:** The `src/lib/` directory already exists with other utility files — no directory creation needed. Do not export other symbols from this shim to keep it narrow.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Create file; rebuild is not needed for typecheck (TypeScript resolves source)
  - Rollback: Delete `packages/ui/src/lib/utils.ts`
- **Documentation impact:** None at this step; shadcn convention documented by TASK-08
- **Notes / references:** `packages/ui/src/lib/` already contains `buildCfImageUrl.ts`, `getIntrinsicSize.ts`, `products.ts`, `useThemePalette.ts` — the directory is established.

---

### TASK-04: Create `src/styles/shadcn-globals.css` placeholder

- **Type:** IMPLEMENT
- **Deliverable:** New file `packages/ui/src/styles/shadcn-globals.css` — minimal CSS, no token injection
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/ui/src/styles/shadcn-globals.css` (new)
- **Depends on:** -
- **Blocks:** TASK-05
- **Build evidence (2026-03-06):**
  - Route: Inline (trivial comment-only CSS file create)
  - File created with 4-line comment block; no CSS variable declarations
  - TC-01: File exists at expected path ✓
  - TC-02: TASK-06 dry-run will confirm field accepted (not yet run)
  - Post-build validation: Mode 2 (Data Simulation) — Pass, attempt 1 (file existence verified)
  - Commit: c89ce82ad9 (Wave 1 with TASK-01, TASK-03)
- **Confidence:** 90%
  - Implementation: 90% — creating an intentionally minimal CSS file
  - Approach: 85% — `tailwind.css` field must point to a real file; the placeholder approach avoids injection conflict. Minor uncertainty: whether the CLI errors if the file has no `@import "tailwindcss"` directive
  - Impact: 95% — no runtime effect; file is referenced only by `components.json` for CLI scaffolding purposes
- **Acceptance:**
  - `packages/ui/src/styles/shadcn-globals.css` exists
  - File contains `/* shadcn placeholder — no token injection */` comment and optionally `@import "tailwindcss";`
  - No CSS variables are defined in this file
- **Validation contract (TC-XX):**
  - TC-01: File exists at expected path
  - TC-02: TASK-06 dry-run does not error on `tailwind.css` path resolution
- **Execution plan:** Create `packages/ui/src/styles/shadcn-globals.css` with content:
  ```css
  /* shadcn placeholder — no token injection.
     This file satisfies components.json tailwind.css requirement.
     Token system is in packages/themes/base/tokens.css (imported per-app). */
  ```
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** The `src/styles/` directory already exists (`builder.css`, `typography.css`, `forms.css`) — no directory creation needed.
- **Edge Cases & Hardening:** If the CLI requires `@import "tailwindcss"` to be present, add it; the file is never imported at runtime, so it has no effect on app CSS.
- **What would make this >=90%:** Dry-run in TASK-06 confirms field is accepted without errors → raises to 95%.
- **Rollout / rollback:**
  - Rollout: Create file
  - Rollback: Delete file (also update `components.json` in TASK-05 rollback)
- **Documentation impact:** None
- **Notes / references:** Existing CSS files in `src/styles/`: `builder.css` (loket nav helpers, responsive visibility), `typography.css`, `forms.css`.

---

### TASK-05: Write `packages/ui/components.json`

- **Type:** IMPLEMENT
- **Deliverable:** New file `packages/ui/components.json` with all required shadcn schema fields
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/components.json` (new)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — all required field values are known from fact-find; one minor unknown is the exact `tailwind.config` value (`""` vs relative path)
  - Approach: 90% — `new-york` style, `neutral` base color, `cssVariables: false`, alias paths all confirmed
  - Impact: 90% — no runtime effect; scaffolding config only
- **Acceptance:**
  - `packages/ui/components.json` exists and is valid JSON conforming to `https://ui.shadcn.com/schema.json`
  - `npx shadcn@latest info --cwd packages/ui` reports Tailwind config and CSS detected (or at minimum no error on `tailwind.css` path)
  - `aliases.utils` resolves to `packages/ui/src/lib/utils.ts`
  - `aliases.ui` resolves to `packages/ui/src/components/atoms/shadcn`
- **Validation contract (TC-XX):**
  - TC-01: `npx shadcn@latest info --cwd packages/ui` → no `No components.json found` output
  - TC-02: `cat packages/ui/components.json | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['aliases']['utils'] == '@/lib/utils'"` → no assertion error
  - TC-03: `cat packages/ui/components.json | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['aliases']['ui'] == '@/components/atoms/shadcn'"` → no assertion error
  - TC-04: `tailwind.cssVariables == false` in parsed JSON
- **Execution plan:**
  Write `packages/ui/components.json`:
  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
      "config": "",
      "css": "src/styles/shadcn-globals.css",
      "baseColor": "neutral",
      "cssVariables": false
    },
    "iconLibrary": "lucide",
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/atoms/shadcn",
      "lib": "@/lib",
      "hooks": "@/hooks"
    }
  }
  ```
  Note: `tailwind.config` is `""` (empty string) because `packages/ui` has no per-package `tailwind.config.mjs`. If the CLI rejects empty string, use `"tailwind.config.mjs"` (relative to `packages/ui/` pointing at repo root via symlink or path traversal) — TASK-06 dry-run validates this.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** `iconLibrary: "lucide"` — `lucide-react` is already a peer dependency of `packages/ui` (`package.json:373`).
- **Edge Cases & Hardening:**
  - If `tailwind.config: ""` causes a CLI error, fallback is `"../../tailwind.config.mjs"` (relative from `packages/ui/` to repo root).
  - `rsc: false` — `packages/ui` uses `"use client"` on shadcn components; RSC is not applicable here.
- **What would make this >=90%:** TASK-06 dry-run confirms CLI accepts the exact field values without errors → raises to 92%.
- **Rollout / rollback:**
  - Rollout: Create file; no install or build step needed
  - Rollback: Delete `packages/ui/components.json`
- **Documentation impact:** None at this step; TASK-08 documents the workflow
- **Notes / references:** `@/components` → `src/components` (for general component output); `@/components/atoms/shadcn` → specific shadcn target directory for `aliases.ui`.

---

### TASK-06: Validate with CLI dry-run and typecheck

- **Type:** IMPLEMENT
- **Deliverable:** Confirmed working CLI path; passing typecheck; any required fixups applied to `components.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/ui/components.json` (may update), `packages/ui/tsconfig.tsbuildinfo` (rebuilt)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-05
- **Blocks:** TASK-07, TASK-08
- **Build evidence (2026-03-06):**
  - Route: Inline CLI validation
  - TC-01: `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` → exit 0; badge.tsx would be written to `src/components/atoms/shadcn/` ✓
  - TC-02: `npx shadcn@latest info --cwd packages/ui` → `tailwindCss: /…/src/styles/shadcn-globals.css` (resolved, not `-`); `tailwindConfig: -` (acceptable — empty string treated as no config) ✓
  - TC-03: `pnpm --filter @acme/ui typecheck` → 0 errors ✓
  - TC-04: `--view` output shows `import { cn } from "@/lib/utils"` and `import { cva } from "class-variance-authority"` in generated badge.tsx ✓
  - Assumption confirmed: `tailwind.config: ""` is accepted by CLI v4 (no error). TASK-05 confidence raised to 92%.
  - Post-build validation: Mode 2 (Data Simulation) — Pass, attempt 1
  - No files modified by dry-run (non-destructive as expected)
- **Confidence:** 85%
  - Implementation: 85% — dry-run is non-destructive; only uncertainty is whether `tailwind.config: ""` is accepted
  - Approach: 90% — `--dry-run` flag confirmed supported by shadcn CLI v4.0.0
  - Impact: 90% — validation step; no production change if dry-run fails
- **Acceptance:**
  - `npx shadcn@latest add badge --cwd packages/ui --dry-run` completes without error and shows files that would be written to `src/components/atoms/shadcn/`
  - `npx shadcn@latest info --cwd packages/ui` no longer reports "No components.json found"
  - `pnpm --filter @acme/ui typecheck` passes after TASK-01–05 changes
  - If `tailwind.config: ""` causes an error: update `components.json` with corrected value and re-run
- **Validation contract (TC-XX):**
  - TC-01: `npx shadcn@latest add badge --cwd packages/ui --dry-run` → exit code 0; output shows `badge.tsx` would be written to `src/components/atoms/shadcn/`
  - TC-02: `npx shadcn@latest info --cwd packages/ui` → `tailwindConfig` and `tailwindCss` fields are populated (not `-`)
  - TC-03: `pnpm --filter @acme/ui typecheck` → 0 type errors on new files
  - TC-04: Generated badge dry-run output shows `import { cn } from "@/lib/utils"` — confirms alias resolution
- **Execution plan:**
  1. Run `npx shadcn@latest info --cwd packages/ui` — confirm config detected
  2. Run `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` — confirm output paths
  3. If step 2 fails with `tailwind.config` error, update field to `"../../tailwind.config.mjs"` and retry
  4. Run `pnpm --filter @acme/ui typecheck` — confirm zero new type errors
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** `badge` component was chosen as the test target because it is simple (single file, uses `cn` and `cva`), confirming both alias dependencies work.
- **Edge Cases & Hardening:** If `--dry-run` is not fully supported for all CLI versions and still writes files, use `--diff` flag to inspect output without writing. Verify with `git status` post-run.
- **What would make this >=90%:** Dry-run completes without any field errors on first attempt → raises approach confidence to 95%, overall to 90%.
- **Rollout / rollback:**
  - Rollout: Non-destructive validation; no files written by dry-run
  - Rollback: Revert any `components.json` field corrections made during this task
- **Documentation impact:** None; TASK-08 documents findings
- **Notes / references:** `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` — `--yes` skips interactive prompts.

---

### TASK-07: Add utils shim test and update wrappers smoke test

- **Type:** IMPLEMENT
- **Deliverable:** New test in `packages/ui/src/lib/__tests__/utils.test.ts`; updated `wrappers.test.tsx` smoke test comment confirming export path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/lib/__tests__/utils.test.ts` (new), `packages/ui/src/components/atoms/shadcn/__tests__/wrappers.test.tsx` (minor update)
- **Depends on:** TASK-02, TASK-06
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — test pattern mirrors existing `cn.test.ts`; trivial assertions
  - Approach: 90% — follows established `wrappers.test.tsx` smoke test pattern
  - Impact: 90% — adds CI coverage for the new shim and export fix; does not change behavior
- **Acceptance:**
  - `packages/ui/src/lib/__tests__/utils.test.ts` exists and tests that `cn` exported from `@/lib/utils` (or relative `../../lib/utils`) merges Tailwind classes correctly
  - Test suite for `packages/ui` passes (CI only — do not run locally per CLAUDE.md policy)
  - `wrappers.test.tsx` continues to pass after the named export fix in TASK-02
- **Validation contract (TC-XX):**
  - TC-01: `utils.test.ts` — `cn("px-4", "px-2")` → `"px-2"` (tailwind-merge deduplication via the custom `extendTailwindMerge`)
  - TC-02: `utils.test.ts` — `cn("bg-primary", "bg-accent")` → `"bg-accent"` (custom THEME_COLOR_TOKENS enable proper dedup)
  - TC-03: `wrappers.test.tsx` still passes (no regressions from TASK-02 export fix)
- **Execution plan:**
  Create `packages/ui/src/lib/__tests__/utils.test.ts`:
  ```ts
  import { cn } from "../utils";

  describe("cn shim", () => {
    it("re-exports cn from utils/style/cn", () => {
      expect(cn("px-4", "px-2")).toBe("px-2");
    });
    it("handles custom theme tokens", () => {
      expect(cn("bg-primary", "bg-accent")).toBe("bg-accent");
    });
  });
  ```
  No changes to `wrappers.test.tsx` content needed — just confirm it still passes after TASK-02.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Check `packages/ui/src/lib/__tests__/` directory exists — it does (confirmed earlier in fact-find investigation).
- **Edge Cases & Hardening:** The `cn` custom token deduplication behavior depends on `THEME_COLOR_TOKENS` including `"primary"` and `"accent"` — verified in `cn.ts` source.
- **What would make this >=90%:** Already at 90%. Raise to 95% once CI run passes.
- **Rollout / rollback:**
  - Rollout: Committed test files; CI validates them
  - Rollback: Delete the new test file (wrappers.test.tsx is unchanged)
- **Documentation impact:** None
- **Notes / references:** Test command (CI only): `pnpm -w run test:governed -- jest -- --config=packages/ui/jest.config.cjs --testPathPattern=src/lib/__tests__/utils`

---

### TASK-08: Document workflow in `packages/ui/AGENTS.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/ui/AGENTS.md` with a "Adding shadcn components" section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/AGENTS.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — doc-only change
  - Approach: 95% — workflow is fully validated by TASK-06 before this runs
  - Impact: 95% — documents confirmed working procedure
- **Acceptance:**
  - `packages/ui/AGENTS.md` contains a "Adding shadcn components" section
  - Section includes: the exact CLI command, reminder to add to `index.ts` barrel, reminder to add a smoke test, note that `cssVariables: false` is intentional
- **Validation contract (TC-XX):**
  - TC-01: `grep "shadcn" packages/ui/AGENTS.md` → matches in the new section
  - TC-02: Section includes `npx shadcn@latest add <component> --cwd packages/ui --yes`
- **Execution plan:**
  Add to `packages/ui/AGENTS.md` after the existing "TypeScript Build Contract" section:

  ```markdown
  ## Adding shadcn components

  Use the CLI to scaffold new components into the shared package:

  ```sh
  npx shadcn@latest add <component> --cwd packages/ui --yes
  ```

  After the CLI writes the file:
  1. Add the component to `src/components/atoms/shadcn/index.ts` (CLI does not update barrels)
  2. Add a smoke render test in `src/components/atoms/shadcn/__tests__/` following the pattern in `wrappers.test.tsx`
  3. Update the exports map in `package.json` if the component needs a named subpath export

  **Notes:**
  - `cssVariables: false` in `components.json` is intentional — the design token system in `packages/themes/base/tokens.css` handles theming; do not change this setting
  - `tailwind.baseColor: "neutral"` — new components will use neutral as the default; override via className as needed
  - CLI-generated files import `cn` from `@/lib/utils` — this resolves to `src/lib/utils.ts` which re-exports from `src/utils/style/cn.ts`
  ```
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None
- **Edge Cases & Hardening:** None
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Commit doc update
  - Rollback: Revert AGENTS.md changes
- **Documentation impact:** This task is the documentation impact
- **Notes / references:** `packages/ui/AGENTS.md` currently has sections: Purpose, File Organization Guidance, TypeScript Build Contract, Clean & Rebuild, Common Errors, CI Expectations.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add class-variance-authority dep | Yes | None | No |
| TASK-02: Fix named export gap | Yes | None | No |
| TASK-03: Create src/lib/utils.ts shim | Yes — src/lib/ dir confirmed to exist | None | No |
| TASK-04: Create shadcn-globals.css placeholder | Yes — src/styles/ dir confirmed to exist | None | No |
| TASK-05: Write components.json | Partial — depends on TASK-01 (dep), TASK-03 (alias target), TASK-04 (css path); all precursor tasks specified as dependencies | Minor: if `tailwind.config: ""` is rejected, fallback path is `"../../tailwind.config.mjs"` — handled by TASK-06 fixup loop | No |
| TASK-06: CLI dry-run validation | Yes — depends on TASK-01, TASK-02, TASK-03, TASK-05 all complete | Minor: dry-run requires network access to `ui.shadcn.com` registry; if offline, use `--diff` fallback | No |
| TASK-07: Add utils shim test | Yes — src/lib/__tests__/ dir confirmed to exist; depends on TASK-06 for validation | None | No |
| TASK-08: Document in AGENTS.md | Yes — depends on TASK-06 (workflow validated before documenting) | None | No |

## Delivery Rehearsal

**Data lens:** No database records or seed data required. All work is file-based config and source code.

**Process/UX lens:** No user-visible flow changes. This is a developer tooling change only — the "user" is the developer running `npx shadcn@latest add`. The workflow is fully specified in TASK-08.

**Security lens:** No auth boundaries introduced or modified. `components.json` is a scaffolding config with no runtime exposure.

**UI lens:** No UI components modified or introduced in this plan. TASK-07 adds tests for an existing utility; TASK-08 is documentation. No rendering path specification needed.

Adjacent-scope items surfaced during delivery rehearsal: None.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `tailwind.config: ""` rejected by CLI | Medium | Low | TASK-06 validates; fallback to `"../../tailwind.config.mjs"` |
| CLI dry-run requires network to shadcn registry | Medium | Low | Use cached version or `--diff` flag; TASK-06 notes this |
| `class-variance-authority` version conflict with `tailwind-merge` | Low | Low | Both are well-maintained; no known peer conflict |
| TASK-02 export ordering breaks existing wildcard resolution | Low | Low | Named exports take precedence over wildcards in the exports map; verify with TC-01 |
| New `src/lib/utils.ts` conflicts with future utility in that path | Low | Low | File is narrow (single re-export); TASK-08 documents the convention |

## Observability

- Logging: None: config-only change
- Metrics: None: config-only change
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `packages/ui/components.json` exists and `npx shadcn@latest info --cwd packages/ui` reports no missing config
- [ ] `npx shadcn@latest add badge --cwd packages/ui --dry-run --yes` exits 0 with expected output paths
- [ ] `packages/ui/src/lib/utils.ts` exports `cn` and tests pass in CI
- [ ] `packages/ui/package.json` has explicit `"./components/atoms/shadcn"` named export
- [ ] `class-variance-authority` is in `packages/ui/package.json` `dependencies`
- [ ] `pnpm --filter @acme/ui typecheck` passes with zero new errors
- [ ] `packages/ui/AGENTS.md` documents the `npx shadcn@latest add` workflow

## Decision Log

- 2026-03-06: Chosen approach is Option A (hand-write `components.json`) over Option B (interactive init) — gives precise control and avoids TTY requirement.
- 2026-03-06: `style: "new-york"` chosen — most complete style in shadcn v4.
- 2026-03-06: `tailwind.cssVariables: false` — prevents CSS token injection conflict with `packages/themes/base/tokens.css`.
- 2026-03-06: Existing shadcn wrappers (`Button.tsx`, `AlertDialog.tsx`, etc.) are NOT replaced — scope is new additions only. Per fact-find open question, default assumption (safer option) used.
- 2026-03-06: `tailwind.config: ""` (empty string) chosen as first attempt; TASK-06 validates. Fallback is `"../../tailwind.config.mjs"`.

## Overall-confidence Calculation

All tasks are S effort (weight=1). Task confidence values (min of Implementation, Approach, Impact):
- TASK-01: min(95,95,95) = 95%
- TASK-02: min(90,95,90) = 90%
- TASK-03: min(95,95,95) = 95%
- TASK-04: min(90,85,95) = 85%
- TASK-05: min(85,90,90) = 85%
- TASK-06: min(85,90,90) = 85%
- TASK-07: min(90,90,90) = 90%
- TASK-08: min(95,95,95) = 95%

Overall = (95+90+95+85+85+85+90+95) / 8 = 720/8 = **90%**

(All S weight=1, so simple average. Confidence-Method: min(Implementation,Approach,Impact) per task; overall = effort-weighted average.)

Overall-confidence: **90%** (updated from frontmatter estimate of 87% — tasks all landed higher after full task-by-task scoring).
