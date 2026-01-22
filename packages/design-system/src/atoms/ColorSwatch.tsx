import * as React from "react";

import { cn } from "../utils/style";

export interface ColorSwatchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
  selected?: boolean;
  /**
   * Width/height of the swatch in pixels. Defaults to 24.
   */
  size?: number;
  /**
   * Optional accessible label describing the swatch choice.
   */
  label?: string;
}

/**
 * Simple circular swatch button for color selection.
 */
export const ColorSwatch = React.forwardRef<
  HTMLButtonElement,
  ColorSwatchProps
>(
  (
    {
      color,
      selected = false,
      size = 24,
      className,
      style,
      label,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const normalizedColor =
      typeof color === "string" ? color.trim() : String(color);
    const sizePx = Number.isFinite(size) ? Number(size) : 24;
    const resolvedAriaLabel = ariaLabel ?? label ?? normalizedColor;

    const mergedStyle: React.CSSProperties = {
      backgroundColor: normalizedColor,
      width: sizePx,
      height: sizePx,
      ...style,
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", // i18n-exempt -- DEV-000 CSS utility class names
          selected ? "ring-2 ring-offset-2" : "", // i18n-exempt -- DEV-000 CSS utility class names
          className,
        )}
        aria-pressed={selected}
        aria-label={resolvedAriaLabel}
        aria-labelledby={ariaLabelledBy}
         
        style={mergedStyle}
        {...props}
      />
    );
  },
);
ColorSwatch.displayName = "ColorSwatch";
