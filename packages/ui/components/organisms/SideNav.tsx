import * as React from "react";
import { cn } from "../../utils/cn";

export type SideNavProps = React.HTMLAttributes<HTMLDivElement>;

export const SideNav = React.forwardRef<HTMLDivElement, SideNavProps>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn("w-48 border-r p-4", className)}
      {...props}
    />
  )
);
SideNav.displayName = "SideNav";
