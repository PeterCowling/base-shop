import { memo } from "react";

import { Inline } from "@acme/design-system/primitives";

export interface FilterToolbarProps {
  /**
   * Caller-injected controls: date selector, control chips, auxiliary buttons.
   * Renders as a wrapping horizontal flex row.
   *
   * Examples of valid children:
   * - common/DateSelector (role-aware, popup calendar)
   * - common/DateSelector (unrestricted, inline calendar)
   * - "Rooms Ready" toggle button
   * - Search inputs
   *
   * FilterToolbar has no opinion on the controls it renders.
   * Role-gating and access policy are the caller's responsibility.
   */
  children: React.ReactNode;
  className?: string;
}

/**
 * FilterToolbar — horizontal control row for screen-level filters and controls.
 *
 * Slot-based: date selection, auxiliary controls, and search inputs are
 * all caller-injected as children. Wraps on narrow viewports.
 *
 * Design canon (from design-spec.md):
 * - Layout: flex items-center gap-3 flex-wrap mb-4
 * - Renders gracefully with zero children (no layout collapse)
 */
export const FilterToolbar = memo(function FilterToolbar({
  children,
  className,
}: FilterToolbarProps) {
  if (!children) return null;

  return (
    <Inline
      gap={3}
      className={`mb-4${className ? ` ${className}` : ""}`}
    >
      {children}
    </Inline>
  );
});
