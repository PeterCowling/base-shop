"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** High-level semantic color */
  color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger" | "destructive";
  /** Fill intensity */
  tone?: "solid" | "soft";
  /** Back-compat alias for color: 'destructive' maps to 'danger' */
  variant?: "default" | "success" | "warning" | "destructive";
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, color, variant, tone = "soft", children, ...props }, ref) => {
    const resolvedColor: NonNullable<TagProps["color"]> = color ??
      (variant === "destructive" ? "destructive" :
       variant === "warning" ? "warning" :
       variant === "success" ? "success" :
       "default");
    const solidBg: Record<string, string> = {
      default: "bg-muted",
      primary: "bg-primary",
      accent: "bg-accent",
      success: "bg-success",
      info: "bg-info",
      warning: "bg-warning",
      danger: "bg-danger",
      destructive: "bg-danger",
    };
    const softBg: Record<string, string> = {
      default: "bg-muted",
      primary: "bg-primary-soft",
      accent: "bg-accent-soft",
      success: "bg-success-soft",
      info: "bg-info-soft",
      warning: "bg-warning-soft",
      danger: "bg-danger-soft",
      destructive: "bg-danger-soft",
    };
    const textFg: Record<string, string> = {
      default: "text-fg",
      primary: tone === "solid" ? "text-primary-foreground" : "text-fg",
      accent: tone === "solid" ? "text-accent-foreground" : "text-fg",
      success: "text-success-foreground",
      info: "text-info-foreground",
      warning: "text-warning-foreground",
      danger: "text-danger-foreground",
      destructive: "text-danger-foreground",
    };
    const bgToken: Record<string, string> = {
      default: "--color-muted",
      primary: tone === "solid" ? "--color-primary" : "--color-primary-soft",
      accent: tone === "solid" ? "--color-accent" : "--color-accent-soft",
      success: tone === "solid" ? "--color-success" : "--color-success-soft",
      info: tone === "solid" ? "--color-info" : "--color-info-soft",
      warning: tone === "solid" ? "--color-warning" : "--color-warning-soft",
      danger: tone === "solid" ? "--color-danger" : "--color-danger-soft",
      destructive: tone === "solid" ? "--color-danger" : "--color-danger-soft",
    };
    const fgToken: Record<string, string> = {
      default: "--color-fg",
      primary: "--color-primary-fg",
      accent: "--color-accent-fg",
      success: "--color-success-fg",
      info: "--color-info-fg",
      warning: "--color-warning-fg",
      danger: "--color-danger-fg",
      destructive: "--color-danger-fg",
    };

    return (
      <span
        ref={ref}
        data-token={bgToken[resolvedColor]}
        data-token-fg={fgToken[resolvedColor]}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
          (tone === "solid" ? solidBg : softBg)[resolvedColor],
          textFg[resolvedColor],
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
