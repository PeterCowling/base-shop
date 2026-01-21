import * as React from "react";

import { cn } from "../../utils/style";

export type ContentProps = React.HTMLAttributes<HTMLDivElement>;

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 p-4", className)} {...props} />
  )
);
Content.displayName = "Content";

// Provide a default export for Storybook/interop patterns that expect it.
export default Content;
