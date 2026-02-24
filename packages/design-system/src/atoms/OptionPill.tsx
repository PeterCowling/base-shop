"use client";

import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface OptionPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const OptionPill = (
  {
    ref,
    selected = false,
    className,
    shape,
    radius,
    type = "button",
    ...props
  }: OptionPillProps & {
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
      type={type}
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — utility class names only
        "inline-flex min-h-11 items-center justify-center border px-4 text-sm font-semibold transition-colors transition-shadow motion-reduce:transition-none",
        shapeRadiusClass,
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            "border-border-3 bg-primary-soft text-foreground"
          : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            "border-border-1 bg-surface-2 text-foreground hover:border-primary/60",
        className,
      )}
      aria-pressed={selected}
      {...props}
    />
  );
};
