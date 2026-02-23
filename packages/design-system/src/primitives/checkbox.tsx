// packages/ui/components/atoms/primitives/checkbox.tsx
 
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "../utils/style";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit control radius token override. */
  radius?: PrimitiveRadius;
}

export const Checkbox = (
  {
    ref,
    className,
    shape,
    radius,
    ...props
  }: CheckboxProps & {
    ref?: React.Ref<React.ElementRef<typeof CheckboxPrimitive.Root>>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "sm",
  });

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-token="--color-primary"
      className={cn(
        "peer h-4 w-4 shrink-0 border border-input bg-input",
        shapeRadiusClass,
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckIcon className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
