import * as React from "react";
import { cn } from "../../utils/cn";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive";
  onRemove?: () => void;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = "default", onRemove, children, ...props }, ref) => {
    const variants: Record<NonNullable<ChipProps["variant"]>, string> = {
      default: "bg-muted text-fg",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-white",
      destructive: "bg-red-500 text-white",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full bg-transparent p-0.5 text-current hover:bg-black/10"
          >
            ×
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = "Chip";
