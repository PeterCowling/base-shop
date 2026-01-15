# Token System Quick Reference

One-page reference for using design tokens in Reception.

## Import Patterns

```typescript
// Colors
import { colors } from "@acme/design-tokens/core/colors";

// Layout Primitives
import { Stack, Inline, Grid, Cluster } from '@acme/ui/atoms';

// Shared Components
import { StatusChip } from '@acme/ui/molecules';
import { TableHeader } from '@acme/ui/atoms';
```

## Color Tokens

### Using in TypeScript
```typescript
const CHART_COLORS = {
  primary: colors.indigo[600],    // #4f46e5
  success: colors.emerald[500],   // #10b981
  warning: colors.orange[400],    // #fb923c
  danger: colors.rose[600],       // #e11d48
  info: colors.sky[500],          // #0ea5e9
  neutral: colors.teal[600],      // #14b8a6
} as const;
```

### Using in Tailwind
```tsx
<div className="text-action-primary bg-action-success">
<div className="border-action-danger hover:bg-action-warning">
```

## Typography Tokens

### Tailwind Classes
```tsx
<span className="text-ops-micro">10px text</span>
<span className="text-ops-tiny">11px text</span>
<span className="text-ops-compact">13px text</span>
```

### CSS Variables
```tsx
<span style={{ fontSize: 'var(--ops-micro-size)' }}>10px</span>
<span style={{ fontSize: 'var(--ops-tiny-size)' }}>11px</span>
<span style={{ fontSize: 'var(--ops-compact-size)' }}>13px</span>
```

## Size Tokens

### Modal Widths
```tsx
<div className="min-w-[var(--ops-modal-sm)]">    {/* 320px */}
<div className="min-w-[var(--ops-modal-md)]">    {/* 480px */}
<div className="min-w-[var(--ops-modal-lg)]">    {/* 640px */}
<div className="min-w-[var(--ops-modal-xl)]">    {/* 960px */}
```

### Panel Heights
```tsx
<div className="max-h-[var(--ops-panel-short)]">   {/* 30vh */}
<div className="max-h-[var(--ops-panel-medium)]">  {/* 60vh */}
<div className="max-h-[var(--ops-panel-tall)]">    {/* 80vh */}
```

### Component Sizes
```tsx
<button className="h-[var(--ops-button-height)]">  {/* 40px */}
<input className="h-[var(--ops-input-height)]">    {/* 40px */}
<td className="h-[var(--ops-cell-height)]">        {/* 44px - accessible */}
<div className="h-[var(--ops-card-height)]">       {/* 80px */}
```

## Layout Primitives

### Stack (Vertical)
```tsx
<Stack gap={4}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Props: gap (0-12), align (start|center|end|stretch)
```

### Inline (Horizontal)
```tsx
<Inline gap={2} alignY="center">
  <Button />
  <Button />
</Inline>

// Props: gap (0-12), alignY (start|center|end|baseline), wrap (bool)
```

### Grid
```tsx
<Grid cols={3} gap={4}>
  <Card />
  <Card />
  <Card />
</Grid>

// Props: cols (1|2|3|4|5|6|12), gap (0-12)
```

### Cluster (Flex + Justify)
```tsx
<Cluster justify="between" alignY="center" gap={2}>
  <span>Label</span>
  <Button />
</Cluster>

// Props: justify (start|center|end|between), alignY (start|center|end), gap (1-6)
```

## Shared Components

### StatusChip
```tsx
<StatusChip variant="success" size="sm">Active</StatusChip>
<StatusChip variant="warning" size="md">Pending</StatusChip>
<StatusChip variant="error">Failed</StatusChip>

// Variants: success, warning, error, info, neutral, primary, secondary
// Sizes: sm, md
```

### TableHeader
```tsx
<TableHeader
  label="Name"
  field="name"
  sortable
  currentSortField={sortField}
  sortAscending={ascending}
  onSort={handleSort}
/>
```

### SimpleModal
```tsx
<SimpleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  maxWidth="max-w-[var(--ops-modal-lg)]"
>
  <Stack gap={4}>Content</Stack>
</SimpleModal>
```

## Migration Cheat Sheet

| Old Pattern | New Pattern |
|-------------|-------------|
| `#4f46e5` | `colors.indigo[600]` or `text-action-primary` |
| `#10b981` | `colors.emerald[500]` or `text-action-success` |
| `#fb923c` | `colors.orange[400]` or `text-action-warning` |
| `#e11d48` | `colors.rose[600]` or `text-action-danger` |
| `text-[10px]` | `text-ops-micro` |
| `text-[11px]` | `text-ops-tiny` |
| `text-[13px]` | `text-ops-compact` |
| `min-w-[40rem]` | `min-w-[var(--ops-modal-lg)]` |
| `max-h-[60vh]` | `max-h-[var(--ops-panel-medium)]` |
| `flex flex-col` | `<Stack>` |
| `flex` | `<Inline>` or `<Cluster>` |
| `grid` | `<Grid>` |

## VSCode Snippets

Type these prefixes and press Tab:

- `import-token-colors` → Import colors from design-tokens
- `import-primitives` → Import Stack, Inline, Grid, Cluster
- `chart-colors` → Create CHART_COLORS constant
- `stack` → Stack component with gap
- `inline` → Inline component with gap
- `grid` → Grid component with cols
- `cluster` → Cluster component with justify
- `text-micro` → text-ops-micro class
- `color-primary` → text/bg-action-primary class
- `modal-size` → min-w-[var(--ops-modal-*)]
- `status-chip` → StatusChip component
- `table-header` → TableHeader component
- `simple-modal` → SimpleModal component

## Find Migration Opportunities

```bash
./scripts/find-token-migrations.sh
```

Shows:
- Files with raw colors
- Files with arbitrary font sizes
- Files with arbitrary dimensions
- Files using raw flex/grid

## Common Patterns

### Chart Component
```typescript
import { colors } from "@acme/design-tokens/core/colors";

const CHART_COLORS = {
  primary: colors.indigo[600],
  success: colors.emerald[500],
} as const;

const data = {
  datasets: [{
    backgroundColor: CHART_COLORS.primary,
  }]
};
```

### Dashboard Card
```tsx
import { Stack, Cluster } from '@acme/ui/atoms';

<Stack gap={2} className="p-3 bg-white rounded shadow">
  <Cluster justify="between" alignY="center">
    <span className="text-ops-micro text-action-primary">Label</span>
    <span className="text-ops-tiny">Value</span>
  </Cluster>
</Stack>
```

### Modal Dialog
```tsx
import { SimpleModal } from '@acme/ui/molecules';
import { Stack } from '@acme/ui/atoms';

<SimpleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Dialog"
  maxWidth="max-w-[var(--ops-modal-lg)]"
>
  <Stack gap={4}>
    {/* content */}
  </Stack>
</SimpleModal>
```

## Accessible Tap Targets

Use `min-h-11 min-w-11` (44px) for interactive elements:

```tsx
<button className="min-h-11 min-w-11 flex items-center justify-center">
  <Icon />
</button>
```

Or use primitives/components that include it:
- TableHeader (already 44px)
- SimpleModal close button (already 44px)
- StatusChip (not interactive, no requirement)

## Full Documentation

- **Token Reference**: [DESIGN-TOKENS.md](./DESIGN-TOKENS.md)
- **Migration Guide**: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
- **Full Summary**: [TOKEN-SYSTEM-SUMMARY.md](./TOKEN-SYSTEM-SUMMARY.md)
- **Commit Guide**: [COMMIT-GUIDE.md](./COMMIT-GUIDE.md)

---

**Keep this open while coding** for quick token lookups!
