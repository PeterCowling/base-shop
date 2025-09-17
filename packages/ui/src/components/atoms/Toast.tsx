"use client";
import * as React from "react";
import { cn } from "../../utils/style";

type ToastVariant = "default" | "success" | "error";

const VARIANT_STYLES: Record<ToastVariant, { className: string; token: string; textToken: string }> = {
  default: {
    className: "bg-fg text-bg",
    token: "--color-fg",
    textToken: "--color-bg",
  },
  success: {
    className: "bg-success text-success-fg",
    token: "--color-success",
    textToken: "--color-success-fg",
  },
  error: {
    className: "bg-danger text-danger-foreground",
    token: "--color-danger",
    textToken: "--color-danger-fg",
  },
};

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: Exclude<ToastVariant, "default">;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, variant, ...props }, ref) => {
    if (!open) return null;
    const resolvedVariant: ToastVariant = variant ?? "default";
    const style = VARIANT_STYLES[resolvedVariant];
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg",
          style.className,
          className
        )}
        data-token={style.token}
        {...props}
      >
        <span data-token={style.textToken}>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 font-bold"
            data-token={style.textToken}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";
