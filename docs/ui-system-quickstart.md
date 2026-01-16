Type: Quick Reference
Status: Active
Domain: Design System
Last-reviewed: 2026-01-16

# UI System Quick Start Guide (Agent Runbook)

## 5-Minute Setup

### Step 1: Choose Context

Pick the context that matches the app type:

```tsx
// Reception, Inventory, POS → Operations
<body className="context-operations">

// Product Shops, Marketing → Consumer
<body className="context-consumer">

// Hotel, Hostel, Booking → Hospitality
<body className="context-hospitality">
```

### Step 2: Import DataTable

```tsx
import { DataTable } from '@acme/ui/operations'

const columns = [
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,  // For sorting/filtering
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    getValue: (row) => row.status,  // Primitive for sort
    cell: (row) => <Badge>{row.status}</Badge>,  // JSX for display
  },
]

<DataTable
  data={items}
  columns={columns}
  searchable
  onRowClick={handleClick}
/>
```

### Step 3: Use Context Variables

```tsx
// Spacing adapts to context automatically
<div className="flex flex-col gap-[var(--row-gap)]">
  <Card className="p-[var(--card-padding)]">
    <h2 className="text-[var(--heading-size)]">Title</h2>
  </Card>
</div>
```

Done. The app now uses context-aware spacing and components.

---

## Common Patterns

### Table with Custom Cells

```tsx
const columns = [
  {
    id: 'id',
    header: 'ID',
    getValue: (row) => row.id,
    sortable: true,
    width: '80px',
  },
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,
    sortable: true,
    filterable: true,  // Searchable
  },
  {
    id: 'status',
    header: 'Status',
    getValue: (row) => row.status,
    cell: (row) => (
      <span style={{ color: `var(--status-${row.status})` }}>
        {row.status}
      </span>
    ),
    sortable: true,
    filterable: false,  // Don't search JSX
  },
  {
    id: 'created',
    header: 'Created',
    getValue: (row) => row.createdAt.toISOString(),  // Sort by ISO
    cell: (row) => row.createdAt.toLocaleDateString(),  // Display formatted
    sortable: true,
  },
]
```

### Card with Context Spacing

```tsx
function ProductCard({ product }) {
  return (
    <div className="p-[var(--card-padding)] flex flex-col gap-[var(--row-gap)] border rounded-lg">
      <h3 className="text-[var(--heading-size)] font-semibold">
        {product.name}
      </h3>
      <p className="text-[var(--base-size)]">
        {product.description}
      </p>
      <button className="px-[var(--button-padding-x)] py-[var(--button-padding-y)]">
        Add to Cart
      </button>
    </div>
  )
}
```

### Override Brand Colors

```tsx
// In the app layout
<body
  className="context-consumer"
  style={{
    '--color-brand-primary': 'hsl(330, 100%, 50%)',  // Pink
    '--color-brand-secondary': 'hsl(340, 100%, 60%)',
  } as React.CSSProperties}
>
```

### Status Colors (Operations)

```tsx
function RoomStatus({ status }: { status: 'available' | 'occupied' | 'cleaning' }) {
  return (
    <div
      className="px-3 py-1 rounded"
      style={{
        backgroundColor: `var(--status-${status})`,
        color: 'white',
      }}
    >
      {status}
    </div>
  )
}
```

---

## CSS Variables Cheat Sheet

### Spacing (Context-Aware)
```css
--row-gap           /* Ops: 8px, Consumer: 24px, Hosp: 16px */
--section-gap       /* Ops: 16px, Consumer: 48px, Hosp: 32px */
--card-padding      /* Ops: 12px, Consumer: 24px, Hosp: 16px */
--input-padding     /* Varies by context */
--table-cell-padding /* Varies by context */
--button-padding-x  /* Varies by context */
--button-padding-y  /* Varies by context */
```

### Typography (Context-Aware)
```css
--base-size        /* Ops: 14px, Consumer: 16px, Hosp: 15px */
--heading-size     /* Varies by context */
--label-size       /* Varies by context */
```

### Core Spacing (Always Available)
```css
--space-0   /* 0 */
--space-1   /* 4px */
--space-2   /* 8px */
--space-3   /* 12px */
--space-4   /* 16px */
--space-6   /* 24px */
--space-8   /* 32px */
--space-12  /* 48px */
```

### Status Colors (Operations Context)
```css
--status-available
--status-occupied
--status-cleaning
--status-maintenance
--stock-low
--stock-ok
--stock-high
```

### Brand Colors (Consumer Context)
```css
--color-brand-primary
--color-brand-secondary
--color-accent
--price-sale
```

### Room Colors (Hospitality Context)
```css
--room-available
--room-occupied
--room-cleaning
--amenity-highlight
```

---

## DataTable Props Reference

```typescript
interface DataTableProps<T> {
  data: T[]                    // Array of data
  columns: DataTableColumn<T>[] // Column definitions
  searchable?: boolean         // Show search bar (default: true)
  searchPlaceholder?: string   // Search placeholder text
  onRowClick?: (row: T) => void // Click handler
  emptyMessage?: string        // Empty state message
  loading?: boolean            // Show loading state
  className?: string           // Additional classes
}

interface DataTableColumn<T> {
  id: string                   // Unique column ID
  header: string               // Column header text
  getValue: (row: T) => string | number | Date | boolean  // For sort/filter
  cell?: (row: T) => ReactNode // Optional custom render
  sortable?: boolean           // Enable sorting
  filterable?: boolean         // Enable search (default: true)
  width?: string               // Column width (e.g., '100px')
  align?: 'left' | 'center' | 'right' // Text alignment
}
```

---

## Migration Examples

### Before (Hardcoded)
```tsx
<div className="p-6 gap-4 text-base">
  <h2 className="text-2xl mb-4">Title</h2>
  <table className="w-full">
    {/* Manual table implementation */}
  </table>
</div>
```

### After (Context-Aware)
```tsx
<div className="p-[var(--card-padding)] gap-[var(--row-gap)] text-[var(--base-size)]">
  <h2 className="text-[var(--heading-size)] mb-[var(--row-gap)]">Title</h2>
  <DataTable data={data} columns={columns} />
</div>
```

---

## Troubleshooting

### Variables show as `var(--row-gap)` in browser
**Fix**: Add context class to parent element:
```tsx
<body className="context-operations">
```

### DataTable import error
**Fix**: Use canonical import:
```tsx
import { DataTable } from '@acme/ui/operations'
// NOT: import ... from '@acme/ui/src/...'
```

### Wrong spacing/fonts
**Fix**: Check context class is applied and not overridden

### Custom cell not sorting correctly
**Fix**: Ensure `getValue` returns primitive, not JSX:
```tsx
{
  getValue: (row) => row.status,  // ✅ Primitive
  cell: (row) => <Badge>{row.status}</Badge>,  // ✅ JSX in cell
}
```

---

## Next Steps

1. **Try it**: Add DataTable to a screen in the app
2. **Explore**: Check Storybook for more examples (port 6007)
3. **Customize**: Override brand colors for the app
4. **Feedback**: Report issues or suggestions

---

## Resources

- [Full Usage Guide](/packages/design-tokens/USAGE.md)
- [Component Reference](/docs/ui-system-component-reference.md)
- [Phase 1 Complete](/docs/ui-system-phase1-complete.md)
- [Storybook](http://localhost:6007)

---

**Ready to use!** All code is production-ready and tested.
**Questions?** Check the full documentation or ask for help.

Last updated: 2026-01-12
