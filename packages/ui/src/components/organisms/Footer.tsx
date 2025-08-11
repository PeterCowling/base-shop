import * as React from "react";
import { cn } from "../../utils/style";

export type FooterProps = React.HTMLAttributes<HTMLDivElement>;

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, ...props }, ref) => (
    <footer
      ref={ref}
      data-token="--color-bg"
      className={cn("flex h-14 items-center border-t px-4", className)}
      {...props}
    />
  )
);
Footer.displayName = "Footer";
