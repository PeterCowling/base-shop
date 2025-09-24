import * as React from "react";
import { cn } from "../../utils/style";

export interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip = ({ text, children, className }: TooltipProps) => (
  <span className={cn("group relative inline-block", className)}>
    {children}
    <span
      aria-hidden="true"
      className="bg-fg text-bg absolute top-full left-1/2 z-10 mt-2 hidden -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block"
    >
      {text}
    </span>
  </span>
);
