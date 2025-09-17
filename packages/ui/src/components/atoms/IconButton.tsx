"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export type IconButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<IconButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary/90",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const tokenByVariant: Record<IconButtonVariant, string> = {
  primary: "--color-primary",
  secondary: "--color-accent",
  ghost: "--color-accent",
  danger: "--color-danger",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-lg",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    className,
    variant = "ghost",
    size = "sm",
    type = "button",
    ...props
  }, ref) => (
    <button
      ref={ref}
      type={type}
      data-token={tokenByVariant[variant]}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  ),
);

IconButton.displayName = "IconButton";

export default IconButton;
