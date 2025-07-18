import * as React from "react";
import { cn } from "../../utils/cn";

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
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          dimension,
          className
        )}
        {...props}
      />
    );
  }
);
Loader.displayName = "Loader";
