import * as React from "react";
import { cn } from "../../utils/style";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive";
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
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
      />
    );
  }
);
Tag.displayName = "Tag";
