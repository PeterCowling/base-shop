import * as React from "react";
import { cn } from "../../utils/cn";

export interface PaginationDotProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const PaginationDot = React.forwardRef<
  HTMLButtonElement,
  PaginationDotProps
>(({ active = false, className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "h-2 w-2 rounded-full",
      active ? "bg-primary" : "bg-muted",
      className
    )}
    {...props}
  />
));
PaginationDot.displayName = "PaginationDot";
