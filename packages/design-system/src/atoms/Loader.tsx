import * as React from "react";

import { cn } from "../utils/style";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width/height of the loader in pixels. Defaults to 20. */
  size?: number;
  /** Accessible label for screen readers. */
  label?: string;
}

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 20, label = "Loading", style, role, ...props }, ref) => {
    const dimension = Number.isFinite(size) ? Number(size) : 20;
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin motion-reduce:animate-none rounded-full border-2 border-current border-t-transparent",
          className
        )}
        role={role ?? "status"}
        aria-label={label}
        aria-live="polite"
         
        style={{
          width: dimension,
          height: dimension,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Loader.displayName = "Loader";
