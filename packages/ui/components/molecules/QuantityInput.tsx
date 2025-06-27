import * as React from "react";
import { cn } from "../../utils/cn";

export interface QuantityInputProps
  extends React.HTMLAttributes<HTMLDivElement> {
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
  const handleDec = () => {
    if (value > min && onChange) onChange(value - 1);
  };
  const handleInc = () => {
    if (value < max && onChange) onChange(value + 1);
  };
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <button
        type="button"
        onClick={handleDec}
        disabled={value <= min}
        className="rounded border px-2 disabled:opacity-50"
      >
        -
      </button>
      <span className="min-w-[2ch] text-center">{value}</span>
      <button
        type="button"
        onClick={handleInc}
        disabled={value >= max}
        className="rounded border px-2 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
});
QuantityInput.displayName = "QuantityInput";
