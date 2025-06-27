import * as React from "react";
import { cn } from "../../utils/cn";

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
    default: "bg-gray-200 text-gray-800",
    sale: "bg-red-500 text-white",
    new: "bg-green-500 text-white",
  };
  return (
    <span
      ref={ref}
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
});
ProductBadge.displayName = "ProductBadge";
