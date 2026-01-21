import * as React from "react";

import { cn } from "../utils/style";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-muted animate-pulse rounded-md",
        className,
      )}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";
