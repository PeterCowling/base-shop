import * as React from "react";

import { cn } from "../utils/style";

export interface PaginationDotProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Tailwind size token used for width/height classes */
  size?: string;
}

export const PaginationDot = React.forwardRef<
  HTMLButtonElement,
  PaginationDotProps
>(({ active = false, size = "2", className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      `h-${size} w-${size} rounded-full`,
      active ? "bg-primary" : "bg-muted",
      className
    )}
    {...props}
  />
));
PaginationDot.displayName = "PaginationDot";
