import * as React from "react";
import { cn } from "../../utils/cn";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  message: string;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onClose, message, className, ...props }, ref) => {
    if (!open) return null;
    return (
      <div
        ref={ref}
        className={cn(
          "bg-fg text-bg fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg",
          className
        )}
        {...props}
      >
        {message}
        {onClose && (
          <button type="button" onClick={onClose} className="ml-2 font-bold">
            ×
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";
