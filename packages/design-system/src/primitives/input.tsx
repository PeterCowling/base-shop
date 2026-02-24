// packages/ui/components/atoms/primitives/input.tsx
"use client";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — no user-facing copy; only prop-driven labels/errors

import * as React from "react";

import { FormField } from "../atoms/FormField";
import { cn } from "../utils/style";

import { Inline } from "./Inline";
import { type PrimitiveRadius, type PrimitiveShape, resolveShapeRadiusClass } from "./shape-radius";

/* ──────────────────────────────────────────────────────────────────────────────
 * Props
 * ──────────────────────────────────────────────────────────────────────────── */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above or floating */
  label?: React.ReactNode;
  /** Optional content rendered to the right of the label (not part of the label element) */
  labelSuffix?: React.ReactNode;
  /** Error message shown below the control */
  error?: React.ReactNode;
  /** Optional helper/description text */
  description?: React.ReactNode;
  /** Enable floating-label style */
  floatingLabel?: boolean;
  /** Extra class on the outer wrapper */
  wrapperClassName?: string;
  /** Compatibility mode for migration scenarios that require bare input semantics. */
  compatibilityMode?: InputCompatibilityMode;
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export type InputCompatibilityMode = "default" | "no-wrapper";

/* ──────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
export const Input = (
  {
    ref,
    className,
    label,
    labelSuffix,
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
  }: InputProps & {
    ref?: React.Ref<HTMLInputElement>;
  }
) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const useFloatingLabel =
    compatibilityMode === "default" && Boolean(floatingLabel);
  const [focused, setFocused] = React.useState(false);
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  /* ------------------------------------------------------------------ *
   *  Dynamic classes
   * ------------------------------------------------------------------ */
  const baseClasses = cn(
    // base
    "flex h-12 w-full border border-input bg-input px-3 py-3 text-sm text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    shapeRadiusClass,
    // placeholder + file input follow tokenized colors
    "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    // ring uses tokenized color and widths
    "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "disabled:cursor-not-allowed disabled:opacity-50",
    // floating-label tweak
    useFloatingLabel && "peer pt-5",
    // error border leverages semantic color token
    error ? "border-danger" : undefined,
    // user-supplied
    className
  );

  /* ------------------------------------------------------------------ *
   *  Handlers
   * ------------------------------------------------------------------ */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  /* ------------------------------------------------------------------ *
   *  Determine if the control currently holds a value
   * ------------------------------------------------------------------ */
  const hasValue =
    props.value !== undefined
      ? String(props.value).length > 0
      : Boolean(props.defaultValue);
  const required = props.required;
  const formClassName = wrapperClassName;
  const compatibilityAriaInvalid =
    props["aria-invalid"] ?? (Boolean(error) || undefined);

  if (compatibilityMode === "no-wrapper") {
    return (
      <input
        id={inputId}
        ref={ref}
        data-token="--color-bg"
        className={baseClasses}
        aria-invalid={compatibilityAriaInvalid}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  return (
    <FormField
      id={inputId}
      label={
        !useFloatingLabel && (label || labelSuffix) ? (
          <Inline wrap={false} gap={1}>
            {label && <span>{label}</span>}
            {labelSuffix}
          </Inline>
        ) : undefined
      }
      description={description}
      error={error}
      {...(required !== undefined ? { required } : {})}
      {...(formClassName !== undefined ? { className: formClassName } : {})}
       
      input={({ id: controlId, describedBy, ariaInvalid }) =>
        useFloatingLabel ? (
          <div className="relative">
            <input
              id={controlId}
              ref={ref}
              data-token="--color-bg"
              className={baseClasses}
              aria-invalid={ariaInvalid}
              aria-describedby={describedBy}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            {(label || labelSuffix) && (
              <Inline
                wrap={false}
                gap={1}
                className="absolute top-2 ms-3 pointer-events-none"
              >
                {label && (
                  <label
                    htmlFor={controlId}
                    className={cn(
                      "text-muted-foreground pointer-events-none transition-colors transition-transform motion-reduce:transition-none", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                      (focused || hasValue) && "-translate-y-3 text-xs" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                    )}
                  >
                    {label}
                  </label>
                )}
                {labelSuffix ? (
                  <span className="pointer-events-auto">{labelSuffix}</span>
                ) : null}
              </Inline>
            )}
          </div>
        ) : (
          <input
            id={controlId}
            ref={ref}
            data-token="--color-bg"
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
