import * as React from "react";
import { cn } from "../../utils/cn";

export interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 p-4", className)} {...props} />
  )
);
Content.displayName = "Content";
