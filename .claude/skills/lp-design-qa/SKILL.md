---
name: lp-design-qa
description: Audit a built UI against the design spec and design system for visual/UI regression, accessibility, responsive behavior, and token compliance. Produces structured issues ready for lp-build fixes.
operating_mode: AUDIT
---

# Design QA

Audit a built UI against the design spec, design system standards, and brand language for visual regression, accessibility compliance, responsive behavior, and semantic token usage. Produces a structured issue list that feeds back into `/lp-build` for fixes.

**Key distinction from `/lp-launch-qa`:**
- **lp-design-qa** focuses on visual/UI correctness — does it look right and meet design system standards?
- **lp-launch-qa** focuses on functional/compliance readiness — does it work and meet launch criteria?

## When to Use

- **S9B (UI Regression QA)**: After `/lp-build` completes UI tasks, before merging to main
- **Post-Design-Spec**: When a design spec exists and implementation is complete
- **Pre-PR Review**: Before human visual/design review to catch systematic issues
- **Responsive Audit**: Standalone audit of responsive behavior across breakpoints
- **A11y Audit**: Standalone accessibility compliance check
- **Token Migration**: After migrating to semantic tokens, verify no regressions

## Operating Mode

**AUDIT + REPORT**

**Allowed:**
- Read design spec (`docs/plans/<slug>-design-spec.md`)
- Read brand language doc (`docs/business-os/strategy/<BIZ>/brand-language.user.md`)
- Read built UI components (files from lp-build completion)
- Read design system docs and token reference
- Trace component tree and token bindings
- Run visual accessibility checks (automated only — no browser testing)
- Create/update issue report (`docs/plans/<slug>-design-qa-report.md`)
- Create/update Business OS card and stage doc via agent API

**Not Allowed:**
- Code changes (use `/lp-build` for fixes)
- Browser testing or screenshot capture (audit is code-only)
- Mockup creation or visual redesign (that's `/lp-design-spec`)
- Functional testing (that's `/lp-launch-qa`)
- Marking issues resolved without citing fix commits

## Invocation

### Fast Path

```
/lp-design-qa <feature-slug>
```

Expects `docs/plans/<slug>-plan.md` and `docs/plans/<slug>-design-spec.md` to exist. Reads both, audits the built UI against the spec.

### Business-Scoped Audit

```
/lp-design-qa --business <BIZ>
```

Audits all apps for the business unit against brand language and design system standards. No feature slug required.

### Scope-Limited Audit

```
/lp-design-qa <feature-slug> --scope responsive
/lp-design-qa <feature-slug> --scope a11y
/lp-design-qa <feature-slug> --scope tokens
/lp-design-qa <feature-slug> --scope visual
```

Audit only specific categories. `--scope full` audits all categories (default).

## Inputs

| Source | Path | Required |
|--------|------|----------|
| Design spec | `docs/plans/<slug>-design-spec.md` | Yes (for feature-level audit) |
| Plan doc | `docs/plans/<slug>-plan.md` | Yes (for feature-level audit) |
| Brand language | `docs/business-os/strategy/<BIZ>/brand-language.user.md` | Yes |
| Built UI components | Paths from plan's completed tasks "Affects" lists | Yes |
| Design system handbook | `docs/design-system-handbook.md` | Yes |
| Token reference | `packages/themes/<theme>/src/tokens.ts` | Yes |
| Typography & color | `docs/typography-and-color.md` | Yes |
| Accessibility guide | `docs/accessibility-guide.md` | No — enhances a11y checks |

## Workflow

### Step 1: Resolve Context

**Goal:** Identify what to audit and against what standard.

1. **For feature-slug path:**
   - Read `docs/plans/<slug>-plan.md` to get Business-Unit and list of completed tasks
   - Read `docs/plans/<slug>-design-spec.md` for expected visual state
   - Extract all file paths from completed tasks' "Affects" lists
   - Resolve business unit → brand language doc and theme package

2. **For business-scoped path:**
   - Read `businesses.json` to get app list and theme for BIZ
   - Read brand language doc for BIZ
   - Read current UI components across all apps for that business
   - Use brand language + design system as the standard (no feature spec)

3. **Load audit standards:**
   - Brand language doc (voice, audience, signature patterns, token overrides)
   - Theme tokens (semantic token catalog)
   - Design system handbook (component usage patterns, atomic layers)

**Outputs for report:**
- Business Unit, App name(s), Feature slug (if applicable)
- Design spec reference (if applicable)
- Scope (full | responsive | a11y | tokens | visual)

### Step 2: Component Inventory

**Goal:** Build a map of what was built and where.

1. **For feature-level audit:**
   - Read all files in completed tasks' "Affects" lists
   - Identify component hierarchy from design spec's composition tree
   - Verify actual components match planned components

2. **For business-level audit:**
   - Glob for components in target app(s): `apps/<app>/src/components/**/*.tsx`
   - Filter to UI components (exclude utils, hooks, types)
   - Group by atomic layer (atoms, molecules, organisms, pages)

3. **Build component inventory table:**

| Component | File Path | Expected (from spec) | Actual Status |
|-----------|-----------|----------------------|---------------|
| `BookingCTA` | `apps/brikette/src/components/landing/BookingWidget.tsx` | Primary button with bg-primary | ✓ Found |
| ... | ... | ... | ... |

**If components are missing from spec:** Flag as a deviation — include in issue report.

**Outputs for report:**
- Component inventory with spec compliance status
- List of unexpected components (not in spec)
- List of missing components (in spec but not built)

### Step 3: Visual Regression Checks

**Goal:** Verify visual implementation matches design spec and brand language.

**Check categories:**

#### VR-01: Token Binding Compliance
- For each element in design spec's "Token Binding" table:
  - Read the component file
  - Grep for the specified token class (e.g., `bg-primary`)
  - Verify it's used on the correct element/property
  - Check for arbitrary values (`#hex`, `bg-red-500`, inline styles with hardcoded colors)
- **Pass:** All specified tokens present, no arbitrary values
- **Fail:** Missing tokens, arbitrary values found, wrong tokens used

#### VR-02: Dark Mode Coverage
- For each token usage:
  - Verify the token has a dark variant in theme package
  - Check for any light-mode-only color values
  - Look for `dark:` overrides that bypass semantic tokens
- **Pass:** All colors have dark variants, no light-mode-only values
- **Fail:** Dark mode gaps, hardcoded dark overrides

#### VR-03: Component Reuse
- Check if components listed in spec's "Reused Components" are actually imported
- Verify no duplication of existing design system components
- Check correct package usage (design-system vs ui vs app-level)
- **Pass:** Spec's component map followed, no duplication
- **Fail:** Components not reused when they should be, wrong package layer

#### VR-04: Layout Skeleton
- Compare actual layout structure to spec's "Layout" section
- Verify spacing tokens match spec (e.g., `gap-4`, `p-6`)
- Check for arbitrary spacing values
- **Pass:** Layout matches spec, semantic spacing used
- **Fail:** Layout diverges from spec, arbitrary spacing found

#### VR-05: Brand Signature Patterns
- Read brand language "Signature Patterns" section
- Verify signature patterns are applied (e.g., "cards always use rounded-lg shadow-sm")
- Check for deviations from brand patterns without justification
- **Pass:** Brand patterns applied consistently
- **Fail:** Brand patterns violated or inconsistently applied

**Output per check:** Pass | Fail | Partial with evidence (file:line) and expected vs actual state.

### Step 4: Responsive Behavior Checks

**Goal:** Verify responsive breakpoints and mobile-first approach.

**Check categories:**

#### RS-01: Mobile-First Structure
- Verify base styles (no prefix) are mobile-appropriate
- Check that `md:` and `lg:` prefixes override mobile defaults
- Look for desktop-first patterns (`max-width` media queries, reverse overrides)
- **Pass:** Mobile-first, progressive enhancement via `md:` / `lg:`
- **Fail:** Desktop-first, missing mobile styles, incorrect breakpoint logic

#### RS-02: Breakpoint Compliance
- Compare actual breakpoints to spec's "Layout" section (mobile / tablet / desktop)
- Verify changes at `md:` (768px+) and `lg:` (1024px+) match spec
- Check for arbitrary breakpoints or custom media queries
- **Pass:** Spec breakpoints implemented correctly
- **Fail:** Breakpoints missing, arbitrary breakpoints used, spec not followed

#### RS-03: Touch Target Sizes
- Grep for interactive elements (buttons, links, inputs, clickable cards)
- Verify minimum size: `min-h-11 min-w-11` (or `h-11 w-11` for fixed)
- Check for interactive elements below WCAG minimum (44x44px)
- **Pass:** All interactive elements meet minimum size
- **Fail:** Interactive elements below minimum, no size constraints

#### RS-04: Overflow Handling
- Check for horizontal scroll issues (long text, fixed widths without `max-w`)
- Verify text wrapping (`break-words`, `line-clamp` usage)
- Look for unconstrained images or containers
- **Pass:** Content constrained, text wraps, no horizontal scroll
- **Fail:** Fixed widths cause overflow, missing max-width constraints

**Output per check:** Pass | Fail | Partial with evidence and recommended fixes.

### Step 5: Accessibility Checks

**Goal:** Verify WCAG AA compliance and spec's "Accessibility" section requirements.

**Check categories:**

#### A11Y-01: Semantic HTML
- Verify correct use of `<button>`, `<a>`, `<nav>`, `<main>`, `<section>`, `<article>`
- Check for `<div>` with `onClick` instead of `<button>`
- Verify heading hierarchy (`h1` → `h2` → `h3`, no skips)
- **Pass:** Semantic HTML used correctly
- **Fail:** Non-semantic elements for interactive content, heading hierarchy violated

#### A11Y-02: ARIA Coverage
- For each ARIA requirement in spec's "Accessibility" section:
  - Verify `role`, `aria-label`, `aria-labelledby`, `aria-describedby` present
  - Check for `aria-live` regions for dynamic content
  - Verify `aria-expanded`, `aria-controls` for disclosure widgets
- Check for redundant ARIA (e.g., `role="button"` on `<button>`)
- **Pass:** Required ARIA present, no redundant ARIA
- **Fail:** Missing ARIA, redundant ARIA, incorrect usage

#### A11Y-03: Focus Management
- Verify focus styles visible (`focus-visible:ring` or similar)
- Check for `focus:outline-none` without replacement
- Verify focus order matches visual/logical order (tab sequence from spec)
- Look for focus traps or missing `tabIndex` on custom interactive elements
- **Pass:** Focus visible, correct order, no traps
- **Fail:** Missing focus styles, wrong tab order, focus traps

#### A11Y-04: Contrast Compliance
- For each token combination in spec's "Token Binding":
  - Calculate contrast ratio (or flag for manual check if auto-check unavailable)
  - Verify ≥4.5:1 for normal text, ≥3:1 for large text/UI components (WCAG AA)
  - Check both light and dark modes
- **Pass:** All combinations meet WCAG AA
- **Fail:** Contrast ratios below threshold, token combinations not checked

#### A11Y-05: Screen Reader Support
- Verify visually-hidden text for icons/graphics (`sr-only` class)
- Check for `alt` text on images (empty `alt=""` for decorative)
- Verify form labels (`<label>` or `aria-label`)
- **Pass:** Screen reader text present where needed
- **Fail:** Missing alt text, unlabeled form inputs, icon-only buttons without labels

**Output per check:** Pass | Fail | Partial with WCAG reference and recommended fixes.

### Step 6: Token Compliance Checks

**Goal:** Verify semantic token usage and theme package integrity.

**Check categories:**

#### TC-01: Arbitrary Value Audit
- Grep for arbitrary values: `#`, `rgb(`, `hsl(`, `[`, `px` in className strings
- Filter out legitimate uses (e.g., `calc()` in utility classes, `data-[` attributes)
- Flag hardcoded colors, spacing, sizes
- **Pass:** Zero arbitrary values for color/spacing/sizing
- **Fail:** Arbitrary values found

#### TC-02: Tailwind Palette Usage
- Grep for Tailwind default palette classes: `bg-red-500`, `text-blue-600`, etc.
- Verify no non-semantic color classes
- **Pass:** Zero Tailwind palette classes
- **Fail:** Palette classes found (should use semantic tokens)

#### TC-03: Token Existence
- For each token class used in components:
  - Verify it exists in theme package's `tokens.ts`
  - Check for invented tokens (e.g., `bg-brand-coral` when theme only defines `bg-primary`)
- **Pass:** All tokens exist in theme
- **Fail:** Invented tokens, missing token definitions

#### TC-04: Dark Mode Token Integrity
- For each semantic token used:
  - Verify it has a dark mode variant in theme
  - Check for `dark:` overrides that bypass semantic tokens
- **Pass:** All tokens have dark variants, no bypasses
- **Fail:** Dark mode gaps, hardcoded dark overrides

**Output per check:** Pass | Fail with list of violations and fix actions.

### Step 7: Produce Issue Report

**Goal:** Create a structured, actionable issue list.

**Output path:**
```
docs/plans/<slug>-design-qa-report.md
```

**Frontmatter:**
```yaml
---
Type: Design-QA-Report
Status: <In-review | Issues-found | Passed>
Feature-Slug: <slug>
Business-Unit: <BIZ>
Audit-Scope: <full | responsive | a11y | tokens | visual>
Created: <YYYY-MM-DD>
Last-updated: <YYYY-MM-DD>
Design-Spec: docs/plans/<slug>-design-spec.md
Issues-Found: <count>
Critical-Issues: <count>
---
```

**Report sections:**

1. **Executive Summary**
   - Overall verdict: Pass | Issues-found | Critical-issues-found
   - Issue breakdown by severity and category
   - Must-fix blockers before merge

2. **Component Inventory Status**
   - Expected vs actual components
   - Missing components
   - Unexpected components (not in spec)

3. **Issues by Category**

For each issue, use structured format:

```markdown
### Issue DQ-01: Primary CTA uses arbitrary color value
- **Severity:** Critical
- **Category:** Token compliance
- **Component:** `BookingWidget.tsx:45`
- **Expected:** `bg-primary` (from design spec)
- **Actual:** `bg-[#e74c3c]`
- **Impact:** Dark mode broken, brand color inconsistency
- **Fix:** Replace `bg-[#e74c3c]` with `bg-primary`
- **Estimated effort:** XS (1-line change)
```

**Severity levels:**
- **Critical:** Blocks merge — a11y violation, dark mode broken, arbitrary colors, brand violation
- **Major:** Should fix before merge — missing responsive behavior, incorrect token, layout divergence
- **Minor:** Polish issue — spacing inconsistency, missing hover state, non-critical a11y improvement

**Issue categories:**
- Visual regression
- Responsive behavior
- Accessibility (WCAG AA)
- Token compliance
- Component reuse
- Brand pattern violation

4. **Pass Summary**
   - List of checks that passed with evidence

5. **Recommended Fix Sequence**
   - Critical issues first (blockers)
   - Major issues by component (group related fixes)
   - Minor issues last

6. **Sign-off Checklist**
   - [ ] All Critical issues resolved
   - [ ] All Major issues resolved or deferred with justification
   - [ ] Design spec compliance verified
   - [ ] Brand language patterns applied
   - [ ] WCAG AA compliance achieved
   - [ ] Dark mode tested (code-level)
   - [ ] Ready for `/lp-launch-qa` functional audit

### Step 8: Report Completion

**Completion message format:**

```
Design QA complete for <feature-slug> (<BIZ>).

**Audit summary:**
- Scope: <full | responsive | a11y | tokens | visual>
- Components audited: <N>
- Issues found: <N> | Critical: <N> | Major: <N> | Minor: <N>

**Issue breakdown by category:**
- Visual regression: <N>
- Responsive behavior: <N>
- Accessibility: <N>
- Token compliance: <N>
- Component reuse: <N>
- Brand pattern violation: <N>

**Verdict:** <Pass | Issues-found | Critical-issues-found>

**Blockers for merge:** <list Critical issues or "None">

**Report:** `docs/plans/<slug>-design-qa-report.md`
**Next:**
- If issues found: `/lp-build` to fix issues in report
- If passed: `/lp-launch-qa` for functional/compliance readiness
```

## Quality Checks

- [ ] Design spec read and used as expected state baseline
- [ ] Brand language doc read and patterns checked
- [ ] All components in "Affects" lists audited (not a sample)
- [ ] Every issue cites file path and line number
- [ ] Every issue includes Expected vs Actual state
- [ ] Every issue includes recommended fix
- [ ] Severity assigned based on impact (not arbitrary)
- [ ] All critical issues are genuine blockers (a11y, dark mode, brand violations)
- [ ] Pass verdicts cite evidence (not assumed)
- [ ] Report saved at correct path with correct frontmatter
- [ ] Issue count in frontmatter matches report body

## Integration

- **Upstream dependencies:**
  - `/lp-design-spec` defines expected visual state
  - `/lp-build` produces the built UI
  - Plan doc lists completed tasks and affected files

- **Downstream consumers:**
  - `/lp-build` uses issue report to fix regressions
  - `/lp-launch-qa` assumes design QA passed before functional audit
  - Human PR reviewers use report for visual review focus areas

- **Loop position:** S9B (UI Regression QA) — post-build, pre-launch-qa
- **Trigger conditions:**
  - `/lp-build` completes UI tasks
  - Design spec exists
  - Feature ready for visual review

- **Business OS sync:** Updates build stage doc with design-qa results and issue count

## Red Flags (Invalid Run)

1. **Design spec missing:** If no design spec exists for a feature-level audit, STOP and recommend running `/lp-design-spec` first.
2. **No completed build tasks:** If plan has no completed IMPLEMENT tasks, STOP — nothing to audit yet.
3. **Issues without evidence:** Every issue must cite file:line. No "I think" or "probably" issues.
4. **False passes:** If a check genuinely cannot be verified from code (e.g., visual contrast needs browser testing), mark as "Manual check required" not "Pass".
5. **Scope mismatch:** If user requests `--scope a11y` but no a11y requirements in spec, STOP and clarify scope with user.
6. **Severity inflation:** Do not mark minor polish issues as Critical. Reserve Critical for genuine merge blockers (a11y violations, broken dark mode, brand violations, arbitrary color values).

## Example Invocations

```
/lp-design-qa commerce-core
/lp-design-qa --business BRIK --scope tokens
/lp-design-qa prime-onboarding --scope a11y
/lp-design-qa brikette-booking-widget --scope full
```
