import * as React from "react";
import { cn } from "../../utils/style";

export interface ProductBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: "default" | "sale" | "new";
}

export const ProductBadge = React.forwardRef<
  HTMLSpanElement,
  ProductBadgeProps
>(({ label, variant = "default", className, ...props }, ref) => {
  const bgClasses: Record<string, string> = {
    default: "bg-muted",
    sale: "bg-danger",
    new: "bg-success",
  };
  const textClasses: Record<string, string> = {
    default: "text-fg",
    sale: "text-danger-foreground",
    new: "text-success-fg",
  };
  const bgTokens: Record<string, string> = {
    default: "--color-muted",
    sale: "--color-danger",
    new: "--color-success",
  };
  const textTokens: Record<string, string> = {
    default: "--color-fg",
    sale: "--color-danger-fg",
    new: "--color-success-fg",
  };
  return (
    <span
      ref={ref}
      data-token={bgTokens[variant]}
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold",
        bgClasses[variant],
        className
      )}
      {...props}
    >
      <span className={textClasses[variant]} data-token={textTokens[variant]}>
        {label}
      </span>
    </span>
  );
});
ProductBadge.displayName = "ProductBadge";
