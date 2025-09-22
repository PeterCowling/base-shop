// packages/ui/components/atoms/shadcn/Button.tsx
"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import type { ButtonProps as BaseButtonProps } from "../primitives/button";
import { Button as BaseButton } from "../primitives/button";
import { Slot } from "../primitives/slot";

export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
  variant?: BaseButtonProps["variant"] | "destructive";
  /** Optional size override for icon-only buttons */
  size?: "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const sizeClass = size === "icon" ? "h-8 w-8 p-0 shrink-0" : "h-12 px-4 py-3";
    if (variant === "destructive") {
      const base =
        "inline-flex h-12 items-center justify-center rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
      const styles =
        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      return (
        <Comp ref={ref} className={cn(base, sizeClass, styles, className)} {...props} />
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
