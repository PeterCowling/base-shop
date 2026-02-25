import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface PaginationDotProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Tailwind size token used for width/height classes */
  size?: string;
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const PaginationDot = (
  {
    ref,
    active = false,
    size = "2",
    shape,
    radius,
    className,
    ...props
  }: PaginationDotProps & {
    ref?: React.Ref<HTMLButtonElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "full",
  });

  return (
    <button
      ref={ref}
      className={cn(
        `h-${size} w-${size}`,
        shapeRadiusClass,
        active ? "bg-primary text-primary-foreground" : "bg-muted",
        className
      )}
      {...props}
    />
  );
};
