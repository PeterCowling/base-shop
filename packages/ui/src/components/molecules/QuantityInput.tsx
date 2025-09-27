"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";

export interface QuantityInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

/**
 * Numeric input with increment/decrement buttons.
 */
export const QuantityInput = React.forwardRef<
  HTMLDivElement,
  QuantityInputProps
>(({ value, min = 1, max = Infinity, onChange, className, ...props }, ref) => {
  const t = useTranslations();
  const handleDec = () => {
    if (value > min && onChange) onChange(value - 1);
  };
  const handleInc = () => {
    if (value < max && onChange) onChange(value + 1);
  };
  return (
    // i18n-exempt: CSS utility class strings
    <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
      <button
        type="button"
        onClick={handleDec}
        disabled={value <= min}
        aria-label={t("quantity.decrement") as string}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded border px-2 disabled:opacity-50"
      >
        <span aria-hidden="true">-</span>{/* i18n-exempt: decorative glyph */}
        <span className="sr-only">{t("quantity.decrement")}</span>
      </button>
      <span className="min-w-6 text-center" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={handleInc}
        disabled={value >= max}
        aria-label={t("quantity.increment") as string}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded border px-2 disabled:opacity-50"
      >
        <span aria-hidden="true">+</span>{/* i18n-exempt: decorative glyph */}
        <span className="sr-only">{t("quantity.increment")}</span>
      </button>
    </div>
  );
});
QuantityInput.displayName = "QuantityInput";
