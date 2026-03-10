---
name: lp-design-qa
description: Audit a built UI against the design spec and design system for visual consistency (code-level), accessibility, responsive behavior, and token compliance. Produces structured issues ready for lp-do-build fixes.
operating_mode: AUDIT
---

# Design QA

Audit a built UI against the design spec, design system standards, and brand language for visual consistency (code-level static analysis), accessibility compliance, responsive behavior, and semantic token usage. Produces a structured issue list that feeds back into `/lp-do-build` for fixes.

**Key distinction from `/lp-launch-qa`:**
- **lp-design-qa** focuses on visual/UI consistency via static code analysis — do token bindings, component composition, and class usage match the design spec? (No browser rendering or screenshot capture.)
- **lp-launch-qa** focuses on functional/compliance readiness — does it work and meet launch criteria?

## When to Use

- **S9B (UI Regression QA)**: After `/lp-do-build` completes UI tasks, before merging to main
- **Post-Design-Spec**: When a design spec exists and implementation is complete
- **Pre-PR Review**: Before human visual/design review to catch systematic issues
- **Responsive Audit**: Standalone audit of responsive behavior across breakpoints
- **A11y Audit**: Standalone accessibility compliance check
- **Token Migration**: After migrating to semantic tokens, verify no regressions

## Operating Mode

**AUDIT + REPORT**

**Allowed:**
- Read design spec, brand language doc, built UI components, design system docs, token reference
- Trace component tree and token bindings
- Run visual accessibility checks (automated only — no browser testing)
- Create/update issue report and Business OS card/stage doc via agent API

**Not Allowed:**
- Code changes (use `/lp-do-build` for fixes)
- Browser testing or screenshot capture
- Mockup creation or visual redesign (that's `/lp-design-spec`)
- Functional testing (that's `/lp-launch-qa`)
- Marking issues resolved without citing fix commits

## Invocation

```
/lp-design-qa <feature-slug>
/lp-design-qa --business <BIZ>
/lp-design-qa <feature-slug> --scope responsive|a11y|tokens|visual|full
```

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

`--scope full` audits all 4 domains (default). Scoped variants run one domain only.

## Inputs

| Source | Path | Required |
|--------|------|----------|
| Design spec | `docs/plans/<slug>-design-spec.md` | Yes (feature audit) |
| Plan doc | `docs/plans/<slug>-plan.md` | Yes (feature audit) |
| Brand language | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | Yes |
| Built UI components | Paths from plan's completed tasks "Affects" lists | Yes |
| Design system handbook | `docs/design-system-handbook.md` | Yes |
| Token reference | `packages/themes/<theme>/src/tokens.ts` | Yes |
| Typography & color | `docs/typography-and-color.md` | Yes |
| Accessibility guide | `docs/accessibility-guide.md` | No |

## Workflow

### Step 1: Resolve Context

1. **For feature-slug path:** Read plan + design spec; extract built file paths from completed tasks' "Affects" lists; resolve business unit → brand language doc and theme package.
2. **For business-scoped path:** Read `businesses.json`; read brand language + current UI components across all apps for BIZ; use brand language + design system as standard.
3. **Load audit standards:** Brand language doc, theme tokens, design system handbook.

**Outputs for report:** Business Unit, App name(s), Feature slug, Design spec reference, Scope.

### Step 2: Component Inventory

1. **Feature-level:** Read all files in completed tasks' "Affects" lists; identify component hierarchy from spec's composition tree; verify actual matches planned.
2. **Business-level:** Glob `apps/<app>/src/components/**/*.tsx`; filter to UI components; group by atomic layer.
3. **Build inventory table:** Component | File Path | Expected | Actual Status.

**Outputs:** Inventory with spec compliance status; missing and unexpected component lists.

### Steps 3–6: Domain Checks

**If `--scope full`** (default): dispatch 4 domain subagents simultaneously via Task tool in a SINGLE message. Load `modules/report-template.md` for output format.

Protocol: `_shared/subagent-dispatch-contract.md` (Model A — domain subagents run read-only audit checks; orchestrator aggregates results).

Dispatch brief per domain subagent:
- Load `modules/domain-<name>.md` for check definitions
- Perform all checks; collect evidence
- Return: `{ domain: "<name>", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`
- `touched_files`: [] (audit-only — no file writes)

Domain modules:
- `modules/domain-visual.md` — VR-01–VR-05 (visual regression)
- `modules/domain-responsive.md` — RS-01–RS-04 (responsive behavior)
- `modules/domain-a11y.md` — A11Y-01–A11Y-05 (accessibility)
- `modules/domain-tokens.md` — TC-01–TC-04 (token compliance)

**If `--scope <X>`** (single domain): load only `modules/domain-<X>.md`; run checks without dispatching subagents.

### Step 7: Produce Issue Report

Load `modules/report-template.md` for full report structure, issue format, severity levels, categories, and sign-off checklist.

Output path: `docs/plans/<slug>-design-qa-report.md`

### Step 8: Report Completion

```
Design QA complete for <feature-slug> (<BIZ>).

**Audit summary:**
- Scope: <full | responsive | a11y | tokens | visual>
- Components audited: <N>
- Issues found: <N> | Critical: <N> | Major: <N> | Minor: <N>

**Verdict:** <Pass | Issues-found | Critical-issues-found>
**Blockers for merge:** <list Critical issues or "None">

**Report:** `docs/plans/<slug>-design-qa-report.md`
**Next:**
- If issues found: `/lp-do-build` to fix issues in report
- If passed: `/lp-launch-qa` for functional/compliance readiness
- If issues found and fixed: **re-run `/lp-design-qa`** to confirm fixes before routing to S9C sweeps. Do not proceed to `tools-ui-contrast-sweep` / `tools-ui-breakpoint-sweep` with unverified fixes.
```

## Quality Checks

- [ ] Design spec read and used as expected state baseline
- [ ] Brand language doc read and patterns checked
- [ ] All components in "Affects" lists audited (not a sample)
- [ ] Every issue cites file path and line number
- [ ] Every issue includes Expected vs Actual state and recommended fix
- [ ] Severity assigned based on impact (not arbitrary)
- [ ] Report saved at correct path with correct frontmatter
- [ ] Issue count in frontmatter matches report body

## Integration

- **Upstream:** `/lp-design-spec` (expected visual state); `tools-ui-frontend-design` (executes the S9A UI build via `lp-do-build`); `lp-do-build` (fix cycle after issues found)
- **Downstream:** `/lp-do-build` (uses issue report to fix regressions); `/lp-launch-qa` (assumes design QA passed); human PR reviewers
- **Loop position:** S9B (UI Regression QA) — post-build, pre-launch-qa
- **Business OS sync:** Updates build stage doc with design-qa results and issue count

## Red Flags (Invalid Run)

1. **Design spec missing:** STOP — run `/lp-design-spec` first.
2. **No completed build tasks:** STOP — nothing to audit yet.
3. **Issues without evidence:** Every issue must cite file:line.
4. **False passes:** If a check cannot be verified from code, mark "Manual check required" not "Pass".
5. **Scope mismatch:** `--scope a11y` with no a11y spec requirements — STOP and clarify.
6. **Severity inflation:** Reserve Critical for genuine merge blockers only.

## Example Invocations

```
/lp-design-qa commerce-core
/lp-design-qa --business BRIK --scope tokens
/lp-design-qa prime-onboarding --scope a11y
/lp-design-qa brikette-booking-widget --scope full
```
