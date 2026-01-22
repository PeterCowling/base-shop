import * as React from "react";

import { cn } from "../utils/style";

export interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  input:
    | React.ReactElement
    | ((args: { id: string; describedBy?: string; ariaInvalid?: boolean }) => React.ReactNode);
}

type InputElement = React.ReactElement<Record<string, unknown>>;

function joinDescribedBy(parts: Array<string | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join(" ");
  return joined.length > 0 ? joined : undefined;
}

function extractExistingAria(inputElement: InputElement | null): {
  describedBy?: string;
  ariaInvalid?: string | boolean;
} {
  if (!inputElement) return {};

  const ariaDescribedBy = inputElement.props["aria-describedby"];
  const describedBy = typeof ariaDescribedBy === "string" ? ariaDescribedBy : undefined;

  const ariaInvalid = inputElement.props["aria-invalid"];
  const ariaInvalidValue =
    typeof ariaInvalid === "boolean" || typeof ariaInvalid === "string"
      ? ariaInvalid
      : undefined;

  return { describedBy, ariaInvalid: ariaInvalidValue };
}

function renderFormFieldInput(args: {
  input: FormFieldProps["input"];
  inputElement: InputElement | null;
  controlId: string;
  describedBy?: string;
  hasError: boolean;
  existingAriaInvalid?: string | boolean;
}): React.ReactNode {
  if (typeof args.input === "function") {
    const renderArgs: { id: string; describedBy?: string; ariaInvalid?: boolean } = {
      id: args.controlId,
    };
    if (args.describedBy) renderArgs.describedBy = args.describedBy;
    if (args.hasError) renderArgs.ariaInvalid = true;
    return args.input(renderArgs);
  }

  if (!args.inputElement) {
    return args.input;
  }

  return React.cloneElement(args.inputElement, {
    id: args.controlId,
    "aria-describedby": args.describedBy,
    "aria-invalid": args.existingAriaInvalid ?? (args.hasError || undefined),
  });
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

  const inputElement = React.isValidElement<Record<string, unknown>>(input)
    ? (input as InputElement)
    : null;
  const existingAria = extractExistingAria(inputElement);
  const describedBy = joinDescribedBy([
    descriptionId,
    errorId,
    existingAria.describedBy,
  ]);
  const renderedInput = renderFormFieldInput({
    input,
    inputElement,
    controlId,
    describedBy,
    hasError: Boolean(error),
    existingAriaInvalid: existingAria.ariaInvalid,
  });

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
