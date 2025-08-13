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
  const variants: Record<string, string> = {
    default: "bg-muted text-fg",
    sale: "bg-danger text-danger-foreground",
    new: "bg-success text-success-fg",
  };
  const tokenMap: Record<string, string> = {
    default: "--color-muted",
    sale: "--color-danger",
    new: "--color-success",
  };
  return (
    <span
      ref={ref}
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
      data-token={tokenMap[variant]}
      {...props}
    >
      {label}
    </span>
  );
});
ProductBadge.displayName = "ProductBadge";
