// packages/ui/components/atoms/shadcn/Button.tsx
"use client";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — component has no embedded user-facing strings

import * as React from "react";
import { cn } from "../../../utils/style";
import type { ButtonProps as BaseButtonProps } from "../primitives/button";
import { Button as BaseButton } from "../primitives/button";
import { Slot } from "../primitives/slot";

export interface ButtonProps
  extends Omit<BaseButtonProps, "variant" | "size"> {
  variant?: BaseButtonProps["variant"] | "destructive";
  /** Optional size override */
  size?: BaseButtonProps["size"] | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Default to the primitive's base sizing (h-10 px-4 py-2) for text buttons.
    // Only override when rendering icon-only buttons for consistent square touch targets.
    const sizeClass =
      size === "icon"
        ? "h-10 w-12 min-w-12 p-0 shrink-0" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        : size === "sm"
        ? "h-8 px-3 py-1.5 text-xs" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        : "";
    if (variant === "destructive") {
      const base =
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      const styles =
        "bg-destructive text-destructive-foreground hover:bg-destructive/90"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      // Avoid forwarding non-DOM props when rendering native elements
      const {
        iconOnly: _iconOnly,
        leadingIcon: _leadingIcon,
        trailingIcon: _trailingIcon,
        iconSize: _iconSize,
        tone: _tone,
        color: _color,
        size: _size,
        ...restProps
      } = props as Omit<ButtonProps, "variant">;
      return (
        <Comp
          ref={ref}
          className={cn(base, sizeClass, styles, className)}
          {...(restProps as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        />
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
Button.displayName = "Button"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
