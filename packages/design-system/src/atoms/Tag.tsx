"use client";

import * as React from "react";

import { cn } from "../utils/style";

type TagColor =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "destructive";
type TagTone = "solid" | "soft";

const SOLID_BG: Record<TagColor, string> = {
  default: "bg-muted",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  destructive: "bg-danger",
};

const SOFT_BG: Record<TagColor, string> = {
  default: "bg-muted",
  primary: "bg-primary-soft",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  destructive: "bg-danger-soft",
};

const FG_TOKEN: Record<TagColor, string> = {
  default: "--color-fg",
  primary: "--color-primary-fg",
  accent: "--color-accent-fg",
  success: "--color-success-fg",
  info: "--color-info-fg",
  warning: "--color-warning-fg",
  danger: "--color-danger-fg",
  destructive: "--color-danger-fg",
};

function resolveColor(variant: TagProps["variant"], color?: TagColor): TagColor {
  if (color) return color;
  if (variant === "destructive") return "destructive";
  if (variant === "warning") return "warning";
  if (variant === "success") return "success";
  return "default";
}

function resolveTone(
  tone: TagProps["tone"],
  color?: TagColor,
  variant?: TagProps["variant"]
): TagTone {
  if (tone) return tone;
  return color ? "soft" : variant ? "solid" : "soft";
}

function textClass(color: TagColor, tone: TagTone): string {
  if (tone !== "solid") return "text-fg";
  switch (color) {
    case "primary":
      return "text-primary-foreground";
    case "accent":
      return "text-accent-foreground";
    case "success":
      return "text-success-fg";
    case "info":
      return "text-info-fg";
    case "warning":
      return "text-warning-fg";
    case "danger":
    case "destructive":
      return "text-danger-foreground";
    default:
      return "text-fg";
  }
}

function bgToken(color: TagColor, tone: TagTone): string {
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
    case "destructive":
      return tone === "solid" ? "--color-danger" : "--color-danger-soft";
    default:
      return "--color-muted";
  }
}

// i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
const SIZE_CLASSES: Record<NonNullable<TagProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px]", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  md: "px-3 py-1 text-xs", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
  lg: "px-4 py-2 text-sm", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names for spacing/typography
};

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

export const Tag = (
  {
    ref,
    className,
    color,
    variant,
    tone,
    size = "md",
    children,
    ...props
  }: TagProps & {
    ref?: React.Ref<HTMLSpanElement>;
  }
) => {
  const resolvedColor = resolveColor(variant, color);
  const resolvedTone = resolveTone(tone, color, variant);

  return (
    <span
      ref={ref}
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
      data-token={bgToken(resolvedColor, resolvedTone)}
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
      data-token-fg={FG_TOKEN[resolvedColor]}
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "inline-flex items-center rounded-full font-medium",
        SIZE_CLASSES[size],
        (resolvedTone === "solid" ? SOLID_BG : SOFT_BG)[resolvedColor],
        textClass(resolvedColor, resolvedTone),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
