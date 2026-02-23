"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../utils/style";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({
  ref,
  className,
  shape,
  radius,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  ref?: React.Ref<HTMLDivElement>;
  /** Semantic list shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit list radius token override. */
  radius?: PrimitiveRadius;
}) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center bg-muted p-1 text-muted-foreground",
        shapeRadiusClass,
        className,
      )}
      {...props}
    />
  );
};

export const TabsTrigger = ({
  ref,
  className,
  shape,
  radius,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.Ref<HTMLButtonElement>;
  /** Semantic trigger shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit trigger radius token override. */
  radius?: PrimitiveRadius;
}) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "sm",
  });

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        shapeRadiusClass,
        className,
      )}
      {...props}
    />
  );
};

export const TabsContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.Ref<HTMLDivElement>;
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
);
