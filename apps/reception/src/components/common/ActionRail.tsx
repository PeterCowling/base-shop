import { memo } from "react";

export interface ActionRailProps {
  /** Role-gated action buttons — caller is responsible for conditional rendering */
  children: React.ReactNode;
  className?: string;
}

/**
 * ActionRail — horizontal button group for screen-level actions.
 *
 * Slot-based: caller injects role-gated buttons (e.g., NewBookingButton,
 * EditButton, DeleteButton). ActionRail has no internal role checks.
 *
 * Design canon (from design-spec.md):
 * - Layout: flex items-center justify-end gap-2 mb-4
 * - Caller responsibility: conditional rendering based on user permissions
 */
export const ActionRail = memo(function ActionRail({
  children,
  className,
}: ActionRailProps) {
  return (
    <div
      className={`mb-4 flex items-center justify-end gap-2${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
});
