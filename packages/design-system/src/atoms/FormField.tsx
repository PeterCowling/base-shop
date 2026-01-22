import * as React from "react";

import { cn } from "../utils/style";

function readAriaStringProp(props: unknown, name: string): string | undefined {
  if (!props || typeof props !== "object") return undefined;
  const value = (props as Record<string, unknown>)[name];
  return typeof value === "string" ? value : undefined;
}

function readAriaInvalid(props: unknown): string | boolean | undefined {
  if (!props || typeof props !== "object") return undefined;
  const value = (props as Record<string, unknown>)["aria-invalid"];
  return typeof value === "boolean" || typeof value === "string" ? value : undefined;
}

function buildDescribedBy(ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value.length > 0 ? value : undefined;
}

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
  const inputProps = inputElement?.props as unknown;
  const inputDescribedBy = readAriaStringProp(inputProps, "aria-describedby");
  const inputAriaInvalid = readAriaInvalid(inputProps);
  const describedBy = buildDescribedBy([descriptionId, errorId, inputDescribedBy]);

  const renderedInput = (() => {
    if (typeof input === "function") {
      return input({
        id: controlId,
        ...(describedBy ? { describedBy } : {}),
        ...(error ? { ariaInvalid: true } : {}),
      });
    }

    if (inputElement) {
      return React.cloneElement(inputElement, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": inputAriaInvalid ?? (Boolean(error) || undefined),
      });
    }

    return input;
  })();

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
