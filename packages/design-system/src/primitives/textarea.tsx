// packages/ui/components/atoms/primitives/textarea.tsx
"use client";

import * as React from "react";

import { FormField } from "../atoms/FormField";
import { cn } from "../utils/style";

import { type PrimitiveRadius, type PrimitiveShape, resolveShapeRadiusClass } from "./shape-radius";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label displayed above or floating */
  label?: React.ReactNode;
  /** Error message shown below the control */
  error?: React.ReactNode;
  /** Optional helper/description text */
  description?: React.ReactNode;
  /** Enable floating label style */
  floatingLabel?: boolean;
  /** Class applied to the wrapper element */
  wrapperClassName?: string;
  /** Compatibility mode for migration scenarios that require bare textarea semantics. */
  compatibilityMode?: TextareaCompatibilityMode;
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export type TextareaCompatibilityMode = "default" | "no-wrapper";

export const Textarea = (
  {
    ref,
    className,
    label,
    error,
    description,
    floatingLabel,
    wrapperClassName,
    compatibilityMode = "default",
    shape,
    radius,
    id,
    onFocus,
    onBlur,
    ...props
  }: TextareaProps & {
    ref?: React.Ref<HTMLTextAreaElement>;
  }
) => {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const useFloatingLabel =
    compatibilityMode === "default" && Boolean(floatingLabel);
  const [focused, setFocused] = React.useState(false);
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  /* ------------------------------------------------------------------
   * Tailwind / shadcn class string
   * ------------------------------------------------------------------ */
  const hasError = Boolean(error); // avoids 0 | 0n union in type-inference

  const baseClasses = cn(
    "min-h-[6rem] w-full border border-input bg-input px-3 py-2 text-sm text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    shapeRadiusClass,
    "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    useFloatingLabel && "peer pt-5",
    hasError && "border-danger",
    className
  );

  /* ------------------------------------------------------------------
   * Focus helpers
   * ------------------------------------------------------------------ */
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const hasValue =
    props.value !== undefined
      ? String(props.value).length > 0
      : Boolean(props.defaultValue);
  const required = props.required;
  const formClassName = wrapperClassName;
  const compatibilityAriaInvalid =
    props["aria-invalid"] ?? (hasError || undefined);

  if (compatibilityMode === "no-wrapper") {
    return (
      <textarea
        id={textareaId}
        ref={ref}
        className={baseClasses}
        aria-invalid={compatibilityAriaInvalid}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <FormField
      id={textareaId}
      label={!useFloatingLabel ? label : undefined}
      description={description}
      error={error}
      {...(required !== undefined ? { required } : {})}
      {...(formClassName !== undefined ? { className: formClassName } : {})}
       
      input={({ id: controlId, describedBy, ariaInvalid }) =>
        useFloatingLabel ? (
          <div className="relative flex flex-col gap-1">
            <textarea
              id={controlId}
              ref={ref}
              className={baseClasses}
              aria-invalid={ariaInvalid}
              aria-describedby={describedBy}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            {label && (
              <label
                htmlFor={controlId}
                className={cn(
                  "text-muted-foreground pointer-events-none absolute top-2 left-3 transition-colors transition-transform motion-reduce:transition-none", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                  (focused || hasValue) && "-translate-y-3 text-xs" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                )}
              >
                {label}
              </label>
            )}
          </div>
        ) : (
          <textarea
            id={controlId}
            ref={ref}
            className={baseClasses}
            aria-invalid={ariaInvalid}
            aria-describedby={describedBy}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        )
      }
    />
  );
};
