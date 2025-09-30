import * as React from "react";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label for the form control */
  label: React.ReactNode;
  /** id of the form control this label describes */
  htmlFor?: string;
  /** Error message shown below the control */
  error?: React.ReactNode;
  /** Display asterisk after the label */
  required?: boolean;
  /** Optional width */
  width?: string | number;
  /** Optional height */
  height?: string | number;
  /** Optional padding classes */
  padding?: string;
  /** Optional margin classes */
  margin?: string;
}

// i18n-exempt -- TECH-000 [ttl=2026-01-31] CSS utility class tokens and design tokens below are not user-facing copy
const WRAPPER_CLASSES = "flex flex-col gap-1"; // i18n-exempt -- TECH-000 [ttl=2026-01-31] CSS classes
const ERROR_TEXT_CLASSES = "text-sm text-danger"; // i18n-exempt -- TECH-000 [ttl=2026-01-31] CSS classes
const DANGER_TOKEN = "--color-danger"; // i18n-exempt -- TECH-000 [ttl=2026-01-31] design token

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      htmlFor,
      error,
      required = false,
      width,
      height,
      padding,
      margin,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { classes, style } = boxProps({ width, height, padding, margin });
    // Convert width/height style to Tailwind arbitrary value classes to avoid inline style on DOM nodes
    const sizeClasses: string[] = [];
    if (style.width !== undefined) {
      const w = typeof style.width === "number" ? `${style.width}px` : style.width;
      sizeClasses.push(`w-[${w}]`);
    }
    if (style.height !== undefined) {
      const h = typeof style.height === "number" ? `${style.height}px` : style.height;
      sizeClasses.push(`h-[${h}]`);
    }
    const errorChildren = React.Children.toArray(error ?? null);
    const hasError = errorChildren.length > 0;
    const isTextOnly = errorChildren.every(
      (child) => typeof child === "string" || typeof child === "number",
    );
    const ErrorContainer = isTextOnly ? "p" : "div";

    return (
      <div
        ref={ref}
        className={cn(WRAPPER_CLASSES, classes, sizeClasses.join(" "), className)}
        {...props}
      >
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && (
            <span
              aria-hidden="true"
              className="text-danger"
              data-token={DANGER_TOKEN}
            >
              {/* i18n-exempt -- TECH-000 [ttl=2026-01-31] required field asterisk */}
              *
            </span>
          )}
        </label>
        {children}
        {hasError && (
          <ErrorContainer className={ERROR_TEXT_CLASSES} data-token={DANGER_TOKEN}>
            {error}
          </ErrorContainer>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";
