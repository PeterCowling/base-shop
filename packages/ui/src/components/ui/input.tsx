// packages/ui/components/ui/input.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

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
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // floating-label tweak
      floatingLabel && "peer pt-5",
      // error border
      error ? "border-red-500" : undefined,
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
                  "text-muted-foreground pointer-events-none absolute top-2 left-3 transition-all",
                  (focused || hasValue) && "-translate-y-3 text-xs"
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
                className="mb-1 block text-sm font-medium"
              >
                {label}
              </label>
            )}
            <input
              id={inputId}
              ref={ref}
              className={baseClasses}
              aria-invalid={error ? true : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
          </>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
