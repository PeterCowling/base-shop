/* i18n-exempt file -- OPS-003 [ttl=2026-12-31] class names are not user-facing */
'use client'

import React, { useEffect } from 'react'

import { cn } from '@acme/design-system/utils/style/cn'

export interface SimpleModalProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal content */
  children: React.ReactNode
  /** Maximum width class (e.g., 'max-w-lg', 'max-w-2xl') */
  maxWidth?: string
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Additional classes for modal content */
  className?: string
  /** Additional classes for backdrop */
  backdropClassName?: string
}

/**
 * SimpleModal - Lightweight modal component
 *
 * A simpler alternative to Radix Dialog for cases where you don't need
 * the full accessibility features or prefer imperative control.
 *
 * Features:
 * - Fixed backdrop with click-outside to close
 * - Optional close button
 * - Header with title
 * - Footer for actions
 * - ESC key to close
 * - Body scroll lock when open
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <SimpleModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={onClose}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure?</p>
 * </SimpleModal>
 * ```
 */
export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  footer,
  showCloseButton = true,
  className,
  backdropClassName,
}) => {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- UI-LINT-05 Modal backdrop click-to-close; keyboard handled via ESC listener above
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center px-4',
        'bg-black/50 backdrop-blur-sm',
        backdropClassName
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- UI-LINT-05 stopPropagation prevents backdrop click; content is focusable via children */}
      <div
        className={cn(
          'relative w-full rounded-lg shadow-lg',
          'bg-white dark:bg-darkSurface',
          'border border-gray-200 dark:border-darkSurface',
          maxWidth,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          // eslint-disable-next-line ds/enforce-layout-primitives -- UI-LINT-05 Modal header layout; fixed 2-column structure
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-darkAccentGreen"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="min-h-10 min-w-10 flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-darkAccentGreen dark:hover:text-white transition-colors"
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
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          // eslint-disable-next-line ds/enforce-layout-primitives -- UI-LINT-05 Modal footer layout; fixed action bar structure
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleModal
