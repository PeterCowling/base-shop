// packages/ui/components/ui/textarea.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label displayed above or floating */
  label?: React.ReactNode;
  /** Error message shown below the control */
  error?: React.ReactNode;
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

    const baseClasses = cn(
      "min-h-[6rem] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900",
      floatingLabel && "peer pt-5",
      error && "border-red-500",
      className
    );

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
        : false || Boolean(props.defaultValue);

    return (
      <div className={cn("relative", wrapperClassName)}>
        {floatingLabel ? (
          <>
            <textarea
              id={textareaId}
              ref={ref}
              className={baseClasses}
              aria-invalid={error ? true : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            {label && (
              <label
                htmlFor={textareaId}
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
                htmlFor={textareaId}
                className="mb-1 block text-sm font-medium"
              >
                {label}
              </label>
            )}
            <textarea
              id={textareaId}
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

Textarea.displayName = "Textarea";
