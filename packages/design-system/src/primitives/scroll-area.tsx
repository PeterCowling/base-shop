"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../utils/style";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export interface ScrollBarProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  /** Semantic thumb shape. Ignored when `thumbRadius` is provided. */
  thumbShape?: PrimitiveShape;
  /** Explicit thumb radius token override. */
  thumbRadius?: PrimitiveRadius;
}

export const ScrollArea = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  ref?: React.Ref<HTMLDivElement>;
}) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    {/* eslint-disable-next-line ds/no-arbitrary-tailwind, ds/no-raw-radius -- rounded-[inherit] is a valid CSS pattern for composable scroll areas to inherit border-radius from parent container [DS-01] */}
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
);

export const ScrollBar = ({
  ref,
  className,
  orientation = "vertical",
  thumbShape,
  thumbRadius,
  ...props
}: ScrollBarProps & {
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const thumbShapeRadiusClass = resolveShapeRadiusClass({
    shape: thumbShape,
    radius: thumbRadius,
    defaultRadius: "full",
  });

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn("relative flex-1 bg-border", thumbShapeRadiusClass)}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
};
