import * as React from "react";
import { cn } from "../../utils/style";

export interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip = ({ text, children, className }: TooltipProps) => (
  <span
    className={cn(
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
      "group inline-block",
      className,
    )}
  >
    {children}
    <span className="relative">
      <span
        aria-hidden="true"
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className="bg-fg text-bg absolute top-full hidden rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block translate-y-2"
      >
        {text}
      </span>
    </span>
  </span>
);
