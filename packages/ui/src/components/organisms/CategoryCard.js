import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";
export const CategoryCard = React.forwardRef(({ category, padding = "p-4", className, ...props }, ref) => (_jsxs("div", { ref: ref, className: cn("flex flex-col gap-3 rounded-lg border", padding, className), ...props, children: [_jsx("div", { className: "relative aspect-square", children: _jsx(Image, { src: category.image, alt: category.title, fill: true, sizes: "(min-width: 640px) 25vw, 50vw", className: "rounded-md object-cover" }) }), _jsx("h3", { className: "font-medium", children: category.title }), category.description && (_jsx("p", { className: "text-muted-foreground text-sm", children: category.description }))] })));
CategoryCard.displayName = "CategoryCard";
