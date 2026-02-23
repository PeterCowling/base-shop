import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
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
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

/**
 * Simple circular swatch button for color selection.
 */
export const ColorSwatch = (
  {
    ref,
    color,
    selected = false,
    size = 24,
    className,
    style,
    label,
    shape,
    radius,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    type = "button",
    ...props
  }: ColorSwatchProps & {
    ref?: React.Ref<HTMLButtonElement>;
  }
) => {
  const normalizedColor =
    typeof color === "string" ? color.trim() : String(color);
  const sizePx = Number.isFinite(size) ? Number(size) : 24;
  const resolvedAriaLabel = ariaLabel ?? label ?? normalizedColor;
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "full",
  });

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
        "border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", // i18n-exempt -- DEV-000 CSS utility class names
        shapeRadiusClass,
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
};
