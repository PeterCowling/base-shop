import * as React from "react";
import { cn } from "../../utils/cn";

export type LoaderProps = React.HTMLAttributes<HTMLDivElement>;

export const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      {...props}
    />
  )
);
Loader.displayName = "Loader";
