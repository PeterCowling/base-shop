"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive";
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const bgClasses: Record<string, string> = {
      default: "bg-muted",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-danger",
    };
    const textClasses: Record<string, string> = {
      default: "text-fg",
      success: "text-success-fg",
      warning: "text-warning-fg",
      destructive: "text-danger-foreground",
    };
    const bgTokens: Record<string, string> = {
      default: "--color-muted",
      success: "--color-success",
      warning: "--color-warning",
      destructive: "--color-danger",
    };
    const textTokens: Record<string, string> = {
      default: "--color-fg",
      success: "--color-success-fg",
      warning: "--color-warning-fg",
      destructive: "--color-danger-fg",
    };
    return (
      <span
        ref={ref}
        data-token={bgTokens[variant]}
        data-token-fg={textTokens[variant]}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
          bgClasses[variant],
          textClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Tag.displayName = "Tag";
