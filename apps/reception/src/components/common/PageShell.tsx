import { memo } from "react";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Override the default centered heading with a custom header */
  headerSlot?: React.ReactNode;
}

/**
 * Shared page wrapper for reception screens.
 * Provides consistent background, padding, and heading layout.
 */
export const PageShell = memo(function PageShell({
  title,
  children,
  className,
  headerSlot,
}: PageShellProps) {
  return (
    <div
      className={`min-h-80vh p-4 font-sans text-foreground${className ? ` ${className}` : ""}`}
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
