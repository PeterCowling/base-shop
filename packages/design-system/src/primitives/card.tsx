// packages/ui/components/atoms/primitives/card.tsx
 
import * as React from "react";

import { cn } from "../utils/style";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevate surface to surface-3 and stronger shadow */
  elevated?: boolean;
}

export const Card = (
  {
    ref,
    className,
    elevated = false,
    ...props
  }: CardProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div
  ref={ref}
  data-token="--color-bg"
  className={cn(
    // Default to card surface; allow elevated variant to opt into stronger surface
    elevated ? "bg-surface-3 shadow-elevation-2" : "bg-card shadow",
    "text-card-foreground rounded-xl border border-border-2",
    className
  )}
  {...props}
/>);

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
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => (<div ref={ref} className={cn("p-6", className)} {...props} />);

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
