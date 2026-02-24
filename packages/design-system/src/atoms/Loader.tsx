import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width/height of the loader in pixels. Defaults to 20. */
  size?: number;
  /** Accessible label for screen readers. */
  label?: string;
  /** Semantic spinner shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit spinner radius token override. */
  radius?: PrimitiveRadius;
}

export const Loader = (
  {
    ref,
    className,
    size = 20,
    label = "Loading",
    shape,
    radius,
    style,
    role,
    ...props
  }: LoaderProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const dimension = Number.isFinite(size) ? Number(size) : 20;
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "full",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin motion-reduce:animate-none border-2 border-current border-t-transparent",
        shapeRadiusClass,
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
};
