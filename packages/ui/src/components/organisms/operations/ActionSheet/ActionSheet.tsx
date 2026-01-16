import React, { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../../utils/style/cn";
import {
  Cluster,
  Stack,
} from "../../../atoms/primitives";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "../../../atoms/primitives/dialog";

export interface ActionSheetProps {
  /**
   * Whether the action sheet is visible
   */
  isOpen: boolean;

  /**
   * Callback when the sheet should close
   */
  onClose: () => void;

  /**
   * Title displayed at the top of the sheet
   */
  title: string;

  /**
   * Optional description below the title
   */
  description?: string;

  /**
   * Content to display in the sheet
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether clicking the backdrop closes the sheet
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether pressing Escape closes the sheet
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Accessible label for the close button
   */
  closeLabel?: string;
}

/**
 * ActionSheet - Bottom sheet component for mobile-friendly actions
 *
 * Features:
 * - Slides up from bottom on mobile, centered modal on desktop
 * - Backdrop click and Escape key to close
 * - Scrollable content area
 * - Accessible with proper focus management
 *
 * @example
 * ```tsx
 * <ActionSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Quick Actions"
 *   description="Choose an action to perform"
 * >
 *   <div className="space-y-2">
 *     <button onClick={handleEdit}>Edit Item</button>
 *     <button onClick={handleDelete}>Delete Item</button>
 *   </div>
 * </ActionSheet>
 * ```
 */
export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  closeLabel =
    "Close", // i18n-exempt -- UI-3006 [ttl=2026-12-31] default close label
}: ActionSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed bottom-0 start-1/2 w-full -translate-x-1/2 rounded-t-2xl border border-border-1 bg-surface-1 shadow-elevation-4",
            "sm:top-1/2 sm:bottom-auto sm:w-96 sm:-translate-y-1/2 sm:rounded-2xl",
            className
          )}
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!closeOnBackdropClick) event.preventDefault();
          }}
          aria-labelledby="action-sheet-title"
        >
          <Cluster
            justify="between"
            alignY="start"
            className="border-b border-border-1 px-6 py-4"
          >
            <Stack gap={1} className="min-w-0">
              <DialogTitle id="action-sheet-title" className="text-lg font-semibold">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="text-sm text-foreground/70">
                  {description}
                </DialogDescription>
              ) : null}
            </Stack>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={closeLabel}
                className="min-h-11 min-w-11 rounded-full p-2 text-foreground/60 hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </Cluster>

          <div className="max-h-dvh overflow-y-auto px-6 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default ActionSheet;
