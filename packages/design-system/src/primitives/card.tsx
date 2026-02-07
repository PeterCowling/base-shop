// packages/ui/components/atoms/primitives/card.tsx
 
"use client";
import * as React from "react";

import { cn } from "../utils/style";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevate surface to surface-3 and stronger shadow */
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, ...props }, ref) => (
    <div
      ref={ref}
      data-token="--color-bg"
      className={cn(
        // Default to card surface; allow elevated variant to opt into stronger surface
        elevated ? "bg-surface-3 shadow-elevation-2" : "bg-card shadow",
        "text-card-foreground rounded-xl border border-border-2",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 border-b border-border-2", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-3 border-t border-border-2", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
