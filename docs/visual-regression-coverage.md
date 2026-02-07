---
Type: Reference
Status: Active
Domain: Design System / Testing
Created: 2026-01-16
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
---

# Visual Regression Coverage

This document defines critical DS components for Chromatic visual regression testing.

## Infrastructure

### Workflow

Visual regression is configured in `.github/workflows/storybook.yml`:

| Job | Purpose | Trigger |
|-----|---------|---------|
| `coverage` | Story coverage policy check | PR + push to main |
| `chromatic` | Visual regression snapshots | PR + push to main (requires `CHROMATIC_PROJECT_TOKEN`) |
| `ui-smoke` | Token + RTL smoke tests | PR + push to main |
| `runner` | Storybook test runner (critical set) | PR + push to main |

### Verification Command

```bash
# Check story coverage against policy
pnpm stories:verify
```

## Critical Component List

### Tier 1: Atoms (Highest Priority)

These foundation components require complete visual regression coverage.

| Component | Story File | States Required |
|-----------|-----------|-----------------|
| Button | `atoms/primitives/Button.stories.tsx` | All sizes, colors, tones, disabled |
| IconButton | `atoms/IconButton.stories.tsx` | All sizes, variants, disabled |
| Tag | `atoms/Tag.stories.tsx` | All sizes, colors, tones |
| Chip | `atoms/Chip.stories.tsx` | All sizes, colors, with/without remove |
| Alert | `atoms/Alert.stories.tsx` | All variants, tones |
| Input | `atoms/primitives/Input.stories.tsx` | Default, focused, error, disabled |
| Checkbox | `atoms/primitives/Checkbox.stories.tsx` | Unchecked, checked, indeterminate, disabled |
| Select | `atoms/primitives/Select.stories.tsx` | Closed, open, selected, disabled |
| Switch | `atoms/Switch.stories.tsx` | On, off, disabled |
| ProductBadge | `atoms/ProductBadge.stories.tsx` | All sizes, colors, tones |
| Progress | `atoms/Progress.stories.tsx` | Various percentages |
| Skeleton | `atoms/Skeleton.stories.tsx` | Various shapes/sizes |

### Tier 2: Molecules (High Priority)

Composed components that affect user experience.

| Component | Story File | States Required |
|-----------|-----------|-----------------|
| FormField | `molecules/FormField.stories.tsx` | Default, error, required, disabled |
| SearchBar | `molecules/SearchBar.stories.tsx` | Empty, with query, with suggestions |
| Breadcrumbs | `molecules/Breadcrumbs.stories.tsx` | Various depths |
| Accordion | `molecules/Accordion.stories.tsx` | Collapsed, expanded |
| QuantityInput | `molecules/QuantityInput.stories.tsx` | Default, min, max, disabled |
| PaginationControl | `molecules/PaginationControl.stories.tsx` | Various page counts |

### Tier 3: Overlays (High Priority)

Modal and overlay components critical for UX.

| Component | Story File | States Required |
|-----------|-----------|-----------------|
| Dialog | `atoms/primitives/Dialog.stories.tsx` | Open state |
| Drawer | `atoms/primitives/drawer.stories.tsx` | Left, right positions |
| Popover | `atoms/Popover.stories.tsx` | Open state, various placements |
| DropdownMenu | `atoms/primitives/dropdown-menu.stories.tsx` | Open state |
| Toast | `atoms/Toast.stories.tsx` | All variants |

### Tier 4: CMS Components (Medium Priority)

CMS-specific patterns used in admin interfaces.

| Component | Story File | States Required |
|-----------|-----------|-----------------|
| CmsBuildHero | `cms/CmsBuildHero.stories.tsx` | All tones |
| CmsLaunchChecklist | `cms/CmsLaunchChecklist.stories.tsx` | Various states |
| CmsMetricTiles | `cms/CmsMetricTiles.stories.tsx` | Various configurations |

## Story Requirements

Each critical component must have stories covering:

### 1. Default State
```tsx
export const Default: Story = {};
```

### 2. All Sizes
```tsx
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### 3. All Colors
```tsx
export const Colors: Story = {
  render: () => (
    <div className="flex gap-2">
      {['default', 'primary', 'accent', 'success', 'info', 'warning', 'danger'].map(color => (
        <Button key={color} color={color}>{color}</Button>
      ))}
    </div>
  ),
};
```

### 4. All Tones
```tsx
export const Tones: Story = {
  render: () => (
    <div className="flex gap-2">
      {['solid', 'soft', 'outline', 'ghost', 'quiet'].map(tone => (
        <Button key={tone} tone={tone}>{tone}</Button>
      ))}
    </div>
  ),
};
```

### 5. Interactive States
```tsx
export const States: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button data-state="hover">Hover</Button>
      <Button data-state="focus">Focus</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
```

### 6. Dark Mode

Use Storybook decorator or explicit story:

```tsx
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark',
  },
};
```

### 7. RTL Layout (where applicable)

```tsx
export const RTL: Story = {
  parameters: {
    direction: 'rtl',
  },
};
```

## Chromatic Configuration

### Enabling Visual Regression

Stories included in visual regression should have:

```tsx
export const Default: Story = {
  parameters: {
    chromatic: {
      disable: false,
    },
  },
};
```

### Multi-Mode Snapshots

Capture light and dark mode in single story:

```tsx
export const Default: Story = {
  parameters: {
    chromatic: {
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
      },
    },
  },
};
```

### Disabling for Specific Stories

For stories with animation or dynamic content:

```tsx
export const Animated: Story = {
  parameters: {
    chromatic: { disable: true },
  },
};
```

## Coverage Tracking

### Current Status

| Tier | Components | With Stories | Coverage |
|------|------------|--------------|----------|
| Tier 1 (Atoms) | 12 | 12 | 100% |
| Tier 2 (Molecules) | 6 | 6 | 100% |
| Tier 3 (Overlays) | 5 | 5 | 100% |
| Tier 4 (CMS) | 3 | 3 | 100% |

### Adding New Components

When adding a new component to the critical list:

1. Create comprehensive stories following requirements above
2. Add to appropriate tier in this document
3. Verify with `pnpm stories:verify`
4. Add Chromatic parameters for visual regression

## Related Documentation

- [Design System Handbook](design-system-handbook.md) - Component library overview
- [Component API Standard](component-api-standard.md) - Prop conventions
- [Accessibility Audit Plan](accessibility-audit-plan.md) - A11y testing
