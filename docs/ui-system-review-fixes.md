Type: Review Response
Status: Active
Domain: Design System
Last-reviewed: 2026-01-12
Relates-to: docs/ui-system-enhancement-strategy.md

# UI System Review - Fixes & Clarifications

## Review Findings - Resolution Plan

### High Priority Issues

#### 1. DataTable Accessor Pattern (CRITICAL FIX)

**Problem**: `accessor` returns `ReactNode`, but sorting/filtering uses `String(value)` and `</>` comparisons. JSX cells won't sort/search correctly.

**Solution**: Split into `getValue` and `cell` (render function pattern)

**Fixed Interface**:
```typescript
export interface DataTableColumn<T> {
  id: string
  header: string
  // Split accessor into two functions
  getValue: (row: T) => string | number | Date  // For sorting/filtering
  cell?: (row: T) => React.ReactNode             // Optional custom render
  sortable?: boolean
  filterable?: boolean  // Can be searched
  width?: string
  align?: 'left' | 'center' | 'right'
}
```

**Usage Example**:
```typescript
const columns = [
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,  // Returns string for sort/filter
    sortable: true,
    filterable: true,
  },
  {
    id: 'status',
    header: 'Status',
    getValue: (row) => row.status,  // Returns raw value
    cell: (row) => <StatusIndicator status={row.status} />,  // Custom render
    sortable: true,
    filterable: false,  // Don't search JSX
  },
]
```

**Status**: ✅ Will be fixed in all docs

---

#### 2. DataTable Feature Scope Mismatch

**Problem**: Strategy/reference promise filtering, pagination, row selection, keyboard nav, but Phase 1 implementation only covers search/sort.

**Solution**: Define Phase 1 MVP vs future enhancements explicitly

**Phase 1 MVP (Weeks 2-3)**:
- ✅ Column sorting (asc/desc)
- ✅ Global search (searches across `filterable` columns)
- ✅ Row click handler
- ✅ Loading and empty states
- ✅ Responsive (horizontal scroll)

**Phase 2 Enhancements (Week 4+)**:
- ⏳ Row selection (single/multi with checkboxes)
- ⏳ Pagination (configurable page size)
- ⏳ Column filtering (per-column filters)
- ⏳ Keyboard navigation (arrow keys, enter)

**Updated Definition of Done** (Phase 1):
- [ ] DataTable with sort and global search working
- [ ] Storybook stories for MVP features only
- [ ] Unit tests for sort/search logic
- [ ] Accessibility: Keyboard sortable headers, screen reader announcements
- [ ] Responsive on mobile/tablet/desktop

**Status**: ✅ Will update strategy to clarify phases

---

### Medium Priority Issues

#### 3. Dashboard Context & Spacious Density (SCOPING DECISION)

**Problem**: `dashboard` context and `spacious` density declared but never implemented.

**Decision Required**: Include in Phase 1 or defer to Phase 2?

**Recommendation**: **Defer to Phase 2**

**Phase 1 Scope** (3 contexts, 3 densities):
- ✅ `operations` context → `compact` density
- ✅ `consumer` context → `comfortable` density
- ✅ `hospitality` context → `default` density

**Phase 2 Additions**:
- ⏳ `dashboard` context (analytics-focused, chart-optimized)
- ⏳ `spacious` density (accessibility, large displays)

**Fixed Type Definition** (Phase 1):
```typescript
export type TokenContext = 'operations' | 'consumer' | 'hospitality'
export type Density = 'compact' | 'default' | 'comfortable'

// Phase 2 (commented for now):
// | 'dashboard'
// | 'spacious'
```

**Status**: ✅ Will remove from Phase 1, document in Phase 2 plan

---

#### 4. CSS Variable Mapping Completeness

**Problem**: Docs use `--heading-size`, `--table-cell-padding`, `--space-*` but plugin only sets `--row-gap`, `--section-gap`, `--card-padding`.

**Solution**: Complete the CSS variable bridge in Tailwind plugin

**Fixed Tailwind Plugin**:
```typescript
export const contextPlugin = plugin(
  function({ addUtilities, addComponents, theme }) {
    // Operations context
    addUtilities({
      '.context-operations': {
        // Typography
        '--base-size': operationsTokens.typography['base-size'],
        '--heading-size': operationsTokens.typography['heading-size'],
        '--label-size': operationsTokens.typography['label-size'],
        '--data-size': operationsTokens.typography['data-size'],

        // Spacing
        '--row-gap': operationsTokens.spacing['row-gap'],
        '--section-gap': operationsTokens.spacing['section-gap'],
        '--card-padding': operationsTokens.spacing['card-padding'],
        '--input-padding': operationsTokens.spacing['input-padding'],
        '--table-cell-padding': operationsTokens.spacing['table-cell-padding'],
        '--button-padding-x': operationsTokens.spacing['button-padding-x'],
        '--button-padding-y': operationsTokens.spacing['button-padding-y'],

        // Colors
        '--color-brand-primary': operationsTokens.colors['chart-primary'],
        '--status-available': operationsTokens.colors['status-available'],
        '--status-occupied': operationsTokens.colors['status-occupied'],
        '--status-cleaning': operationsTokens.colors['status-cleaning'],
        '--status-maintenance': operationsTokens.colors['status-maintenance'],
      },
    })

    // Similar for consumer and hospitality...
  }
)
```

**Core Spacing Bridge** (always available):
```typescript
// Map core spacing tokens to CSS variables
addBase({
  ':root': {
    '--space-0': spacing[0],
    '--space-1': spacing[1],
    '--space-2': spacing[2],
    '--space-3': spacing[3],
    '--space-4': spacing[4],
    '--space-5': spacing[5],
    '--space-6': spacing[6],
    '--space-8': spacing[8],
    '--space-10': spacing[10],
    '--space-12': spacing[12],
    '--space-16': spacing[16],
  }
})
```

**Status**: ✅ Will add complete CSS variable mapping

---

#### 5. Import Path Inconsistency

**Problem**: Internal package alias `@/components/...` won't work in `packages/ui`, and paths are inconsistent across docs.

**Solution**: Establish canonical import pattern

**Decision**: Use **shallow, semantic exports**

**Canonical Pattern** (what users import):
```typescript
// ✅ Correct - shallow semantic imports
import { Button, Input } from '@acme/ui/atoms/shadcn'
import { DataTable, MetricsCard } from '@acme/ui/operations'
import { ProductCard } from '@acme/ui/patterns/ecommerce'
import { DashboardLayout } from '@acme/ui/templates/operations'
```

**Internal Imports** (within packages/ui source):
```typescript
// ✅ Correct - relative imports within package
import { Input } from '../atoms/shadcn/Input'
import { Button } from '../atoms/shadcn/Button'

// ❌ Wrong - don't use @ alias in package source
import { Input } from '@/components/atoms/shadcn/Input'
```

**Package Exports** (packages/ui/package.json):
```json
{
  "exports": {
    "./atoms/shadcn": {
      "types": "./dist/components/atoms/shadcn/index.d.ts",
      "import": "./dist/components/atoms/shadcn/index.js"
    },
    "./operations": {
      "types": "./dist/components/organisms/operations/index.d.ts",
      "import": "./dist/components/organisms/operations/index.js"
    },
    "./patterns/ecommerce": {
      "types": "./dist/components/patterns/ecommerce/index.d.ts",
      "import": "./dist/components/patterns/ecommerce/index.js"
    },
    "./templates/operations": {
      "types": "./dist/components/templates/operations/index.d.ts",
      "import": "./dist/components/templates/operations/index.js"
    }
  }
}
```

**Status**: ✅ Will standardize all import examples

---

### Low Priority Issues

#### 6. Hardcoded Colors vs Token Standard

**Problem**: Examples use `gray-200`, `green-600` despite "no hardcoded values" rule.

**Solution**: Use semantic color tokens consistently

**Fixed Pattern**:
```tsx
// ❌ Before - hardcoded Tailwind colors
<thead className="bg-gray-50 border-b border-gray-200">
<div className="text-green-600">Available</div>

// ✅ After - semantic tokens
<thead className="bg-muted border-b border-muted">
<div className="text-success">Available</div>

// OR use CSS variables
<thead style={{ backgroundColor: 'var(--color-muted)' }}>
```

**Token Mapping**:
- `gray-50/100` → `var(--color-muted)` or `bg-muted`
- `gray-600/700/900` → `var(--color-fg)` or `text-fg`
- `green-600` → `var(--color-success)` or `text-success`
- `red-600` → `var(--color-danger)` or `text-danger`
- `blue-600` → `var(--color-primary)` or `text-primary`

**Status**: ✅ Will replace all hardcoded colors

---

#### 7. Document Length (Runbook Limit)

**Problem**: All four docs exceed 350-line runbook guideline.

**Solution**: Split into focused runbooks + reference appendices

**New Structure**:
```
docs/ui-system/
├── 00-overview.md                    # 150 lines - Start here
├── 01-token-system.md                # 250 lines - Token architecture
├── 02-phase1-implementation.md       # 300 lines - Week-by-week tasks
├── 03-datatable-component.md         # 200 lines - Detailed component guide
├── 04-migration-guide.md             # 200 lines - App migration steps
├── appendix-component-catalog.md     # Reference - All components
└── appendix-code-examples.md         # Reference - Full code samples
```

**Status**: ⏳ Will refactor after fixes are approved

---

## Questions - Answers & Decisions

### Q1: Dashboard Context - Phase 1 or Phase 2?

**Answer**: **Phase 2**

**Rationale**:
- Phase 1 focus: Establish core pattern with 3 contexts
- Dashboard context adds complexity (chart-specific tokens, wider layouts)
- No immediate use case (reception/inventory use operations context)
- Better to validate pattern with 3, then expand

**Action**: Remove `dashboard` from Phase 1 types, add to Phase 2 plan

---

### Q2: Which Import Surface is Canonical?

**Answer**: **Shallow semantic paths** (`@acme/ui/operations`)

**Decision Matrix**:

| Pattern | Example | Pros | Cons | Verdict |
|---------|---------|------|------|---------|
| **Shallow semantic** | `@acme/ui/operations` | Short, context-clear, easy to remember | Requires good barrel exports | ✅ **CANONICAL** |
| Deep paths | `@acme/ui/organisms/operations/DataTable` | Explicit, follows file structure | Verbose, exposes internals | ❌ Avoid |
| Flat | `@acme/ui` | Simple | Name collisions, huge bundle | ❌ Avoid |

**Implemented Surface**:
```typescript
// Components by context
'@acme/ui/operations'          // Operations organisms
'@acme/ui/hospitality'         // Hospitality organisms
'@acme/ui/pos'                 // POS-specific organisms
'@acme/ui/inventory'           // Inventory-specific organisms

// Components by layer
'@acme/ui/atoms/shadcn'        // shadcn primitives
'@acme/ui/atoms'               // In-house atoms
'@acme/ui/molecules'           // Molecule compositions

// Patterns and templates
'@acme/ui/patterns/ecommerce'  // E-commerce patterns
'@acme/ui/templates/operations'// Operations layouts
'@acme/ui/templates/consumer'  // Consumer layouts
```

**Action**: Update all docs to use canonical imports

---

### Q3: CSS Variable Bridge - Already Exists?

**Answer**: **Partial** - needs completion

**Current State** (inferred from existing code):
- ✅ Core design tokens exist (`--color-bg`, `--color-fg`, `--color-primary`)
- ✅ Spacing tokens exist in design-tokens package
- ⚠️ Context-specific variables (`--heading-size`, `--table-cell-padding`) not yet mapped
- ❌ Brand override pattern (`--color-brand-primary`) not documented

**Required Additions**:
1. Complete Tailwind plugin to set all CSS variables used in examples
2. Document brand color override pattern
3. Provide fallback values for unsupported contexts

**Action**: Add complete CSS variable mapping to Phase 1 implementation

---

## Fix Implementation Plan

### Immediate Fixes (Before Phase 1 Start)

**Week 0 - Documentation Updates**:
1. ✅ Fix DataTable interface (split `getValue`/`cell`)
2. ✅ Update all DataTable usage examples
3. ✅ Remove `dashboard` context from Phase 1
4. ✅ Standardize all import paths to canonical pattern
5. ✅ Replace hardcoded colors with semantic tokens
6. ✅ Complete CSS variable mapping in plugin example
7. ✅ Clarify Phase 1 vs Phase 2 DataTable features

**Week 0 - New Document Structure** (optional, can defer):
8. ⏳ Split large docs into focused runbooks
9. ⏳ Create appendices for reference material

---

## Updated Component Examples

### DataTable - Fixed Interface

```typescript
export interface DataTableColumn<T> {
  id: string
  header: string
  getValue: (row: T) => string | number | Date | boolean
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// Usage
const columns: DataTableColumn<User>[] = [
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,
    sortable: true,
    filterable: true,
  },
  {
    id: 'status',
    header: 'Status',
    getValue: (row) => row.status,  // Returns 'active' | 'inactive'
    cell: (row) => <StatusIndicator status={row.status} />,
    sortable: true,
    filterable: false,
  },
]
```

### Corrected Search/Sort Logic

```typescript
// Search - only searches filterable columns' getValue results
if (searchable && searchTerm) {
  filtered = data.filter((row) =>
    columns
      .filter(col => col.filterable !== false)  // Default to true
      .some((col) => {
        const value = col.getValue(row)
        return String(value)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      })
  )
}

// Sort - uses getValue for comparison
if (sortConfig) {
  filtered = [...filtered].sort((a, b) => {
    const column = columns.find((col) => col.id === sortConfig.key)
    if (!column) return 0

    const aValue = column.getValue(a)
    const bValue = column.getValue(b)

    // Safe comparison (handles string, number, Date)
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })
}
```

---

## Validation Checklist

Before Phase 1 implementation:

- [ ] All DataTable examples use `getValue`/`cell` pattern
- [ ] All import examples use canonical paths (no `@/` aliases)
- [ ] All color references use semantic tokens (no `gray-600`)
- [ ] All CSS variables are defined in plugin
- [ ] `dashboard` context removed from Phase 1
- [ ] `spacious` density removed from Phase 1
- [ ] Phase 1 DataTable features clearly scoped (sort + search only)
- [ ] Phase 2 enhancements listed (pagination, filters, row selection)

---

## Related Updates

Files requiring updates:
- [x] `ui-system-enhancement-strategy.md` - Remove dashboard from Phase 1
- [x] `ui-system-phase1-implementation.md` - Fix DataTable, CSS vars, imports
- [x] `ui-system-benefits-by-app.md` - Fix all code examples
- [x] `ui-system-component-reference.md` - Fix DataTable API, imports

---

**Review responses**: Complete
**Status**: Ready for fix implementation
**Next step**: Apply fixes to all four docs
