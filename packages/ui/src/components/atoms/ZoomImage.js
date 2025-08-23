import { jsx as _jsx } from "react/jsx-runtime";
import Image, {} from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
export const ZoomImage = React.forwardRef(({ alt, className, zoomScale = 1.25, ...props }, ref) => {
    const [zoom, setZoom] = React.useState(false);
    return (_jsx("figure", { ref: ref, onClick: () => setZoom(!zoom), className: cn("relative w-full cursor-zoom-in overflow-hidden", zoom && "cursor-zoom-out"), children: _jsx(Image, { alt: alt ?? "", ...props, className: cn("object-cover transition-transform duration-300", zoom ? "scale-125" : "scale-100", className), style: { transform: zoom ? `scale(${zoomScale})` : undefined } }) }));
});
ZoomImage.displayName = "ZoomImage";
