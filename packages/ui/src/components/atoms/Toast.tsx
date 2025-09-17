"use client";
import * as React from "react";
import { cn } from "../../utils/style";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
  variant?: "success" | "error";
}

const variantClasses: Record<Required<ToastProps>["variant"], string> = {
  success: "bg-success text-success-fg",
  error: "bg-danger text-danger-foreground",
};

const variantTokens: Record<Required<ToastProps>["variant"], { bg: string; fg: string }> = {
  success: { bg: "--color-success", fg: "--color-success-fg" },
  error: { bg: "--color-danger", fg: "--color-danger-fg" },
};

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, variant, ...props }, ref) => {
    if (!open) return null;

    const tokens = variant ? variantTokens[variant] : { bg: "--color-fg", fg: "--color-bg" };
    const appearance = variant ? variantClasses[variant] : "bg-fg text-bg";

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg",
          appearance,
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
