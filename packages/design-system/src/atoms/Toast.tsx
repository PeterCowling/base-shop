"use client";
import * as React from "react";

import { useTranslations } from "@acme/i18n";

import { Inline } from "../primitives/Inline";
import { cn } from "../utils/style";

type ToastVariant = "default" | "success" | "info" | "warning" | "danger" | "error";
type ToastTone = "soft" | "solid";
type ToastPlacement =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: ToastVariant;
  tone?: ToastTone;
  /**
   * Optional action button.
   */
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Auto-hide duration in ms. If provided, toast will close after this delay.
   */
  duration?: number;
  /**
   * Position of the toast on screen.
   */
  placement?: ToastPlacement;
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

// i18n-exempt -- UI-000: CSS utility class names for placement, not user-facing copy [ttl=2026-01-31]
const PLACEMENT_CLASSES: Record<ToastPlacement, string> = {
  "bottom-center": "bottom-4 start-1/2 -translate-x-1/2", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
  "bottom-start": "bottom-4 start-4", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
  "bottom-end": "bottom-4 end-4", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
  "top-center": "top-4 start-1/2 -translate-x-1/2", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
  "top-start": "top-4 start-4", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
  "top-end": "top-4 end-4", // i18n-exempt -- UI-000: placement utility class string [ttl=2026-01-31]
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      open,
      onClose,
      message,
      className,
      variant = "default",
      tone = "soft",
      actionLabel,
      onAction,
      duration,
      placement = "bottom-center",
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();
    React.useEffect(() => {
      if (!open || !duration || !onClose) return;
      const timer = window.setTimeout(onClose, duration);
      return () => window.clearTimeout(timer);
    }, [open, duration, onClose]);

    if (!open) return null;
    // Back-compat: "error" maps to "danger"
    const v = variant === "error" ? "danger" : variant;
    const bgClass = tone === "solid" ? SOLID_BG[v] : SOFT_BG[v];
    const fgClass = tone === "solid" ? FG[v] : "text-fg";
    const token = TOKEN_BG[v];
    const tokenFg = TOKEN_FG[v];
    const closeLabel = t("actions.close") as string;
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-toast rounded-md border border-border-2 px-4 py-2 shadow-elevation-3 w-full sm:w-96 break-words", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
          PLACEMENT_CLASSES[placement],
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
        <Inline gap={3} alignY="start" wrap={false} className="items-start">
          <span className="grow" data-token={tokenFg}>{message}</span>
          <Inline gap={2} wrap={false} alignY="center" className="shrink-0">
            {onAction && actionLabel ? (
              <button
                type="button"
                onClick={onAction}
                className="text-sm font-semibold underline underline-offset-2 decoration-current inline-flex min-h-11 min-w-11 items-center justify-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
                data-token={tokenFg}
              >
                {actionLabel}
              </button>
            ) : null}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ms-1 font-bold inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
                data-token={tokenFg}
                aria-label={closeLabel}
              >
                ×
              </button>
            )}
          </Inline>
        </Inline>
      </div>
    );
  }
);
Toast.displayName = "Toast";
