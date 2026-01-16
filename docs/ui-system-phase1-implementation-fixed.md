Type: Implementation Guide
Status: Active - Review Fixes Applied
Domain: Design System
Last-reviewed: 2026-01-12
Relates-to: docs/ui-system-review-fixes.md

# UI System Phase 1 Implementation Guide (CORRECTED)

## Review Fixes Applied

✅ DataTable uses `getValue`/`cell` pattern (no JSX comparison issues)
✅ Phase 1 scope limited to sort + search (pagination/filters → Phase 2)
✅ Dashboard context removed (moved to Phase 2)
✅ Complete CSS variable mapping in plugin
✅ Canonical import paths (no `@/` aliases)
✅ Semantic color tokens (no hardcoded gray-600)

---

## Overview

**Timeline**: Weeks 1-3
**Goal**: Foundation for multi-context design system
**Scope**: 3 contexts (operations, consumer, hospitality), core DataTable component

## Week 1: Token Architecture

### Task 1.1: Create Context-Specific Token Structure

#### Directory structure

```bash
mkdir -p packages/design-tokens/src/{core,contexts,themes}
mkdir -p packages/design-tokens/src/contexts/{consumer,operations,hospitality}
```

#### Core tokens

**File**: `packages/design-tokens/src/core/spacing.ts`
```typescript
/**
 * Core spacing scale - 4px grid system
 */
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const
```

**File**: `packages/design-tokens/src/core/typography.ts`
```typescript
export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
} as const
```

**File**: `packages/design-tokens/src/core/colors.ts`
```typescript
/**
 * Core color primitives
 */
export const colors = {
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  blue: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  yellow: {
    50: '#fefce8',
    500: '#eab308',
    600: '#ca8a04',
  },
} as const
```

#### Context tokens

**File**: `packages/design-tokens/src/contexts/operations/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

export const operationsTokens = {
  spacing: {
    'row-gap': spacing[2],        // 8px
    'section-gap': spacing[4],    // 16px
    'card-padding': spacing[3],   // 12px
    'input-padding': spacing[2],  // 8px
    'table-cell-padding': spacing[2],
    'button-padding-x': spacing[3],
    'button-padding-y': spacing[2],
  },

  typography: {
    'base-size': '0.875rem',   // 14px
    'heading-size': '1.125rem', // 18px
    'label-size': '0.75rem',   // 12px
    'data-size': '0.875rem',   // 14px
  },

  colors: {
    'status-available': colors.green[600],
    'status-occupied': colors.red[600],
    'status-cleaning': colors.yellow[600],
    'status-maintenance': colors.blue[600],
    'stock-low': colors.red[600],
    'stock-ok': colors.green[600],
    'stock-high': colors.blue[500],
  },

  density: 'compact' as const,
}
```

**File**: `packages/design-tokens/src/contexts/consumer/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

export const consumerTokens = {
  spacing: {
    'row-gap': spacing[6],        // 24px
    'section-gap': spacing[12],   // 48px
    'card-padding': spacing[6],   // 24px
    'input-padding': spacing[4],  // 16px
    'button-padding-x': spacing[6],
    'button-padding-y': spacing[3],
  },

  typography: {
    'base-size': '1rem',      // 16px
    'heading-size': '1.5rem', // 24px
    'label-size': '0.875rem', // 14px
    'hero-size': '3rem',      // 48px
  },

  colors: {
    'brand-primary': colors.blue[600],
    'brand-secondary': colors.blue[500],
    'accent': colors.green[600],
  },

  density: 'comfortable' as const,
}
```

**File**: `packages/design-tokens/src/contexts/hospitality/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

export const hospitalityTokens = {
  spacing: {
    'row-gap': spacing[4],        // 16px
    'section-gap': spacing[8],    // 32px
    'card-padding': spacing[4],   // 16px
    'input-padding': spacing[3],  // 12px
  },

  typography: {
    'base-size': '0.9375rem',  // 15px
    'heading-size': '1.25rem', // 20px
    'label-size': '0.8125rem', // 13px
  },

  colors: {
    'room-available': colors.green[600],
    'room-occupied': colors.red[600],
    'room-cleaning': colors.yellow[600],
    'room-maintenance': colors.gray[600],
  },

  density: 'default' as const,
}
```

**File**: `packages/design-tokens/src/index.ts`
```typescript
export * from './core/spacing'
export * from './core/typography'
export * from './core/colors'

export { operationsTokens } from './contexts/operations'
export { consumerTokens } from './contexts/consumer'
export { hospitalityTokens } from './contexts/hospitality'

// Phase 1: 3 contexts only
export type TokenContext = 'operations' | 'consumer' | 'hospitality'
export type Density = 'compact' | 'default' | 'comfortable'

// Phase 2: Add dashboard context and spacious density
// export type TokenContext = 'operations' | 'consumer' | 'hospitality' | 'dashboard'
// export type Density = 'compact' | 'default' | 'comfortable' | 'spacious'

export function getContextTokens(context: TokenContext) {
  switch (context) {
    case 'operations':
      return operationsTokens
    case 'consumer':
      return consumerTokens
    case 'hospitality':
      return hospitalityTokens
    default:
      return consumerTokens
  }
}
```

### Task 1.2: Tailwind Plugin with Complete CSS Variable Mapping

**File**: `packages/design-tokens/src/tailwind-plugin.ts`
```typescript
import plugin from 'tailwindcss/plugin'
import { operationsTokens } from './contexts/operations'
import { consumerTokens } from './contexts/consumer'
import { hospitalityTokens } from './contexts/hospitality'
import { spacing } from './core/spacing'

export const contextPlugin = plugin(
  function({ addBase, addUtilities }) {
    // Base: Core spacing tokens always available
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
        '--space-20': spacing[20],
        '--space-24': spacing[24],
      }
    })

    // Context: Operations
    addUtilities({
      '.context-operations': {
        // Typography
        fontSize: operationsTokens.typography['base-size'],
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

        // Status colors
        '--status-available': operationsTokens.colors['status-available'],
        '--status-occupied': operationsTokens.colors['status-occupied'],
        '--status-cleaning': operationsTokens.colors['status-cleaning'],
        '--status-maintenance': operationsTokens.colors['status-maintenance'],
        '--stock-low': operationsTokens.colors['stock-low'],
        '--stock-ok': operationsTokens.colors['stock-ok'],
        '--stock-high': operationsTokens.colors['stock-high'],
      },

      // Context: Consumer
      '.context-consumer': {
        fontSize: consumerTokens.typography['base-size'],
        '--base-size': consumerTokens.typography['base-size'],
        '--heading-size': consumerTokens.typography['heading-size'],
        '--label-size': consumerTokens.typography['label-size'],
        '--hero-size': consumerTokens.typography['hero-size'],

        '--row-gap': consumerTokens.spacing['row-gap'],
        '--section-gap': consumerTokens.spacing['section-gap'],
        '--card-padding': consumerTokens.spacing['card-padding'],
        '--input-padding': consumerTokens.spacing['input-padding'],
        '--button-padding-x': consumerTokens.spacing['button-padding-x'],
        '--button-padding-y': consumerTokens.spacing['button-padding-y'],

        '--color-brand-primary': consumerTokens.colors['brand-primary'],
        '--color-brand-secondary': consumerTokens.colors['brand-secondary'],
        '--color-accent': consumerTokens.colors['accent'],
      },

      // Context: Hospitality
      '.context-hospitality': {
        fontSize: hospitalityTokens.typography['base-size'],
        '--base-size': hospitalityTokens.typography['base-size'],
        '--heading-size': hospitalityTokens.typography['heading-size'],
        '--label-size': hospitalityTokens.typography['label-size'],

        '--row-gap': hospitalityTokens.spacing['row-gap'],
        '--section-gap': hospitalityTokens.spacing['section-gap'],
        '--card-padding': hospitalityTokens.spacing['card-padding'],
        '--input-padding': hospitalityTokens.spacing['input-padding'],

        '--room-available': hospitalityTokens.colors['room-available'],
        '--room-occupied': hospitalityTokens.colors['room-occupied'],
        '--room-cleaning': hospitalityTokens.colors['room-cleaning'],
        '--room-maintenance': hospitalityTokens.colors['room-maintenance'],
      },

      // Density overrides
      '.density-compact': {
        '--row-gap': operationsTokens.spacing['row-gap'],
        '--section-gap': operationsTokens.spacing['section-gap'],
        '--card-padding': operationsTokens.spacing['card-padding'],
      },
      '.density-comfortable': {
        '--row-gap': consumerTokens.spacing['row-gap'],
        '--section-gap': consumerTokens.spacing['section-gap'],
        '--card-padding': consumerTokens.spacing['card-padding'],
      },
      '.density-default': {
        '--row-gap': hospitalityTokens.spacing['row-gap'],
        '--section-gap': hospitalityTokens.spacing['section-gap'],
        '--card-padding': hospitalityTokens.spacing['card-padding'],
      },
    })
  }
)
```

**Update**: `packages/design-tokens/src/index.ts`
```typescript
export { contextPlugin } from './tailwind-plugin'
```

**Update**: Root `tailwind.config.mjs`
```javascript
import { contextPlugin } from '@acme/design-tokens'

plugins: [
  tokens,
  contextPlugin,
  require("@tailwindcss/forms"),
  require("@tailwindcss/container-queries"),
],
```

## Week 2-3: DataTable Component (MVP)

### Phase 1 Scope (MVP)

**Included**:
- ✅ Column sorting (ascending/descending)
- ✅ Global search across filterable columns
- ✅ Row click handler
- ✅ Loading and empty states
- ✅ Responsive (horizontal scroll on mobile)
- ✅ Basic keyboard support (sortable headers)

**Deferred to Phase 2**:
- ⏳ Row selection (checkboxes)
- ⏳ Pagination
- ⏳ Per-column filtering
- ⏳ Advanced keyboard navigation (arrow keys)

### Task 2.1: Create DataTable Component (FIXED)

**File**: `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx`

```tsx
'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Input } from '../../atoms/shadcn/Input'
import { Button } from '../../atoms/shadcn/Button'

/**
 * Column definition with split getValue/cell pattern
 * - getValue: Returns primitive value for sorting/filtering
 * - cell: Optional custom render function for display
 */
export interface DataTableColumn<T> {
  id: string
  header: string
  /** Returns primitive value for sorting and filtering */
  getValue: (row: T) => string | number | Date | boolean
  /** Optional custom render - if omitted, getValue result is displayed */
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  /** Can this column be searched? Defaults to true */
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const processedData = useMemo(() => {
    let filtered = data

    // Search - only searches filterable columns' getValue results
    if (searchable && searchTerm) {
      filtered = data.filter((row) =>
        columns
          .filter(col => col.filterable !== false)  // Default to searchable
          .some((col) => {
            const value = col.getValue(row)
            return String(value)
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          })
      )
    }

    // Sort - uses getValue for safe comparison
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const column = columns.find((col) => col.id === sortConfig.key)
        if (!column) return 0

        const aValue = column.getValue(a)
        const bValue = column.getValue(b)

        // Safe comparison for primitives
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [data, columns, searchTerm, sortConfig, searchable])

  const handleSort = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId)
    if (!column?.sortable) return

    setSortConfig((current) => {
      if (current?.key === columnId) {
        return {
          key: columnId,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  return (
    <div className={`flex flex-col gap-[var(--row-gap)] ${className}`}>
      {/* Search bar */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-muted overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    style={{ width: column.width }}
                    className={`
                      px-[var(--table-cell-padding)] py-2
                      text-left text-xs font-medium uppercase tracking-wider
                      ${column.sortable ? 'cursor-pointer hover:bg-muted/80' : ''}
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortConfig?.key === column.id && (
                        <span>
                          {sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-bg divide-y divide-muted">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-[var(--table-cell-padding)] py-8 text-center text-muted"
                  >
                    Loading...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-[var(--table-cell-padding)] py-8 text-center text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                processedData.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                      transition-colors
                    `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`
                          px-[var(--table-cell-padding)] py-3 text-sm
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                        `}
                      >
                        {/* Use cell render if provided, otherwise getValue */}
                        {column.cell ? column.cell(row) : String(column.getValue(row))}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      {processedData.length > 0 && (
        <div className="text-sm text-muted">
          Showing {processedData.length} of {data.length} items
        </div>
      )}
    </div>
  )
}
```

### Task 2.2: Storybook Story (FIXED)

**File**: `packages/ui/src/components/organisms/operations/DataTable/DataTable.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from './DataTable'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: Date
}

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: new Date('2024-01-15') },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: new Date('2024-02-20') },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'inactive', createdAt: new Date('2024-03-10') },
]

// Status badge component for custom cell rendering
function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span
      className={`
        px-2 py-1 text-xs rounded-full
        ${status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-fg'}
      `}
    >
      {status}
    </span>
  )
}

const meta: Meta<typeof DataTable> = {
  title: 'Organisms/Operations/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  args: {
    data: mockUsers,
    columns: [
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
        filterable: true,
      },
      {
        id: 'email',
        header: 'Email',
        getValue: (row) => row.email,
        sortable: true,
        filterable: true,
      },
      {
        id: 'role',
        header: 'Role',
        getValue: (row) => row.role,
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        getValue: (row) => row.status,  // Returns primitive for sort
        cell: (row) => <StatusBadge status={row.status} />,  // Custom render
        sortable: true,
        filterable: false,  // Don't search JSX
      },
    ],
  },
}

export const WithRowClick: Story = {
  args: {
    ...Default.args,
    onRowClick: (row) => alert(`Clicked: ${row.name}`),
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
  },
}

export const NoSearch: Story = {
  args: {
    ...Default.args,
    searchable: false,
  },
}
```

### Task 2.3: Package Exports (FIXED - Canonical Imports)

**File**: `packages/ui/src/components/organisms/operations/index.ts`
```typescript
export { DataTable } from './DataTable/DataTable'
export type { DataTableColumn, DataTableProps } from './DataTable/DataTable'
```

**File**: `packages/ui/package.json` (add to exports)
```json
{
  "exports": {
    "./operations": {
      "types": "./dist/components/organisms/operations/index.d.ts",
      "import": "./dist/components/organisms/operations/index.js"
    }
  }
}
```

## Testing

### Unit Test (FIXED)

**File**: `packages/ui/__tests__/DataTable.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, DataTableColumn } from '../src/components/organisms/operations/DataTable/DataTable'

interface MockData {
  id: number
  name: string
  status: 'active' | 'inactive'
}

const mockData: MockData[] = [
  { id: 1, name: 'John', status: 'active' },
  { id: 2, name: 'Jane', status: 'inactive' },
]

const mockColumns: DataTableColumn<MockData>[] = [
  {
    id: 'id',
    header: 'ID',
    getValue: (row) => row.id,
    sortable: true,
  },
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
    getValue: (row) => row.status,
    cell: (row) => <span data-testid={`status-${row.id}`}>{row.status.toUpperCase()}</span>,
    sortable: true,
  },
]

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })

  it('renders custom cell content', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    expect(screen.getByTestId('status-1')).toHaveTextContent('ACTIVE')
    expect(screen.getByTestId('status-2')).toHaveTextContent('INACTIVE')
  })

  it('handles search on filterable columns', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable />)
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Jane')).not.toBeInTheDocument()
  })

  it('sorts using getValue primitive', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    const nameHeader = screen.getByText('Name')

    // First click: ascending
    fireEvent.click(nameHeader)
    const rows = screen.getAllByRole('row').slice(1) // Skip header
    expect(rows[0]).toHaveTextContent('Jane')
    expect(rows[1]).toHaveTextContent('John')

    // Second click: descending
    fireEvent.click(nameHeader)
    const rowsDesc = screen.getAllByRole('row').slice(1)
    expect(rowsDesc[0]).toHaveTextContent('John')
    expect(rowsDesc[1]).toHaveTextContent('Jane')
  })

  it('handles row click', () => {
    const handleClick = jest.fn()
    render(<DataTable data={mockData} columns={mockColumns} onRowClick={handleClick} />)
    fireEvent.click(screen.getByText('John'))
    expect(handleClick).toHaveBeenCalledWith(mockData[0])
  })

  it('shows empty state', () => {
    render(<DataTable data={[]} columns={mockColumns} emptyMessage="No results" />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<DataTable data={mockData} columns={mockColumns} loading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

## Definition of Done (Phase 1 MVP)

### Token System
- [ ] Core tokens created (spacing, typography, colors)
- [ ] Context tokens implemented (operations, consumer, hospitality only)
- [ ] Tailwind plugin sets ALL CSS variables used in examples
- [ ] `dashboard` context and `spacious` density documented for Phase 2
- [ ] Documentation complete with canonical import examples

### DataTable Component (MVP Only)
- [ ] Component implemented with `getValue`/`cell` pattern
- [ ] Sort and search working correctly
- [ ] Storybook stories created
- [ ] Unit tests passing (>80% coverage)
- [ ] Accessibility verified (keyboard sortable, screen reader)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Uses semantic color tokens (no hardcoded grays)
- [ ] Uses CSS variables for all spacing

### Integration
- [ ] At least one app using new tokens
- [ ] DataTable used in one real screen
- [ ] No regressions in existing apps
- [ ] Canonical import paths documented

### Phase 2 Scope (Documented, Not Built)
- [ ] DataTable pagination documented
- [ ] DataTable row selection documented
- [ ] DataTable per-column filtering documented
- [ ] Dashboard context plan created
- [ ] Spacious density plan created

## Next Steps (Phase 2)

After Phase 1 completion:
- Add DataTable pagination, row selection, column filters
- Create MetricsCard component
- Create QuickActionBar component
- Add StatusIndicator component
- Begin dashboard context implementation

---

**Implementation owner**: Frontend team
**Review cadence**: Daily standups, weekly demos
**Last updated**: 2026-01-12
**Review fixes applied**: 2026-01-12
