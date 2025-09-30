import * as React from "react";
import { cn } from "../../utils/style";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width/height of the loader in pixels. Defaults to 20. */
  size?: number;
}

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 20, ...props }, ref) => {
    const dimension = `h-[${size}px] w-[${size}px]`;
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          dimension,
          className
        )}
        {...props}
      />
    );
  }
);
Loader.displayName = "Loader"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — component displayName, not user-facing
