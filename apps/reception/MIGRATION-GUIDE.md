# Token Migration Guide for Reception

This guide provides step-by-step instructions for migrating Reception code to use design tokens and layout primitives.

## Quick Start

Reception now has access to operations-context design tokens via:

1. **Tailwind utilities** - Use token-based classes directly
2. **CSS variables** - Access via `var(--ops-*)`
3. **TypeScript imports** - Import colors/tokens directly

## Migration Patterns

### Pattern 1: Chart Colors (Chart.js, Recharts, etc.)

**Before:**
```tsx
import { Bar } from "react-chartjs-2";

const data = {
  datasets: [{
    backgroundColor: "#4f46e5",  // ❌ Raw color
  }]
};
```

**After:**
```tsx
import { Bar } from "react-chartjs-2";
import { colors } from "@acme/design-tokens/core/colors";

// Define chart colors using tokens
const CHART_COLORS = {
  primary: colors.indigo[600],
  success: colors.emerald[500],
  warning: colors.orange[400],
  danger: colors.rose[600],
  info: colors.sky[500],
} as const;

const data = {
  datasets: [{
    backgroundColor: CHART_COLORS.primary,  // ✅ Token-based
  }]
};
```

**Eliminated:** `ds/no-raw-color` errors

---

### Pattern 2: Arbitrary Font Sizes

**Before:**
```tsx
<span className="text-[10px]">Micro text</span>  {/* ❌ Arbitrary value */}
<span className="text-[11px]">Tiny text</span>
<span className="text-[13px]">Compact text</span>
```

**After:**
```tsx
<span className="text-ops-micro">Micro text</span>  {/* ✅ Token class */}
<span className="text-ops-tiny">Tiny text</span>
<span className="text-ops-compact">Compact text</span>
```

**Eliminated:** `ds/no-arbitrary-tailwind` errors for typography

---

### Pattern 3: Arbitrary Dimensions

**Before:**
```tsx
<div className="min-w-[40rem] max-h-[60vh]">  {/* ❌ Arbitrary values */}
  <div className="h-[80px]">
```

**After:**
```tsx
<div className="min-w-[var(--ops-modal-lg)] max-h-[var(--ops-panel-medium)]">  {/* ✅ CSS vars */}
  <div className="h-[var(--ops-card-height)]">
```

**Available Size Tokens:**
- `--ops-modal-sm/md/lg/xl`: 320px, 480px, 640px, 960px
- `--ops-panel-short/medium/tall`: 30vh, 60vh, 80vh
- `--ops-button-height/input-height/cell-height/card-height`: 40px, 40px, 44px, 80px

**Eliminated:** `ds/no-arbitrary-tailwind` errors for sizing

---

### Pattern 4: Layout Primitives (Flex/Grid)

**Before:**
```tsx
<div className="flex flex-col gap-4">  {/* ❌ Raw flex */}
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<div className="flex gap-2 items-center">  {/* ❌ Raw flex */}
  <Button />
  <Button />
</div>

<div className="grid grid-cols-3 gap-4">  {/* ❌ Raw grid */}
  <Card />
  <Card />
  <Card />
</div>
```

**After:**
```tsx
import { Stack, Inline, Grid } from '@acme/ui/atoms';

<Stack gap={4}>  {/* ✅ Primitive */}
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

<Inline gap={2} alignY="center">  {/* ✅ Primitive */}
  <Button />
  <Button />
</Inline>

<Grid cols={3} gap={4}>  {/* ✅ Primitive */}
  <Card />
  <Card />
  <Card />
</Grid>
```

**Eliminated:** `ds/enforce-layout-primitives` errors

---

### Pattern 5: Inline Styles with Colors

**Before:**
```tsx
<div style={{ backgroundColor: '#4f46e5', color: '#fff' }}>  {/* ❌ Inline styles */}
```

**After - Option A (Tailwind):**
```tsx
<div className="bg-action-primary text-white">  {/* ✅ Utility classes */}
```

**After - Option B (TypeScript):**
```tsx
import { colors } from "@acme/design-tokens/core/colors";

<div style={{ backgroundColor: colors.indigo[600], color: colors.white }}>  {/* ✅ Tokens */}
```

**Eliminated:** `ds/no-raw-color` errors

---

## Complete Example

**File: `src/components/dashboard/MetricsCard.tsx`**

**Before:**
```tsx
export function MetricsCard({ title, value, trend }: Props) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded shadow">
      <div className="flex justify-between items-center">
        <span className="text-[10px]" style={{ color: '#4f46e5' }}>
          {title}
        </span>
        <span className="text-[11px]" style={{ color: trend > 0 ? '#10b981' : '#e11d48' }}>
          {trend}%
        </span>
      </div>
      <div className="text-[18px] font-semibold">
        {value}
      </div>
    </div>
  );
}
```

**After:**
```tsx
import { Stack, Cluster } from '@acme/ui/atoms';
import { colors } from "@acme/design-tokens/core/colors";

const STATUS_COLORS = {
  positive: colors.emerald[500],
  negative: colors.rose[600],
  neutral: colors.indigo[600],
} as const;

export function MetricsCard({ title, value, trend }: Props) {
  const trendColor = trend > 0 ? STATUS_COLORS.positive : STATUS_COLORS.negative;

  return (
    <Stack gap={2} className="p-3 bg-white rounded shadow">
      <Cluster justify="between" alignY="center">
        <span className="text-ops-micro text-action-primary">
          {title}
        </span>
        <span className="text-ops-tiny" style={{ color: trendColor }}>
          {trend}%
        </span>
      </Cluster>
      <div className="text-lg font-semibold">
        {value}
      </div>
    </Stack>
  );
}
```

**Results:**
- ✅ No `ds/no-raw-color` errors
- ✅ No `ds/no-arbitrary-tailwind` errors
- ✅ No `ds/enforce-layout-primitives` errors
- ✅ Better maintainability and consistency

---

## Automated Migration Tools

### Find Migration Opportunities

Run the script to identify files needing migration:

```bash
./scripts/find-token-migrations.sh
```

### Quick Reference

**Color Mapping:**
| Raw Hex    | Token Name          | Tailwind Class      |
|------------|---------------------|---------------------|
| #4f46e5    | `indigo[600]`       | `text/bg-action-primary` |
| #10b981    | `emerald[500]`      | `text/bg-action-success` |
| #fb923c    | `orange[400]`       | `text/bg-action-warning` |
| #e11d48    | `rose[600]`         | `text/bg-action-danger`  |
| #0ea5e9    | `sky[500]`          | `text/bg-action-info`    |
| #14b8a6    | `teal[600]`         | `text/bg-action-neutral` |

**Font Size Mapping:**
| Arbitrary    | Token Class      | Size  |
|--------------|------------------|-------|
| text-[10px]  | text-ops-micro   | 10px  |
| text-[11px]  | text-ops-tiny    | 11px  |
| text-[13px]  | text-ops-compact | 13px  |

**Dimension Mapping:**
| Arbitrary      | CSS Variable           | Value |
|----------------|------------------------|-------|
| min-w-[40rem]  | var(--ops-modal-lg)    | 640px |
| max-h-[60vh]   | var(--ops-panel-medium)| 60vh  |
| h-[80px]       | var(--ops-card-height) | 80px  |

---

## Migration Strategy

### Phase 1: High-Impact Files (Week 1)
Target files with most violations:
1. Dashboard components
2. Analytics/charts
3. Modal dialogs
4. Table components

### Phase 2: Medium-Impact Files (Week 2)
5. Form components
6. Card layouts
7. Navigation elements

### Phase 3: Low-Impact Files (Week 3)
8. Utility components
9. Edge cases
10. Legacy components

### Measuring Success

Track lint error reduction:

```bash
# Before migration
pnpm exec eslint . 2>&1 | grep "✖"
# Target: < 200 issues (from 517 current)

# After each phase
pnpm exec eslint . 2>&1 | grep "✖"
```

---

## Common Pitfalls

### ❌ Don't mix approaches
```tsx
// Bad: mixing raw colors with tokens
<div style={{ color: '#4f46e5' }} className="bg-action-primary">
```

### ✅ Be consistent
```tsx
// Good: all token-based
<div className="text-action-primary bg-action-primary/10">
```

### ❌ Don't use arbitrary values when tokens exist
```tsx
// Bad: arbitrary value when token exists
<div className="text-[10px]">
```

### ✅ Use token classes
```tsx
// Good: token-based class
<div className="text-ops-micro">
```

---

## Benefits Summary

1. **Lint Compliance**: Eliminates 130+ violations (58 color + 72 arbitrary)
2. **Consistency**: Design system ensures visual coherence
3. **Maintainability**: Update tokens once, affects all uses
4. **Type Safety**: TypeScript validates token usage
5. **Accessibility**: Primitives include proper ARIA attributes
6. **Performance**: Smaller bundle (no duplicate colors/sizes)

---

## Support

For questions or issues:
1. Check [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) for token reference
2. Review existing migrated files for patterns
3. Run `./scripts/find-token-migrations.sh` for opportunities

## Example Commits

See these commits for real examples:
- `feat(reception): migrate MenuPerformanceDashboard to design tokens`
- `refactor(reception): use Stack primitive in DashboardLayout`
- `style(reception): replace arbitrary font sizes with tokens`
