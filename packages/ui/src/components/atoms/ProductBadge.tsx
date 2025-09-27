import * as React from "react";
import { cn } from "../../utils/style";

export interface ProductBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  /** Back-compat legacy variants */
  variant?: "default" | "sale" | "new";
  /** Semantic color intent */
  color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";
  /** Visual tone */
  tone?: "solid" | "soft";
}

export const ProductBadge = React.forwardRef<HTMLSpanElement, ProductBadgeProps>(
  ({ label, variant = "default", color, tone, className, ...props }, ref) => {
    const resolvedColor: NonNullable<ProductBadgeProps["color"]> = color ??
      (variant === "sale" ? "danger" : variant === "new" ? "success" : "default");
    const resolvedTone: NonNullable<ProductBadgeProps["tone"]> =
      tone ?? (color ? "soft" : variant ? "solid" : "soft");

    const solidBg: Record<string, string> = {
      // i18n-exempt — CSS utility class names
      default: "bg-muted",
      primary: "bg-primary",
      accent: "bg-accent",
      success: "bg-success",
      info: "bg-info",
      warning: "bg-warning",
      danger: "bg-danger",
    };
    const softBg: Record<string, string> = {
      // i18n-exempt — CSS utility class names
      default: "bg-muted",
      primary: "bg-primary-soft",
      accent: "bg-accent-soft",
      success: "bg-success-soft",
      info: "bg-info-soft",
      warning: "bg-warning-soft",
      danger: "bg-danger-soft",
    };
    const textFg: Record<string, string> = {
      default: "text-fg",
      primary: resolvedTone === "solid" ? "text-primary-foreground" : "text-fg",
      accent: resolvedTone === "solid" ? "text-accent-foreground" : "text-fg",
      // Back-compat: legacy expectation is `text-success-fg` for solid tone
      success: resolvedTone === "solid" ? "text-success-fg" : "text-fg",
      info: resolvedTone === "solid" ? "text-info-foreground" : "text-fg",
      warning: resolvedTone === "solid" ? "text-warning-foreground" : "text-fg",
      danger: resolvedTone === "solid" ? "text-danger-foreground" : "text-fg",
    };
    const bgToken: Record<string, string> = {
      // i18n-exempt — CSS var token names
      default: "--color-muted",
      primary: resolvedTone === "solid" ? "--color-primary" : "--color-primary-soft",
      accent: resolvedTone === "solid" ? "--color-accent" : "--color-accent-soft",
      success: resolvedTone === "solid" ? "--color-success" : "--color-success-soft",
      info: resolvedTone === "solid" ? "--color-info" : "--color-info-soft",
      warning: resolvedTone === "solid" ? "--color-warning" : "--color-warning-soft",
      danger: resolvedTone === "solid" ? "--color-danger" : "--color-danger-soft",
    };
    const fgToken: Record<string, string> = {
      // i18n-exempt — CSS var token names
      default: "--color-fg",
      primary: "--color-primary-fg",
      accent: "--color-accent-fg",
      success: "--color-success-fg",
      info: "--color-info-fg",
      warning: "--color-warning-fg",
      danger: "--color-danger-fg",
    };

    return (
      <span
        ref={ref}
        data-token={bgToken[resolvedColor]}
        className={cn(
          "rounded px-2 py-1 text-xs font-semibold", // i18n-exempt — CSS utility class names
          (resolvedTone === "solid" ? solidBg : softBg)[resolvedColor],
          className
        )}
        {...props}
      >
        <span className={textFg[resolvedColor]} data-token={fgToken[resolvedColor]}>
          {label}
        </span>
      </span>
    );
  }
);
ProductBadge.displayName = "ProductBadge";
