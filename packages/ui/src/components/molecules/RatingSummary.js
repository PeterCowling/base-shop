import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { RatingStars } from "../atoms/RatingStars";
/**
 * Display average rating and optional review count.
 */
export const RatingSummary = React.forwardRef(({ rating, count, className, ...props }, ref) => {
    const rounded = rating.toFixed(1);
    return (_jsxs("div", { ref: ref, className: cn("flex items-center gap-2", className), ...props, children: [_jsx(RatingStars, { rating: rating }), _jsxs("span", { className: "text-sm", children: [rounded, typeof count === "number" && (_jsxs("span", { className: "text-muted", children: [" (", count, ")"] }))] })] }));
});
RatingSummary.displayName = "RatingSummary";
