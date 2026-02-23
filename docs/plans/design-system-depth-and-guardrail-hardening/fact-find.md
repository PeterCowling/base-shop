---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: design-system-depth-and-guardrail-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system, lp-design-qa
Related-Plan: docs/plans/design-system-depth-and-guardrail-hardening/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: Operator-requested design-system audit and hardening brief; not sourced from IDEAS-03 promotion
---

# Design System Depth and Guardrail Hardening — Fact-Find Brief

## Scope

### Summary

This fact-find audits the current design-system implementation and enforcement posture for two problems raised by the operator: (1) limited component variation depth (for example, shape/radius flexibility) and (2) insufficient protective guardrails (for example, content bleed prevention and text/background contrast protection).

The repository has a strong token foundation and a mature lint rule inventory, but enforcement is uneven across surfaces. The highest-risk gap is that internal operations UI components are explicitly exempted from many DS rules and currently rely on raw palette classes and ad hoc styling patterns. The second gap is that contrast and token drift checks exist but are not wired into the standard `scripts/validate-changes.sh` gate.

### Goals

- Establish evidence-backed current-state findings for design-system variation depth and protective guardrails.
- Identify highest-leverage implementation targets for safer defaults (bleed protection, contrast safety, token usage).
- Produce a planning-ready route for phased hardening without breaking existing surfaces.

### Non-goals

- No source code changes in this fact-find.
- No redesign of brand language or per-business theme identity.
- No migration execution; this document only prepares `/lp-do-plan`.

### Constraints & Assumptions

- Constraints:
  - Existing apps and packages depend on both `@acme/design-system` and `@acme/ui`; migration must be incremental.
  - Design-system guardrails currently include intentional carve-outs for internal operations components.
  - Validation workflow must remain scoped/targeted per repo policy, not full-suite on every change.
- Assumptions:
  - Internal operations components should still meet a minimum DS safety bar (token usage, contrast, overflow containment) even if UX affordances differ from customer-facing UI.
  - Shape variation should be first-class API in primitives rather than ad hoc class overrides at call-sites.

## Evidence Audit (Current State)

### Entry Points

- `packages/design-system/src/primitives/index.ts` - canonical primitive export surface consumed by apps/packages.
- `packages/ui/src/components/organisms/operations/index.ts` - operations surface where guardrail gaps are most visible.
- `eslint.config.mjs` - repository-level DS policy and override logic.
- `scripts/validate-changes.sh` - default pre-commit validation gate used in regular delivery flow.

### Key Modules / Files

- `packages/themes/base/src/tokens.extensions.ts:189` - extended radius token scale (`--radius-none` through `--radius-4xl` and `--radius-full`).
- `packages/tailwind-config/src/index.ts:150` - full radius token scale exposed to Tailwind utilities.
- `packages/design-system/src/primitives/button.tsx:53` - primitive base uses fixed `rounded-md`.
- `packages/design-system/src/primitives/input.tsx:61` - input base uses fixed `rounded-md` and no shape API.
- `packages/design-system/src/primitives/dialog.tsx:46` - explicit `overflow-x-hidden` bleed protection in dialog content.
- `packages/eslint-plugin-ds/src/rules/no-overflow-hazards.ts:5` - overflow hazard detection currently targets a narrow class/style subset.
- `eslint.config.mjs:294` - global DS token enforcement baseline and many downstream overrides.
- `scripts/validate-changes.sh:107` - scoped typecheck/lint + targeted tests, but no token contrast/drift checks.
- `packages/design-tokens/src/tailwind-plugin.ts:40` - `.context-operations` semantic context token utility exists.
- `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:31` - operations component uses raw palette classes and ad hoc style patterns.

### Patterns & Conventions Observed

- Radius capability exists at token and Tailwind layers, but primitive usage is concentrated in a narrow subset.
  - Evidence: `packages/themes/base/src/tokens.extensions.ts:189`, `packages/tailwind-config/src/index.ts:150`, `packages/design-system/src/primitives/button.tsx:53`, `packages/design-system/src/primitives/input.tsx:61`.
  - Radius usage scan in DS primitives: `rounded-md` dominates (`36` occurrences), while higher-depth options (`rounded-3xl`, `rounded-4xl`, `rounded-xs`) are absent in current TSX usage.

- Some components include explicit bleed protection, but this is not standardized as a reusable safety primitive.
  - Evidence: `packages/design-system/src/primitives/dialog.tsx:46` includes `overflow-x-hidden` with rationale comment.

- Raw Tailwind palette rule exists globally as warning, with many scope overrides.
  - Evidence: `eslint.config.mjs:301` (`ds/no-raw-tailwind-color: warn` globally), app-specific escalations (`eslint.config.mjs:318` onward), and operations carve-out (`eslint.config.mjs:1795`).

- Internal operations UI explicitly disables several DS safety rules.
  - Evidence: `eslint.config.mjs:1795` to `eslint.config.mjs:1821` disables `ds/no-arbitrary-tailwind`, focus/layout guards, viewport/z-index guards, and `react/forbid-dom-props` for operations components.

- Existing operations components still carry raw palette classes and inline style patterns.
  - Evidence:
    - `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:31`, `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:108`, `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:149`
    - `packages/ui/src/components/organisms/operations/FormCard/FormCard.tsx:106`, `packages/ui/src/components/organisms/operations/FormCard/FormCard.tsx:124`, `packages/ui/src/components/organisms/operations/FormCard/FormCard.tsx:149`
    - `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx:137`, `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx:142`, `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx:148`
    - `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx:111`, `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx:146`
    - `packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.tsx:200`, `packages/ui/src/components/atoms/StatusIndicator/StatusIndicator.tsx:207`

- Context-token support exists (`.context-operations`), but usage appears concentrated in story wrappers instead of broad production adoption [inference: based on literal class-name search hits].
  - Evidence: `packages/design-tokens/src/tailwind-plugin.ts:40`; references largely in stories (for example `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.stories.tsx:11`).

- Documentation references include stale/missing paths.
  - Evidence: `docs/design-system-handbook.md:57` and `docs/design-system-handbook.md:58` reference files that do not exist in repo (`packages/ui/docs/architecture.md`, `packages/ui/docs/platform-vs-apps.md`).

### Data & Contracts

- Token contracts:
  - Radius tokens are defined in theme source and mapped into Tailwind radius utilities.
  - Evidence: `packages/themes/base/src/tokens.extensions.ts:189`, `packages/tailwind-config/src/index.ts:150`.

- Lint governance contracts:
  - DS plugin exports broad rule coverage, including overflow hazard checks.
  - Evidence: `packages/eslint-plugin-ds/src/index.ts:36`.
  - `ds/no-overflow-hazards` is available in plugin but not configured in `eslint.config.mjs` (search result: no match for `ds/no-overflow-hazards`).

- Validation gate contracts:
  - `validate-changes.sh` runs scoped typecheck/lint and targeted tests.
  - Evidence: `scripts/validate-changes.sh:107`, `scripts/validate-changes.sh:209`.
  - Token contrast/drift scripts exist in root scripts but are not called by default gate.
  - Evidence: `package.json:18`, `package.json:20`, `scripts/validate-changes.sh` (no token script invocation).

### Dependency & Impact Map

- Upstream dependencies:
  - Theme tokens (`packages/themes/base/src/tokens.extensions.ts`) feed Tailwind preset mapping (`packages/tailwind-config/src/index.ts`).
  - Lint plugin (`packages/eslint-plugin-ds`) and `eslint.config.mjs` determine enforcement strength.
  - Validation gate (`scripts/validate-changes.sh`) determines what is blocking vs advisory before commit.

- Downstream dependents:
  - `@acme/design-system` primitives are consumed directly and via `@acme/ui` compatibility shims.
  - Evidence: `packages/design-system/README.md:3`, `packages/ui/src/components/atoms/primitives/button.tsx:3`.
  - Operations components and CMS/product UI surfaces inherit DS policy decisions through lint and token infrastructure.

- Likely blast radius:
  - Any guardrail escalation in `eslint.config.mjs` will immediately affect `packages/ui/src/components/organisms/operations/**/*`.
  - Primitive API changes for shape/variant depth will affect all app/package consumers of Button/Input/Select/Textarea/Card.
  - Validation-gate changes in `scripts/validate-changes.sh` affect pre-commit pipeline behavior repo-wide.

### Security & Performance Boundaries

- Security/accessibility-adjacent boundaries:
  - Contrast correctness is enforced today through token-level scripts/tests, not consistently via per-change gate.
  - Evidence: `scripts/src/tokens/validate-contrast.ts:27`, `packages/themes/base/__tests__/contrast.test.ts:28`.

- Performance boundaries:
  - Current operations components frequently use broad transitions and inline styles in hot UI primitives.
  - Evidence: `packages/ui/src/components/organisms/operations/MetricsCard/MetricsCard.tsx:86`, `packages/ui/src/components/organisms/operations/ActionSheet/ActionSheet.tsx:142`.
  - Impact is modest at component scale but accumulates in dense dashboard views.

### Test Landscape

#### Test Infrastructure

- DS package tests via Jest:
  - `packages/design-system/package.json` (`test`, `test:coverage`, `lint`, `typecheck`).
- UI package tests via Jest:
  - `packages/ui/package.json` (`test`, `test:pkg`, `lint`, `typecheck`).
- DS lint plugin tests:
  - `packages/eslint-plugin-ds/package.json` (`test` with `JEST_FORCE_CJS=1`).
- Token contrast checks:
  - `scripts/src/tokens/validate-contrast.ts` and theme contrast unit tests.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Theme token contrast | Unit | `packages/themes/base/__tests__/contrast.test.ts` | Verifies key light/dark token pairs at AA thresholds |
| UI contrast behavior | Unit | `packages/ui/src/components/cms/page-builder/__tests__/FontsPanel.contrast.test.ts` | Validates component-level contrast expectations |
| DS lint rule behavior | Unit | `packages/eslint-plugin-ds/tests/no-overflow-hazards.spec.ts` | Rule behavior exists, but activation in repo config is missing |
| Validation gate behavior | Script | `scripts/validate-changes.sh` | Enforces typecheck/lint/tests, not token contrast/drift |

#### Coverage Gaps

- No mandatory contrast/drift execution in default validation gate for style/token-affecting changes.
- No standard test contract that operations components remain token-semantic (raw palette regressions can pass).
- No reusable component-level bleed test harness (dialog contains one-off protection, not systemic guard).

#### Testability Assessment

- Easy to test:
  - Lint policy changes (`eslint --print-config`, targeted file lint runs).
  - Token contrast checks via existing script.
- Hard to test:
  - End-to-end content-bleed behavior across varied component compositions.
  - Migration correctness when escalating operations guardrails with many existing exemptions.
- Test seams needed:
  - Snapshot/DOM guard tests for overflow containment primitives.
  - Rule-level tests for raw palette usage on operations components once exemptions are reduced.

#### Recommended Test Approach

- Unit:
  - Add DS primitive tests for shape variants and overflow containment defaults.
- Lint contract:
  - Add fixed-file lint fixture tests for operations components under intended policy level.
- Validation gate:
  - Add conditional token checks in `validate-changes.sh` when token/theme/UI styling files change.

### Recent Git History (Targeted)

- `2e5319f15e` - `chore: checkpoint outstanding updates and relax affected-test timeout`
- `7822b2e23d` - `fix: include remaining outstanding updates and validator path handling`
- `dfe95c7f2b` - `fix(ci): harden mcp-server test selection in validation gate`
- `8f3af9bb0c` - `feat(ds-compliance-v2): fix reception token + spacing violations, escalate rules (DS-05, DS-06)`

Implications:
- Recent work has focused on CI/validation reliability and selective DS rule escalation, but not on closing operations-component exemptions.
- Git-history sample includes nearby CI/validation commits and should be treated as directional rather than exhaustive for DS-specific edits.
- Guardrails are actively maintained, so incremental hardening should fit current repo direction.

## Questions

### Resolved

- Q: Does the repository already have a deep radius token scale?
  - A: Yes. Token and Tailwind layers support a broad scale from `none` to `4xl/full`.
  - Evidence: `packages/themes/base/src/tokens.extensions.ts:189`, `packages/tailwind-config/src/index.ts:150`.

- Q: Are contrast protections present today?
  - A: Yes, but mostly at token/script and selective test levels rather than universal build gate enforcement.
  - Evidence: `scripts/src/tokens/validate-contrast.ts:27`, `packages/themes/base/__tests__/contrast.test.ts:28`, `scripts/validate-changes.sh:107`.

- Q: Are operations components currently protected by strict DS rules?
  - A: No. Operations paths explicitly disable several strict DS and style/a11y guardrails.
  - Evidence: `eslint.config.mjs:1795` to `eslint.config.mjs:1821`.

### Open (User Input Needed)

- Q: Should operations components remain exempt from core DS safety rules, or should we move to a “strict minimum safety baseline” for internal tools?
  - Why it matters: determines whether hardening is advisory or blocking.
  - Decision impacted: lint policy escalation and migration scope.
  - Decision owner: Peter
  - Default assumption (if no answer): enforce minimum baseline (token colors, overflow safety, no unsafe inline styles), keep selected ergonomic exceptions.

- Q: Do you want shape/radius variation exposed as explicit primitive API (`shape`/`radius` props), or controlled only through theme-level defaults?
  - Why it matters: controls API surface growth and migration complexity.
  - Decision impacted: primitive refactor scope and compatibility strategy.
  - Decision owner: Peter
  - Default assumption (if no answer): add explicit primitive shape API with conservative defaults.

- Q: Should contrast checks become required in the default `validate-changes.sh` gate when style/token files change?
  - Why it matters: determines whether contrast regressions become commit-blocking.
  - Decision impacted: CI/pre-commit runtime and enforcement strength.
  - Decision owner: Peter
  - Default assumption (if no answer): yes, conditionally run contrast/drift checks on relevant path changes.

## Confidence Inputs

- Implementation: 87%
  - Evidence basis: primary hotspots and policy controls are clearly identified with file-level evidence.
  - Raise to >=80: already met.
  - Raise to >=90: lock decisions on operations safety baseline and primitive shape API direction.

- Approach: 84%
  - Evidence basis: phased hardening path (policy + primitives + validation gate) matches current architecture and existing tooling.
  - Raise to >=80: already met.
  - Raise to >=90: validate migration blast radius with a short lint impact spike on operations components.

- Impact: 82%
  - Evidence basis: findings directly target operator-raised issues (variation depth and safety protections).
  - Raise to >=80: already met.
  - Raise to >=90: quantify expected reduction in raw-palette/overflow violations before and after phase 1.

- Delivery-Readiness: 81%
  - Evidence basis: all key ownership points are known (`@acme/design-system`, `@acme/ui`, lint config, validation gate).
  - Raise to >=80: already met.
  - Raise to >=90: pre-approve sequencing for policy escalation to avoid workflow disruption.

- Testability: 76%
  - Evidence basis: test/script primitives exist, but not all are connected to blocking gates and not all safety concerns have dedicated component tests.
  - Raise to >=80: add token check invocation contract in validation gate and targeted lint fixtures for operations.
  - Raise to >=90: add reusable overflow/bleed test harness for high-risk primitive containers.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Strict rule escalation creates large immediate violation volume in operations surfaces | High | High | Stage rollout: baseline report -> autofix where possible -> enforce by directory wave |
| Primitive API expansion (`shape`/`radius`) breaks consumers relying on className overrides | Medium | High | Preserve backward-compatible defaults and provide codemod/migration notes |
| Contrast checks increase validation runtime and are bypassed in practice | Medium | Medium | Run checks conditionally on style/token paths and keep command outputs concise |
| Inconsistent docs continue to cause wrong import/architecture assumptions | Medium | Medium | Update handbook references and document canonical DS guardrail policy |
| Operations exemptions remain broad and regressions continue silently | High | High | Replace full exemptions with minimal non-negotiable safety rule set |
| One-off bleed fixes remain ad hoc and do not generalize | Medium | Medium | Introduce shared containment primitives and lint guidance for usage |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use semantic token utilities instead of raw palette classes in shared components.
  - Keep `@acme/design-system` as canonical primitive implementation source.
  - Keep internal-tool ergonomics where needed, but do not exempt critical safety checks.

- Rollout/rollback expectations:
  - Roll out rule escalation by path wave with measurable violation burn-down.
  - Roll back by downgrading specific rule severities only; avoid broad blanket exemptions.

- Observability expectations:
  - Track counts of raw palette usage and arbitrary styling violations before/after each phase.
  - Track contrast check pass/fail in CI logs for style/token change sets.

## Suggested Task Seeds (Non-binding)

- TASK-01 (INVESTIGATE): Produce a lint impact inventory for operations components under proposed minimum safety baseline.
- TASK-02 (IMPLEMENT): Add primitive `shape`/`radius` variants (Button, Input, Select, Textarea, Card) with backward-compatible defaults.
- TASK-03 (IMPLEMENT): Introduce shared containment primitive/pattern for overflow/bleed safety and migrate high-risk containers.
- TASK-04 (IMPLEMENT): Tighten `eslint.config.mjs` for operations components (remove full exemptions; keep narrow explicit exceptions).
- TASK-05 (IMPLEMENT): Wire `tokens:contrast:check` and `tokens:drift:check` into `scripts/validate-changes.sh` under path-based conditions.
- TASK-06 (IMPLEMENT): Migrate operations components from raw palette utilities to semantic token classes/context tokens.
- TASK-07 (IMPLEMENT): Update DS handbook and migration docs to reflect current canonical paths and rule posture.
- TASK-08 (CHECKPOINT): Run scoped typecheck/lint and targeted tests for touched packages and publish validation evidence.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-system`, `lp-design-qa`
- Deliverable acceptance package:
  - Updated primitives and lint config with targeted migration changes.
  - Validation evidence from changed packages (`typecheck`, `lint`, targeted tests, token checks).
  - Updated DS documentation for architecture/rules.
- Post-delivery measurement plan:
  - Track raw-palette violations and arbitrary-style violations in operations paths.
  - Track contrast check failures over subsequent PRs.

## Evidence Gap Review

### Gaps Addressed

- Verified that operation-surface exemptions are explicit policy, not accidental drift (`eslint.config.mjs:1795` onward).
- Verified that contrast checks exist and are runnable (`package.json:20`, `scripts/src/tokens/validate-contrast.ts:27`).
- Verified that validation gate currently omits token checks (`scripts/validate-changes.sh`).
- Verified stale documentation links by file existence check against handbook references.

### Confidence Adjustments

- Reduced Testability confidence from tentative high-80s to 76% after confirming gate-level contrast/drift checks are not default-enforced and operations rules are broadly exempt.
- Kept Implementation/Approach confidence above 80 due direct file evidence and clear blast-radius mapping.

### Remaining Assumptions

- Assumes operator wants a stricter minimum baseline for internal operations components rather than full exemption continuation.
- Assumes shape API expansion is acceptable if backward compatibility is preserved.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None (open decisions are policy-shaping, not investigation blockers).
- Recommended next step:
  - Run `/lp-do-plan` for `design-system-depth-and-guardrail-hardening`, with an early DECISION task for operations safety baseline and shape API strategy.
