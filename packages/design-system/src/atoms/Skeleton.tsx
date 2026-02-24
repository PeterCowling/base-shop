import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Semantic surface shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const Skeleton = (
  {
    ref,
    className,
    shape,
    radius,
    ...props
  }: SkeletonProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "bg-muted animate-pulse motion-reduce:animate-none",
        shapeRadiusClass,
        className,
      )}
      {...props}
    />
  );
};
