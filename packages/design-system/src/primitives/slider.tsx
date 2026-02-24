"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../utils/style";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export const Slider = ({
  ref,
  className,
  trackShape,
  trackRadius,
  thumbShape,
  thumbRadius,
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  ref?: React.Ref<HTMLSpanElement>;
  /** Semantic track shape. Ignored when `trackRadius` is provided. */
  trackShape?: PrimitiveShape;
  /** Explicit track radius token override. */
  trackRadius?: PrimitiveRadius;
  /** Semantic thumb shape. Ignored when `thumbRadius` is provided. */
  thumbShape?: PrimitiveShape;
  /** Explicit thumb radius token override. */
  thumbRadius?: PrimitiveRadius;
}) => {
  const trackShapeRadiusClass = resolveShapeRadiusClass({
    shape: trackShape,
    radius: trackRadius,
    defaultRadius: "full",
  });
  const thumbShapeRadiusClass = resolveShapeRadiusClass({
    shape: thumbShape,
    radius: thumbRadius,
    defaultRadius: "full",
  });

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden bg-muted", trackShapeRadiusClass)}>
        <SliderPrimitive.Range className="absolute h-full bg-primary" data-ds-contrast-exempt aria-hidden="true" />
      </SliderPrimitive.Track>
      {(props.defaultValue ?? props.value ?? [0]).map((_: number, i: number) => (
        <SliderPrimitive.Thumb
          key={i}
           
          className={cn(
            "block h-5 w-5 border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
            thumbShapeRadiusClass,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
};
