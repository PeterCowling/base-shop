# Design Tokens & Layout Primitives for Reception

This guide helps Reception developers use centralized design tokens and layout primitives to reduce lint violations and improve consistency.

## Layout Primitives

Reception should use layout primitives from `@acme/ui/atoms` instead of raw flex/grid:

### Available Primitives

```tsx
import { Stack, Inline, Grid, Cluster } from '@acme/ui/atoms';
```

#### Stack (Vertical Layout)
For vertical arrangements:

```tsx
// ❌ Before (lint error)
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ✅ After (using primitive)
<Stack gap={4}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

**Props:**
- `gap`: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
- `align`: "start" | "center" | "end" | "stretch"
- `asChild`: boolean (use Slot pattern)

#### Inline (Horizontal Layout)
For horizontal arrangements:

```tsx
// ❌ Before
<div className="flex gap-2 items-center">
  <Button />
  <Button />
</div>

// ✅ After
<Inline gap={2} alignY="center">
  <Button />
  <Button />
</Inline>
```

**Props:**
- `gap`: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
- `alignY`: "start" | "center" | "end" | "baseline"
- `wrap`: boolean (default: true)

#### Grid (Grid Layout)
For grid layouts:

```tsx
// ❌ Before
<div className="grid grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>

// ✅ After
<Grid cols={3} gap={4}>
  <Card />
  <Card />
  <Card />
</Grid>
```

**Props:**
- `cols`: 1 | 2 | 3 | 4 | 5 | 6 | 12
- `gap`: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

#### Cluster (Flex with Justify)
For flex layouts with justification:

```tsx
// ❌ Before
<div className="flex justify-between items-center gap-2">
  <span>Label</span>
  <Button />
</div>

// ✅ After
<Cluster justify="between" alignY="center" gap={2}>
  <span>Label</span>
  <Button />
</Cluster>
```

**Props:**
- `gap`: 1 | 2 | 3 | 4 | 5 | 6
- `alignY`: "start" | "center" | "end"
- `justify`: "start" | "center" | "end" | "between"
- `wrap`: boolean (default: true)

## Design Tokens

Reception uses the **operations context** tokens from `@acme/design-tokens`.

### Color Tokens

Replace raw hex colors with semantic tokens:

```tsx
// ❌ Before (raw color)
<div style={{ backgroundColor: '#4f46e5' }}>

// ✅ After (using CSS variable)
<div className="bg-[var(--ops-action-primary)]">

// ✅ Or with Tailwind config extension
<div className="bg-action-primary">
```

**Available Color Tokens:**

**Status Colors:**
- `status-available` - Green (#16a34a)
- `status-occupied` - Red (#dc2626)
- `status-cleaning` - Yellow (#ca8a04)
- `status-maintenance` - Blue (#2563eb)

**Stock Colors:**
- `stock-low` - Red (#dc2626)
- `stock-ok` - Green (#16a34a)
- `stock-high` - Blue (#3b82f6)

**Action Colors:**
- `action-primary` - Indigo (#4f46e5)
- `action-success` - Emerald (#10b981)
- `action-warning` - Orange (#fb923c)
- `action-danger` - Rose (#e11d48)
- `action-info` - Sky (#0ea5e9)
- `action-neutral` - Teal (#0d9488)

**Dark Mode:**
- `surface-dark` - #333333
- `surface-darker` - #000000
- `accent-dark-green` - #a8dba8
- `accent-dark-orange` - #ffd89e

### Typography Tokens

Replace arbitrary font sizes:

```tsx
// ❌ Before
<span className="text-[10px]">Micro text</span>
<span className="text-[11px]">Tiny text</span>
<span className="text-[13px]">Compact text</span>

// ✅ After (using CSS variables)
<span className="text-[var(--ops-typography-micro-size)]">Micro text</span>
<span className="text-[var(--ops-typography-tiny-size)]">Tiny text</span>
<span className="text-[var(--ops-typography-compact-size)]">Compact text</span>
```

**Available Typography Tokens:**
- `micro-size`: 10px
- `tiny-size`: 11px
- `label-size`: 12px
- `compact-size`: 13px
- `base-size`: 14px
- `heading-size`: 18px

### Size Tokens

Replace arbitrary dimensions:

```tsx
// ❌ Before
<div className="min-w-[40rem]">
<div className="max-h-[60vh]">
<div className="h-[80px]">

// ✅ After
<div className="min-w-[var(--ops-size-modal-lg)]">
<div className="max-h-[var(--ops-size-panel-medium)]">
<div className="h-[var(--ops-size-card-height)]">
```

**Available Size Tokens:**

**Modal Widths:**
- `modal-sm`: 320px
- `modal-md`: 480px
- `modal-lg`: 640px
- `modal-xl`: 960px

**Panel Heights:**
- `panel-short`: 30vh
- `panel-medium`: 60vh
- `panel-tall`: 80vh

**Component Sizes:**
- `button-height`: 40px
- `input-height`: 40px
- `cell-height`: 44px (meets tap target)
- `card-height`: 80px

## Migration Examples

### Example 1: Status Badge

```tsx
// ❌ Before
<span
  className="inline-flex items-center px-2 py-1 text-[11px] rounded"
  style={{ backgroundColor: '#22c55e', color: '#fff' }}
>
  Available
</span>

// ✅ After
import { StatusChip } from '@acme/ui/molecules';

<StatusChip variant="success" size="sm">
  Available
</StatusChip>
```

### Example 2: Table Header

```tsx
// ❌ Before
<th
  className="px-3 py-2 text-sm cursor-pointer"
  onClick={() => handleSort('name')}
>
  <div className="flex items-center gap-2">
    Name
    <ArrowIcon />
  </div>
</th>

// ✅ After
import { TableHeader } from '@acme/ui/atoms';

<TableHeader
  label="Name"
  field="name"
  sortable
  currentSortField={sortField}
  sortAscending={ascending}
  onSort={handleSort}
/>
```

### Example 3: Modal Layout

```tsx
// ❌ Before
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white min-w-[40rem] max-h-[60vh] rounded-lg">
    <div className="flex justify-between items-center px-6 py-4">
      <h2 className="text-[18px]">Title</h2>
      <button className="text-[#111]">×</button>
    </div>
    <div className="px-6 py-4">
      Content
    </div>
  </div>
</div>

// ✅ After
import { SimpleModal } from '@acme/ui/molecules';
import { Stack } from '@acme/ui/atoms';

<SimpleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  maxWidth="max-w-[var(--ops-size-modal-lg)]"
>
  <Stack gap={4}>
    Content
  </Stack>
</SimpleModal>
```

### Example 4: Dashboard Grid

```tsx
// ❌ Before
<div className="grid grid-cols-3 gap-4">
  <div className="flex flex-col gap-2 p-3">
    <span className="text-[10px]" style={{ color: '#4f46e5' }}>
      Label
    </span>
    <span className="text-[18px]">Value</span>
  </div>
</div>

// ✅ After
import { Grid, Stack } from '@acme/ui/atoms';

<Grid cols={3} gap={4}>
  <Stack gap={2} className="p-3">
    <span className="text-[var(--ops-typography-micro-size)] text-action-primary">
      Label
    </span>
    <span className="text-[var(--ops-typography-heading-size)]">Value</span>
  </Stack>
</Grid>
```

## Benefits

1. **Reduced Lint Violations**: Eliminates `ds/enforce-layout-primitives`, `ds/no-arbitrary-tailwind`, and `ds/no-raw-color` errors
2. **Consistency**: Shared components ensure visual consistency across Reception
3. **Maintainability**: Centralized token updates affect all uses
4. **Accessibility**: Primitives include proper semantic HTML and ARIA attributes
5. **Type Safety**: TypeScript ensures valid prop values

## Next Steps

To further reduce lint violations:

1. Migrate high-frequency layouts (tables, modals, cards) to primitives
2. Replace raw colors with semantic tokens
3. Use token-based sizing instead of arbitrary values
4. Consider creating Reception-specific composite components for repeated patterns

## Resources

- Layout Primitives: `packages/ui/src/components/atoms/primitives/`
- Design Tokens: `packages/design-tokens/src/contexts/operations/`
- Shared Components: `packages/ui/src/molecules/`
