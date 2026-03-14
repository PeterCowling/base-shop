// packages/ui/components/atoms/primitives/card.tsx
 
import * as React from "react";

import { cn } from "../utils/style";

import { type PrimitiveRadius, type PrimitiveShape, resolveShapeRadiusClass } from "./shape-radius";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevate surface to surface-3 and stronger shadow */
  elevated?: boolean;
  /** Semantic container shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const Card = (
  {
    ref,
    className,
    elevated = false,
    shape,
    radius,
    style,
    ...props
  }: CardProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "xl",
  });

  return (<div
  ref={ref}
  data-token="--color-bg"
  className={cn(
    // Default to card surface; allow elevated variant to opt into stronger surface
    elevated ? "bg-surface-3 shadow-elevation-2" : "bg-card",
    "text-card-foreground border border-border-2",
    shapeRadiusClass,
    className
  )}
  style={{
    // Profile-driven elevation overrides Tailwind shadow when the var is defined.
    // Fallback reproduces Tailwind's default `shadow` utility so apps without
    // profiles see no visual change.
    ...(!elevated && {
      boxShadow: "var(--profile-card-elevation, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1))",
    }),
    ...style,
  }}
  {...props}
/>);
};

export const CardHeader = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  className={cn("p-4 border-b border-border-2", className)}
  {...props}
/>);

export const CardContent = (
  {
    ref,
    className,
    style,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  className={cn("p-6", className)}
  style={{
    padding: "var(--profile-space-card-padding, 1.5rem)",
    ...style,
  }}
  {...props}
/>);

export const CardFooter = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  className={cn("p-3 border-t border-border-2", className)}
  {...props}
/>);
