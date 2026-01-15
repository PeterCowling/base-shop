import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export interface FilterSection {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export interface FilterPanelProps {
  sections: FilterSection[];
  onClear?: () => void;
  onApply?: () => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  showClearButton?: boolean;
  showApplyButton?: boolean;
  className?: string;
  activeFiltersCount?: number;
}

/**
 * FilterPanel component for advanced filtering interfaces
 *
 * Features:
 * - Collapsible sections
 * - Clear all filters button
 * - Apply filters button
 * - Active filters count badge
 * - Expandable/collapsible panel
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <FilterPanel
 *   sections={[
 *     {
 *       id: 'status',
 *       title: 'Status',
 *       children: <StatusFilter />,
 *       defaultExpanded: true
 *     },
 *     {
 *       id: 'date',
 *       title: 'Date Range',
 *       children: <DateRangeFilter />
 *     }
 *   ]}
 *   onClear={() => resetFilters()}
 *   onApply={() => applyFilters()}
 *   activeFiltersCount={3}
 * />
 * ```
 */
export function FilterPanel({
  sections,
  onClear,
  onApply,
  isCollapsible = false,
  defaultCollapsed = false,
  showClearButton = true,
  showApplyButton = false,
  className = '',
  activeFiltersCount = 0,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => {
      acc[section.id] = section.defaultExpanded ?? true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const togglePanel = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showClearButton && activeFiltersCount > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={togglePanel}
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
              className="rounded p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {section.title}
                </span>
                {expandedSections[section.id] ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Section Content */}
              {expandedSections[section.id] && (
                <div className="px-4 pb-4">{section.children}</div>
              )}
            </div>
          ))}

          {/* Apply Button */}
          {showApplyButton && onApply && (
            <div className="px-4 py-3">
              <button
                onClick={onApply}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
