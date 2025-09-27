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
  ({ className, color, variant, tone, children, ...props }, ref) => {
    const resolvedColor: NonNullable<TagProps["color"]> = color ??
      (variant === "destructive" ? "destructive" :
       variant === "warning" ? "warning" :
       variant === "success" ? "success" :
       "default");
    // Back-compat default: if using legacy `variant` without an explicit `color`,
    // default to solid tone; otherwise default to soft for new API usage.
    const resolvedTone: NonNullable<TagProps["tone"]> =
      tone ?? (color ? "soft" : variant ? "solid" : "soft");
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
      primary: resolvedTone === "solid" ? "text-primary-foreground" : "text-fg",
      accent: resolvedTone === "solid" ? "text-accent-foreground" : "text-fg",
      // Prefer `*-fg` aliases for statuses, except `destructive` which maps to `danger-foreground` for test/back-compat
      success: resolvedTone === "solid" ? "text-success-fg" : "text-fg",
      info: resolvedTone === "solid" ? "text-info-fg" : "text-fg",
      warning: resolvedTone === "solid" ? "text-warning-fg" : "text-fg",
      danger: resolvedTone === "solid" ? "text-danger-foreground" : "text-fg",
      destructive: resolvedTone === "solid" ? "text-danger-foreground" : "text-fg",
    };
    const bgToken: Record<string, string> = {
      default: "--color-muted",
      primary: resolvedTone === "solid" ? "--color-primary" : "--color-primary-soft",
      accent: resolvedTone === "solid" ? "--color-accent" : "--color-accent-soft",
      success: resolvedTone === "solid" ? "--color-success" : "--color-success-soft",
      info: resolvedTone === "solid" ? "--color-info" : "--color-info-soft",
      warning: resolvedTone === "solid" ? "--color-warning" : "--color-warning-soft",
      danger: resolvedTone === "solid" ? "--color-danger" : "--color-danger-soft",
      destructive: resolvedTone === "solid" ? "--color-danger" : "--color-danger-soft",
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
        // i18n-exempt — design token attribute, not user copy
        data-token={bgToken[resolvedColor]}
        // i18n-exempt — design token attribute, not user copy
        data-token-fg={fgToken[resolvedColor]}
        className={cn(
          // i18n-exempt — CSS utility class names
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
          (resolvedTone === "solid" ? solidBg : softBg)[resolvedColor],
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
