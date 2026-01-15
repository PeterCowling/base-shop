import React, { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export interface FormCardProps {
  /**
   * Card title displayed in the header
   */
  title: string;

  /**
   * Optional description text below the title
   */
  description?: string;

  /**
   * Form content - typically form fields
   */
  children: ReactNode;

  /**
   * Optional footer content - typically action buttons
   */
  footer?: ReactNode;

  /**
   * Validation state of the form
   * - 'idle' - Default state
   * - 'loading' - Form is submitting
   * - 'success' - Form submitted successfully
   * - 'error' - Form has validation errors
   */
  state?: 'idle' | 'loading' | 'success' | 'error';

  /**
   * Error message to display when state is 'error'
   */
  errorMessage?: string;

  /**
   * Success message to display when state is 'success'
   */
  successMessage?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show a visual loading overlay
   */
  showLoadingOverlay?: boolean;
}

/**
 * FormCard - Consistent card-based form layout for operations interfaces
 *
 * Features:
 * - Header with title and optional description
 * - Content area for form fields
 * - Optional footer for action buttons
 * - Built-in validation state display (idle, loading, success, error)
 * - Loading overlay option during submission
 * - Dark mode support
 * - Context-aware spacing from operations tokens
 *
 * @example
 * ```tsx
 * <FormCard
 *   title="Inventory Adjustment"
 *   description="Adjust stock levels for this item"
 *   state={isSubmitting ? 'loading' : 'idle'}
 *   errorMessage={error}
 *   footer={
 *     <>
 *       <Button variant="secondary" onClick={onCancel}>Cancel</Button>
 *       <Button type="submit" disabled={isSubmitting}>Save</Button>
 *     </>
 *   }
 * >
 *   <div className="space-y-4">
 *     <Input label="Quantity" type="number" />
 *     <Textarea label="Reason" />
 *   </div>
 * </FormCard>
 * ```
 */
export function FormCard({
  title,
  description,
  children,
  footer,
  state = 'idle',
  errorMessage,
  successMessage,
  className = '',
  showLoadingOverlay = false,
}: FormCardProps) {
  const showError = state === 'error' && errorMessage;
  const showSuccess = state === 'success' && successMessage;
  const isLoading = state === 'loading';

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm
        dark:border-darkSurface dark:bg-darkSurface
        ${className}
      `}
    >
      {/* Loading overlay */}
      {showLoadingOverlay && isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-darkSurface/80">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-darkAccentGreen" />
            <p className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
              Saving changes...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-[var(--card-padding)] py-4 dark:border-darkSurface dark:bg-darkBg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-darkAccentGreen">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="border-b border-green-200 bg-green-50 px-[var(--card-padding)] py-3 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {showError && (
        <div className="border-b border-red-200 bg-red-50 px-[var(--card-padding)] py-3 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-[var(--card-padding)] py-[var(--card-padding)]">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 bg-gray-50 px-[var(--card-padding)] py-4 dark:border-darkSurface dark:bg-darkBg">
          <div className="flex items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormCard;
