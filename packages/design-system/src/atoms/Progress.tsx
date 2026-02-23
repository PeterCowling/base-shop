"use client";

import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: React.ReactNode;
  labelClassName?: string;
  /** Semantic track shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit track radius token override. */
  radius?: PrimitiveRadius;
}

export const Progress = (
  {
    ref,
    value,
    label,
    className,
    labelClassName,
    shape,
    radius,
    style,
    ...props
  }: ProgressProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const clampedValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  const scale = clampedValue / 100;
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      style={style}
      {...props}
    >
      <div
        className={
          cn(
            "bg-muted h-2 w-full overflow-hidden", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
            shapeRadiusClass,
          )
        }
        data-token="--color-muted" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
      >
        <div
          className={cn(
            "bg-primary h-full origin-left scale-x-0 transition-transform motion-reduce:transition-none", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
          )}
          data-token="--color-primary" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
          style={{ transform: `scaleX(${scale})` }}
        />
      </div>
      {label ? (
        <div
          className={cn(
            "text-muted-foreground text-end text-sm", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
            labelClassName
          )}
          data-token="--color-muted-fg" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
