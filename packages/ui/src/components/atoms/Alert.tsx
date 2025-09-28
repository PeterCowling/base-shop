"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";
import { resolveText } from "@i18n/resolveText";

export type AlertVariant = "info" | "success" | "warning" | "danger";
export type AlertTone = "soft" | "solid";

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  tone?: AlertTone;
  heading?: TranslatableText;
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
  ({ className, variant = "info", tone = "soft", heading, locale = "en", children, ...props }, ref) => {
    const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
    const resolvedTitle = heading ? resolveText(heading, locale, t) : undefined;
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

Alert.displayName = "Alert"; // i18n-exempt -- DEV-000 component displayName, not user-facing

export default Alert;
