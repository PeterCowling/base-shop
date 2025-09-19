// packages/ui/components/atoms/shadcn/Button.tsx
"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import type { ButtonProps as BaseButtonProps } from "../primitives/button";
import { Button as BaseButton } from "../primitives/button";
import { Slot } from "../primitives/slot";

export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
  variant?: BaseButtonProps["variant"] | "destructive";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    if (variant === "destructive") {
      const base =
        "inline-flex h-12 items-center justify-center rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
      const styles =
        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      return (
        <Comp ref={ref} className={cn(base, styles, className)} {...props} />
      );
    }
    return (
      <BaseButton
        ref={ref}
        variant={variant as BaseButtonProps["variant"]}
        asChild={asChild}
        className={cn("h-12 px-4 py-3", className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
