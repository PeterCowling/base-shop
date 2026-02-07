import * as React from "react";

import { cn } from "../utils/style";

type ProductBadgeColor =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "danger";
type ProductBadgeTone = "solid" | "soft";

const SOLID_BG: Record<ProductBadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "bg-muted",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
};

const SOFT_BG: Record<ProductBadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "bg-muted",
  primary: "bg-primary-soft",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const FG_TOKEN: Record<ProductBadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  default: "--color-fg",
  primary: "--color-primary-fg",
  accent: "--color-accent-fg",
  success: "--color-success-fg",
  info: "--color-info-fg",
  warning: "--color-warning-fg",
  danger: "--color-danger-fg",
};

function resolveColor(
  variant: ProductBadgeProps["variant"],
  color?: ProductBadgeColor
): ProductBadgeColor {
  if (color) return color;
  if (variant === "sale") return "danger";
  if (variant === "new") return "success";
  return "default";
}

function resolveTone(
  tone: ProductBadgeProps["tone"],
  color?: ProductBadgeColor
): ProductBadgeTone {
  if (tone) return tone;
  return color ? "soft" : "solid";
}

function textClass(color: ProductBadgeColor, tone: ProductBadgeTone): string {
  if (tone !== "solid") return "text-fg";
  switch (color) {
    case "primary":
      return "text-primary-foreground";
    case "accent":
      return "text-accent-foreground";
    case "success":
      return "text-success-fg";
    case "info":
      return "text-info-foreground";
    case "warning":
      return "text-warning-foreground";
    case "danger":
      return "text-danger-foreground";
    default:
      return "text-fg";
  }
}

function bgToken(color: ProductBadgeColor, tone: ProductBadgeTone): string {
  switch (color) {
    case "primary":
      return tone === "solid" ? "--color-primary" : "--color-primary-soft";
    case "accent":
      return tone === "solid" ? "--color-accent" : "--color-accent-soft";
    case "success":
      return tone === "solid" ? "--color-success" : "--color-success-soft";
    case "info":
      return tone === "solid" ? "--color-info" : "--color-info-soft";
    case "warning":
      return tone === "solid" ? "--color-warning" : "--color-warning-soft";
    case "danger":
      return tone === "solid" ? "--color-danger" : "--color-danger-soft";
    default:
      return "--color-muted";
  }
}

// i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
const SIZE_CLASSES: Record<NonNullable<ProductBadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px]", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  md: "px-2 py-1 text-xs", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  lg: "px-3 py-1.5 text-sm", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
};

export interface ProductBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  /** Back-compat legacy variants */
  variant?: "default" | "sale" | "new";
  /** Semantic color intent */
  color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";
  /** Visual tone */
  tone?: "solid" | "soft";
  /** Size scale */
  size?: "sm" | "md" | "lg";
}

export const ProductBadge = React.forwardRef<HTMLSpanElement, ProductBadgeProps>(
  ({ label, variant = "default", color, tone, size = "md", className, ...props }, ref) => {
    const resolvedColor = resolveColor(variant, color);
    const resolvedTone = resolveTone(tone, color);

    return (
      <span
        ref={ref}
        data-token={bgToken(resolvedColor, resolvedTone)}
        className={cn(
          "rounded font-semibold", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          SIZE_CLASSES[size],
          (resolvedTone === "solid" ? SOLID_BG : SOFT_BG)[resolvedColor],
          className
        )}
        {...props}
      >
        <span className={textClass(resolvedColor, resolvedTone)} data-token={FG_TOKEN[resolvedColor]}>
          {label}
        </span>
      </span>
    );
  }
);
ProductBadge.displayName = "ProductBadge";
