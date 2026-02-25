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
      className={`min-h-80vh p-4 bg-surface-2 font-sans text-foreground${className ? ` ${className}` : ""}`}
    >
      {headerSlot ?? (
        <h1 className="w-full mb-6 text-2xl text-center font-heading text-primary-main">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
});
