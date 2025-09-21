"use client";
import * as React from "react";
import { cn } from "../../utils/style";

type ToastVariant = "default" | "success" | "error";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: ToastVariant;
}

const VARIANT_STYLES: Record<ToastVariant, {
  className: string;
  token: string;
  tokenFg: string;
}> = {
  default: {
    className: "bg-fg text-bg",
    token: "--color-fg",
    tokenFg: "--color-bg",
  },
  success: {
    className: "bg-success text-success-fg",
    token: "--color-success",
    tokenFg: "--color-success-fg",
  },
  error: {
    className: "bg-destructive text-destructive-foreground",
    token: "--color-danger",
    tokenFg: "--color-danger-fg",
  },
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, variant = "default", ...props }, ref) => {
    if (!open) return null;
    const { className: variantClassName, token, tokenFg } = VARIANT_STYLES[variant];
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg max-w-[90vw] sm:max-w-md break-words",
          variantClassName,
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
            className="ml-2 font-bold"
            data-token={tokenFg}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";
