import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
/**
 * Simple circular swatch button for color selection.
 */
export const ColorSwatch = React.forwardRef(({ color, selected = false, size = 24, className, style, ...props }, ref) => {
    return (_jsx("button", { ref: ref, type: "button", style: {
            backgroundColor: color,
            width: size,
            height: size,
            ...style,
        }, className: cn("rounded-full border", selected ? "ring-2 ring-offset-2" : "", className), ...props }));
});
ColorSwatch.displayName = "ColorSwatch";
