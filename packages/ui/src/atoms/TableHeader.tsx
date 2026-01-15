/* i18n-exempt file -- OPS-002 [ttl=2026-12-31] class names are not user-facing */
'use client'

import React, { useMemo } from 'react'
import { cn } from '../utils/style/cn'

export interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  /** Display label (already translated) */
  label: string
  /** Field name for sorting */
  field?: string
  /** Current sort field */
  currentSortField?: string
  /** Current sort direction */
  sortAscending?: boolean
  /** Callback when header is clicked for sorting */
  onSort?: (field: string) => void
  /** Whether this column is sortable */
  sortable?: boolean
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
}

/**
 * TableHeader - Sortable table header cell
 *
 * Provides consistent styling and sorting behavior for table headers.
 * Displays sort indicators when active.
 *
 * Features:
 * - Click to sort
 * - Visual sort indicators (↑/↓)
 * - Hover states
 * - Dark mode support
 * - Accessible (scope, aria-label)
 *
 * @example
 * ```tsx
 * <thead>
 *   <tr>
 *     <TableHeader
 *       label="Name"
 *       field="name"
 *       sortable
 *       currentSortField={sortField}
 *       sortAscending={ascending}
 *       onSort={handleSort}
 *     />
 *     <TableHeader label="Status" align="center" />
 *   </tr>
 * </thead>
 * ```
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  label,
  field,
  currentSortField,
  sortAscending = true,
  onSort,
  sortable = false,
  align = 'left',
  className,
  ...rest
}) => {
  const isActive = field && currentSortField === field
  const isSortable = sortable && field && onSort

  const handleClick = () => {
    if (isSortable && field) {
      onSort(field)
    }
  }

  const SortIcon = useMemo(() => {
    if (!isActive) {
      // Neutral sort icon
      return (
        <svg
          className="h-4 w-4 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    // Active sort icon
    return sortAscending ? (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }, [isActive, sortAscending])

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <th
      scope="col"
      onClick={handleClick}
      className={cn(
        'px-3 py-2 font-semibold text-sm border-b',
        'bg-gray-100 text-gray-700',
        'dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface',
        isSortable && 'cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-800',
        alignStyles[align],
        className
      )}
      aria-sort={
        isActive ? (sortAscending ? 'ascending' : 'descending') : undefined
      }
      {...rest}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {isSortable && SortIcon}
      </span>
    </th>
  )
}

export default TableHeader
