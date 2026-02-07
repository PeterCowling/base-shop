"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";

import { Inline } from "../primitives/Inline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../primitives/table";
import { cn } from "../utils/style";

import { PaginationControl } from "./PaginationControl";

export interface DataGridProps<TData> {
  /** Column definitions — uses @tanstack/react-table ColumnDef directly */
  columns: ColumnDef<TData, unknown>[];
  /** Data array */
  data: TData[];

  // --- Feature flags ---
  /** Enable column sorting (default: false) */
  sortable?: boolean;
  /** Enable global filter / search (default: false) */
  filterable?: boolean;
  /** Enable client-side pagination (default: false) */
  paginated?: boolean;
  /** Enable row selection with checkboxes (default: false) */
  selectable?: boolean;

  // --- Controlled state (optional) ---
  /** Controlled sorting state */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Controlled global filter */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  /** Controlled pagination */
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Controlled row selection */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  // --- Configuration ---
  /** Rows per page when paginated (default: 10) */
  pageSize?: number;
  /** Row key extractor for stable React keys */
  getRowId?: (row: TData, index: number) => string;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void;

  // --- UI customization ---
  /** Additional className for the root wrapper */
  className?: string;
  /** Message shown when data is empty */
  emptyMessage?: React.ReactNode;
  /** Whether data is loading */
  loading?: boolean;
  /** Message shown while loading */
  loadingMessage?: React.ReactNode;
  /** Enable zebra striping on rows */
  striped?: boolean;
  /** Compact row padding */
  dense?: boolean;

  // --- Advanced ---
  /** Access the underlying table instance for advanced use cases */
  tableRef?: React.MutableRefObject<TanstackTable<TData> | null>;
}

function DataGridSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search\u2026"
      className={cn(
        "w-full rounded-md border border-border-2 bg-input px-3 py-2",
        "text-sm text-foreground placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    />
  );
}

const DEFAULT_PAGE_SIZE = 10;

function resolveUpdater<T>(current: T, updater: React.SetStateAction<T>) {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(current)
    : updater;
}

function getSortingState(sortable: boolean, sorting: SortingState) {
  return sortable ? { sorting } : {};
}

function getFilterState(filterable: boolean, globalFilter: string) {
  return filterable ? { globalFilter } : {};
}

function getPaginationState(paginated: boolean, pagination: PaginationState) {
  return paginated ? { pagination } : {};
}

function getSelectionState(selectable: boolean, rowSelection: RowSelectionState) {
  return selectable ? { rowSelection } : {};
}

function getSortingOptions(
  sortable: boolean,
  sorting: SortingState,
  onChange: (next: SortingState) => void
) {
  if (!sortable) return {};
  return {
    onSortingChange: (updater: React.SetStateAction<SortingState>) => {
      onChange(resolveUpdater(sorting, updater));
    },
    getSortedRowModel: getSortedRowModel(),
  };
}

function getFilterOptions(
  filterable: boolean,
  globalFilter: string,
  onChange: (next: string) => void
) {
  if (!filterable) return {};
  return {
    onGlobalFilterChange: (updater: React.SetStateAction<string>) => {
      onChange(resolveUpdater(globalFilter, updater));
    },
    getFilteredRowModel: getFilteredRowModel(),
  };
}

function getPaginationOptions(
  paginated: boolean,
  pagination: PaginationState,
  onChange: (next: PaginationState) => void
) {
  if (!paginated) return {};
  return {
    onPaginationChange: (updater: React.SetStateAction<PaginationState>) => {
      onChange(resolveUpdater(pagination, updater));
    },
    getPaginationRowModel: getPaginationRowModel(),
  };
}

function getSelectionOptions(
  selectable: boolean,
  rowSelection: RowSelectionState,
  onChange: (next: RowSelectionState) => void
) {
  if (!selectable) return {};
  return {
    onRowSelectionChange: (updater: React.SetStateAction<RowSelectionState>) => {
      onChange(resolveUpdater(rowSelection, updater));
    },
    enableRowSelection: true,
  };
}

type DataGridTableProps<TData> = {
  table: TanstackTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  striped?: boolean;
  dense?: boolean;
  onRowClick?: (row: TData) => void;
};

function DataGridTable<TData>({
  table,
  columns,
  loading,
  loadingMessage,
  emptyMessage,
  striped,
  dense,
  onRowClick,
}: DataGridTableProps<TData>) {
  const rows = table.getRowModel().rows;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              return (
                <TableHead
                  key={header.id}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  className={cn(
                    canSort && "cursor-pointer select-none",
                    dense && "px-3 py-1",
                  )}
                >
                  {header.isPlaceholder ? null : (
                    <Inline asChild gap={1} alignY="center" wrap={false}>
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <SortAscIcon />}
                        {header.column.getIsSorted() === "desc" && <SortDescIcon />}
                      </span>
                    </Inline>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
              {loadingMessage ?? "Loading\u2026"}
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
              {emptyMessage ?? "No data"}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, idx) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                onRowClick && "cursor-pointer",
                striped && idx % 2 === 1 && "bg-surface-2/50",
                dense && "[&>td]:px-3 [&>td]:py-1",
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function DataGrid<TData>({
  columns,
  data,
  sortable = false,
  filterable = false,
  paginated = false,
  selectable = false,
  sorting: controlledSorting,
  onSortingChange,
  globalFilter: controlledFilter,
  onGlobalFilterChange,
  pagination: controlledPagination,
  onPaginationChange,
  rowSelection: controlledSelection,
  onRowSelectionChange,
  pageSize = DEFAULT_PAGE_SIZE,
  getRowId,
  onRowClick,
  className,
  emptyMessage,
  loading,
  loadingMessage,
  striped = false,
  dense = false,
  tableRef,
}: DataGridProps<TData>): React.JSX.Element {
  // Internal state (used when not controlled)
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalFilter, setInternalFilter] = React.useState("");
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [internalSelection, setInternalSelection] = React.useState<RowSelectionState>({});

  // Resolve controlled vs uncontrolled
  const sorting = controlledSorting ?? internalSorting;
  const globalFilter = controlledFilter ?? internalFilter;
  const pagination = controlledPagination ?? internalPagination;
  const rowSelection = controlledSelection ?? internalSelection;
  const applySortingChange = (next: SortingState) => (onSortingChange ?? setInternalSorting)(next);
  const applyFilterChange = (next: string) => (onGlobalFilterChange ?? setInternalFilter)(next);
  const applyPaginationChange = (next: PaginationState) => (onPaginationChange ?? setInternalPagination)(next);
  const applySelectionChange = (next: RowSelectionState) => (onRowSelectionChange ?? setInternalSelection)(next);

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      ...getSortingState(sortable, sorting),
      ...getFilterState(filterable, globalFilter),
      ...getPaginationState(paginated, pagination),
      ...getSelectionState(selectable, rowSelection),
    },
    ...getSortingOptions(sortable, sorting, applySortingChange),
    ...getFilterOptions(filterable, globalFilter, applyFilterChange),
    ...getPaginationOptions(paginated, pagination, applyPaginationChange),
    ...getSelectionOptions(selectable, rowSelection, applySelectionChange),
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  });

  // Expose table instance via ref
  if (tableRef) {
    tableRef.current = table;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {filterable && (
        <DataGridSearch
          value={globalFilter}
          onChange={applyFilterChange}
        />
      )}

      <DataGridTable
        table={table}
        columns={columns}
        loading={loading}
        loadingMessage={loadingMessage}
        emptyMessage={emptyMessage}
        striped={striped}
        dense={dense}
        onRowClick={onRowClick}
      />

      {paginated && table.getPageCount() > 1 && (
        <PaginationControl
          page={table.getState().pagination.pageIndex + 1}
          pageCount={table.getPageCount()}
          onPageChange={(p) => table.setPageIndex(p - 1)}
        />
      )}
    </div>
  );
}
DataGrid.displayName = "DataGrid";

/** Helper to create a checkbox selection column */
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "_select",
    header: ({ table: t }) => (
        <input
          type="checkbox"
          checked={t.getIsAllPageRowsSelected()}
          onChange={t.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all"
          className="min-h-12 min-w-12 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
        className="min-h-12 min-w-12 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    ),
    size: 40,
  };
}

function SortAscIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M6 3L10 8H2L6 3Z" fill="currentColor" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M6 9L2 4H10L6 9Z" fill="currentColor" />
    </svg>
  );
}
