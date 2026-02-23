---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Audit-Ref: working-tree (HEAD b1fe18b84f1c88e059dceb9c4f6fc87745bcfcd0)
Relates-to charter: docs/theming-charter.md
Feature-Slug: design-system-depth-and-guardrail-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system, lp-design-qa
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall-confidence is effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
artifact: plan
---

# Design System Depth and Guardrail Hardening Plan

## Summary
This plan hardens the design system in three layers: component depth, safety guardrails, and enforcement reliability. The sequence starts with policy decisions and one investigation to remove uncertainty before touching shared primitives or lint policy. Implementation then lands in foundation-first order: primitive variant depth, reusable overflow containment patterns, validation-gate enforcement for token checks, and lint hardening for operations surfaces. A dedicated migration wave updates the highest-impact operations components to semantic token usage under the tightened rule set, followed by a checkpoint before test/docs hardening and final validation. Build automation is intentionally not auto-triggered in this run (`plan-only`).

## Active tasks
- [x] TASK-01: Decide internal-operations minimum safety baseline
- [x] TASK-02: Decide primitive shape strategy (API vs theme-only)
- [x] TASK-03: Investigate lint/migration inventory and wave boundaries
- [x] TASK-04: Implement primitive shape/radius variant contracts
- [x] TASK-05: Implement shared overflow/bleed containment patterns
- [x] TASK-06: Implement conditional token checks in validation gate
- [x] TASK-07: Implement lint policy hardening for operations surfaces
- [x] TASK-08: Implement operations migration wave 1 to semantic tokens
- [x] TASK-09: Horizon checkpoint - reassess downstream validation scope
- [x] TASK-10: Implement targeted test and lint-fixture hardening
- [x] TASK-11: Implement documentation alignment and policy updates
- [x] TASK-12: Implement final verification and rollout notes

## Goals
- Add first-class primitive depth controls (shape/radius variants) without breaking existing consumers.
- Standardize protection against content bleed in high-risk container primitives.
- Move contrast/drift checks into the default validation path for relevant change sets.
- Replace broad operations lint carve-outs with a minimum safety baseline.
- Migrate high-impact operations components from raw palette classes to semantic token usage.

## Non-goals
- Full repository-wide UI migration in a single pass.
- Rebranding or redesign of visual language outside token/guardrail concerns.
- Changes to startup-loop orchestration or Business OS workflows.
- Auto-build in this planning cycle.

## Constraints & Assumptions
- Constraints:
  - `@acme/design-system` remains canonical for primitives and style utilities.
  - Validation remains scoped to changed packages/targets; no forced full-repo lint/test runs.
  - Internal operations UX can differ from customer-facing UX, but critical safety checks must still apply.
- Assumptions:
  - Operator will accept a minimum safety baseline for operations components.
  - Primitive API surface may expand if backward compatibility is preserved.
  - Existing token and lint infrastructure is sufficient to enforce the new baseline once configured.

## Fact-Find Reference
- Related brief: `docs/plans/design-system-depth-and-guardrail-hardening/fact-find.md`
- Key findings used:
  - Operations components currently carry broad DS rule exemptions: `eslint.config.mjs:1795`.
  - Raw palette usage in operations surfaces is non-trivial (current regex probe count: `247` matches across operations TSX).
  - Radius token depth exists, but primitive usage remains concentrated (`rounded-md`=16, `rounded-sm`=9, `rounded-full`=8, `rounded-lg`=3, `rounded-xl`=1 in DS primitives).
  - Token contrast/drift checks existed in scripts but were absent from `scripts/validate-changes.sh` at fact-find baseline (addressed by TASK-06).
  - `ds/no-overflow-hazards` exists in plugin but is not configured in `eslint.config.mjs`.

## Proposed Approach
- Option A: Patch only known problem components and keep current lint carve-outs.
- Option B: Foundation-first hardening (decisions + inventory -> primitives + guardrails -> migration + tests/docs) with explicit checkpoint (chosen).
- Chosen approach:
  - Apply architectural fixes before migration work so component updates happen once under stable contracts.
  - Keep the first migration wave narrow and evidence-driven, then checkpoint before broadening.

## Plan Gates
- Foundation Gate: Pass
  - Fact-find contains `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, startup alias, delivery-readiness, test landscape, and risk inventory.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - Reason: `Auto-Build-Intent: plan-only` (manual build invocation only).

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Internal operations minimum safety baseline | 90% | S | Complete (2026-02-23) | - | TASK-03, TASK-06, TASK-07, TASK-08 |
| TASK-02 | DECISION | Primitive shape strategy (API vs theme-only) | 85% | S | Complete (2026-02-23) | - | TASK-03, TASK-04, TASK-05, TASK-08 |
| TASK-03 | INVESTIGATE | Lint/migration inventory and wave boundaries | 85% | M | Complete (2026-02-23) | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-07, TASK-08 |
| TASK-04 | IMPLEMENT | Primitive shape/radius variant contracts | 85% | M | Complete (2026-02-23) | TASK-02, TASK-03 | TASK-08, TASK-10, TASK-11 |
| TASK-05 | IMPLEMENT | Shared overflow/bleed containment patterns | 85% | M | Complete (2026-02-23) | TASK-02, TASK-03 | TASK-07, TASK-08, TASK-10 |
| TASK-06 | IMPLEMENT | Conditional contrast/drift checks in validation gate | 90% | S | Complete (2026-02-23) | TASK-01 | TASK-12 |
| TASK-07 | IMPLEMENT | Lint policy hardening for operations baseline | 85% | M | Complete (2026-02-23) | TASK-01, TASK-03, TASK-05 | TASK-08, TASK-10, TASK-11 |
| TASK-08 | IMPLEMENT | Operations migration wave 1 to semantic tokens | 85% | L | Complete (2026-02-23) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-07 | TASK-09 |
| TASK-09 | CHECKPOINT | Reassess downstream scope and confidence | 95% | S | Complete (2026-02-23) | TASK-08 | TASK-10, TASK-11 |
| TASK-10 | IMPLEMENT | Targeted test and lint-fixture hardening | 85% | M | Complete (2026-02-23) | TASK-04, TASK-05, TASK-07, TASK-09 | TASK-12 |
| TASK-11 | IMPLEMENT | Documentation alignment and policy updates | 90% | S | Complete (2026-02-23) | TASK-04, TASK-07, TASK-09 | TASK-12 |
| TASK-12 | IMPLEMENT | Final verification and rollout notes | 85% | S | Complete (2026-02-23) | TASK-06, TASK-10, TASK-11 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Two operator decisions can run in parallel. |
| 2 | TASK-03 | TASK-01, TASK-02 | Inventory baseline before implementation tasks. |
| 3 | TASK-04, TASK-05, TASK-06 | TASK-03 (+ decision deps) | Primitive/contracts, containment, and gate wiring can proceed in parallel. |
| 4 | TASK-07 | TASK-01, TASK-03, TASK-05 | Lint policy follows containment contract + inventory evidence. |
| 5 | TASK-08 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-07 | Migration wave under finalized contracts/policy. |
| 6 | TASK-09 | TASK-08 | Mandatory checkpoint before downstream hardening tasks. |
| 7 | TASK-10, TASK-11 | TASK-09 (+ specific deps) | Validation hardening and docs alignment in parallel. |
| 8 | TASK-12 | TASK-06, TASK-10, TASK-11 | Final verification and publication notes. |

## Validation Contracts
| Contract ID | Task | Scenario | Expected outcome |
|---|---|---|---|
| TC-04 | TASK-04 | Primitive props and class generation | New shape/radius variants compile and default behavior is unchanged |
| TC-05 | TASK-05 | Overflow containment in key primitives | Horizontal bleed prevention is standardized and no regressions in container behavior |
| TC-06 | TASK-06 | Validation gate path conditions | Token contrast/drift checks run on relevant changes and fail correctly on violations |
| TC-07 | TASK-07 | Lint policy severity and scope | Operations paths enforce minimum baseline; exemptions are narrow and explicit |
| TC-08 | TASK-08 | Operations migration wave 1 | Target components no longer rely on raw palette classes and pass lint/typecheck |
| TC-10 | TASK-10 | Regression and lint-fixture coverage | New tests/fixtures fail without intended behavior and pass with fixes |
| TC-11 | TASK-11 | Handbook/policy integrity | Stale doc links removed and current guardrail policy documented |
| TC-12 | TASK-12 | End-to-end verification | Changed packages pass scoped validation and rollout notes are complete |

## Open Decisions
None: TASK-01 and TASK-02 were resolved on 2026-02-23 using default Option B recommendations to unblock build execution.

## Tasks

### TASK-01: Decide internal-operations minimum safety baseline
- **Type:** DECISION
- **Deliverable:** Decision record in this plan (`Decision Log`) defining rule baseline for operations components
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `eslint.config.mjs`, `packages/ui/src/components/organisms/operations/**/*.{ts,tsx}`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-06, TASK-07, TASK-08
- **Confidence:** 90%
  - Implementation: 95% - Decision capture is straightforward and local to planning artifacts.
  - Approach: 90% - Options and tradeoffs are explicit from fact-find evidence.
  - Impact: 90% - This decision directly controls migration scope and enforcement strictness.
- **Options:**
  - Option A: Keep broad operations exemptions as-is.
  - Option B: Enforce minimum safety baseline (token color usage, overflow safety, constrained inline-style escapes).
  - Option C: Enforce full customer-facing DS rule set on operations paths.
- **Recommendation:** Option B.
- **Decision resolution (2026-02-23):**
  - Selected: Option B (default accepted to unblock build cycle).
  - Rationale: Preserves internal-tool flexibility while enforcing token color usage, overflow safety, and constrained style escapes.
  - Risk accepted: temporary lint migration workload during TASK-07/TASK-08.
- **Acceptance:**
  - Decision logged with selected option and rationale.
  - Downstream tasks reference one policy target with no ambiguity.
- **Validation contract:** Decision closes when operator confirms option in writing (or explicitly accepts default).
- **Planning validation:** None: decision task only.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update `Decision Log` and TASK-07 notes.

### TASK-02: Decide primitive shape strategy (API vs theme-only)
- **Type:** DECISION
- **Deliverable:** Decision record in this plan for primitive shape/radius strategy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/*.tsx`, `packages/ui/src/components/atoms/primitives/*.tsx`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-08
- **Confidence:** 85%
  - Implementation: 90% - Decision artifact is straightforward.
  - Approach: 85% - Both options are technically viable; preference affects API footprint.
  - Impact: 85% - Choice materially affects migration and consumer ergonomics.
- **Options:**
  - Option A: Theme-only shape defaults, no new primitive props.
  - Option B: Add explicit primitive `shape`/`radius` props with backward-compatible defaults.
- **Recommendation:** Option B.
- **Decision resolution (2026-02-23):**
  - Selected: Option B (default accepted to unblock build cycle).
  - Rationale: Enables controlled depth variation without forcing theme-only indirection.
  - Risk accepted: moderate API-surface growth, controlled by backward-compatible defaults.
- **Acceptance:**
  - Decision logged and reflected in TASK-04 acceptance criteria.
  - No ambiguity remains for primitive implementation.
- **Validation contract:** Decision closes when option is confirmed or default accepted.
- **Planning validation:** None: decision task only.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update TASK-04 and TASK-11 references.

### TASK-03: Investigate lint/migration inventory and wave boundaries
- **Type:** INVESTIGATE
- **Deliverable:** Evidence-backed migration inventory appended to this plan (TASK-03 notes)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `eslint.config.mjs`, `packages/ui/src/components/organisms/operations/**/*.{ts,tsx}`, `[readonly] docs/plans/design-system-depth-and-guardrail-hardening/fact-find.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-07, TASK-08
- **Confidence:** 85%
  - Implementation: 90% - Investigation commands and target paths are concrete.
  - Approach: 85% - Requires classification decisions from TASK-01 and TASK-02.
  - Impact: 85% - Reduces uncertainty in all downstream implementation tasks.
- **Questions to answer:**
  - Which operations files fail under proposed baseline rules and by what categories?
  - Which components should be included in migration wave 1 vs deferred?
  - Which current exemptions remain necessary after containment/variant foundations land?
- **Acceptance:**
  - Quantified violation inventory with categorized counts and file paths.
  - Wave-1 migration list and explicit defer list documented.
  - Dependency notes for TASK-07/TASK-08 updated from findings.
- **Validation contract:** Investigation is closed when another operator can reproduce the inventory from logged commands and paths.
- **Planning validation:**
  - Checks run:
    - `rg -n "bg-(white|gray|green|yellow|red|blue|black)|text-(gray|green|yellow|red|blue|white|black)|border-(gray|green|yellow|red|blue|white|black)" packages/ui/src/components/organisms/operations -g "*.tsx" | wc -l`
    - `rg -n "bg-(white|gray|green|yellow|red|blue|black)|text-(gray|green|yellow|red|blue|white|black)|border-(gray|green|yellow|red|blue|white|black)" packages/ui/src/components/organisms/operations -g "*.tsx" -g "!*.stories.tsx" -g "!*.test.tsx" | wc -l`
    - `rg -nP "[A-Za-z0-9_-]+-\[[^\]]+\]" packages/ui/src/components/organisms/operations -g "*.tsx" -g "!*.stories.tsx" -g "!*.test.tsx" | wc -l`
    - `rg -n "style=\{\{" packages/ui/src/components/organisms/operations -g "*.tsx" -g "!*.stories.tsx" -g "!*.test.tsx" | wc -l`
    - `rg -n "\bw-screen\b|\boverflow-visible\b|100vw" packages/ui/src/components/organisms/operations -g "*.tsx" | wc -l`
    - `pnpm exec eslint --print-config packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx | rg -n "no-raw-tailwind-color|no-overflow-hazards|forbid-dom-props|no-arbitrary-tailwind"`
  - Validation artifacts:
    - Current raw-palette baseline = `247` lines (operations TSX scope), with `92` lines in production components (excluding stories/tests).
    - Production arbitrary-value utility baseline = `22` occurrences.
    - Production inline `style` baseline = `9` usages.
    - Overflow-hazard probe baseline (`w-screen`, `overflow-visible`, `100vw`) = `0`.
    - Current policy evidence from `eslint.config.mjs:1795-1821` and ESLint print-config:
      - `ds/no-raw-tailwind-color`: `warn`
      - `ds/no-overflow-hazards`: `not configured`
      - `ds/no-arbitrary-tailwind`: `off`
      - `react/forbid-dom-props`: `off` for operations scope
  - Unexpected findings:
    - Raw palette concentration in production components is skewed to `NotificationCenter`, `MetricsCard`, `FormCard`, and `CommandPalette`, while style-prop usage is concentrated in virtualization/layout components (`VirtualList`, `SplitPane`, `StepWizard`).
    - `ds/no-raw-tailwind-color` coverage can be reduced by dynamic class assembly; migration checks must include file-level review, not lint output alone.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update TASK-03 notes and `Task Summary` confidence if findings materially shift scope.
- **TASK-03 build evidence (2026-02-23):**
  - Quantified inventory by category:
    - Raw palette hotspots (production line matches): `CommandPalette` (`21`), `NotificationCenter` (`14`), `MetricsCard` (`13`), `FormCard` (`13`), `QuickActionBar` (`10`), `ActionSheet` (`6`).
    - Arbitrary utility hotspots (production occurrences): `FormCard` (`5`), `DataTable` (`5`), `QuickActionBar` (`4`), `MetricsCard` (`3`), `ActionSheet` (`2`).
    - Inline-style hotspots (production usages): `VirtualList` (`5`), `ActionSheet` (`1`), `DataTable` (`1`), `SplitPane` (`1`), `StepWizard` (`1`).
  - Wave boundary decision:
    - **Wave 1 include:** `MetricsCard`, `FormCard`, `ActionSheet`, `DataTable`, `StatusIndicator` (matches TASK-08 scope and delivers broad token coverage with bounded complexity).
    - **Deferred post-checkpoint:** `NotificationCenter`, `CommandPalette`, `QuickActionBar`, `EmptyState`, `FilterPanel`, `Timeline`, `Pagination`, `VirtualList`, `SplitPane`, `StepWizard` (higher interaction/layout risk or lower immediate blast radius).
  - Dependency notes:
    - TASK-07 should enable `ds/no-overflow-hazards` in operations scope immediately (zero known baseline hits), then tighten `react/forbid-dom-props` via file-scoped exceptions for unavoidable runtime layout sizing (`VirtualList`, `SplitPane`, `StepWizard`, `DataTable`, `ActionSheet`).
    - TASK-07 should move `ds/no-arbitrary-tailwind` from `off` to a constrained policy (warn/error + explicit exceptions) because arbitrary utilities are concentrated and auditable.
    - TASK-08 should keep current wave-1 file list; investigate deferred overlays/layout-heavy components after TASK-09 checkpoint.
  - Downstream confidence propagation:
    - Outcome classification: **Neutral-to-affirming** for TASK-04/TASK-05/TASK-07/TASK-08.
    - Confidence scores unchanged in this cycle; no threshold transitions required.
- **Notes / references:**
  - `docs/plans/design-system-depth-and-guardrail-hardening/fact-find.md`
  - `eslint.config.mjs:1795`

### TASK-04: Implement primitive shape/radius variant contracts
- **Type:** IMPLEMENT
- **Deliverable:** Shape/radius variant API for core primitives with backward-compatible defaults
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/button.tsx`, `packages/design-system/src/primitives/input.tsx`, `packages/design-system/src/primitives/select.tsx`, `packages/design-system/src/primitives/textarea.tsx`, `packages/design-system/src/primitives/card.tsx`, `packages/design-system/src/primitives/shape-radius.ts` (scope expansion), `packages/design-system/src/primitives/Button.stories.tsx` (scope expansion), `packages/design-system/src/primitives/Input.stories.tsx` (scope expansion), `packages/design-system/src/primitives/Select.stories.tsx` (scope expansion), `packages/design-system/src/primitives/Textarea.stories.tsx` (scope expansion), `packages/design-system/src/primitives/Card.stories.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/button.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/input.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/select.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/textarea.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/card.test.tsx` (scope expansion), `[readonly] packages/ui/src/components/atoms/primitives/*.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-08, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 85% - Primitive targets and class patterns are known.
  - Approach: 90% - Explicit API with defaults is clear and bounded.
  - Impact: 85% - Shared primitive changes have broad blast radius but controlled by compatibility defaults.
- **Acceptance:**
  - Add consistent `shape` and/or `radius` variant contract to targeted primitives.
  - Preserve existing default visual behavior for consumers that do not pass new props.
  - Update primitive stories or examples to demonstrate at least 3 shape depths.
- **Validation contract (TC-04):**
  - TC-04.1 (happy): primitives accept new variant props and render expected class combinations.
  - TC-04.2 (failure): invalid variant values fail typecheck (no implicit `any` escape).
  - TC-04.3 (edge): legacy usage without new props remains visually/functionally unchanged.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "rounded-(md|lg|xl|2xl|3xl|4xl|xs)" packages/design-system/src/primitives -g "*.tsx"`
    - `rg -n "--radius-(none|xs|sm|md|lg|xl|2xl|3xl|4xl|full)" packages/themes/base/src/tokens.extensions.ts packages/tailwind-config/src/index.ts`
  - Validation artifacts:
    - Token radius scale exists and is broad; primitive usage is currently narrow.
  - Unexpected findings:
    - Some primitives/wrappers under `packages/ui` remain pass-through shims; compatibility must be verified at both import layers.
- **Consumer tracing (required):**
  - New outputs:
    - New primitive prop contracts (`shape`, `radius`) consumed by DS consumers and `@acme/ui` shim exports.
  - Modified behavior:
    - Primitive class composition changes; verify downstream consumers that depend on implicit `rounded-md` visuals.
  - Unchanged consumer note:
    - Consumers not passing new props remain on default behavior by design.
- **Scouts:**
  - `rg -n "from \"@acme/design-system/primitives/(button|input|select|textarea|card)\"" apps packages -S`
- **Edge Cases & Hardening:**
  - Ensure icon-only button variants keep minimum tap target and focus ring behavior.
  - Ensure shape variants do not break RTL class conventions.
- **What would make this >=90%:**
  - Add explicit visual regression snapshots for new shape variants in light/dark themes.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Added shared shape/radius resolver utility: `packages/design-system/src/primitives/shape-radius.ts`.
    - Added `shape`/`radius` props with backward-compatible defaults to:
      - `Button` (default `rounded-md`)
      - `Input` (default `rounded-md`)
      - `SelectTrigger` + `SelectContent` (default `rounded-md`)
      - `Textarea` (default `rounded-md`)
      - `Card` (default `rounded-xl`)
    - Radius precedence implemented consistently (`radius` overrides `shape`).
  - Controlled scope expansion (required by acceptance):
    - Added primitive story coverage with three shape depths (`square`, `soft`, `pill`) for Button/Input/Select/Textarea/Card.
    - Added targeted primitive tests for shape/radius behavior and precedence in all five primitive test files.
  - Validation evidence:
    - `pnpm --filter @acme/design-system typecheck` -> pass.
    - `pnpm --filter @acme/design-system lint` -> pass (after import-sort autofix).
    - `pnpm --filter @acme/design-system test -- src/primitives/__tests__/button.test.tsx src/primitives/__tests__/input.test.tsx src/primitives/__tests__/select.test.tsx src/primitives/__tests__/textarea.test.tsx src/primitives/__tests__/card.test.tsx` -> pass (`5` suites, `38` tests).
  - TC mapping:
    - TC-04.1: covered by new tests asserting applied radius classes and radius precedence.
    - TC-04.2: enforced by package typecheck and strict prop unions on `shape`/`radius`.
    - TC-04.3: preserved by default radius mapping matching prior classes.
- **Rollout / rollback:**
  - Rollout: land variant API and examples in one change set before migration wave.
  - Rollback: revert primitive prop additions and class maps if regression risk emerges.
- **Documentation impact:**
  - Update component catalog/handbook variant sections in TASK-11.
- **Notes / references:**
  - `packages/themes/base/src/tokens.extensions.ts:189`
  - `packages/tailwind-config/src/index.ts:150`

### TASK-05: Implement shared overflow/bleed containment patterns
- **Type:** IMPLEMENT
- **Deliverable:** Reusable containment pattern(s) and adoption in high-risk primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/dialog.tsx`, `packages/design-system/src/primitives/dropdown-menu.tsx`, `packages/design-system/src/primitives/select.tsx`, `packages/design-system/src/utils/style/*`, `packages/design-system/src/utils/style/overflowContainment.ts` (scope expansion), `packages/design-system/src/utils/style/index.ts` (scope expansion), `packages/design-system/src/primitives/__tests__/dialog.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/dropdown-menu.accessibility.test.tsx` (scope expansion), `packages/design-system/src/primitives/__tests__/select.test.tsx` (scope expansion)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-07, TASK-08, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - Targets and existing one-off protection are explicit.
  - Approach: 85% - Extracting standardized pattern is straightforward but needs careful API choice.
  - Impact: 90% - Reduces cross-component bleed regressions and simplifies migration policy.
- **Acceptance:**
  - Introduce one reusable containment helper/pattern (utility or primitive-level convention).
  - Replace one-off containment in at least two high-risk primitives with shared pattern.
  - Preserve keyboard/focus behavior and layout semantics.
- **Validation contract (TC-05):**
  - TC-05.1 (happy): known bleed scenario no longer overflows container bounds.
  - TC-05.2 (failure): disabling containment in test fixture reproduces prior bleed.
  - TC-05.3 (edge): long unbroken content remains accessible (scroll/clip behavior documented and intentional).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "overflow-x-hidden|overflow-hidden|overflow-visible|100vw|w-screen" packages/design-system/src/primitives -g "*.tsx"`
    - `nl -ba packages/design-system/src/primitives/dialog.tsx | sed -n 40,70p`
    - `nl -ba packages/design-system/src/primitives/dropdown-menu.tsx | sed -n 54,102p`
  - Validation artifacts:
    - Dialog has explicit one-off containment; dropdown/select already use some overflow controls.
  - Unexpected findings:
    - Some primitives include inline style fallbacks; containment pattern must avoid coupling to color fallback logic.
- **Consumer tracing (required):**
  - New outputs:
    - Shared containment utility/pattern consumed by dialog/dropdown/select (and future container primitives).
  - Modified behavior:
    - Container overflow behavior may change for child content; verify expected scroll/clip semantics at call sites.
  - Unchanged consumer note:
    - Components not using overflow-prone layouts are intentionally unchanged.
- **Scouts:**
  - `rg -n "DialogContent|DropdownMenuContent|SelectContent" packages/design-system/src packages/ui/src -S`
- **Edge Cases & Hardening:**
  - Preserve accessibility of content that requires horizontal scrolling when needed.
  - Avoid clipping focus outlines.
- **What would make this >=90%:**
  - Add dedicated primitive-level test fixture for overflow behavior in CI.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Added shared containment utility `overflowContainmentClass()` in `packages/design-system/src/utils/style/overflowContainment.ts`.
    - Exported containment utility via `packages/design-system/src/utils/style/index.ts`.
    - Replaced one-off containment classes with shared utility in high-risk primitives:
      - `DialogContent` -> `overflowContainmentClass("dialogContent")`
      - `DropdownMenuContent` + `DropdownMenuSubContent` -> `overflowContainmentClass("menuSurface")`
      - `SelectContent` -> `overflowContainmentClass("menuSurface")`
  - Controlled scope expansion (required for TC evidence):
    - Added containment assertions and fixture coverage in:
      - `packages/design-system/src/primitives/__tests__/dialog.test.tsx`
      - `packages/design-system/src/primitives/__tests__/dropdown-menu.accessibility.test.tsx`
      - `packages/design-system/src/primitives/__tests__/select.test.tsx`
  - Validation evidence:
    - `pnpm --filter @acme/design-system typecheck` -> pass.
    - `pnpm --filter @acme/design-system lint` -> pass.
    - `pnpm --filter @acme/design-system test -- src/primitives/__tests__/dialog.test.tsx src/primitives/__tests__/dropdown-menu.accessibility.test.tsx src/primitives/__tests__/dropdown-menu.behavior.test.tsx src/primitives/__tests__/select.test.tsx` -> pass (`4` suites, `17` tests).
  - TC mapping:
    - TC-05.1: containment class assertions verify protected primitives include shared overflow containment classes.
    - TC-05.2: dialog test includes explicit bleed-prone fixture (`w-screen overflow-visible`) without containment to reproduce prior-hazard class state.
    - TC-05.3: menu-surface behavior remains `overflow-hidden` (existing intentional clip semantics preserved); no keyboard/portal behavior regressions in dropdown/select behavior tests.
- **Rollout / rollback:**
  - Rollout: foundation change before lint escalation.
  - Rollback: revert containment utility adoption if any accessibility regression appears.
- **Documentation impact:**
  - Add containment guidance to DS handbook in TASK-11.
- **Notes / references:**
  - `packages/design-system/src/primitives/dialog.tsx:46`
  - `packages/design-system/src/primitives/dropdown-menu.tsx:57`

### TASK-06: Implement conditional contrast/drift checks in validation gate
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/validate-changes.sh` conditionally invokes `tokens:contrast:check` and `tokens:drift:check`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `scripts/validate-changes.sh`, `[readonly] package.json`, `[readonly] scripts/src/tokens/validate-contrast.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 95% - Script wiring is localized and deterministic.
  - Approach: 90% - Path-conditioned checks preserve validation speed while enforcing safety.
  - Impact: 90% - Moves contrast/drift regressions from advisory to gate-enforced on relevant changes.
- **Acceptance:**
  - Validation gate runs token checks when theme/token/UI style paths are touched.
  - Gate emits explicit skip reason when irrelevant paths changed.
  - Failing token check exits with non-zero status.
- **Validation contract (TC-06):**
  - TC-06.1 (happy): relevant path changes trigger both token checks.
  - TC-06.2 (failure): simulated failing token check causes gate failure.
  - TC-06.3 (edge): unrelated changes skip token checks and continue normal flow.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** None required for S effort.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Added a single conditional token-check block in `scripts/validate-changes.sh` that:
      - derives trigger set from `ALL_CHANGED` once per run,
      - logs trigger paths when matched,
      - runs `pnpm run tokens:contrast:check` and `pnpm run tokens:drift:check`,
      - exits non-zero with explicit failure reason when either check fails,
      - emits explicit skip reason when no relevant paths changed.
  - Validation evidence:
    - `sh -n scripts/validate-changes.sh` -> syntax valid.
    - Trigger-path probe matched relevant paths:
      - `packages/themes/base/src/tokens.extensions.ts`
      - `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx`
    - Non-trigger probe confirmed skip behavior for unrelated docs path:
      - `docs/testing-policy.md` does not match trigger regex.
    - Guardrail for duplicate invocation:
      - token-check block appears once in script and executes once per run regardless of `range`/`staged` mode (`ALL_CHANGED` is resolved once before block execution).
- **Scouts:**
  - `rg -n "tokens:contrast:check|tokens:drift:check" package.json scripts/validate-changes.sh -S`
- **Edge Cases & Hardening:**
  - Ensure no duplicate token-check invocation when both staged and range modes are used.
- **What would make this >=90%:**
  - Add script test harness for path-condition branching.
- **Rollout / rollback:**
  - Rollout: script update with clear log output.
  - Rollback: revert conditional block if runtime cost or false positives are unacceptable.
- **Documentation impact:**
  - Add note in testing/validation docs if gate behavior changes materially.
- **Notes / references:**
  - `package.json:18-21`
  - `scripts/validate-changes.sh`

### TASK-07: Implement lint policy hardening for operations baseline
- **Type:** IMPLEMENT
- **Deliverable:** Operations lint overrides narrowed to explicit exceptions; baseline safety rules enforced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `eslint.config.mjs`, `[readonly] packages/eslint-plugin-ds/src/rules/no-overflow-hazards.ts`, `[readonly] packages/eslint-plugin-ds/src/index.ts`
- **Depends on:** TASK-01, TASK-03, TASK-05
- **Blocks:** TASK-08, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 85% - Config targets are clear; enforcement points are centralized.
  - Approach: 85% - Requires balancing strictness with internal-tool pragmatism.
  - Impact: 90% - Enables durable policy enforcement and reduces silent regressions.
- **Acceptance:**
  - Configure `ds/no-overflow-hazards` in `eslint.config.mjs` for relevant scopes.
  - Replace broad operations rule disable block with minimal explicit exceptions.
  - `eslint --print-config` on operations files reflects intended severities.
- **Validation contract (TC-07):**
  - TC-07.1 (happy): representative operations files now report safety-rule coverage at intended severity.
  - TC-07.2 (failure): intentionally unsafe overflow class/style pattern is flagged.
  - TC-07.3 (edge): approved exceptions remain functional with documented justification.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "no-overflow-hazards" eslint.config.mjs packages/eslint-plugin-ds/src/index.ts -S`
    - `pnpm exec eslint --print-config packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx | rg -n "no-overflow-hazards|no-raw-tailwind-color|forbid-dom-props|no-arbitrary-tailwind"`
  - Validation artifacts:
    - Rule is registered in plugin but currently not configured in repo config.
  - Unexpected findings:
    - Some raw-palette patterns in operations may evade lint if class strings are dynamically assembled.
- **Consumer tracing (required):**
  - New outputs:
    - Updated rule-severity map consumed by ESLint for operations components.
  - Modified behavior:
    - Existing operations files may newly fail lint; migration sequencing must keep build green.
  - Unchanged consumer note:
    - Non-operations paths keep existing policy unless explicitly updated.
- **Scouts:**
  - `pnpm exec eslint packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx`
- **Edge Cases & Hardening:**
  - Keep targeted carve-outs for genuinely internal-only exceptions, each documented by rule and rationale.
- **What would make this >=90%:**
  - Add lint fixture tests that validate expected behavior for at least one allowed and one disallowed operations pattern.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Replaced the broad operations exemption block in `eslint.config.mjs` with a minimum-safety policy:
      - enabled `ds/no-overflow-hazards` at `error`,
      - moved `ds/no-arbitrary-tailwind` from `off` to constrained `warn` with explicit allowlist options (`var`, `calc`, and percent translate patterns),
      - tightened `react/forbid-dom-props` to `error` for operations scope.
    - Added a file-scoped explicit exception block for known runtime-layout components requiring style props:
      - `ActionSheet`, `DataTable`, `SplitPane`, `StepWizard`, `VirtualList`.
    - Converted prior blanket internal-tool disables to targeted `warn` severities for non-baseline ergonomics rules instead of `off`.
  - Validation evidence:
    - `pnpm exec eslint --print-config packages/ui/src/components/organisms/operations/NotificationCenter/NotificationCenter.tsx` confirms:
      - `ds/no-overflow-hazards: [2]`
      - `ds/no-arbitrary-tailwind: [1, { ...allowlist... }]`
      - `react/forbid-dom-props: [2, { forbid: [\"style\"] }]`
    - `pnpm exec eslint --print-config packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx` confirms file-scoped exception:
      - `react/forbid-dom-props: [0, { forbid: [\"style\"] }]`
    - Failure probes:
      - `--stdin` fixture at `NotificationCenter.tsx` with `className=\"w-screen overflow-visible\"` reports `ds/no-overflow-hazards` errors.
      - `--stdin` fixture at `NotificationCenter.tsx` with inline `style={{ width: 120 }}` reports `react/forbid-dom-props` error.
    - Edge probe:
      - `--stdin` fixture at `VirtualList.tsx` with inline `style={{ width: 120 }}` exits cleanly under documented exception block.
    - Representative lint checks remain non-blocking (warnings only):
      - `pnpm exec eslint packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx` -> warnings only.
      - `pnpm exec eslint packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx` -> warnings only.
      - `pnpm exec eslint packages/ui/src/components/organisms/operations/VirtualList/VirtualList.tsx` -> warnings only.
  - TC mapping:
    - TC-07.1: print-config snapshots verify intended operations severities and scoped exception behavior.
    - TC-07.2: intentionally unsafe overflow and inline-style fixtures now fail in non-exception operations scope.
    - TC-07.3: approved runtime-layout exceptions remain functional via explicit file-level `react/forbid-dom-props` override.
  - Downstream confidence propagation:
    - TASK-08/TASK-10/TASK-11 remain at existing confidence levels; this task removed policy ambiguity but did not change effort/risk class.
- **Rollout / rollback:**
  - Rollout: stage severity increase after TASK-05 foundations and before TASK-08 migration execution.
  - Rollback: downgrade specific rule severities rather than restoring blanket exemptions.
- **Documentation impact:**
  - Record policy baseline in handbook/process docs (TASK-11).
- **Notes / references:**
  - `eslint.config.mjs:1795-1846`
  - `packages/eslint-plugin-ds/src/rules/no-overflow-hazards.ts:5`

### TASK-08: Implement operations migration wave 1 to semantic tokens
- **Type:** IMPLEMENT
- **Deliverable:** Wave-1 operations components migrated to semantic tokens and baseline-safe patterns
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx`, `packages/ui/src/components/organisms/operations/FormCard/FormCard.tsx`, `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx`, `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx`, `packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.tsx`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - Target files and violation patterns are explicit.
  - Approach: 85% - Foundation-first sequencing reduces migration ambiguity.
  - Impact: 90% - High-value reduction of raw palette usage in the most visible internal components.
- **Acceptance:**
  - Wave-1 target files no longer rely on raw Tailwind palette classes for core surfaces/text/borders.
  - Inline style escapes reduced to justified, documented exceptions.
  - Target files pass lint/typecheck under updated baseline.
- **Validation contract (TC-08):**
  - TC-08.1 (happy): target files pass lint/typecheck with tightened operations policy.
  - TC-08.2 (failure): reverting migrated classes to raw palette reproduces lint failures.
  - TC-08.3 (edge): dark-mode and context-token behavior remains readable and functionally intact.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "bg-(white|gray|green|yellow|red|blue|black)|text-(gray|green|yellow|red|blue|white|black)|border-(gray|green|yellow|red|blue|white|black)" packages/ui/src/components/organisms/operations -g "*.tsx"`
    - `pnpm exec eslint packages/ui/src/components/organisms/operations/{MetricsCard,FormCard,ActionSheet,DataTable}/**/*.tsx`
  - Validation artifacts:
    - Baseline pattern count and representative file references from TASK-03.
  - Unexpected findings:
    - Dynamic utility strings may require manual semantic remapping rather than one-shot search/replace.
- **Consumer tracing (required):**
  - New outputs:
    - Semantic token class usage in operations components consumed by `.context-operations` runtime variables and DS color tokens.
  - Modified behavior:
    - Component visual output may shift subtly where raw palette values were previously hardcoded.
  - Unchanged consumer note:
    - Wave-1 explicitly excludes non-listed operations files until post-checkpoint reprioritization.
- **Scouts:**
  - `rg -n "context-operations" packages/ui/src/components/organisms/operations -S`
- **Edge Cases & Hardening:**
  - Confirm text/background contrast for success/warning/danger variants in both light and dark contexts.
  - Preserve keyboard interactions and focus visibility where components are interactive.
- **What would make this >=90%:**
  - Complete a pilot migration on one component and capture before/after lint + contrast evidence.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Migrated all wave-1 files to semantic token classes for core surfaces/text/borders:
      - `MetricsCard`: replaced raw gray/green/yellow/red + dark overrides with token-based variants (`bg-surface-2`, `bg-*-soft`, `text-*-foreground`, `border-*`).
      - `FormCard`: replaced raw card/header/footer/loading/success/error color classes with semantic tokens (`bg-surface-*`, `border-border-*`, `bg-success-soft`, `bg-danger-soft`, `text-foreground`, `text-muted-foreground`).
      - `ActionSheet`: replaced raw white/gray/black + dark overrides with semantic tokens (`bg-surface-2`, `border-border-2`, `bg-fg/50`, `text-foreground`, `text-muted-foreground`).
      - `DataTable`: kept semantic structure and tightened neutral usage (`border-border-1`, `bg-surface-1`, `text-muted-foreground`, `divide-border-1`).
      - `StatusIndicator`: replaced raw neutral gray chip/text colors with semantic tokens (`bg-surface-1`, `text-foreground`).
    - Inline style escapes remain only where runtime behavior requires them (notably table column width in `DataTable`), aligned with TASK-07 explicit exceptions.
  - Validation evidence:
    - Raw-palette + explicit dark utility matches in target files were eliminated:
      - `MetricsCard`: `before=13`, `after=0`
      - `FormCard`: `before=15`, `after=0`
      - `ActionSheet`: `before=7`, `after=0`
      - `DataTable`: `before=0`, `after=0`
      - `StatusIndicator`: `before=2`, `after=0`
      - Command basis: `git show HEAD:<file> | rg ...` vs current file scan.
    - Lint (target files): `pnpm exec eslint packages/ui/src/components/organisms/operations/{MetricsCard,FormCard,ActionSheet,DataTable}/**/*.tsx packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.tsx` -> pass with warnings only, no errors.
    - Typecheck: `pnpm --filter @acme/ui typecheck` -> pass.
    - Targeted regression tests: `pnpm --filter @acme/ui test -- src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx` -> pass (`2` suites, `20` tests).
  - TC mapping:
    - TC-08.1: target files pass lint/typecheck under tightened operations baseline (warnings only, no errors).
    - TC-08.2: pre-migration snapshots (`git show HEAD:<file>`) demonstrate that reverting to prior state reintroduces raw-palette classes; current state eliminates those matches in all wave-1 files.
    - TC-08.3: semantic token classes now drive both neutral and status states without raw `dark:*` palette literals; dark/readability behavior is token-governed by theme context (inference from class/token mapping).
  - Downstream confidence propagation:
    - TASK-09 remains the required checkpoint gate before TASK-10/TASK-11; no confidence re-score needed in this cycle.
- **Rollout / rollback:**
  - Rollout: migrate target files in batches with per-file lint confirmation.
  - Rollback: revert individual file migrations if visual or accessibility regression appears.
- **Documentation impact:**
  - Update migration notes and examples in TASK-11.
- **Notes / references:**
  - `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:31`
  - `packages/ui/src/components/organisms/operations/FormCard/FormCard.tsx:105`
  - `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx:136`
  - `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx:111`
  - `packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.tsx:200`

### TASK-09: Horizon checkpoint - reassess downstream validation scope
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan state via `/lp-do-replan` checkpoint process if downstream confidence shifts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/design-system-depth-and-guardrail-hardening/plan.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 95%
  - Implementation: 95% - Checkpoint process is defined.
  - Approach: 95% - Prevents deep-chain execution on stale assumptions.
  - Impact: 95% - Contains risk after highest blast-radius migration task.
- **Acceptance:**
  - `/lp-do-build` stops at checkpoint.
  - Downstream tasks are re-evaluated for confidence/scope.
  - Plan is updated and still topologically valid.
- **Horizon assumptions to validate:**
  - Migration wave 1 is sufficient to calibrate remaining scope.
  - Lint severity changes do not introduce hidden blocker classes in non-target files.
- **Validation contract:** checkpoint closure requires documented re-evaluation result and updated statuses/dependencies.
- **Planning validation:** replan evidence logged in this plan or referenced note.
- **Build completion evidence (2026-02-23):**
  - Completed-task evidence reviewed:
    - TASK-07 established operations lint baseline enforcement with explicit runtime-layout style exceptions.
    - TASK-08 migrated wave-1 files (`MetricsCard`, `FormCard`, `ActionSheet`, `DataTable`, `StatusIndicator`) to semantic token classes with raw-palette/dark utility matches reduced to zero in those files.
  - Horizon assumption validation:
    - Assumption 1 (`wave 1 sufficient to calibrate scope`): **validated**.
      - Deferred-scope raw palette inventory remains material (`60` production matches across deferred components), confirming additional migration work is still needed post-checkpoint without broadening current wave.
    - Assumption 2 (`lint hardening introduces no hidden blocker classes`): **validated**.
      - Operations-wide lint run under current baseline reports `62` warnings and `0` errors, so no new blocking error class was introduced by TASK-07/TASK-08.
  - Downstream replan deltas:
    - TASK-10 scope expanded to include wave-1 UI regression coverage gaps discovered at checkpoint (no dedicated tests yet for `MetricsCard`, operations `DataTable`, and `StatusIndicator` tokenized output).
    - TASK-11/TASK-12 dependency topology unchanged.
  - Topology/sequence decision:
    - No task add/remove/dependency rewiring was required; `/lp-sequence` not invoked for this checkpoint cycle.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update checkpoint notes in `Decision Log`.

### TASK-10: Implement targeted test and lint-fixture hardening
- **Type:** IMPLEMENT
- **Deliverable:** Added/updated tests for primitive depth, containment safety, operations wave-1 semantic migration, and lint policy behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `packages/design-system/src/primitives/**/__tests__/*`, `packages/ui/src/components/organisms/operations/MetricsCard/__tests__/MetricsCard.test.tsx` (scope expansion via TASK-09), `packages/ui/src/components/organisms/operations/DataTable/__tests__/DataTable.test.tsx` (scope expansion via TASK-09), `packages/ui/src/components/atoms/__tests__/StatusIndicator.test.tsx` (scope expansion via TASK-09), `packages/ui/src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx` (scope expansion via TASK-09), `packages/ui/src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx` (scope expansion via TASK-09), `packages/eslint-plugin-ds/src/rules/no-raw-tailwind-color.ts`, `packages/eslint-plugin-ds/tests/*.spec.ts`, `packages/themes/base/__tests__/contrast.test.ts`, `scripts/validate-changes.sh` (test hooks only if needed)
- **Depends on:** TASK-04, TASK-05, TASK-07, TASK-09
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 85% - Existing test infrastructure and target areas are known.
  - Approach: 85% - Regression-focused additions are straightforward but require fixture design.
  - Impact: 90% - Reduces risk of silent regressions in new guardrails.
- **Acceptance:**
  - Add tests covering primitive shape/radius variants and containment behavior.
  - Add/extend wave-1 operations regression tests to assert semantic token usage and protect against raw palette reintroduction.
  - Add lint fixture coverage for operations baseline rules (including overflow-hazard behavior).
  - Ensure targeted tests can run with repo testing constraints.
- **Validation contract (TC-10):**
  - TC-10.1 (happy): new tests pass and fail when behavior is intentionally broken.
  - TC-10.2 (failure): lint fixture catches disallowed pattern under updated policy.
  - TC-10.3 (edge): test execution remains targeted and does not invoke broad unfiltered test runs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "describe\(|test\(" packages/design-system/src/primitives packages/ui/src/components/organisms/operations packages/ui/src/components/atoms packages/eslint-plugin-ds/tests packages/themes/base/__tests__ -g "*.test.ts" -g "*.test.tsx" -g "*.spec.ts"`
    - `ps aux | grep jest | grep -v grep` (policy pre-check before broader targeted runs)
  - Validation artifacts:
    - Existing contrast and lint-plugin test suites are present and extendable.
    - Checkpoint evidence shows coverage gaps for wave-1 files (`MetricsCard`, operations `DataTable`, `StatusIndicator`) that now require explicit test additions.
  - Unexpected findings:
    - Primitive test directories may not exist for every target; creation may be required.
    - Operations coverage is uneven: `FormCard` and `ActionSheet` have tests, while other wave-1 components currently do not.
- **Consumer tracing (required):**
  - New outputs:
    - Test fixtures/assertions consumed by CI/test commands to enforce behavior contracts.
  - Modified behavior:
    - CI may fail on newly codified regressions that previously passed.
  - Unchanged consumer note:
    - Non-target package test behavior remains unchanged.
- **Scouts:**
  - `pnpm --filter @acme/eslint-plugin-ds test -- --testPathPattern="no-overflow-hazards"`
- **Edge Cases & Hardening:**
  - If ESM parsing issues occur, rerun targeted tests with `JEST_FORCE_CJS=1` per repo policy.
- **What would make this >=90%:**
  - Add one end-to-end regression fixture that combines lint + runtime containment behavior.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Added new wave-1 operations/atoms regression tests for semantic-token contracts:
      - `packages/ui/src/components/organisms/operations/MetricsCard/__tests__/MetricsCard.test.tsx`
      - `packages/ui/src/components/organisms/operations/DataTable/__tests__/DataTable.test.tsx`
      - `packages/ui/src/components/atoms/__tests__/StatusIndicator.test.tsx`
    - Extended existing wave-1 test coverage:
      - `packages/ui/src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx`
      - `packages/ui/src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx`
    - Added/extended lint fixtures for operations baseline behavior:
      - `packages/eslint-plugin-ds/tests/no-overflow-hazards.spec.ts`
      - `packages/eslint-plugin-ds/tests/no-raw-tailwind-color.spec.ts`
    - Fixed `ds/no-raw-tailwind-color` under-detection for whitespace-separated classes and arbitrary color functions by correcting regex whitespace boundaries in `packages/eslint-plugin-ds/src/rules/no-raw-tailwind-color.ts`.
  - Validation evidence:
    - Jest process pre-check: `ps aux | grep jest | grep -v grep` -> no running processes.
    - UI targeted tests:
      - `pnpm --filter @acme/ui test -- packages/ui/src/components/organisms/operations/MetricsCard/__tests__/MetricsCard.test.tsx packages/ui/src/components/organisms/operations/DataTable/__tests__/DataTable.test.tsx packages/ui/src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx packages/ui/src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx packages/ui/src/components/atoms/__tests__/StatusIndicator.test.tsx` -> pass (`5` suites, `36` tests).
    - Lint fixture targeted tests:
      - `pnpm --filter @acme/eslint-plugin-ds exec jest --ci --runInBand --detectOpenHandles --config ../../jest.config.cjs --testPathPattern="no-overflow-hazards|no-raw-tailwind-color"` -> pass (`3` suites, `24` tests).
    - Typecheck:
      - `pnpm --filter @acme/ui typecheck` -> pass.
  - TC mapping:
    - TC-10.1: new/extended wave-1 tests pass and enforce semantic-token behavior for `MetricsCard`, operations `DataTable`, `StatusIndicator`, `FormCard`, and `ActionSheet`.
    - TC-10.2: lint fixtures now fail on disallowed patterns (`w-[100vw]`, raw Tailwind palette classes, arbitrary color values) and pass on approved baseline cases.
    - TC-10.3: all verification used targeted test/typecheck commands; no unfiltered broad `pnpm test` run was invoked.
  - Downstream confidence propagation:
    - TASK-12 remains unblocked from a test-hardening standpoint; remaining blockers are documentation alignment (TASK-11) and final verification rollup.
- **Rollout / rollback:**
  - Rollout: land tests with implementation changes; enforce in same PR wave where feasible.
  - Rollback: revert specific failing tests only when proven false-positive, with rationale.
- **Documentation impact:**
  - Add test contract references in plan `Validation Contracts` and testing docs if needed.
- **Notes / references:**
  - `packages/themes/base/__tests__/contrast.test.ts`
  - `packages/eslint-plugin-ds/tests/no-overflow-hazards.spec.ts`

### TASK-11: Implement documentation alignment and policy updates
- **Type:** IMPLEMENT
- **Deliverable:** Updated DS handbook and policy references aligned to current repo structure and guardrails
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/design-system-handbook.md`, `docs/component-catalog.md`, `packages/design-system/README.md`
- **Depends on:** TASK-04, TASK-07, TASK-09
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 95% - Doc target files and stale references are explicit.
  - Approach: 90% - Straightforward alignment to new contracts and policy baseline.
  - Impact: 90% - Prevents recurrence of incorrect adoption guidance.
- **Acceptance:**
  - Remove/replace stale handbook links that currently reference missing files.
  - Document the operations minimum safety baseline and containment policy.
  - Document primitive shape/radius usage contract.
- **Validation contract (TC-11):**
  - TC-11.1 (happy): all referenced paths in updated docs exist.
  - TC-11.2 (failure): lint/docs checks fail if stale links remain.
  - TC-11.3 (edge): docs distinguish canonical rules from legacy exceptions.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** None required for S effort.
- **Scouts:**
  - `for f in packages/ui/docs/architecture.md packages/ui/docs/platform-vs-apps.md; do [ -f "$f" ] || echo "missing $f"; done`
- **Edge Cases & Hardening:**
  - Preserve migration/history context while clearly marking canonical current-state guidance.
- **What would make this >=90%:**
  - Add docs lint rule that verifies referenced internal file paths exist.
- **Build completion evidence (2026-02-23):**
  - Implementation:
    - Updated handbook references and policy guidance in `docs/design-system-handbook.md`:
      - Replaced stale `packages/ui/docs/*` references with canonical repo docs.
      - Added primitive shape/radius usage contract.
      - Added containment/bleed safety contract section with shared utility mapping.
      - Added explicit operations minimum safety baseline policy summary.
    - Updated catalog guidance in `docs/component-catalog.md`:
      - Added canonical guardrail contract section (shape/radius, containment, operations baseline).
      - Replaced stale plan link with current hardening plan path.
    - Updated package-facing guidance in `packages/design-system/README.md`:
      - Added primitive contract and containment sections.
      - Added operations consumer baseline summary.
      - Replaced stale architecture-consolidation plan link with current hardening plan.
  - Validation evidence:
    - Stale-reference scan:
      - `rg -n "packages/ui/docs/architecture.md|packages/ui/docs/platform-vs-apps.md|design-system-plan.md|ui-architecture-consolidation-plan.md" docs/design-system-handbook.md docs/component-catalog.md packages/design-system/README.md` -> no matches.
    - Link existence scan (all links in updated docs):
      - `for f in docs/design-system-handbook.md docs/component-catalog.md packages/design-system/README.md; do ...; done` -> no missing link targets.
    - Contract section presence checks:
      - `rg -n "Primitive Shape & Radius Contract|Containment & Bleed Safety Contract|Operations Baseline \\(Internal Admin UI\\)" docs/design-system-handbook.md`
      - `rg -n "Guardrail Contracts \\(Canonical\\)|Primitive depth variation|Containment and bleed safety|Operations minimum safety baseline" docs/component-catalog.md`
      - `rg -n "Primitive Contracts|Shape and radius depth|Containment safety|Operations Consumer Baseline|Design System Hardening Plan" packages/design-system/README.md`
  - TC mapping:
    - TC-11.1: updated docs now reference existing paths only; stale targets removed.
    - TC-11.2: stale-link scans return empty results across all three target docs.
    - TC-11.3: docs now distinguish canonical guardrails (operations baseline + containment + shape/radius contracts) from broader/legacy guidance.
  - Downstream confidence propagation:
    - TASK-12 dependencies are now fully satisfied (TASK-10 + TASK-11 complete).
- **Rollout / rollback:**
  - Rollout: docs update after policy/contract tasks converge.
  - Rollback: revert docs section changes if they diverge from implemented behavior.
- **Documentation impact:**
  - This task is the documentation impact execution.
- **Notes / references:**
  - `docs/design-system-handbook.md:57-58`

### TASK-12: Implement final verification and rollout notes
- **Type:** IMPLEMENT
- **Deliverable:** Final validation evidence and rollout/rollback memo in this plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/design-system-depth-and-guardrail-hardening/plan.md`, `[readonly] changed package files`
- **Depends on:** TASK-06, TASK-10, TASK-11
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - Validation and documentation actions are procedural.
  - Approach: 85% - Depends on quality of prior task outputs.
  - Impact: 90% - Confirms readiness and closes loop with explicit evidence.
- **Acceptance:**
  - Run scoped typecheck/lint for changed packages.
  - Run targeted tests tied to changed files.
  - Record rollout/rollback notes and any residual risks.
- **Validation contract (TC-12):**
  - TC-12.1 (happy): all targeted validations pass.
  - TC-12.2 (failure): failing validation is triaged with fix or explicit blocker status.
  - TC-12.3 (edge): no forbidden broad/unfiltered test command is used.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** None required for S effort.
- **Scouts:**
  - `bash scripts/validate-changes.sh` (scope-aware gate)
- **Edge Cases & Hardening:**
  - If targeted tests hit ESM/CJS issues, rerun with `JEST_FORCE_CJS=1` where policy indicates.
- **What would make this >=90%:**
  - Include before/after policy metrics (raw palette count, lint rule violations, token check pass rate).
- **Build completion evidence (2026-02-23):**
  - Scoped validation (code packages touched in TASK-10/TASK-11):
    - Lint (targeted files):
      - `pnpm exec eslint packages/ui/src/components/atoms/__tests__/StatusIndicator.test.tsx packages/ui/src/components/organisms/operations/MetricsCard/__tests__/MetricsCard.test.tsx packages/ui/src/components/organisms/operations/DataTable/__tests__/DataTable.test.tsx packages/ui/src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx packages/ui/src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx packages/eslint-plugin-ds/src/rules/no-raw-tailwind-color.ts packages/eslint-plugin-ds/tests/no-overflow-hazards.spec.ts packages/eslint-plugin-ds/tests/no-raw-tailwind-color.spec.ts` -> pass.
    - Type/build checks:
      - `pnpm --filter @acme/ui typecheck` -> pass.
      - `pnpm --filter @acme/eslint-plugin-ds build` -> pass.
    - Targeted tests:
      - `pnpm --filter @acme/ui test -- packages/ui/src/components/organisms/operations/MetricsCard/__tests__/MetricsCard.test.tsx packages/ui/src/components/organisms/operations/DataTable/__tests__/DataTable.test.tsx packages/ui/src/components/organisms/operations/FormCard/__tests__/FormCard.test.tsx packages/ui/src/components/organisms/operations/ActionSheet/__tests__/ActionSheet.test.tsx packages/ui/src/components/atoms/__tests__/StatusIndicator.test.tsx` -> pass (`5` suites, `36` tests).
      - `pnpm --filter @acme/eslint-plugin-ds exec jest --ci --runInBand --detectOpenHandles --config ../../jest.config.cjs --testPathPattern="no-overflow-hazards|no-raw-tailwind-color"` -> pass (`3` suites, `24` tests).
    - Documentation integrity checks:
      - Stale-reference scan across target docs -> no matches.
      - Link existence scan across `docs/design-system-handbook.md`, `docs/component-catalog.md`, `packages/design-system/README.md` -> no missing targets.
  - TC mapping:
    - TC-12.1: all scoped validation commands passed.
    - TC-12.2: no failing validation remained unresolved in this cycle.
    - TC-12.3: only targeted test commands were used; no broad unfiltered `pnpm test` invocation.
  - Residual risks:
    - The broader repo still has deferred operations files with raw-palette usage outside wave-1 scope; those remain for subsequent migration waves.
    - Root plan was executed in a heavily dirty multi-agent workspace, so final integration should preserve narrow commit scope for these files only.
- **Rollout / rollback:**
  - Rollout: merge after targeted validation evidence and decision-log closure; keep rollout scoped to TASK-10/TASK-11/TASK-12 files.
  - Rollback: revert the specific implementation batch causing regression (tests/docs/rule) while keeping prior completed decision records and migration evidence intact.
- **Documentation impact:**
  - Final status update in this plan and corresponding build record.
- **Notes / references:**
  - `scripts/validate-changes.sh`
  - `docs/testing-policy.md`

## Risks & Mitigations
- Risk: Lint hardening creates an immediate violation spike.
  - Mitigation: inventory-first sequencing and wave-based migration before full enforcement.
- Risk: Primitive API expansion introduces unintended consumer regressions.
  - Mitigation: backward-compatible defaults and targeted variant tests.
- Risk: Gate runtime overhead from token checks slows feedback loops.
  - Mitigation: path-conditional invocation and explicit skip behavior.
- Risk: Dynamic class composition avoids lint detection.
  - Mitigation: combine lint with code-review checklist and targeted migration scans.

## Observability
- Logging:
  - Validation gate logs whether token checks were run or skipped and why.
- Metrics:
  - Raw-palette match count in operations scope (baseline from TASK-03, then post-migration deltas).
  - Count of lint violations for baseline safety rules in operations paths.
- Alerts/Dashboards:
  - None: repository CI status is primary signal.

## Acceptance Criteria (overall)
- [x] Primitive depth variation contract is implemented and backward compatible.
- [x] Containment safety pattern is standardized in high-risk primitives.
- [x] Token contrast/drift checks are conditionally enforced by validation gate.
- [x] Operations baseline rules are hardened and wave-1 migration passes under new policy.
- [x] Targeted tests and lint fixtures are updated to lock behavior.
- [x] Documentation guidance is updated to reflect current policy and contracts.

## Decision Log
- 2026-02-23: Plan created from fact-find with `plan-only` intent; sequencing completed.
- 2026-02-23: Default recommendation recorded for TASK-01 = Option B (minimum operations safety baseline).
- 2026-02-23: Default recommendation recorded for TASK-02 = Option B (explicit primitive shape/radius API).
- 2026-02-23: Fact-check pass updated audit anchor, primitive radius evidence counts, and critique-run status reference.
- 2026-02-23: TASK-01 resolved to Option B (default accepted during `/lp-do-build` kickoff).
- 2026-02-23: TASK-02 resolved to Option B (default accepted during `/lp-do-build` kickoff).
- 2026-02-23: TASK-03 completed; lint/migration inventory, wave boundary, and TASK-07/TASK-08 dependency notes captured.
- 2026-02-23: TASK-06 completed; `scripts/validate-changes.sh` now conditionally runs `tokens:contrast:check` and `tokens:drift:check` with explicit trigger/skip logging.
- 2026-02-23: TASK-04 completed; shape/radius variant contracts landed for Button/Input/Select/Textarea/Card with story + targeted test coverage.
- 2026-02-23: TASK-05 completed; shared overflow containment utility adopted by Dialog/Dropdown/Select with targeted regression assertions.
- 2026-02-23: TASK-07 completed; operations lint policy now enforces overflow/style baseline with explicit runtime-layout exceptions.
- 2026-02-23: TASK-08 completed; wave-1 operations files migrated to semantic token classes with raw-palette/dark utility matches reduced to zero.
- 2026-02-23: TASK-09 checkpoint completed; downstream scope revalidated with no topology changes and TASK-10 expanded for wave-1 operations test coverage gaps.
- 2026-02-23: TASK-10 completed; wave-1 semantic regression tests and lint fixtures were hardened, including a regex-boundary fix in `ds/no-raw-tailwind-color` to catch whitespace-separated raw palette classes reliably.
- 2026-02-23: TASK-11 completed; handbook/catalog/package README now align to canonical paths and codify shape/radius, containment, and operations baseline guardrail policy.
- 2026-02-23: TASK-12 completed; scoped lint/type/test and documentation-link validations all passed, closing the plan with rollout/rollback and residual-risk notes.

## Overall-confidence Calculation
- Effort weights: `S=1`, `M=2`, `L=3`
- Weighted sum:
  - S tasks: TASK-01 (90) + TASK-02 (85) + TASK-06 (90) + TASK-09 (95) + TASK-11 (90) + TASK-12 (85) = 535
  - M tasks: TASK-03 (85*2) + TASK-04 (85*2) + TASK-05 (85*2) + TASK-07 (85*2) + TASK-10 (85*2) = 850
  - L tasks: TASK-08 (85*3) = 255
  - Total weighted score = `1640`
  - Total weight = `19`
- Overall-confidence = `1640 / 19 = 86.3%` -> **86%**

## Phase 11 Trigger Evaluation
- Trigger 1 (`Overall-confidence < 4.0/5.0`): **No** (`86%` ~= `4.3/5.0`).
- Trigger 2 (uncovered task with confidence <80): **No** (no task confidence below `80%`).
- Critique run: **Completed (manual, user-requested)**; see `docs/plans/design-system-depth-and-guardrail-hardening/critique-history.md`.

## Section Omission Rule
None: all core sections are populated for this plan.
