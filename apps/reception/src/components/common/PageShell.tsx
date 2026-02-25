import { memo } from "react";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Override the default centered heading with a custom header */
  headerSlot?: React.ReactNode;
  /** Remove the default gradient backdrop and use a flat surface background instead */
  withoutGradient?: boolean;
}

/**
 * Shared page wrapper for reception screens.
 * Provides consistent background, padding, and heading layout.
 * By default a top-to-bottom gradient from surface-2 to surface-3 is applied.
 * Pass `withoutGradient` to use a flat bg-surface background instead.
 */
export const PageShell = memo(function PageShell({
  title,
  children,
  className,
  headerSlot,
  withoutGradient,
}: PageShellProps) {
  const bgClass = withoutGradient
    ? "bg-surface"
    : "bg-gradient-to-b from-surface-2 to-surface-3";

  return (
    <div
      className={`${bgClass} min-h-80vh p-4 font-sans text-foreground${className ? ` ${className}` : ""}`}
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
