import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { RatingStars } from "../atoms/RatingStars";
import { Input } from "../atoms/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../atoms/primitives/select";
/**
 * Display a list of product reviews with author and rating.
 */
export function ReviewsList({ reviews, minRating = 0, query = "", filterable = false, onMinRatingChange, onQueryChange, className, ...props }) {
    const [localRating, setLocalRating] = React.useState(minRating);
    const [localQuery, setLocalQuery] = React.useState(query);
    const rating = onMinRatingChange ? minRating : localRating;
    const search = onQueryChange ? query : localQuery;
    const handleRatingChange = (v) => {
        if (onMinRatingChange) {
            onMinRatingChange(v);
        }
        else {
            setLocalRating(v);
        }
    };
    const handleQueryChange = (v) => {
        if (onQueryChange) {
            onQueryChange(v);
        }
        else {
            setLocalQuery(v);
        }
    };
    const normalized = search.trim().toLowerCase();
    const filtered = reviews.filter((r) => {
        const matchesRating = rating === 0 || r.rating >= rating;
        const matchesQuery = normalized.length === 0 ||
            r.author.toLowerCase().includes(normalized) ||
            r.content.toLowerCase().includes(normalized);
        return matchesRating && matchesQuery;
    });
    return (_jsxs("div", { className: cn("space-y-4", className), ...props, children: [filterable && (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Input, { placeholder: "Search reviews\u2026", value: search, onChange: (e) => handleQueryChange(e.target.value), className: "w-48" }), _jsxs(Select, { value: String(rating), onValueChange: (v) => handleRatingChange(Number(v)), children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, { placeholder: "Rating" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0", children: "All ratings" }), _jsx(SelectItem, { value: "5", children: "5 stars" }), _jsx(SelectItem, { value: "4", children: "4 stars & up" }), _jsx(SelectItem, { value: "3", children: "3 stars & up" }), _jsx(SelectItem, { value: "2", children: "2 stars & up" }), _jsx(SelectItem, { value: "1", children: "1 star & up" })] })] })] })), filtered.map((r, i) => (_jsxs("div", { className: "rounded-md border p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "font-semibold", children: r.author }), _jsx(RatingStars, { rating: r.rating })] }), _jsx("p", { className: "mt-2 text-sm", children: r.content }), filtered.length === 0 && (_jsx("p", { className: "text-muted-foreground text-sm", children: "No reviews found." }))] }, i)))] }));
}
