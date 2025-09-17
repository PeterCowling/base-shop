"use client";
import * as React from "react";
import { cn } from "../../utils/style";

export type ToastVariant = "info" | "success" | "error";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: ToastVariant;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: "bg-fg text-bg",
  success: "bg-success text-success-fg",
  error: "bg-danger text-danger-foreground",
};

const VARIANT_TOKENS: Record<ToastVariant, { bg: string; fg: string }> = {
  info: { bg: "--color-fg", fg: "--color-bg" },
  success: { bg: "--color-success", fg: "--color-success-fg" },
  error: { bg: "--color-danger", fg: "--color-danger-fg" },
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, variant = "info", ...props }, ref) => {
    if (!open) return null;

    const tokens = VARIANT_TOKENS[variant] ?? VARIANT_TOKENS.info;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg",
          VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.info,
          className
        )}
        data-token={tokens.bg}
        data-token-fg={tokens.fg}
        {...props}
      >
        <span data-token={tokens.fg}>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 font-bold"
            data-token={tokens.fg}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";
