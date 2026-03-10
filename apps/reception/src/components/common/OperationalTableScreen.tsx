import { memo } from "react";

export interface OperationalTableScreenProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Override the default ScreenHeader with a custom header node */
  headerSlot?: React.ReactNode;
}

/**
 * OperationalTableScreen — canonical screen wrapper for table-workflow routes.
 *
 * Owns the single gradient layer for OperationalTableScreen routes.
 * AuthenticatedApp provides the max-width chrome only; this component provides
 * the per-screen gradient, padding, and heading structure.
 *
 * Architecture:
 * - bg-gradient-to-b from-surface-2 to-surface-3: single source of gradient
 * - p-4: per-screen padding (AuthenticatedApp has no outer padding)
 * - Default ScreenHeader: accent bar (h-7 bg-primary-main) + h1 (text-foreground)
 * - headerSlot: optional override for screens with custom header layouts
 *
 * Use for: /checkin, /checkout, and all table-workflow routes in Wave 1+.
 * Not for: /bar (POSFullBleedScreen carve-out), inbox/reports (Wave 2 OperationalWorkspaceScreen).
 */
export const OperationalTableScreen = memo(function OperationalTableScreen({
  title,
  children,
  className,
  headerSlot,
}: OperationalTableScreenProps) {
  return (
    <div
      className={`bg-gradient-to-b from-surface-2 to-surface-3 min-h-80vh p-4 font-sans text-foreground${className ? ` ${className}` : ""}`}
    >
      {headerSlot ?? (
        <div className="mb-6 flex items-center gap-3">
          <div className="h-7 w-1 rounded-full bg-primary-main" aria-hidden="true" />
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            {title}
          </h1>
        </div>
      )}
      {children}
    </div>
  );
});
