import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslations } from '@acme/i18n';
import { Inline } from '../../../atoms/primitives';
import { cn } from '../../../../utils/style/cn';

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
  const t = useTranslations();
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
    <Inline
      asChild
      alignY="center"
      className={cn(
        'w-full justify-between gap-4 rounded-lg border border-border-2 bg-surface-1 px-4 py-3',
        className
      )}
      role="navigation"
      aria-label={t('pagination.ariaLabel')}
    >
      <div>
        {/* Items info */}
        <Inline alignY="center" gap={4}>
          <span className="text-sm text-muted">
            {totalItems === 0
              ? t('pagination.noItems')
              : t('pagination.range', {
                  start: startItem,
                  end: endItem,
                  total: totalItems,
                })}
          </span>

          {/* Page size selector */}
          {showPageSizeSelector && onPageSizeChange && (
            <Inline alignY="center" gap={2}>
              <label htmlFor="page-size" className="text-sm text-muted">
                {t('pagination.perPage')}
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                disabled={disabled}
                className={cn(
                  'min-h-10 rounded border border-border-2 bg-surface-1 px-2 py-1 text-sm text-fg transition-colors',
                  'hover:border-border-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Inline>
          )}
        </Inline>

        {/* Page navigation */}
        <Inline alignY="center" gap={2}>
          {showFirstLast && (
            <button
              onClick={() => handlePageChange(1)}
              disabled={!canGoPrevious}
              aria-label={t('pagination.first')}
              className={cn(
                'grid min-h-11 min-w-11 place-items-center rounded-md text-muted transition-colors',
                'hover:bg-muted/40 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
              )}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            aria-label={t('pagination.prev')}
            className={cn(
              'grid min-h-11 min-w-11 place-items-center rounded-md text-muted transition-colors',
              'hover:bg-muted/40 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-24 text-center text-sm text-fg">
            {t('pagination.pageOf', { current: currentPage, total: totalPages })}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label={t('pagination.next')}
            className={cn(
              'grid min-h-11 min-w-11 place-items-center rounded-md text-muted transition-colors',
              'hover:bg-muted/40 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {showFirstLast && (
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={!canGoNext}
              aria-label={t('pagination.last')}
              className={cn(
                'grid min-h-11 min-w-11 place-items-center rounded-md text-muted transition-colors',
                'hover:bg-muted/40 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
              )}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </Inline>
      </div>
    </Inline>
  );
}
