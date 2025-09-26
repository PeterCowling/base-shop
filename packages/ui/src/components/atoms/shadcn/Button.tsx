// packages/ui/components/atoms/shadcn/Button.tsx
"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import type { ButtonProps as BaseButtonProps } from "../primitives/button";
import { Button as BaseButton } from "../primitives/button";
import { Slot } from "../primitives/slot";

export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
  variant?: BaseButtonProps["variant"] | "destructive";
  /** Optional size override */
  size?: "icon" | "sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Default to the primitive's base sizing (h-10 px-4 py-2) for text buttons.
    // Only override when rendering icon-only buttons for consistent square touch targets.
    const sizeClass =
      size === "icon"
        ? "h-10 w-12 min-w-12 p-0 shrink-0"
        : size === "sm"
        ? "h-8 px-3 py-1.5 text-xs"
        : "";
    if (variant === "destructive") {
      const base =
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
      const styles =
        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      // Avoid forwarding non-DOM props when rendering native elements
      const {
        // strip custom props not valid on DOM nodes
        iconOnly: _iconOnly,
        leadingIcon: _leadingIcon,
        trailingIcon: _trailingIcon,
        iconSize: _iconSize,
        tone: _tone,
        color: _color,
        // size handled via sizeClass above
        size: _size,
        ...domProps
      } = props as any;
      return (
        <Comp ref={ref} className={cn(base, sizeClass, styles, className)} {...domProps} />
      );
    }
    return (
      <BaseButton
        ref={ref}
        variant={variant as BaseButtonProps["variant"]}
        asChild={asChild}
        className={cn(sizeClass, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
