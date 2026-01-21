"use client";

import * as React from "react";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { TranslatableText } from "@acme/types/i18n";

import { cn } from "../../utils/style";

export type AlertVariant = "info" | "success" | "warning" | "danger";
export type AlertTone = "soft" | "solid";

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  tone?: AlertTone;
  // Prefer `heading`, but also accept legacy `title` for backwards compatibility
  heading?: TranslatableText;
  title?: TranslatableText | string;
  locale?: Locale;
}

const SOFT_BG: Record<AlertVariant, string> = {
  info: "bg-info-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const SOLID_BG: Record<AlertVariant, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const FG: Record<AlertVariant, string> = {
  info: "text-info-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  danger: "text-danger-foreground",
};

const TOKEN_BG: Record<AlertVariant, string> = {
  info: "--color-info",
  success: "--color-success",
  warning: "--color-warning",
  danger: "--color-danger",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", tone = "soft", heading, title, locale = "en", children, ...props }, ref) => {
    const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
    // Support both `heading` and legacy `title`. `heading` takes precedence.
    const titleSource: TranslatableText | string | undefined = heading ?? title;
    const resolvedTitle = titleSource ? resolveText(titleSource as TranslatableText, locale, t) : undefined;
    const bgClass = tone === "solid" ? SOLID_BG[variant] : SOFT_BG[variant];
    const fgClass = tone === "solid" ? FG[variant] : "text-fg";
    return (
      <div
        ref={ref}
        data-token={TOKEN_BG[variant]}
        role="status"
        className={cn(
          "rounded-md border border-border-2 p-3", // i18n-exempt -- DEV-000 CSS utility class names
          bgClass,
          fgClass,
          className,
        )}
        {...props}
      >
        {resolvedTitle && <div className="font-medium">{resolvedTitle}</div>}
        {children && <div className={cn("text-sm", heading ? "pt-1" : undefined)}>{children}</div>}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
