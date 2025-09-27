// packages/ui/components/atoms/primitives/input.tsx
"use client";
// i18n-exempt: no user-facing copy; only prop-driven labels/errors

import * as React from "react";
import { cn } from "../../../utils/style";

/* ──────────────────────────────────────────────────────────────────────────────
 * Props
 * ──────────────────────────────────────────────────────────────────────────── */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above or floating */
  label?: React.ReactNode;
  /** Error message shown below the control */
  error?: React.ReactNode;
  /** Enable floating-label style */
  floatingLabel?: boolean;
  /** Extra class on the outer wrapper */
  wrapperClassName?: string;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      floatingLabel,
      wrapperClassName,
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [focused, setFocused] = React.useState(false);

    /* ------------------------------------------------------------------ *
     *  Dynamic classes
     * ------------------------------------------------------------------ */
    const baseClasses = cn(
      // base
      "flex h-12 w-full rounded-md border border-input bg-input px-3 py-3 text-sm text-foreground", // i18n-exempt: class tokens only
      // placeholder + file input follow tokenized colors
      "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium", // i18n-exempt: class tokens only
      // ring uses tokenized color and widths
      "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring", // i18n-exempt: class tokens only
      "disabled:cursor-not-allowed disabled:opacity-50",
      // floating-label tweak
      floatingLabel && "peer pt-5",
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

    /* ------------------------------------------------------------------ *
     *  Render
     * ------------------------------------------------------------------ */
    return (
      <div className={cn("relative", wrapperClassName)}>
        {floatingLabel ? (
          <>
            <input
              id={inputId}
              ref={ref}
              data-token="--color-bg"
              className={baseClasses}
              aria-invalid={error ? true : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-muted-foreground pointer-events-none absolute top-2 ms-3 transition-all", // i18n-exempt: classes only
                  (focused || hasValue) && "-translate-y-3 text-xs" // i18n-exempt: classes only
                )}
              >
                {label}
              </label>
            )}
          </>
        ) : (
          <>
            {label && (
              <label
                htmlFor={inputId}
                className="block text-sm font-medium"
              >
                {label}
              </label>
            )}
            <input
              id={inputId}
              ref={ref}
              data-token="--color-bg"
              className={baseClasses}
              aria-invalid={error ? true : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
          </>
        )}
        {error && (
          <p className="text-sm text-danger" data-token="--color-danger"> {/* i18n-exempt: classes only */}
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input"; // i18n-exempt: component displayName, not user-facing
