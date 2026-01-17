import * as React from "react";
import { cn } from "../../utils/style";

export interface FormFieldProps {
  id?: string | undefined;
  label?: React.ReactNode | undefined;
  description?: React.ReactNode | undefined;
  error?: React.ReactNode | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  input:
    | React.ReactElement
    | ((args: { id: string; describedBy?: string | undefined; ariaInvalid?: boolean | undefined }) => React.ReactNode);
}

/**
 * Lightweight form field wrapper to standardize label/description/error wiring.
 * Clones the provided input element and wires `id` and `aria-describedby`.
 */
export function FormField({
  id,
  label,
  description,
  error,
  required,
  className,
  input,
}: FormFieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const inputElement = React.isValidElement<Record<string, unknown>>(input) ? input : null;
  const inputProps = inputElement?.props;
  const inputDescribedBy =
    typeof inputProps?.["aria-describedby"] === "string"
      ? (inputProps["aria-describedby"] as string)
      : undefined;
  const inputAriaInvalid =
    typeof inputProps?.["aria-invalid"] === "boolean" ||
    typeof inputProps?.["aria-invalid"] === "string"
      ? (inputProps["aria-invalid"] as string | boolean)
      : undefined;

  const describedBy = [descriptionId, errorId, inputDescribedBy]
    .filter(Boolean)
    .join(" ") || undefined;

  const renderedInput =
    typeof input === "function"
      ? input({
          id: controlId,
          describedBy,
          ariaInvalid: Boolean(error) || undefined,
        })
      : inputElement
        ? React.cloneElement(inputElement, {
            id: controlId,
            "aria-describedby": describedBy,
            "aria-invalid": inputAriaInvalid ?? (Boolean(error) || undefined),
          })
        : input;

  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <label
          htmlFor={controlId}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required ? <span className="text-destructive ms-1">*</span> : null}
        </label>
      ) : null}
      {renderedInput}
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
