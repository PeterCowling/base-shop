"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "../utils/style";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export const RadioGroup = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  ref?: React.Ref<HTMLDivElement>;
}) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-2", className)}
    {...props}
  />
);

export const RadioGroupItem = ({
  ref,
  className,
  shape,
  radius,
  indicatorShape,
  indicatorRadius,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  ref?: React.Ref<HTMLButtonElement>;
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit control radius token override. */
  radius?: PrimitiveRadius;
  /** Semantic indicator shape. Ignored when `indicatorRadius` is provided. */
  indicatorShape?: PrimitiveShape;
  /** Explicit indicator radius token override. */
  indicatorRadius?: PrimitiveRadius;
}) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "full",
  });
  const indicatorShapeRadiusClass = resolveShapeRadiusClass({
    shape: indicatorShape,
    radius: indicatorRadius,
    defaultRadius: "full",
  });

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        shapeRadiusClass,
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className={cn("h-2.5 w-2.5 bg-current", indicatorShapeRadiusClass)} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
};
