import { memo } from "react";

export interface TableCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * TableCard — surface container for data table content.
 *
 * Provides the canonical card styling (rounded-xl, bg-surface-2, border,
 * shadow, ring) sourced from CheckinsTableView:90.
 *
 * Modals rendered as siblings outside TableCard — not inside — to preserve
 * portal/z-index independence (see design-spec.md § Prop Contracts).
 *
 * Design canon (from CheckinsTableView:90 via design-spec.md):
 * - rounded-xl bg-surface-2 border border-border-strong shadow-xl
 * - ring-1 ring-border-1/30 p-5
 * - overflow-x-auto included by default (inner table content scrolls horizontally)
 */
export const TableCard = memo(function TableCard({
  children,
  className,
}: TableCardProps) {
  return (
    <div
      className={`overflow-x-auto rounded-xl bg-surface-2 border border-border-strong shadow-xl ring-1 ring-border-1/30 p-5${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
});
