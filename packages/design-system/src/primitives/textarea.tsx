// packages/ui/components/atoms/primitives/textarea.tsx
"use client";

import * as React from "react";

import { FormField } from "../atoms/FormField";
import { cn } from "../utils/style";

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
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      description,
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
    const textareaId = id ?? generatedId;
    const [focused, setFocused] = React.useState(false);

    /* ------------------------------------------------------------------
     * Tailwind / shadcn class string
     * ------------------------------------------------------------------ */
    const hasError = Boolean(error); // avoids 0 | 0n union in type-inference

    const baseClasses = cn(
      "min-h-[6rem] w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      floatingLabel && "peer pt-5",
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

    /* ------------------------------------------------------------------
     * Render
     * ------------------------------------------------------------------ */
    return (
      <FormField
        id={textareaId}
        label={!floatingLabel ? label : undefined}
        description={description}
        error={error}
        {...(required !== undefined ? { required } : {})}
        {...(formClassName !== undefined ? { className: formClassName } : {})}
         
        input={({ id: controlId, describedBy, ariaInvalid }) =>
          floatingLabel ? (
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
                    "text-muted-foreground pointer-events-none absolute top-2 left-3 transition-all", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                    (focused || hasValue) && "-translate-y-3 text-xs" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                  )}
                >
                  {label}
                </label>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
              {label && (
                <label
                  htmlFor={controlId}
                  className="block text-sm font-medium" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                >
                  {label}
                </label>
              )}
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
            </div>
          )
        }
      />
    );
  }
);

Textarea.displayName = "Textarea";
