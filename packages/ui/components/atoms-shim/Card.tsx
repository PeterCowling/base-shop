import * as React from "react";
import type { CardProps as BaseCardProps } from "../ui/card";
import { Card as BaseCard, CardContent as BaseCardContent } from "../ui/card";

export type CardProps = BaseCardProps;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <BaseCard ref={ref} className={className} {...props} />
  )
);
Card.displayName = "Card";

export type CardContentProps = BaseCardProps;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <BaseCardContent ref={ref} className={className} {...props} />
  )
);
CardContent.displayName = "CardContent";
