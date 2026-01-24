/* i18n-exempt file -- OPS-003 [ttl=2026-12-31] class names are not user-facing */
"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style/cn";

export interface SimpleModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Maximum width class (e.g., 'max-w-lg', 'max-w-2xl') */
  maxWidth?: string;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional classes for modal content */
  className?: string;
  /** Additional classes for backdrop */
  backdropClassName?: string;
}

/**
 * SimpleModal - Lightweight modal component
 *
 * Uses design-system Dialog primitives for focus trapping, scroll locking,
 * and keyboard handling while keeping the original SimpleModal API.
 */
export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  footer,
  showCloseButton = true,
  className,
  backdropClassName,
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className={cn("bg-black/50 backdrop-blur-sm", backdropClassName)} />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 start-1/2 z-modal w-full -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-border-2 bg-panel text-foreground shadow-elevation-4",
            "focus:outline-none",
            maxWidth,
            className
          )}
        >
          {(title || showCloseButton) && (
            // eslint-disable-next-line ds/enforce-layout-primitives -- UI-LINT-05 Modal header layout; fixed 2-column structure
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-2">
              {title && (
                <DialogTitle className="text-xl font-semibold">
                  {title}
                </DialogTitle>
              )}
              {showCloseButton && (
                <DialogPrimitive.Close
                  className="min-h-10 min-w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          <div className="px-6 py-4">{children}</div>

          {footer && (
            // eslint-disable-next-line ds/enforce-layout-primitives -- UI-LINT-05 Modal footer layout; fixed action bar structure
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-2">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SimpleModal;
