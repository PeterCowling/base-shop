import React from "react";
import { X, type LucideIcon } from "lucide-react";
import { Cluster, Inline } from "../../../atoms/primitives";

export interface BulkAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface BulkActionsProps {
  selectedCount: number;
  totalCount?: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  position?: "top" | "bottom" | "sticky";
  className?: string;
}

/**
 * BulkActions component for multi-select operations toolbar
 *
 * Features:
 * - Shows selected items count
 * - Multiple action buttons with icons
 * - Clear selection button
 * - Danger variant for destructive actions
 * - Can be positioned at top, bottom, or sticky
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <BulkActions
 *   selectedCount={5}
 *   totalCount={100}
 *   actions={[
 *     {
 *       id: 'delete',
 *       label: 'Delete',
 *       icon: Trash2,
 *       onClick: handleDelete,
 *       variant: 'danger'
 *     },
 *     {
 *       id: 'export',
 *       label: 'Export',
 *       icon: Download,
 *       onClick: handleExport
 *     }
 *   ]}
 *   onClearSelection={clearSelection}
 * />
 * ```
 */
export function BulkActions({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  position = "top",
  className = "",
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  const positionClasses = {
    top: "",
    bottom: "",
    sticky: "sticky top-0 z-10",
  };

  return (
    <Cluster
      justify="between"
      alignY="center"
      className={`gap-4 rounded-lg border border-info bg-info-soft px-4 py-3 ${positionClasses[position]} ${className}`}
      role="toolbar"
      aria-label="Bulk actions"
    >
      {/* Selection info */}
      <Inline gap={3}>
        <span className="text-sm font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          {totalCount !== undefined && ` of ${totalCount}`}
        </span>

        <button
          onClick={onClearSelection}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-info-soft"
          aria-label="Clear selection"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      </Inline>

      {/* Action buttons */}
      <Inline gap={2} wrap>
        {actions.map((action) => {
          const Icon = action.icon;
          const isDisabled = action.disabled;

          const variantClasses = {
            default:
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/60",
            danger:
              "bg-danger text-danger-foreground hover:bg-danger/90 disabled:bg-danger/60",
          };

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={isDisabled}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                variantClasses[action.variant || "default"]
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {action.label}
            </button>
          );
        })}
      </Inline>
    </Cluster>
  );
}
