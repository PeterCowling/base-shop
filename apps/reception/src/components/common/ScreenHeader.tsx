import { memo } from "react";

import { Inline } from "@acme/design-system/primitives";

export interface ScreenHeaderProps {
  title: string;
  /** Optional right-side slot — e.g., role-gated action buttons via ActionRail, status badge */
  children?: React.ReactNode;
  className?: string;
}

/**
 * ScreenHeader — canonical screen title row for OperationalTableScreen routes.
 *
 * Renders: accent bar (h-7 bg-primary-main) left-aligned with the title,
 * and an optional right-side slot for ActionRail or other controls.
 *
 * Design canon (from design-spec.md):
 * - Accent bar: h-7 w-1 rounded-full bg-primary-main
 * - Title: text-2xl font-heading font-semibold text-foreground (no opacity modifier)
 * - Layout: flex items-center justify-between mb-6
 */
export const ScreenHeader = memo(function ScreenHeader({
  title,
  children,
  className,
}: ScreenHeaderProps) {
  return (
    <div
      className={`mb-6 flex items-center justify-between${className ? ` ${className}` : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-7 w-1 rounded-full bg-primary-main" aria-hidden="true" />
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          {title}
        </h1>
      </div>
      {children && (
        <Inline>{children}</Inline>
      )}
    </div>
  );
});
