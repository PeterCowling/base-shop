"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";

type ToastVariant = "default" | "success" | "info" | "warning" | "danger" | "error";
type ToastTone = "soft" | "solid";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: ToastVariant;
  tone?: ToastTone;
}

const SOFT_BG: Record<Exclude<ToastVariant, "error">, string> = {
  default: "bg-muted",
  success: "bg-success-soft",
  info: "bg-info-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

const SOLID_BG: Record<Exclude<ToastVariant, "error">, string> = {
  default: "bg-fg",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
};

const FG: Record<Exclude<ToastVariant, "error">, string> = {
  default: "text-bg",
  success: "text-success-foreground",
  info: "text-info-foreground",
  warning: "text-warning-foreground",
  danger: "text-danger-foreground",
};

const TOKEN_BG: Record<Exclude<ToastVariant, "error">, string> = {
  default: "--color-muted",
  success: "--color-success",
  info: "--color-info",
  warning: "--color-warning",
  danger: "--color-danger",
};

const TOKEN_FG: Record<Exclude<ToastVariant, "error">, string> = {
  default: "--color-bg",
  success: "--color-success-fg",
  info: "--color-info-fg",
  warning: "--color-warning-fg",
  danger: "--color-danger-fg",
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, variant = "default", tone = "soft", ...props }, ref) => {
    const t = useTranslations();
    if (!open) return null;
    // Back-compat: "error" maps to "danger"
    const v = variant === "error" ? "danger" : variant;
    const bgClass = tone === "solid" ? SOLID_BG[v] : SOFT_BG[v];
    const fgClass = tone === "solid" ? FG[v] : "text-fg";
    const token = TOKEN_BG[v];
    const tokenFg = TOKEN_FG[v];
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 start-1/2 z-50 -translate-x-1/2 rounded-md border border-border-2 px-4 py-2 shadow-elevation-3 w-full sm:w-96 break-words", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
          bgClass,
          fgClass,
          className
        )}
        data-token={token}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        {...props}
      >
        <span data-token={tokenFg}>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ms-2 font-bold inline-flex items-center justify-center min-h-11 min-w-11" // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
            data-token={tokenFg}
            aria-label={t("actions.close") as string}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";
