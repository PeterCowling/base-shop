import * as React from "react";
import { cn } from "../../utils/cn";

export type HeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    />
  )
);
Header.displayName = "Header";
