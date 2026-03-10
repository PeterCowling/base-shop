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
        relative overflow-hidden rounded-lg border border-border-2 bg-surface-2 shadow-sm
        ${className}
      `}
    >
      {/* Loading overlay */}
      {showLoadingOverlay && isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Saving changes...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border-2 bg-surface-1 px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="border-b border-success/40 bg-success-soft px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-foreground" />
            <p className="text-sm font-medium text-success-foreground">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {showError && (
        <div className="border-b border-danger/40 bg-danger-soft px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-foreground" />
            <p className="text-sm font-medium text-danger-foreground">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border-2 bg-surface-1 px-4 py-4">
          <div className="flex items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormCard;
