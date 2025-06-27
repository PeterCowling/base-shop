import * as React from "react";
import { cn } from "../utils/cn";

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn("flex h-14 items-center border-t px-4", className)}
      {...props}
    />
  )
);
Footer.displayName = "Footer";
