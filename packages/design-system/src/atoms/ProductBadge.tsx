import * as React from "react";

import { cn } from "../utils/style";

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

type BadgeColor = NonNullable<ProductBadgeProps["color"]>;
type BadgeTone = NonNullable<ProductBadgeProps["tone"]>;
type BadgeSize = NonNullable<ProductBadgeProps["size"]>;

const SOLID_BG_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "bg-muted",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
};

const SOFT_BG_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "bg-muted",
  primary: "bg-primary-soft",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const SOLID_TEXT_FG_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "text-fg",
  primary: "text-primary-foreground",
  accent: "text-accent-foreground",
  success: "text-success-fg",
  info: "text-info-foreground",
  warning: "text-warning-foreground",
  danger: "text-danger-foreground",
};

const SOFT_TEXT_FG_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
  default: "text-fg",
  primary: "text-fg",
  accent: "text-fg",
  success: "text-fg",
  info: "text-fg",
  warning: "text-fg",
  danger: "text-fg",
};

const SOLID_BG_TOKEN_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  default: "--color-muted",
  primary: "--color-primary",
  accent: "--color-accent",
  success: "--color-success",
  info: "--color-info",
  warning: "--color-warning",
  danger: "--color-danger",
};

const SOFT_BG_TOKEN_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  default: "--color-muted",
  primary: "--color-primary-soft",
  accent: "--color-accent-soft",
  success: "--color-success-soft",
  info: "--color-info-soft",
  warning: "--color-warning-soft",
  danger: "--color-danger-soft",
};

const FG_TOKEN_BY_COLOR: Record<BadgeColor, string> = {
  // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS var token names
  default: "--color-fg",
  primary: "--color-primary-fg",
  accent: "--color-accent-fg",
  success: "--color-success-fg",
  info: "--color-info-fg",
  warning: "--color-warning-fg",
  danger: "--color-danger-fg",
};

// i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  md: "px-2 py-1 text-xs", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  lg: "px-3 py-1.5 text-sm", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
};

function resolveBadgeColor(
  variant: ProductBadgeProps["variant"],
  color: ProductBadgeProps["color"]
): BadgeColor {
  if (color) return color;
  if (variant === "sale") return "danger";
  if (variant === "new") return "success";
  return "default";
}

function resolveBadgeTone(args: {
  tone: ProductBadgeProps["tone"];
  color: ProductBadgeProps["color"];
  variant: ProductBadgeProps["variant"];
}): BadgeTone {
  if (args.tone) return args.tone;
  if (args.color) return "soft";
  if (args.variant) return "solid";
  return "soft";
}

export const ProductBadge = React.forwardRef<HTMLSpanElement, ProductBadgeProps>(
  ({ label, variant = "default", color, tone, size = "md", className, ...props }, ref) => {
    const resolvedColor = resolveBadgeColor(variant, color);
    const resolvedTone = resolveBadgeTone({ tone, color, variant });
    const bgToken =
      resolvedTone === "solid"
        ? SOLID_BG_TOKEN_BY_COLOR[resolvedColor]
        : SOFT_BG_TOKEN_BY_COLOR[resolvedColor];
    const bgClass =
      resolvedTone === "solid"
        ? SOLID_BG_BY_COLOR[resolvedColor]
        : SOFT_BG_BY_COLOR[resolvedColor];
    const textClass =
      resolvedTone === "solid"
        ? SOLID_TEXT_FG_BY_COLOR[resolvedColor]
        : SOFT_TEXT_FG_BY_COLOR[resolvedColor];

    return (
      <span
        ref={ref}
        data-token={bgToken}
        className={cn(
          "rounded font-semibold", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          SIZE_CLASSES[size],
          bgClass,
          className
        )}
        {...props}
      >
        <span className={textClass} data-token={FG_TOKEN_BY_COLOR[resolvedColor]}>
          {label}
        </span>
      </span>
    );
  }
);
ProductBadge.displayName = "ProductBadge";
