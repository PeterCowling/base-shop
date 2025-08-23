import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export function ARViewer({ src, className, ...props }) {
    React.useEffect(() => {
        if (customElements.get("model-viewer"))
            return;
        const script = document.createElement("script");
        script.type = "module";
        script.src =
            "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, []);
    return (_jsx("model-viewer", { src: src, ar: true, "camera-controls": true, className: cn("h-full w-full", className), ...props }));
}
