// packages/ui/components/atoms/primitives/card.tsx
"use client";
import * as React from "react";
import { cn } from "../../../utils/style";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-token="--color-panel"
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border-2 shadow",
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
