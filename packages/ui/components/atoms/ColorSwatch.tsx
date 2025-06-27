import * as React from "react";
import { cn } from "../../utils/cn";

export interface ColorSwatchProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  color: string;
  selected?: boolean;
}

/**
 * Simple circular swatch button for color selection.
 */
export const ColorSwatch = React.forwardRef<
  HTMLButtonElement,
  ColorSwatchProps
>(({ color, selected = false, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      style={{ backgroundColor: color }}
      className={cn(
        "h-6 w-6 rounded-full border",
        selected ? "ring-2 ring-offset-2" : "",
        className
      )}
      {...props}
    />
  );
});
ColorSwatch.displayName = "ColorSwatch";
