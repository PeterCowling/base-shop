import * as React from "react";
import { cn } from "../../utils/cn";

export interface ColorSwatchProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  color: string;
  selected?: boolean;
  /**
   * Width/height of the swatch in pixels. Defaults to 24.
   */
  size?: number;
}

/**
 * Simple circular swatch button for color selection.
 */
export const ColorSwatch = React.forwardRef<
  HTMLButtonElement,
  ColorSwatchProps
>(({ color, selected = false, size = 24, className, style, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        ...style,
      }}
      className={cn(
        "rounded-full border",
        selected ? "ring-2 ring-offset-2" : "",
        className
      )}
      {...props}
    />
  );
});
ColorSwatch.displayName = "ColorSwatch";
