"use client";

import * as React from "react";

import { cn } from "../utils/style";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** High-level semantic color */
  color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger" | "destructive";
  /** Fill intensity */
  tone?: "solid" | "soft";
  /** Size scale */
  size?: "sm" | "md" | "lg";
  /** Back-compat alias for color: 'destructive' maps to 'danger' */
  variant?: "default" | "success" | "warning" | "destructive";
}

type TagColor = NonNullable<TagProps["color"]>;
type TagTone = NonNullable<TagProps["tone"]>;
type TagSize = NonNullable<TagProps["size"]>;

const SOLID_BG_BY_COLOR: Record<TagColor, string> = {
  default: "bg-muted",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  destructive: "bg-danger",
};

const SOFT_BG_BY_COLOR: Record<TagColor, string> = {
  default: "bg-muted",
  primary: "bg-primary-soft",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  destructive: "bg-danger-soft",
};

const SOLID_TEXT_FG_BY_COLOR: Record<TagColor, string> = {
  default: "text-fg",
  primary: "text-primary-foreground",
  accent: "text-accent-foreground",
  success: "text-success-fg",
  info: "text-info-fg",
  warning: "text-warning-fg",
  danger: "text-danger-foreground",
  destructive: "text-danger-foreground",
};

const SOFT_TEXT_FG_BY_COLOR: Record<TagColor, string> = {
  default: "text-fg",
  primary: "text-fg",
  accent: "text-fg",
  success: "text-fg",
  info: "text-fg",
  warning: "text-fg",
  danger: "text-fg",
  destructive: "text-fg",
};

const SOLID_BG_TOKEN_BY_COLOR: Record<TagColor, string> = {
  default: "--color-muted",
  primary: "--color-primary",
  accent: "--color-accent",
  success: "--color-success",
  info: "--color-info",
  warning: "--color-warning",
  danger: "--color-danger",
  destructive: "--color-danger",
};

const SOFT_BG_TOKEN_BY_COLOR: Record<TagColor, string> = {
  default: "--color-muted",
  primary: "--color-primary-soft",
  accent: "--color-accent-soft",
  success: "--color-success-soft",
  info: "--color-info-soft",
  warning: "--color-warning-soft",
  danger: "--color-danger-soft",
  destructive: "--color-danger-soft",
};

const FG_TOKEN_BY_COLOR: Record<TagColor, string> = {
  default: "--color-fg",
  primary: "--color-primary-fg",
  accent: "--color-accent-fg",
  success: "--color-success-fg",
  info: "--color-info-fg",
  warning: "--color-warning-fg",
  danger: "--color-danger-fg",
  destructive: "--color-danger-fg",
};

// i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
const SIZE_CLASSES: Record<TagSize, string> = {
  sm: "px-2 py-0.5 text-[11px]", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  md: "px-3 py-1 text-xs", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  lg: "px-4 py-2 text-sm", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
};

function resolveTagColor(color: TagProps["color"], variant: TagProps["variant"]): TagColor {
  if (color) return color;
  if (variant === "destructive") return "destructive";
  if (variant === "warning") return "warning";
  if (variant === "success") return "success";
  return "default";
}

function resolveTagTone(args: { tone: TagProps["tone"]; color: TagProps["color"]; variant: TagProps["variant"] }): TagTone {
  if (args.tone) return args.tone;
  if (args.color) return "soft";
  if (args.variant) return "solid";
  return "soft";
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, color, variant, tone, size = "md", children, ...props }, ref) => {
    const resolvedColor = resolveTagColor(color, variant);
    const resolvedTone = resolveTagTone({ tone, color, variant });
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
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
        data-token={bgToken}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
        data-token-fg={FG_TOKEN_BY_COLOR[resolvedColor]}
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          "inline-flex items-center rounded-full font-medium",
          SIZE_CLASSES[size],
          bgClass,
          textClass,
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
