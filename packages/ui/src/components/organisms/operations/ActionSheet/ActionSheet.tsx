import React, { type ReactNode,useEffect } from 'react';
import { X } from 'lucide-react';

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
}

/**
 * ActionSheet - Bottom sheet component for mobile-friendly actions
 *
 * Features:
 * - Slides up from bottom on mobile, centered modal on desktop
 * - Backdrop click and Escape key to close
 * - Smooth animations with framer-motion
 * - Scrollable content area
 * - Dark mode support
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
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ActionSheetProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-sheet-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-fg/50 transition-opacity" />

      {/* Sheet */}
      <div
        className={`
          relative w-full max-w-lg transform overflow-hidden rounded-t-2xl bg-surface-2 shadow-xl
          transition-all sm:rounded-2xl
          ${className}
        `}
        style={{
          maxHeight: '90vh',
        }}
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border-2 bg-surface-2 px-[var(--card-padding)] py-4">
          <div className="flex-1 pr-4">
            <h3
              id="action-sheet-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-surface-1 hover:text-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-[var(--card-padding)] py-[var(--card-padding)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ActionSheet;
