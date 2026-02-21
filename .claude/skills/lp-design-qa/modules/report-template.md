# Report Template: Design QA Report

## Output Path

```
docs/plans/<slug>-design-qa-report.md
```

## Frontmatter

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

## Report Sections

### 1. Executive Summary

- Overall verdict: Pass | Issues-found | Critical-issues-found
- Issue breakdown by severity and category
- Must-fix blockers before merge

### 2. Component Inventory Status

- Expected vs actual components
- Missing components (in spec but not built)
- Unexpected components (not in spec)

### 3. Issues by Category

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

### 4. Pass Summary

List of checks that passed with evidence (do not mark "Pass" without evidence).

### 5. Recommended Fix Sequence

- Critical issues first (blockers)
- Major issues by component (group related fixes)
- Minor issues last

### 6. Sign-off Checklist

- [ ] All Critical issues resolved
- [ ] All Major issues resolved or deferred with justification
- [ ] Design spec compliance verified
- [ ] Brand language patterns applied
- [ ] WCAG AA compliance achieved
- [ ] Dark mode tested (code-level)
- [ ] Ready for `/lp-launch-qa` functional audit
