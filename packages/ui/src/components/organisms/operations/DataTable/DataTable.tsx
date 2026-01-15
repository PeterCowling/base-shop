'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Input } from '../../../atoms/shadcn/Input'
import { Button } from '../../../atoms/shadcn/Button'

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
