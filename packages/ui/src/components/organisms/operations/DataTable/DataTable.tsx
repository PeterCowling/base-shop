'use client'

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Search } from "lucide-react"
import { useTranslations } from "@acme/i18n"
import { Input } from "../../../atoms/shadcn/Input"
import { Button } from "../../../atoms/shadcn/Button"
import { Cluster, Inline, Stack } from "../../../atoms/primitives"
import { cn } from "../../../../utils/style/cn"

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
  getRowId?: (row: T) => string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder,
  onRowClick,
  emptyMessage,
  loading = false,
  className = "",
  getRowId,
}: DataTableProps<T>) {
  const t = useTranslations()
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("dataTable.searchPlaceholder")
  const resolvedEmptyMessage = emptyMessage ?? t("dataTable.emptyMessage")
  const hasWidths = columns.some((column) => Boolean(column.width))

  const processedData = useMemo(() => {
    let filtered = data

    // Search - only searches filterable columns' getValue results
    if (searchable && searchTerm) {
      filtered = data.filter((row) =>
        columns
          .filter((col) => col.filterable !== false) // Default to searchable
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
          direction: current.direction === "asc" ? "desc" : "asc",
        }
      }
      return { key: columnId, direction: "asc" }
    })
  }

  return (
    <Stack gap={2} className={className}>
      {/* Search bar */}
      {searchable && (
        <Cluster alignY="center" className="gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder={resolvedSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-8"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              {t("dataTable.clearSearch")}
            </Button>
          )}
        </Cluster>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            {hasWidths && (
              <colgroup>
                {columns.map((column) => (
                  <col key={column.id} width={column.width} />
                ))}
              </colgroup>
            )}
            <thead className="border-b border-border-2 bg-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "px-4 py-2 text-start text-xs font-medium uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-muted/80",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-end"
                    )}
                    onClick={() => handleSort(column.id)}
                  >
                    <Inline gap={1} alignY="center">
                      <span>{column.header}</span>
                      {column.sortable && sortConfig?.key === column.id && (
                        <span>
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </Inline>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-2 bg-bg">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted"
                  >
                    {t("dataTable.loading")}
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted"
                  >
                    {resolvedEmptyMessage}
                  </td>
                </tr>
              ) : (
                processedData.map((row) => {
                  const rowKey =
                    getRowId?.(row) ??
                    (row as { id?: string }).id ??
                    (row as { key?: string }).key ??
                    (row as { _id?: string })._id ??
                    JSON.stringify(row)
                  return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3 text-sm",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-end"
                        )}
                      >
                        {/* Use cell render if provided, otherwise getValue */}
                        {column.cell ? column.cell(row) : String(column.getValue(row))}
                      </td>
                    ))}
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      {processedData.length > 0 && (
        <p className="text-sm text-muted">
          {t("dataTable.footer", {
            shown: processedData.length,
            total: data.length,
          })}
        </p>
      )}
    </Stack>
  )
}
