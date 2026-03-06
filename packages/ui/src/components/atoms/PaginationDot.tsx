import * as React from "react";

import { cn } from "../../utils/style";

export interface PaginationDotProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** Tailwind size token used for width/height classes */
  size?: string;
}

export function PaginationDot({ active = false, size = "2", className, ref, ...props }: PaginationDotProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      data-slot="pagination-dot"
      ref={ref}
      className={cn(
        `h-${size} w-${size} rounded-full`,
        active ? "bg-primary" : "bg-muted",
        className
      )}
      {...props}
    />
  );
}
