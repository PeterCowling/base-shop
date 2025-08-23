import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
function Star({ filled, size = 16 }) {
    return (_jsx("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", className: filled ? "fill-yellow-500" : "fill-muted", width: size, height: size, children: _jsx("path", { d: "M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.4 8.173L12 18.902l-7.334 3.868 1.4-8.173L.132 9.211l8.2-1.193z" }) }));
}
export const RatingStars = React.forwardRef(({ rating, size = 16, className, ...props }, ref) => {
    const rounded = Math.round(rating);
    return (_jsx("div", { ref: ref, className: cn("flex gap-0.5", className), ...props, children: Array.from({ length: 5 }).map((_, i) => (_jsx(Star, { filled: i < rounded, size: size }, i))) }));
});
RatingStars.displayName = "RatingStars";
