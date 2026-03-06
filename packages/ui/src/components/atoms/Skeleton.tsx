import * as React from "react";

import { cn } from "../../utils/style";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ref, ...props }: SkeletonProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      data-slot="skeleton"
      ref={ref}
      className={cn(
        "bg-muted animate-pulse motion-reduce:animate-none rounded-md",
        className,
      )}
      {...props}
    />
  );
}
