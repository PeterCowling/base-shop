Type: Implementation Guide
Status: Active
Domain: Design System
Last-reviewed: 2026-01-12
Relates-to: docs/ui-system-enhancement-strategy.md

# UI System Phase 1 Implementation Guide

## Overview

This guide provides step-by-step implementation instructions for Phase 1 of the UI system enhancement strategy. Phase 1 focuses on establishing the enhanced token system and creating core operations components.

**Timeline**: Weeks 1-3
**Goal**: Foundation for multi-context design system

## Week 1: Token Architecture

### Task 1.1: Create Context-Specific Token Structure

#### Create directory structure

```bash
# From monorepo root
mkdir -p packages/design-tokens/src/{core,semantic,contexts,themes}
mkdir -p packages/design-tokens/src/contexts/{consumer,operations,hospitality,dashboard}
```

#### Create core tokens

**File**: `packages/design-tokens/src/core/spacing.ts`
```typescript
/**
 * Core spacing scale - universal across all contexts
 * Based on 4px grid system
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

export type Spacing = keyof typeof spacing
```

**File**: `packages/design-tokens/src/core/typography.ts`
```typescript
/**
 * Core typography scales
 */
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

export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const
```

**File**: `packages/design-tokens/src/core/colors.ts`
```typescript
/**
 * Core color primitives
 * These are the base colors, semantic meaning applied in contexts
 */
export const colors = {
  // Neutrals
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

  // Brand colors (example - adjust per brand)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Status colors
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
} as const
```

#### Create context-specific tokens

**File**: `packages/design-tokens/src/contexts/operations/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

/**
 * Operations context tokens
 * Optimized for dense, data-heavy interfaces
 */
export const operationsTokens = {
  spacing: {
    // Tighter defaults for tables and forms
    'row-gap': spacing[2],        // 8px between rows
    'section-gap': spacing[4],    // 16px between sections
    'card-padding': spacing[3],   // 12px card padding
    'input-padding': spacing[2],  // 8px input padding
    'table-cell-padding': spacing[2], // 8px table cells
    'button-padding-x': spacing[3],   // 12px button horizontal
    'button-padding-y': spacing[2],   // 8px button vertical
  },

  typography: {
    // Slightly smaller base for more density
    'base-size': '0.875rem',  // 14px
    'heading-size': '1.125rem', // 18px
    'label-size': '0.75rem',   // 12px
    'data-size': '0.875rem',   // 14px
  },

  colors: {
    // Operational status colors
    'status-available': colors.green[600],
    'status-occupied': colors.red[600],
    'status-cleaning': colors.yellow[600],
    'status-maintenance': colors.blue[600],
    'stock-low': colors.red[600],
    'stock-ok': colors.green[600],
    'stock-high': colors.blue[500],

    // Data visualization
    'chart-primary': colors.blue[600],
    'chart-secondary': colors.green[600],
    'chart-tertiary': colors.yellow[600],
    'chart-quaternary': colors.red[600],
  },

  density: 'compact' as const,
}
```

**File**: `packages/design-tokens/src/contexts/consumer/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

/**
 * Consumer context tokens
 * Optimized for marketing, e-commerce, content-heavy interfaces
 */
export const consumerTokens = {
  spacing: {
    // Generous spacing for breathing room
    'row-gap': spacing[6],        // 24px between rows
    'section-gap': spacing[12],   // 48px between sections
    'card-padding': spacing[6],   // 24px card padding
    'input-padding': spacing[4],  // 16px input padding
    'button-padding-x': spacing[6],   // 24px button horizontal
    'button-padding-y': spacing[3],   // 12px button vertical
  },

  typography: {
    // Larger, more readable
    'base-size': '1rem',      // 16px
    'heading-size': '1.5rem', // 24px
    'label-size': '0.875rem', // 14px
    'hero-size': '3rem',      // 48px
  },

  colors: {
    // Brand-forward colors
    'brand-primary': colors.blue[600],
    'brand-secondary': colors.blue[500],
    'accent': colors.green[600],

    // E-commerce specific
    'price-default': colors.gray[900],
    'price-sale': colors.red[600],
    'price-original': colors.gray[500],
    'badge-new': colors.green[600],
    'badge-sale': colors.red[600],
  },

  density: 'comfortable' as const,
}
```

**File**: `packages/design-tokens/src/contexts/hospitality/index.ts`
```typescript
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

/**
 * Hospitality context tokens
 * Balanced between consumer (guest-facing) and operations (staff-facing)
 */
export const hospitalityTokens = {
  spacing: {
    // Medium density
    'row-gap': spacing[4],        // 16px between rows
    'section-gap': spacing[8],    // 32px between sections
    'card-padding': spacing[4],   // 16px card padding
    'input-padding': spacing[3],  // 12px input padding
  },

  typography: {
    'base-size': '0.9375rem',  // 15px - balanced
    'heading-size': '1.25rem', // 20px
    'label-size': '0.8125rem', // 13px
  },

  colors: {
    // Room status colors (operations)
    'room-available': colors.green[600],
    'room-occupied': colors.red[600],
    'room-cleaning': colors.yellow[600],
    'room-maintenance': colors.gray[600],

    // Guest experience (consumer)
    'amenity-highlight': colors.blue[600],
    'booking-primary': colors.green[600],
    'booking-secondary': colors.blue[500],
  },

  density: 'default' as const,
}
```

#### Update main index to export contexts

**File**: `packages/design-tokens/src/index.ts`
```typescript
// Export core tokens
export * from './core/spacing'
export * from './core/typography'
export * from './core/colors'

// Export context tokens
export { operationsTokens } from './contexts/operations'
export { consumerTokens } from './contexts/consumer'
export { hospitalityTokens } from './contexts/hospitality'

// Export types
export type TokenContext = 'operations' | 'consumer' | 'hospitality' | 'dashboard'
export type Density = 'compact' | 'default' | 'comfortable' | 'spacious'

/**
 * Get tokens for a specific context
 */
export function getContextTokens(context: TokenContext) {
  switch (context) {
    case 'operations':
      return operationsTokens
    case 'consumer':
      return consumerTokens
    case 'hospitality':
      return hospitalityTokens
    default:
      return consumerTokens // default fallback
  }
}
```

### Task 1.2: Update Tailwind Config for Context Support

**File**: `packages/design-tokens/src/tailwind-plugin.ts`
```typescript
import plugin from 'tailwindcss/plugin'
import { operationsTokens } from './contexts/operations'
import { consumerTokens } from './contexts/consumer'
import { hospitalityTokens } from './contexts/hospitality'

/**
 * Tailwind plugin that provides context-aware utilities
 */
export const contextPlugin = plugin(
  function({ addUtilities, addComponents, theme }) {
    // Add context-specific utilities
    addUtilities({
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

    // Add context wrapper classes
    addComponents({
      '.context-operations': {
        fontSize: operationsTokens.typography['base-size'],
        '--row-gap': operationsTokens.spacing['row-gap'],
        '--section-gap': operationsTokens.spacing['section-gap'],
      },
      '.context-consumer': {
        fontSize: consumerTokens.typography['base-size'],
        '--row-gap': consumerTokens.spacing['row-gap'],
        '--section-gap': consumerTokens.spacing['section-gap'],
      },
      '.context-hospitality': {
        fontSize: hospitalityTokens.typography['base-size'],
        '--row-gap': hospitalityTokens.spacing['row-gap'],
        '--section-gap': hospitalityTokens.spacing['section-gap'],
      },
    })
  }
)
```

**Update**: `packages/design-tokens/src/index.ts`
```typescript
// Add to exports
export { contextPlugin } from './tailwind-plugin'
```

**Update**: Root `tailwind.config.mjs`
```javascript
import { contextPlugin } from '@acme/design-tokens'

// ... existing config
plugins: [
  tokens,
  contextPlugin, // Add this
  require("@tailwindcss/forms"),
  require("@tailwindcss/container-queries"),
],
```

### Task 1.3: Create Usage Documentation

**File**: `packages/design-tokens/USAGE.md`
```markdown
# Design Tokens Usage Guide

## Context Selection

Choose the appropriate context for your app:

- **Operations**: Dense, data-heavy interfaces (reception, inventory, dashboards)
- **Consumer**: Marketing, e-commerce, content-heavy sites
- **Hospitality**: Mixed guest/staff interfaces (booking, guest portals)

## App Configuration

### Next.js App

Add context class to your root layout:

```tsx
// apps/reception/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="context-operations">
        {children}
      </body>
    </html>
  )
}
```

### Component-Level Override

```tsx
<div className="context-consumer">
  {/* This section uses consumer spacing/typography */}
</div>
```

## Token Usage in Components

### Spacing

Use CSS custom properties:

```tsx
<div style={{
  padding: 'var(--card-padding)',
  gap: 'var(--row-gap)'
}}>
  Content
</div>
```

Or use Tailwind utilities with context:

```tsx
<div className="space-y-[--row-gap] p-[--card-padding]">
  Content
</div>
```

### Density Classes

```tsx
// Override density within a context
<div className="density-compact">
  {/* Tighter spacing regardless of context */}
</div>
```

## Programmatic Access

```typescript
import { getContextTokens, operationsTokens } from '@acme/design-tokens'

// Get tokens for specific context
const tokens = getContextTokens('operations')

// Direct access
const spacing = operationsTokens.spacing['row-gap']
```

## Best Practices

1. **Set context once**: Apply context class at app root
2. **Use CSS variables**: Prefer custom properties over direct token values
3. **Override sparingly**: Only override context when truly needed
4. **Document deviations**: Comment why you're overriding defaults
```

## Week 2-3: Operations Components

### Task 2.1: Create DataTable Component

**File**: `packages/ui/src/components/organisms/operations/DataTable/DataTable.tsx`

```tsx
'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/atoms/shadcn/Input'
import { Button } from '@/components/atoms/shadcn/Button'

export interface DataTableColumn<T> {
  id: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
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

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Search
    if (searchable && searchTerm) {
      filtered = data.filter((row) =>
        columns.some((col) => {
          const value = col.accessor(row)
          return String(value)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        })
      )
    }

    // Sort
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const column = columns.find((col) => col.id === sortConfig.key)
        if (!column) return 0

        const aValue = column.accessor(a)
        const bValue = column.accessor(b)

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
    <div className={`flex flex-col gap-[--row-gap] ${className}`}>
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
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    style={{ width: column.width }}
                    className={`
                      px-[--table-cell-padding] py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider
                      ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
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
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-[--table-cell-padding] py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-[--table-cell-padding] py-8 text-center text-gray-500"
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
                      ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                      transition-colors
                    `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={`
                          px-[--table-cell-padding] py-3 text-sm text-gray-900
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                        `}
                      >
                        {column.accessor(row)}
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
        <div className="text-sm text-gray-600">
          Showing {processedData.length} of {data.length} items
        </div>
      )}
    </div>
  )
}
```

**File**: `packages/ui/src/components/organisms/operations/DataTable/index.ts`
```typescript
export { DataTable } from './DataTable'
export type { DataTableColumn, DataTableProps } from './DataTable'
```

### Task 2.2: Create Storybook Story

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
}

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'inactive' },
  // Add more mock data...
]

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
      { id: 'id', header: 'ID', accessor: (row) => row.id, sortable: true, width: '80px' },
      { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
      { id: 'email', header: 'Email', accessor: (row) => row.email, sortable: true },
      { id: 'role', header: 'Role', accessor: (row) => row.role, sortable: true },
      {
        id: 'status',
        header: 'Status',
        accessor: (row) => (
          <span
            className={`
              px-2 py-1 text-xs rounded-full
              ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            `}
          >
            {row.status}
          </span>
        ),
        sortable: true,
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

### Task 2.3: Update Package Exports

**File**: `packages/ui/src/components/organisms/operations/index.ts`
```typescript
export * from './DataTable'
// Future exports:
// export * from './MetricsCard'
// export * from './QuickActionBar'
// export * from './ActivityFeed'
```

**File**: `packages/ui/package.json`
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

## Testing Strategy

### Unit Tests

**File**: `packages/ui/__tests__/DataTable.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from '../src/components/organisms/operations/DataTable'

const mockData = [
  { id: 1, name: 'John', status: 'active' },
  { id: 2, name: 'Jane', status: 'inactive' },
]

const mockColumns = [
  { id: 'id', header: 'ID', accessor: (row) => row.id, sortable: true },
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
]

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })

  it('handles search', () => {
    render(<DataTable data={mockData} columns={mockColumns} searchable />)
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Jane')).not.toBeInTheDocument()
  })

  it('handles sorting', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    // Add assertions for sort order
  })

  it('handles row click', () => {
    const handleClick = jest.fn()
    render(<DataTable data={mockData} columns={mockColumns} onRowClick={handleClick} />)
    fireEvent.click(screen.getByText('John'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Documentation Checklist

- [ ] Token architecture documented
- [ ] Context selection guide created
- [ ] Usage examples in Storybook
- [ ] Migration guide for existing apps
- [ ] TypeScript types exported correctly
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Responsive behavior verified

## Definition of Done

Phase 1 is complete when:

1. **Token System**:
   - [ ] Core tokens created (spacing, typography, colors)
   - [ ] Context tokens implemented (operations, consumer, hospitality)
   - [ ] Tailwind plugin functional
   - [ ] Documentation complete

2. **DataTable Component**:
   - [ ] Component implemented with search and sort
   - [ ] Storybook stories created
   - [ ] Unit tests passing
   - [ ] Accessibility verified
   - [ ] Responsive on mobile/tablet/desktop

3. **Integration**:
   - [ ] At least one app using new tokens
   - [ ] DataTable used in one real screen
   - [ ] No regressions in existing apps

4. **Documentation**:
   - [ ] Token usage guide
   - [ ] Component API docs
   - [ ] Migration examples
   - [ ] Best practices documented

## Next Steps (Phase 2)

After Phase 1 completion:
- Begin MetricsCard implementation
- Create QuickActionBar
- Add StatusIndicator component
- Start hospitality components (RoomGrid, CheckInForm)

## Questions & Support

For questions during implementation:
- Review: `docs/ui-system-enhancement-strategy.md`
- Check: Storybook at `http://localhost:6007`
- Test: `pnpm --filter @acme/ui test`

---

**Implementation owner**: Frontend team
**Review cadence**: Daily standups, weekly demos
**Last updated**: 2026-01-12
