import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showFirstLast?: boolean;
  className?: string;
  disabled?: boolean;
}

/**
 * Pagination component for tables and lists
 *
 * Features:
 * - Page navigation with prev/next buttons
 * - Optional first/last page buttons
 * - Page size selector
 * - Shows current range and total items
 * - Keyboard accessible
 * - Disabled state support
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   pageSize={20}
 *   totalItems={200}
 *   onPageChange={(page) => setPage(page)}
 *   onPageSizeChange={(size) => setPageSize(size)}
 *   showPageSizeSelector
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = false,
  showFirstLast = true,
  className = '',
  disabled = false,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1 && !disabled;
  const canGoNext = currentPage < totalPages && !disabled;

  const handlePageChange = (page: number) => {
    if (disabled) return;
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (disabled || !onPageSizeChange) return;
    onPageSizeChange(newSize);
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Items info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {totalItems === 0 ? (
            'No items'
          ) : (
            <>
              Showing <span className="font-medium text-slate-900 dark:text-slate-100">{startItem}</span>
              {' - '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{endItem}</span>
              {' of '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{totalItems}</span>
            </>
          )}
        </span>

        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-slate-600 dark:text-slate-400">
              Per page:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
            className="rounded p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
          className="rounded p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-[100px] text-center text-sm text-slate-900 dark:text-slate-100">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
          className="rounded p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
            className="rounded p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
