import React, { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Cluster, Inline } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

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
  className = "",
  activeFiltersCount = 0,
}: FilterPanelProps) {
  const t = useTranslations();
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
      className={cn(
        "rounded-lg border border-border-2 bg-surface-1",
        className
      )}
    >
      {/* Panel Header */}
      <Cluster
        alignY="center"
        justify="between"
        className="border-b border-border-2 px-4 py-3"
      >
        <Inline gap={2} alignY="center">
          <h3 className="font-medium text-fg">{t("filterPanel.title")}</h3>
          {activeFiltersCount > 0 && (
            <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Inline>

        <Inline gap={2} alignY="center">
          {showClearButton && activeFiltersCount > 0 && (
            <button
              onClick={onClear}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center gap-1 rounded px-3 text-sm text-muted transition-colors",
                "hover:bg-muted/50 hover:text-fg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <X className="h-3 w-3" />
              {t("filterPanel.clear")}
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={togglePanel}
              aria-label={
                isExpanded
                  ? t("filterPanel.collapse")
                  : t("filterPanel.expand")
              }
              className={cn(
                "min-h-11 min-w-11 rounded text-muted transition-colors",
                "hover:bg-muted/50 hover:text-fg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </Inline>
      </Cluster>

      {/* Panel Content */}
      {isExpanded && (
        <div className="divide-y divide-border-2">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "flex min-h-11 min-w-11 w-full items-center justify-between px-4 py-3 text-start transition-colors",
                  "hover:bg-muted/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                <span className="text-sm font-medium text-fg">
                  {section.title}
                </span>
                {expandedSections[section.id] ? (
                  <ChevronUp className="h-4 w-4 text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted" />
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
                className={cn(
                  "min-h-11 min-w-11 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors",
                  "hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                {t("filterPanel.apply")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
