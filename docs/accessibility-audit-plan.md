---
Type: Plan
Status: Active
Domain: Accessibility
Created: 2026-01-16
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
---

# Accessibility Audit Plan

This document defines the WCAG 2.1 AA compliance audit strategy for the `@acme/ui` design system.

## Scope

- All components in `packages/ui/src/components/`
- Focus on atoms and molecules (foundation components)
- Organisms and templates inherit compliance from foundations

## Testing Infrastructure

### Automated Testing Tools

| Tool | Purpose | Location |
|------|---------|----------|
| jest-axe | Unit-level a11y assertions | `packages/ui/__tests__/*.test.tsx` |
| @storybook/addon-a11y | Story-level WCAG checks | `apps/storybook/.storybook/main.ts` |
| Cypress audit | E2E accessibility testing | `apps/*/cypress/e2e/*a11y*.cy.ts` |
| pa11y | CLI accessibility testing | Available in devDependencies |

### Test File Patterns

| Type | Pattern | Estimated Count |
|------|---------|-----------------|
| Jest a11y | `**/*.a11y.test.tsx` | 8+ |
| Cypress a11y | `**/cypress/e2e/*a11y*.cy.ts` | 35+ |
| Storybook a11y | All stories (via addon) | 100+ |

### Running Accessibility Tests

```bash
# Jest accessibility tests
pnpm test --filter=@acme/ui -- --testPathPattern=a11y

# Storybook accessibility checks
pnpm storybook:test:a11y

# Cypress accessibility tests
pnpm cypress:run --spec "**/a11y*.cy.ts"
```

## WCAG 2.1 AA Checklist

### Perceivable

| Criterion | ID | Priority | Status | Notes |
|-----------|-----|----------|--------|-------|
| Non-text Content | 1.1.1 | High | In Progress | Icon buttons require aria-label |
| Info and Relationships | 1.3.1 | High | Partial | Semantic HTML in place |
| Meaningful Sequence | 1.3.2 | Medium | Compliant | DOM order matches visual |
| Sensory Characteristics | 1.3.3 | Medium | Compliant | No color-only indicators |
| Use of Color | 1.4.1 | High | Compliant | Icons/text accompany color |
| Audio Control | 1.4.2 | Low | N/A | No auto-playing audio |
| Color Contrast (Normal) | 1.4.3 | High | Partial | Base/dark themes tested |
| Resize Text | 1.4.4 | Medium | Compliant | rem-based typography |
| Images of Text | 1.4.5 | Medium | Compliant | Real text used |
| Reflow | 1.4.10 | Medium | Partial | Responsive design |
| Non-text Contrast | 1.4.11 | High | Pending | Focus rings need audit |
| Text Spacing | 1.4.12 | Low | Compliant | CSS handles spacing |

### Operable

| Criterion | ID | Priority | Status | Notes |
|-----------|-----|----------|--------|-------|
| Keyboard | 2.1.1 | High | Partial | Radix provides support |
| No Keyboard Trap | 2.1.2 | High | Partial | Focus trap in modals |
| Character Key Shortcuts | 2.1.4 | Low | N/A | No single-char shortcuts |
| Timing Adjustable | 2.2.1 | Medium | Compliant | No time limits |
| Pause, Stop, Hide | 2.2.2 | Medium | Compliant | Animations respect prefers-reduced-motion |
| Three Flashes | 2.3.1 | High | Compliant | No flashing content |
| Bypass Blocks | 2.4.1 | Medium | Pending | Skip links needed |
| Page Titled | 2.4.2 | Medium | Compliant | i18n handles titles |
| Focus Order | 2.4.3 | High | Compliant | Tab order is logical |
| Link Purpose | 2.4.4 | Medium | Partial | Some links need context |
| Multiple Ways | 2.4.5 | Low | Compliant | Search + navigation |
| Headings and Labels | 2.4.6 | Medium | Compliant | Proper heading hierarchy |
| Focus Visible | 2.4.7 | High | In Progress | `ring` token configured |
| Target Size | 2.5.5 | Medium | Partial | 44px targets on buttons |

### Understandable

| Criterion | ID | Priority | Status | Notes |
|-----------|-----|----------|--------|-------|
| Language of Page | 3.1.1 | Medium | Compliant | i18n framework handles |
| On Focus | 3.2.1 | High | Compliant | No context change on focus |
| On Input | 3.2.2 | High | Compliant | Explicit submit required |
| Consistent Navigation | 3.2.3 | Medium | Compliant | Consistent nav pattern |
| Consistent Identification | 3.2.4 | Medium | Compliant | Icons/labels consistent |
| Error Identification | 3.3.1 | High | Partial | Alert component exists |
| Labels or Instructions | 3.3.2 | High | Partial | FormField provides labels |
| Error Suggestion | 3.3.3 | Medium | Pending | Error messages need work |
| Error Prevention | 3.3.4 | Medium | Partial | Confirmation on destructive |

### Robust

| Criterion | ID | Priority | Status | Notes |
|-----------|-----|----------|--------|-------|
| Parsing | 4.1.1 | Low | Compliant | React handles |
| Name, Role, Value | 4.1.2 | High | Partial | Radix provides ARIA |
| Status Messages | 4.1.3 | Medium | Partial | Toast uses role="status" |

## Component Audit Status

### Tier 1: Atoms

| Component | Keyboard | Focus Ring | Contrast | ARIA | Tests | Status |
|-----------|----------|------------|----------|------|-------|--------|
| Button | Yes | Yes | Yes | Yes | Yes | **Compliant** |
| IconButton | Yes | Yes | Yes | Warn | Partial | **Needs Work** |
| Input | Yes | Yes | Yes | Yes | Yes | **Compliant** |
| Checkbox | Yes | Yes | Yes | Yes | Yes | **Compliant** |
| Select | Yes | Yes | Yes | Yes | Partial | Pending |
| Switch | Yes | Yes | Yes | Yes | Partial | Pending |
| Tag | N/A | N/A | Yes | N/A | No | Pending |
| Chip | Yes | Yes | Yes | Yes | No | Pending |
| Alert | N/A | N/A | Yes | Yes | No | Pending |
| Progress | N/A | N/A | Yes | Yes | No | Pending |

### Tier 2: Molecules

| Component | Keyboard | Focus Ring | Contrast | ARIA | Tests | Status |
|-----------|----------|------------|----------|------|-------|--------|
| Accordion | Yes | Yes | Pending | Yes | No | Pending |
| SearchBar | Yes | Yes | Pending | Yes | No | Pending |
| FormField | Yes | Yes | Yes | Yes | No | Pending |
| Breadcrumbs | Yes | Yes | Pending | Yes | No | Pending |

### Tier 3: Overlays

| Component | Keyboard | Focus Trap | Contrast | ARIA | Tests | Status |
|-----------|----------|------------|----------|------|-------|--------|
| Dialog | Yes | Yes | Yes | Yes | Yes | **Compliant** |
| Drawer | Yes | Yes | Yes | Yes | Partial | Pending |
| Popover | Yes | No | Pending | Yes | No | Pending |
| DropdownMenu | Yes | No | Pending | Yes | No | Pending |

## Remediation Workflow

### 1. Identify Issues

```bash
# Run automated scans
pnpm test --filter=@acme/ui -- --testPathPattern=a11y

# Check Storybook a11y panel
pnpm storybook
# Open browser dev tools > Accessibility panel
```

### 2. Triage by Impact

Priority order:
1. **P0**: Keyboard inaccessible (blocks users)
2. **P1**: Missing ARIA labels (screen reader blocked)
3. **P2**: Contrast failures (low vision affected)
4. **P3**: Focus visibility issues (keyboard users affected)
5. **P4**: Documentation/minor issues

### 3. Implement Fix

```tsx
// Example: Adding aria-label to IconButton
<IconButton aria-label="Close menu">
  <XIcon />
</IconButton>
```

### 4. Add Regression Test

```tsx
// packages/ui/__tests__/IconButton.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { IconButton } from '../src/components/atoms/IconButton';
import { XIcon } from 'lucide-react';

expect.extend(toHaveNoViolations);

describe('IconButton accessibility', () => {
  it('has no violations with aria-label', async () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <XIcon />
      </IconButton>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('warns when missing accessible name', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    render(
      <IconButton>
        <XIcon />
      </IconButton>
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('aria-label')
    );
  });
});
```

### 5. Update Status

Update this document with new status after fix is merged.

## Adding Accessibility Tests

### Jest (Unit)

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Cypress (E2E)

```tsx
it('passes accessibility audit', () => {
  cy.mount(<Component />);
  cy.injectAxe();
  cy.checkA11y();
});
```

### Storybook (Story-level)

Accessibility checks run automatically via `@storybook/addon-a11y`. View results in the Accessibility panel.

## Review Schedule

| Quarter | Focus | Owner | Deliverable |
|---------|-------|-------|-------------|
| Q1 2026 | Tier 1 Atoms audit | DS Team | All atoms pass automated checks |
| Q2 2026 | Tier 2 Molecules + Overlays | DS Team | All molecules/overlays pass |
| Q3 2026 | Brand theme contrast | DS Team | All 7 themes verified |
| Q4 2026 | Full re-audit | DS Team | WCAG 2.1 AA certification |

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Deque axe DevTools](https://www.deque.com/axe/devtools/)
- [Storybook Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)

## Related Documentation

- [Design System Handbook](design-system-handbook.md) - Component library overview
- [Component API Standard](component-api-standard.md) - Prop conventions
- [Visual Regression Coverage](visual-regression-coverage.md) - Visual testing
