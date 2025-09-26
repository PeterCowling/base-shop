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
      className="bg-fg text-bg absolute top-full z-10 hidden rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block translate-y-2"
    >
      {text}
    </span>
  </span>
);
