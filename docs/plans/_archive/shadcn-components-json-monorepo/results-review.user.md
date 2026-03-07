---
Type: Results-Review
Status: Draft
Feature-Slug: shadcn-components-json-monorepo
Review-date: 2026-03-06
artifact: results-review
---

# Results Review

## Observed Outcomes

All 8 plan tasks completed in a single build session (2026-03-06) across 4 commits.

`packages/ui/components.json` was written with `style: "new-york"`, `cssVariables: false`, `tailwind.config: ""`, and alias paths for cn, ui barrel, and hooks. The shadcn CLI dry-run (`npx shadcn@latest add badge --cwd packages/ui --dry-run --yes`) exits 0 and targets the correct output path `src/components/atoms/shadcn/badge.tsx` with both `import { cn } from "@/lib/utils"` and `import { cva } from "class-variance-authority"` resolving correctly.

`class-variance-authority@^0.7.1` was added to `packages/ui` dependencies and the lockfile updated.

The `@acme/ui/components/atoms/shadcn` named export gap was fixed: a named entry now precedes the wildcard in the exports map, resolving the ESM wildcard pattern issue where `shadcn` mapped to `shadcn.js` (non-existent) rather than `shadcn/index.js`.

The `src/lib/utils.ts` cn shim and `src/styles/shadcn-globals.css` placeholder were created. The shim satisfies the `@/lib/utils` alias convention used by all shadcn CLI-generated files. The CSS placeholder carries a comment explaining the intentional empty state.

Two unit tests for the cn shim were added to `src/lib/__tests__/utils.test.ts` covering Tailwind Merge conflict resolution and custom token handling.

`packages/ui/AGENTS.md` now documents the complete workflow for adding new shadcn components: CLI command, 3-step post-add checklist (barrel, smoke test, exports map), and intent notes for each config decision that might otherwise be misread as misconfiguration.

- TASK-01: Complete (2026-03-06) — Add class-variance-authority dep + pnpm install
- TASK-02: Complete (2026-03-06) — Fix ./components/atoms/shadcn named export gap
- TASK-03: Complete (2026-03-06) — Create src/lib/utils.ts cn shim
- TASK-04: Complete (2026-03-06) — Create src/styles/shadcn-globals.css placeholder
- TASK-05: Complete (2026-03-06) — Write packages/ui/components.json
- TASK-06: Complete (2026-03-06) — Validate with CLI dry-run + typecheck
- TASK-07: Complete (2026-03-06) — Add utils shim test + update wrappers smoke test
- TASK-08: Complete (2026-03-06) — Document workflow in packages/ui/AGENTS.md
- 8 of 8 tasks completed.

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** A working components.json in packages/ui so npx shadcn@latest add <component> --cwd packages/ui installs new components directly into packages/ui/src/components/atoms/shadcn/ with correct alias resolution and no manual post-edit needed. Workflow documented in packages/ui/AGENTS.md.
- **Observed:** `packages/ui/components.json` is live. CLI dry-run exits 0 with badge.tsx targeting the correct path and both alias imports resolving. The `@/lib/utils` cn alias, `class-variance-authority` dep, and named export gap fix are all in place. `packages/ui/AGENTS.md` documents the full workflow with CLI command, post-add steps, and config intent notes.
- **Verdict:** Met
- **Notes:** All 8 tasks completed successfully. No scope deviations. Pre-commit hooks passed on all commits.
