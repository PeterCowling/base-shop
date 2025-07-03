import * as React from "react";
import { boxProps } from "../../utils/boxProps";
import { cn } from "../../utils/cn";

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
    return (
      <div
        ref={ref}
        style={style}
        className={cn("flex flex-col gap-1", classes, className)}
        {...props}
      >
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && (
            <span aria-hidden="true" className="text-red-600">
              *
            </span>
          )}
        </label>
        {children}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
FormField.displayName = "FormField";
