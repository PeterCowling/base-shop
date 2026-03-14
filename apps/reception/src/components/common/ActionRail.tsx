import { memo } from "react";

import { Cluster } from "@acme/design-system/primitives";

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
    <Cluster
      justify="end"
      gap={2}
      className={`mb-4${className ? ` ${className}` : ""}`}
    >
      {children}
    </Cluster>
  );
});
