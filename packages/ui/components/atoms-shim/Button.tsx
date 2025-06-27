// packages/ui/components/atoms-shim/Buttons.tsx

import * as React from "react";
import { cn } from "../../utils/cn";
import type { ButtonProps as BaseButtonProps } from "../ui/button";
import { Button as BaseButton } from "../ui/button";

export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
  variant?: BaseButtonProps["variant"] | "destructive";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, ...props }, ref) => {
    if (variant === "destructive") {
      const base =
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2";
      const styles =
        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      return (
        <button ref={ref} className={cn(base, styles, className)} {...props} />
      );
    }
    return (
      <BaseButton
        ref={ref}
        variant={variant as BaseButtonProps["variant"]}
        className={className}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
