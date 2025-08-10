import * as React from "react";
import { cn } from "../../utils/style";

export interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind width class or CSS length */
  width?: string;
}

export const SideNav = React.forwardRef<HTMLDivElement, SideNavProps>(
  ({ className, width = "w-48", ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(width, "border-r p-4", className)}
      {...props}
    />
  )
);
SideNav.displayName = "SideNav";
