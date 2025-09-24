// packages/ui/components/atoms/primitives/card.tsx
"use client";
import * as React from "react";
import { cn } from "../../../utils/style";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevate surface to surface-3 and stronger shadow */
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, ...props }, ref) => (
    <div
      ref={ref}
      data-token="--color-panel"
      className={cn(
        // Default to panel surface; allow elevated variant to opt into surface-3
        elevated ? "bg-surface-3 shadow-elevation-2" : "bg-panel shadow",
        "text-card-foreground rounded-xl border border-border-2",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";
