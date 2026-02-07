import * as React from "react";

import { cn } from "../utils/style";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton = (
  {
    ref,
    className,
    ...props
  }: SkeletonProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  className={cn(
    "bg-muted animate-pulse motion-reduce:animate-none rounded-md",
    className,
  )}
  {...props}
/>);
