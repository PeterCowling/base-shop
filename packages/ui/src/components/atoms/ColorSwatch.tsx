import * as React from "react";
import { cn } from "../../utils/style";

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
>(({ color, selected = false, size = 24, className, ...props }, ref) => {
  const dimension = `h-[${size}px] w-[${size}px]`;
  const normalized = typeof color === "string" ? color.replace(/\s+/g, "") : String(color);
  const bgClass = `bg-[${normalized}]`;
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "rounded-full border", // i18n-exempt -- DEV-000 CSS utility class names
        dimension,
        bgClass,
        selected ? "ring-2 ring-offset-2" : "", // i18n-exempt -- DEV-000 CSS utility class names
        className
      )}
      {...props}
    />
  );
});
ColorSwatch.displayName = "ColorSwatch"; // i18n-exempt -- DEV-000 component displayName, not user-facing
