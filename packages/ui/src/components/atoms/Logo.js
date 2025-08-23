import { jsx as _jsx } from "react/jsx-runtime";
import Image, {} from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
export const Logo = React.forwardRef(({ className, src, alt, textFallback = "Logo", width = 32, height = 32, ...props }, ref) => {
    if (!src) {
        return _jsx("span", { className: cn("font-bold", className), children: textFallback });
    }
    const widthClass = `w-[${width}px]`;
    const heightClass = `h-[${height}px]`;
    return (_jsx(Image, { ref: ref, src: src, alt: alt ?? "", width: width, height: height, className: cn(widthClass, heightClass, className), ...props }));
});
Logo.displayName = "Logo";
