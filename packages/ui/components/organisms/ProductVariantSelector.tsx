import * as React from "react";
import { cn } from "../../utils/cn";
import { ColorSwatch } from "../atoms/ColorSwatch";
import { QuantityInput } from "../molecules/QuantityInput";

export interface VariantSelectorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  sizes?: string[];
  quantity?: number;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  onQuantityChange?: (qty: number) => void;
  selectedColor?: string;
  selectedSize?: string;
}

/**
 * UI controls for selecting product variants (color, size, quantity).
 */
export function ProductVariantSelector({
  colors,
  sizes,
  quantity = 1,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  selectedColor,
  selectedSize,
  className,
  ...props
}: VariantSelectorProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {colors && (
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              selected={c === selectedColor}
              onClick={() => onColorChange?.(c)}
            />
          ))}
        </div>
      )}
      {sizes && (
        <select
          value={selectedSize}
          onChange={(e) => onSizeChange?.(e.target.value)}
          className="rounded border px-2 py-1"
        >
          {sizes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      <QuantityInput value={quantity} onChange={onQuantityChange} />
    </div>
  );
}
