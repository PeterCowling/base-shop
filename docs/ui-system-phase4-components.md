# UI System Phase 4 - Component Documentation

**Date:** 2026-01-12
**Phase:** 4 - Advanced Operations Components
**Status:** ✅ Complete
**Components:** Pagination, FilterPanel, BulkActions, Timeline

---

## Overview

Phase 4 introduces four advanced operations components designed for complex data management interfaces. These components handle pagination, filtering, bulk operations, and activity tracking - essential features for professional operations applications.

### Components Built

1. **Pagination** - Table pagination with page size controls
2. **FilterPanel** - Collapsible filter sidebar
3. **BulkActions** - Multi-select operation toolbar
4. **Timeline** - Activity/audit trail visualization

---

## Component Details

### 1. Pagination

**Purpose:** Provides navigation through paginated data with page size controls.

**File:** [`packages/ui/src/components/organisms/operations/Pagination/Pagination.tsx`](../packages/ui/src/components/organisms/operations/Pagination/Pagination.tsx)

#### Features
- Page navigation (prev/next, first/last)
- Page size selector
- Item range display (showing 1-20 of 200)
- Keyboard accessible
- Disabled state support
- Dark mode support

#### Props Interface

```typescript
interface PaginationProps {
  currentPage: number;              // Required: Current page (1-indexed)
  totalPages: number;                // Required: Total number of pages
  pageSize: number;                  // Required: Items per page
  totalItems: number;                // Required: Total number of items
  onPageChange: (page: number) => void; // Required: Page change handler
  onPageSizeChange?: (size: number) => void; // Optional: Page size change handler
  pageSizeOptions?: number[];        // Optional: Page size options (default: [10, 20, 50, 100])
  showPageSizeSelector?: boolean;    // Optional: Show page size dropdown
  showFirstLast?: boolean;           // Optional: Show first/last buttons (default: true)
  className?: string;                // Optional: Additional CSS classes
  disabled?: boolean;                // Optional: Disable all interactions
}
```

#### Usage Example

```tsx
import { useState } from 'react';
import { Pagination } from '@acme/ui/operations';

function ProductList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const products = fetchProducts(currentPage, pageSize);
  const totalPages = Math.ceil(products.totalCount / pageSize);

  return (
    <div>
      <ProductTable data={products.items} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={products.totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSizeSelector
      />
    </div>
  );
}
```

#### Design Decisions

1. **1-indexed pages**: Pages start at 1 (not 0) for better UX
2. **Item range**: Shows "Showing 1-20 of 200" for clarity
3. **First/last buttons**: Enabled by default for quick navigation
4. **Page size options**: Defaults to [10, 20, 50, 100]
5. **Disabled state**: Prevents all interactions when loading

---

### 2. FilterPanel

**Purpose:** Provides a collapsible sidebar for complex filtering interfaces.

**File:** [`packages/ui/src/components/organisms/operations/FilterPanel/FilterPanel.tsx`](../packages/ui/src/components/organisms/operations/FilterPanel/FilterPanel.tsx)

#### Features
- Collapsible sections
- Active filters count badge
- Clear all filters button
- Apply filters button
- Panel collapse/expand
- Keyboard accessible
- Dark mode support

#### Props Interface

```typescript
interface FilterSection {
  id: string;                        // Unique section identifier
  title: string;                     // Section title
  children: React.ReactNode;         // Filter controls
  defaultExpanded?: boolean;         // Optional: Expand by default
}

interface FilterPanelProps {
  sections: FilterSection[];         // Required: Array of filter sections
  onClear?: () => void;             // Optional: Clear filters handler
  onApply?: () => void;             // Optional: Apply filters handler
  isCollapsible?: boolean;          // Optional: Allow panel collapse (default: false)
  defaultCollapsed?: boolean;       // Optional: Start collapsed (default: false)
  showClearButton?: boolean;        // Optional: Show clear button (default: true)
  showApplyButton?: boolean;        // Optional: Show apply button (default: false)
  className?: string;               // Optional: Additional CSS classes
  activeFiltersCount?: number;      // Optional: Number of active filters (for badge)
}
```

#### Usage Example

```tsx
import { useState } from 'react';
import { FilterPanel } from '@acme/ui/operations';

function ProductFilters() {
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const activeCount = statusFilters.length + (dateRange.from ? 1 : 0);

  return (
    <FilterPanel
      sections={[
        {
          id: 'status',
          title: 'Status',
          children: <StatusFilterCheckboxes value={statusFilters} onChange={setStatusFilters} />,
          defaultExpanded: true
        },
        {
          id: 'date',
          title: 'Date Range',
          children: <DateRangePicker value={dateRange} onChange={setDateRange} />,
        }
      ]}
      activeFiltersCount={activeCount}
      onClear={() => {
        setStatusFilters([]);
        setDateRange({ from: null, to: null });
      }}
      onApply={() => {
        applyFilters({ status: statusFilters, dateRange });
      }}
      showApplyButton
      isCollapsible
    />
  );
}
```

#### Design Decisions

1. **Section-based**: Filters organized into collapsible sections
2. **Active count badge**: Shows number of active filters in header
3. **Clear button**: Only visible when filters are active
4. **Apply button**: Optional for "apply on click" vs "live filtering"
5. **Panel collapse**: Optional for space-constrained layouts

---

### 3. BulkActions

**Purpose:** Provides a toolbar for multi-select operations.

**File:** [`packages/ui/src/components/organisms/operations/BulkActions/BulkActions.tsx`](../packages/ui/src/components/organisms/operations/BulkActions/BulkActions.tsx)

#### Features
- Selected items count
- Multiple action buttons
- Icon support
- Danger variant for destructive actions
- Clear selection button
- Position variants (top, bottom, sticky)
- Keyboard accessible
- Dark mode support

#### Props Interface

```typescript
interface BulkAction {
  id: string;                        // Unique action identifier
  label: string;                     // Button label
  icon?: LucideIcon;                // Optional: Icon component
  onClick: () => void;              // Action handler
  variant?: 'default' | 'danger';   // Optional: Visual variant (default: 'default')
  disabled?: boolean;               // Optional: Disable action
}

interface BulkActionsProps {
  selectedCount: number;            // Required: Number of selected items
  totalCount?: number;              // Optional: Total items (shows "5 of 100")
  actions: BulkAction[];            // Required: Array of actions
  onClearSelection: () => void;     // Required: Clear selection handler
  position?: 'top' | 'bottom' | 'sticky'; // Optional: Position (default: 'top')
  className?: string;               // Optional: Additional CSS classes
}
```

#### Usage Example

```tsx
import { useState } from 'react';
import { BulkActions } from '@acme/ui/operations';
import { Download, Trash2, Archive } from 'lucide-react';

function OrderTable() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const orders = fetchOrders();

  return (
    <div>
      {selectedIds.length > 0 && (
        <BulkActions
          selectedCount={selectedIds.length}
          totalCount={orders.length}
          actions={[
            {
              id: 'export',
              label: 'Export',
              icon: Download,
              onClick: () => exportOrders(selectedIds)
            },
            {
              id: 'archive',
              label: 'Archive',
              icon: Archive,
              onClick: () => archiveOrders(selectedIds)
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: Trash2,
              onClick: () => {
                if (confirm('Delete selected orders?')) {
                  deleteOrders(selectedIds);
                }
              },
              variant: 'danger'
            }
          ]}
          onClearSelection={() => setSelectedIds([])}
          position="sticky"
        />
      )}

      <OrderTableRows
        orders={orders}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
```

#### Design Decisions

1. **Auto-hide**: Toolbar only renders when items are selected
2. **Danger variant**: Red styling for destructive actions
3. **Sticky position**: Stays visible when scrolling large tables
4. **Icon support**: Visual clarity for common actions
5. **Total count**: Shows context ("5 of 100 selected")

---

### 4. Timeline

**Purpose:** Displays chronological activity/audit trails.

**File:** [`packages/ui/src/components/organisms/operations/Timeline/Timeline.tsx`](../packages/ui/src/components/organisms/operations/Timeline/Timeline.tsx)

#### Features
- Chronological event display
- Custom icons per event
- Color-coded status indicators
- Timestamp display (time and/or date)
- User attribution
- Custom metadata support
- Empty state handling
- Dark mode support

#### Props Interface

```typescript
interface TimelineEvent {
  id: string;                        // Unique event identifier
  timestamp: Date | string;         // Event timestamp
  title: string;                    // Event title
  description?: string;             // Optional: Event description
  icon?: LucideIcon;               // Optional: Icon component
  iconColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'; // Optional: Icon color
  user?: string;                   // Optional: User who triggered event
  metadata?: React.ReactNode;      // Optional: Custom metadata content
}

interface TimelineProps {
  events: TimelineEvent[];          // Required: Array of events (chronological)
  showTime?: boolean;              // Optional: Show timestamps (default: true)
  showDate?: boolean;              // Optional: Show dates (default: false)
  className?: string;              // Optional: Additional CSS classes
  emptyMessage?: string;           // Optional: Empty state message
}
```

#### Usage Example

```tsx
import { Timeline } from '@acme/ui/operations';
import { Package, Truck, CheckCircle } from 'lucide-react';

function OrderActivity({ orderId }: { orderId: string }) {
  const events = fetchOrderEvents(orderId);

  return (
    <Timeline
      events={[
        {
          id: '1',
          timestamp: new Date('2024-01-15T10:00:00'),
          title: 'Order created',
          description: 'New order #1234 placed',
          icon: Package,
          iconColor: 'blue',
          user: 'John Doe'
        },
        {
          id: '2',
          timestamp: new Date('2024-01-15T14:30:00'),
          title: 'Order shipped',
          description: 'Package shipped via FedEx',
          icon: Truck,
          iconColor: 'yellow',
          user: 'Warehouse',
          metadata: (
            <div className="text-xs">
              <p>Tracking: 1234567890</p>
            </div>
          )
        },
        {
          id: '3',
          timestamp: new Date('2024-01-16T11:00:00'),
          title: 'Delivered',
          icon: CheckCircle,
          iconColor: 'green',
          user: 'FedEx'
        }
      ]}
      showTime
      showDate
      emptyMessage="No activity for this order"
    />
  );
}
```

#### Design Decisions

1. **Visual timeline**: Vertical line connects events
2. **Color-coded icons**: Status at a glance (blue, green, yellow, red, gray)
3. **Flexible timestamps**: Show time, date, or both
4. **User attribution**: Shows who triggered each event
5. **Metadata support**: Custom content for complex events
6. **Empty state**: Graceful handling of no events

---

## Testing Strategy

All components have 100% test coverage with comprehensive test suites:

### Test Coverage by Component

| Component | Tests | Coverage Focus |
|-----------|-------|----------------|
| **Pagination** | 18 | Navigation, page size, disabled states, range calculation |
| **FilterPanel** | 15 | Section expansion, clear/apply, collapse, active count |
| **BulkActions** | 16 | Actions, variants, positioning, selection count |
| **Timeline** | 17 | Events, timestamps, colors, metadata, empty state |
| **Total** | **66** | **100% coverage** |

### Testing Approach

Each component includes tests for:
1. **Rendering**: All props and variants render correctly
2. **Interactions**: User actions trigger correct callbacks
3. **Accessibility**: ARIA labels, keyboard navigation
4. **Edge Cases**: Empty states, disabled states, boundary conditions
5. **Styling**: Custom classes applied, dark mode support

---

## Storybook Stories

All components have comprehensive Storybook documentation:

### Stories by Component

| Component | Stories | Story Types |
|-----------|---------|-------------|
| **Pagination** | 9 | Default, with page size, small/large datasets, empty, disabled, dark mode |
| **FilterPanel** | 8 | Default, active filters, collapsible, with apply, interactive, dark mode |
| **BulkActions** | 8 | Default, single item, many actions, disabled, sticky, interactive, dark mode |
| **Timeline** | 10 | Default, with date/time, simple, metadata, errors, many events, empty, dark mode |
| **Total** | **35** | **Full documentation** |

### Story Categories

1. **Basic Usage**: Default, minimal props
2. **Feature Variants**: Different combinations of optional props
3. **Interactive Demos**: Stateful examples with user interaction
4. **Edge Cases**: Empty states, errors, disabled states
5. **Dark Mode**: All components shown in dark mode

---

## Integration Guidelines

### When to Use Each Component

#### Pagination
**Use when:**
- Displaying large datasets in tables or lists
- Need to control items per page
- Want first/last page quick navigation

**Don't use when:**
- Infinite scroll is more appropriate
- Dataset is small (< 20 items)
- Using "Load more" pattern

#### FilterPanel
**Use when:**
- Multiple filter criteria (status, date, category, etc.)
- Filters need organization into sections
- Want collapsible sidebar for space savings

**Don't use when:**
- Simple single-field search (use SearchBar)
- Filters fit inline above table
- No need for sectioned organization

#### BulkActions
**Use when:**
- Multi-select operations on table rows
- Need to export, delete, or modify multiple items
- Want sticky toolbar during scroll

**Don't use when:**
- Single-select operations only
- Actions available per row suffice
- No multi-item operations needed

#### Timeline
**Use when:**
- Showing activity/audit logs
- Tracking order/ticket status changes
- Displaying chronological events

**Don't use when:**
- Events aren't chronological
- Simple list suffices
- No need for visual timeline

---

## Import Pattern

All Phase 4 components export from the operations index:

```typescript
import {
  Pagination,
  type PaginationProps,
  FilterPanel,
  type FilterPanelProps,
  type FilterSection,
  BulkActions,
  type BulkActionsProps,
  type BulkAction,
  Timeline,
  type TimelineProps,
  type TimelineEvent,
} from '@acme/ui/operations';
```

---

## Bundle Impact

| Component | Gzipped Size | Dependencies |
|-----------|--------------|--------------|
| Pagination | ~3KB | lucide-react (icons) |
| FilterPanel | ~3KB | lucide-react (icons) |
| BulkActions | ~2.5KB | lucide-react (icons) |
| Timeline | ~3KB | lucide-react (icons) |
| **Total** | **~11.5KB** | Shared icon library |

**Assessment:** Minimal impact for significant functionality gain.

---

## Accessibility

All components follow WCAG 2.1 AA standards:

### Pagination
- Navigation role and aria-label
- Disabled buttons properly marked
- Page size selector has label association

### FilterPanel
- Section headers are buttons (keyboard accessible)
- Collapse button has aria-label
- Clear/apply buttons clearly labeled

### BulkActions
- Toolbar role and aria-label
- Clear selection button has aria-label
- Action buttons keyboard accessible

### Timeline
- Semantic HTML structure
- Proper heading hierarchy
- Icon colors have sufficient contrast

---

## Dark Mode Support

All components have full dark mode support:
- Automatic color scheme switching via Tailwind dark mode
- Tested in Storybook with dark background
- Proper contrast ratios maintained

---

## Performance Considerations

### Pagination
- No expensive calculations (simple math)
- Memoized component recommended for parent
- Page changes don't require re-mounting

### FilterPanel
- Section expansion state managed efficiently
- Only expanded sections render children
- Minimal re-renders on filter changes

### BulkActions
- Auto-hides when no selection (returns null)
- Sticky position uses CSS (no JS)
- Icon components lazy-loaded

### Timeline
- Virtual scrolling not needed (reasonable event counts)
- Empty state returns early
- Date formatting cached by browser

---

## Migration Patterns

### From Custom Pagination

**Before:**
```tsx
<div className="flex items-center gap-4">
  <button onClick={() => setPage(page - 1)} disabled={page === 1}>
    Previous
  </button>
  <span>Page {page} of {totalPages}</span>
  <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
    Next
  </button>
</div>
```

**After:**
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  showPageSizeSelector
/>
```

### From Custom Filters

**Before:**
```tsx
<div>
  <h3>Filters</h3>
  {filters.map(filter => (
    <div key={filter.id}>
      <h4>{filter.title}</h4>
      {filter.content}
    </div>
  ))}
</div>
```

**After:**
```tsx
<FilterPanel
  sections={filters.map(filter => ({
    id: filter.id,
    title: filter.title,
    children: filter.content,
    defaultExpanded: filter.defaultExpanded
  }))}
  activeFiltersCount={activeCount}
  onClear={clearFilters}
/>
```

---

## Related Documentation

- [Phase 1: DataTable](./ui-system-datatable-integration.md)
- [Phase 2: MetricsCard, StatusIndicator, QuickActionBar](./ui-system-phase2-components.md)
- [Phase 3: EmptyState, SearchBar, FormCard, ActionSheet](./ui-system-phase3-components.md)
- [Design Tokens](./ui-system-design-tokens.md)

---

## Quick Reference

### Pagination Example
```tsx
<Pagination
  currentPage={1}
  totalPages={10}
  pageSize={20}
  totalItems={200}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  showPageSizeSelector
/>
```

### FilterPanel Example
```tsx
<FilterPanel
  sections={[
    { id: 'status', title: 'Status', children: <StatusFilter /> }
  ]}
  activeFiltersCount={3}
  onClear={clearFilters}
/>
```

### BulkActions Example
```tsx
<BulkActions
  selectedCount={5}
  actions={[
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'danger' }
  ]}
  onClearSelection={clearSelection}
/>
```

### Timeline Example
```tsx
<Timeline
  events={[
    { id: '1', timestamp: new Date(), title: 'Event', icon: Package, iconColor: 'blue' }
  ]}
  showTime
  showDate
/>
```

---

**Last Updated:** 2026-01-12
**Component Version:** 1.0.0
**Status:** ✅ Complete
**Maintainer:** UI System Team
