import React, { type ReactNode } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Cluster, Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

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
  state = "idle",
  errorMessage,
  successMessage,
  className = "",
  showLoadingOverlay = false,
}: FormCardProps) {
  const t = useTranslations();
  const showError = state === "error" && errorMessage;
  const showSuccess = state === "success" && successMessage;
  const isLoading = state === "loading";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border-2 bg-surface-1 shadow-elevation-2",
        className
      )}
    >
      {/* Loading overlay */}
      {showLoadingOverlay && isLoading && (
        // eslint-disable-next-line ds/absolute-parent-guard -- UI-3010 [ttl=2026-12-31] overlay is anchored to relative card root
        <div className="absolute inset-0">
          <Cluster
            alignY="center"
            justify="center"
            className="h-full bg-surface-1/80 backdrop-blur-sm"
          >
            <Stack gap={2} align="center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-fg">
                {t("formCard.savingChanges")}
              </p>
            </Stack>
          </Cluster>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border-2 bg-surface-2 px-6 py-4">
        <h2 className="text-lg font-semibold text-fg">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="border-b border-success/30 bg-success-soft px-6 py-3">
          <Inline gap={3} alignY="start" wrap={false}>
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <p className="text-sm font-medium text-success-foreground">
              {successMessage}
            </p>
          </Inline>
        </div>
      )}

      {/* Error message */}
      {showError && (
        <div className="border-b border-danger/30 bg-danger-soft px-6 py-3">
          <Inline gap={3} alignY="start" wrap={false}>
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
            <p className="text-sm font-medium text-danger-foreground">
              {errorMessage}
            </p>
          </Inline>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border-2 bg-surface-2 px-6 py-4">
          <Inline gap={3} alignY="center" className="justify-end">
            {footer}
          </Inline>
        </div>
      )}
    </div>
  );
}

export default FormCard;
