---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: reception-rounded-lg-lint-rule
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-rounded-lg-lint-rule/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260226-0017
Trigger-Why: Bare `rounded` violations recurred across all 4 phases of reception UI polish (12+ per phase); no automated gate exists to prevent reintroduction after each manual fix pass
Trigger-Intended-Outcome: operational | statement: ESLint rule added to eslint.config.mjs that blocks bare `rounded` class commits in apps/reception/src/ and zero bare-rounded violations remain in the codebase | source: auto
---

# Reception: rounded-lg Lint Rule — Fact-Find Brief

## Scope

### Summary
Add a lint rule to the reception app's ESLint config that flags bare `rounded` Tailwind classes (which should always be `rounded-lg` per the Phase 1–4 visual standard). Then bulk-fix the ~100 existing violations.

### Goals
- Block new bare `rounded` occurrences in `apps/reception/src/` at commit time
- Eliminate all ~100 existing violations across 34 files
- Keep correct usage (`rounded-lg`, `rounded-full`, etc.) unaffected

### Non-goals
- Enforcing `rounded-lg` across other apps in the monorepo (brikette, business-os, etc.)
- Migrating `rounded-full` or `rounded-md` to `rounded-lg` where semantically different
- Rewriting component APIs to use shape/radius props (`resolveShapeRadiusClass()`)

### Constraints & Assumptions
- Constraints:
  - Reception app is an internal staff tool; `no-console: "off"` rule block shows prior debt relaxations are accepted practice
  - The existing `ds/no-hardcoded-rounded-class` rule is semantically wrong for this purpose — it bans ALL rounded classes including `rounded-lg` and pushes towards `resolveShapeRadiusClass()`
  - Auto-fix for className strings in template literals / conditional clsx expressions is complex; may need manual fix pass
- Assumptions:
  - `rounded-full` is used intentionally in a small number of places (pill buttons, avatars) — those should NOT be auto-corrected to `rounded-lg`
  - `rounded-sm` and `rounded-md` may also be violations per the Phase 1–4 visual standard, but this is deferred pending operator confirmation (see Open Questions)

## Outcome Contract

- **Why:** Bare `rounded` violations recurred in every phase of the reception UI polish (12+ per phase); no gate exists to catch reintroduction. Manual fix passes are not sustainable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** ESLint rule `ds/no-bare-rounded` added to the plugin and enabled for `apps/reception/src/**`. Zero bare-`rounded` violations remain. Rule runs in CI.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `packages/eslint-plugin-ds/src/rules/` — directory for all DS plugin rules; new rule goes here
- `eslint.config.mjs:2383` — `apps/reception/src/**/*.{ts,tsx}` block (LINT-01: Reception app DS rules) — where the new rule gets enabled
- `eslint.config.mjs:1644` — `apps/reception/**` complexity-relaxations block (separate, for non-DS relaxations)

### Key Modules / Files
- `packages/eslint-plugin-ds/src/rules/no-hardcoded-rounded-class.ts` — existing rule; wrong semantics for this use case (flags ALL `rounded*`, pushes `resolveShapeRadiusClass()` pattern, `schema: []` so no config options). Do NOT modify for this task.
- `packages/eslint-plugin-ds/src/index.ts` (or equivalent) — plugin index; new rule must be registered here
- `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts` — **new file to create**
- `packages/eslint-plugin-ds/src/utils/classParser.ts` — `extractFromJsxAttribute` utility; re-use to parse className expressions consistently
- `eslint.config.mjs` — root flat config; single file for all ESLint rules across the monorepo

### Patterns & Conventions Observed
- Plugin pattern: each rule in its own `.ts` file, default-exported `Rule.RuleModule`; imports `extractFromJsxAttribute` from `utils/classParser.js` - evidence: `no-hardcoded-rounded-class.ts`
- Rule schema: `schema: []` for no-options rules is fine; add minimal `schema` if allow-list needed - evidence: existing rules
- Config block pattern: LINT-01 block at line 2383 has detailed comments per rule explaining why each is on/off - evidence: `eslint.config.mjs:2383-2420`
- Violation pattern: bare `rounded` appears as class in: simple string literals (`"border rounded px-2"`), template literals (``` `bg-surface rounded shadow-lg` ```), conditional expressions — evidence: explore agent output

### Data & Contracts
- Types/schemas/events:
  - `Rule.RuleModule` from `eslint` — interface for the new rule
  - `extractFromJsxAttribute` return type: `{ confident: boolean; classes: string[] }` — already used by other rules
- The new rule's AST visitor pattern: `JSXAttribute` node on `className`/`class` attributes, same as `no-hardcoded-rounded-class`

### Dependency & Impact Map
- Upstream dependencies:
  - `packages/eslint-plugin-ds` must be rebuilt/compiled after adding the new rule (`pnpm --filter @acme/eslint-plugin-ds build`)
  - `eslint.config.mjs` references the compiled plugin
- Downstream dependents:
  - All lint runs for `apps/reception/src/**/*.{ts,tsx}` — will see new errors after rule enabled
  - CI (`pnpm lint`) — will fail until all ~100 violations are fixed
- Likely blast radius:
  - Confined to `apps/reception/src/` — no other app is affected
  - ~100 lint errors after enabling, zero after bulk-fix

### Test Landscape

#### Test Infrastructure
- Frameworks: ESLint rule testing via `@eslint/rule-tester` or `eslint` RuleTester
- Commands: `pnpm --filter @acme/eslint-plugin-ds test` (if test suite exists in package)
- CI integration: `pnpm lint` in CI covers rule activation; plugin unit tests may not be in CI

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| DS plugin rules | Unit (RuleTester) | `packages/eslint-plugin-ds/src/__tests__/` (if exists) | Not confirmed — check during build |
| Reception lint compliance | CI lint check | `pnpm lint` | Will fail after enable, pass after fix |

#### Coverage Gaps
- Untested paths:
  - New rule needs at minimum a valid/invalid test case pair
- Extinct tests:
  - None identified

#### Testability Assessment
- Easy to test:
  - Rule behaviour (valid/invalid cases) via RuleTester — pure AST pattern matching
  - End-to-end lint output via `pnpm --filter reception lint`
- Hard to test:
  - Auto-fix correctness in complex template literals / clsx expressions (if auto-fix is implemented)
- Test seams needed:
  - None blocking

#### Recommended Test Approach
- Unit tests for: new `ds/no-bare-rounded` rule — two valid cases (`rounded-lg`, `rounded-full`), two invalid cases (`rounded`, `hover:rounded`)
- Integration tests for: run `pnpm lint` against `apps/reception/src/` before and after violation fix

### Recent Git History (Targeted)
- `packages/eslint-plugin-ds/` — last touched in `3afc6cb0ca` (feat: nextjs-16-upgrade, ESLint fix) and earlier chore commits. No active rule development in-flight.
- `eslint.config.mjs` — last touched in `3afc6cb0ca` (Next 16 ESLint compatibility). No reception-specific changes in recent history.

## Questions

### Resolved
- Q: Why not use `ds/no-hardcoded-rounded-class` (which already exists)?
  - A: The rule flags ALL `rounded*` classes including `rounded-lg` (the correct class). Its error message says "Use shape/radius props and `resolveShapeRadiusClass()`" — a component-API pattern the reception app does not use. Enabling it would produce 1000+ false positives and push towards an architectural change that's out of scope. A new, focused rule is the right tool.
  - Evidence: `packages/eslint-plugin-ds/src/rules/no-hardcoded-rounded-class.ts` — `isRoundedClass` regex matches `rounded-lg`; `schema: []` means no config options.

- Q: Should `rounded-full` also be flagged?
  - A: No. `rounded-full` is semantically different (pill/circular shape) and is used intentionally in chip components (`CheckInDateChip`, `HoursChip`, `ArrivalDateChip`). The rule should only flag bare `rounded` — not any other scale variant.
  - Evidence: explore agent output showing `rounded-full` appears zero times in violation list (only bare `rounded` is flagged).

- Q: Can all ~100 violations be auto-fixed safely?
  - A: Simple string literals can be auto-fixed safely by the rule (replace `rounded` with `rounded-lg` in class strings). Template literal expressions are also parseable via `extractFromJsxAttribute`. However, the auto-fix will be conservative — if `extractFromJsxAttribute` returns `confident: false`, the rule should report without auto-fix. The remaining manual fixes are trivial string replacements.
  - Evidence: Pattern of violations shows ~95% are simple string literals; complex template literals exist but are a minority.

- Q: Does `no-console: "off"` affect the Extension.tsx fix done earlier in this session?
  - A: No. `no-console: "off"` means the linter won't error on console.log — it does not prohibit removal. The debug logs were removed for correctness (they produced noise in production) and `no-console: "off"` was set because the reception app has legitimate console usage for its POS system.
  - Evidence: `eslint.config.mjs:2399` — `"no-console": "off"`.

- Q: Why not use `no-restricted-syntax` instead of a new plugin rule?
  - A: `no-restricted-syntax` with an AST selector works for simple string literals (`className="... rounded ..."`) but cannot parse template literals or `clsx`/`cn()` calls that assemble class strings dynamically. The existing `extractFromJsxAttribute` utility in the plugin handles all those expression types via confident-parse logic. The plugin approach gives full, consistent coverage across all className expression patterns the reception app uses.
  - Evidence: `no-hardcoded-rounded-class.ts` uses `extractFromJsxAttribute` and correctly processes template literals and conditional expressions — same capability reused.

### Open (Operator Input Required)
- Q: Should `rounded-sm` and `rounded-md` also be banned in the reception app?
  - Why operator input is required: This is a design decision — whether smaller radius variants have valid use cases in the reception app, or whether `rounded-lg` should be the only permitted scale.
  - Decision impacted: Scope of the new rule (bare `rounded` only vs. any non-lg rounded variant)
  - Decision owner: operator
  - Default assumption: The new rule flags ONLY bare `rounded` initially. `rounded-sm`/`rounded-md` can be added as follow-on if operator confirms they're also banned.

## Confidence Inputs

- Implementation: **95%** — New rule is ~40 lines, follows exact same pattern as existing rules. Plugin infrastructure is well-established. Only uncertainty is auto-fix edge cases in complex expressions.
  - To confirm 95%: Read plugin index to verify registration pattern; build plugin with no TS errors.
- Approach: **90%** — New `ds/no-bare-rounded` rule (vs. modifying existing or using `no-restricted-syntax`) is clearly the best path given the plugin infrastructure.
  - To reach 90%: Already at 90. Confirm `extractFromJsxAttribute` handles the violation patterns seen.
- Impact: **95%** — Lint rule will catch bare `rounded` at commit time; violation list is fully enumerated.
  - To reach 90%: Already at 95.
- Delivery-Readiness: **95%** — Clear 4-task plan, no external dependencies, no API changes, confined to one app.
  - To reach 90%: Already at 95.
- Testability: **90%** — Rule can be unit-tested with RuleTester; end-to-end verified with `pnpm lint`.
  - To reach 90%: Already at 90.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `extractFromJsxAttribute` returns `confident: false` for some complex template literals, leaving violations unreported | Low | Low | Report without auto-fix for `confident: false` cases; they surface as `warn` for manual attention |
| Auto-fix changes `rounded` inside a CSS variable name or non-class context | Low | Low | Rule checks `isRoundedClass(baseClass)` — same guard as existing rules; false positives tested with RuleTester |
| Plugin rebuild step missed before lint run (stale build) | Medium | Low | Document build step in task instructions; CI always rebuilds |
| Some `rounded-sm`/`rounded-md` usages are intentional (operator hasn't confirmed) | Low | Low | Default to flagging only bare `rounded`; scope is minimal and safe |
| Rule misses programmatic className assembly via `clsx('rounded', ...)` or `cn('rounded', ...)` | Low | Low | Grep of violations found 0 programmatic occurrences — all are JSX attribute strings; acceptance criteria includes `git grep` final verification |

## Planning Constraints & Notes

- Must-follow patterns:
  - New rule file: `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts`
  - Import pattern: `import { extractFromJsxAttribute } from "../utils/classParser.js"` (`.js` extension, not `.ts`)
  - Registration: add to plugin index under `rules` export, same key format as other rules (`"no-bare-rounded"`)
  - Config: add `"ds/no-bare-rounded": "error"` to the LINT-01 reception block at `eslint.config.mjs:2383`
  - Plugin must be rebuilt: `pnpm --filter @acme/eslint-plugin-ds build` before testing
- Rollout/rollback expectations:
  - Enable at `error` level immediately (not `warn`) — violations are all trivial to fix and the list is fully known
  - Rollback: remove rule from config; revert plugin changes
- Observability expectations:
  - `pnpm lint` in CI will fail if new violations are introduced

## Suggested Task Seeds (Non-binding)

- TASK-01: Write `packages/eslint-plugin-ds/src/rules/no-bare-rounded.ts` — new rule flagging bare `rounded` class, suggest `rounded-lg` in message, register in plugin index, build plugin
- TASK-02: Enable `ds/no-bare-rounded: "error"` in `eslint.config.mjs` LINT-01 block for `apps/reception/src/**/*.{ts,tsx}`
- TASK-03: Bulk-fix all ~100 bare `rounded` violations in `apps/reception/src/` (34 files) — run lint `--fix` or targeted search/replace
- TASK-04: Verify `pnpm --filter reception lint` and `pnpm typecheck` both pass clean

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `pnpm --filter reception lint` exits 0 with no bare-`rounded` errors
  - `pnpm typecheck` exits 0
  - `git grep -rn "\brounded\b" apps/reception/src/` returns 0 matches (or only false positives reviewed and justified)
- Post-delivery measurement plan:
  - Lint runs in CI enforce going forward — no periodic check needed

## Evidence Gap Review

### Gaps Addressed
- Plugin index registration pattern: confirmed from existing rules (explore agent found `packages/eslint-plugin-ds/src/index.ts`)
- Violation count: enumerated ~100 instances across 34 files (explore agent, full list)
- Active rule coverage: `no-raw-radius` only catches arbitrary syntax (`rounded-[12px]`), not named scale variants — confirmed from rule source

### Confidence Adjustments
- Implementation raised from 85% to 95% after reading exact rule source and confirming `extractFromJsxAttribute` API is reusable
- No downward adjustments

### Remaining Assumptions
- Plugin test suite location (`packages/eslint-plugin-ds/src/__tests__/`) — not verified; confirm during TASK-01
- `rounded-sm`/`rounded-md` are violations too per the 4-phase design standard, but the rule scope defaults to bare `rounded` only pending operator confirmation

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-rounded-lg-lint-rule --auto`
