"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export type AlertVariant = "info" | "success" | "warning" | "danger";
export type AlertTone = "soft" | "solid";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  tone?: AlertTone;
  title?: string;
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
  ({ className, variant = "info", tone = "soft", title, children, ...props }, ref) => {
    const bgClass = tone === "solid" ? SOLID_BG[variant] : SOFT_BG[variant];
    const fgClass = tone === "solid" ? FG[variant] : "text-fg";
    return (
      <div
        ref={ref}
        data-token={TOKEN_BG[variant]}
        role="status"
        className={cn(
          "rounded-md border border-border-2 p-3",
          bgClass,
          fgClass,
          className,
        )}
        {...props}
      >
        {title && <div className="mb-1 font-medium">{title}</div>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;

