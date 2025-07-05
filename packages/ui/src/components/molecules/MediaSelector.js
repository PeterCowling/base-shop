import { jsx as _jsx } from "react/jsx-runtime";
import Image from "next/image";
import { cn } from "../../utils/cn";
export function MediaSelector({ items, active, onChange, className, ...props }) {
    return (_jsx("div", { className: cn("flex gap-2", className), ...props, children: items.map((item, idx) => (_jsx("button", { type: "button", onClick: () => onChange?.(idx), className: cn("h-16 w-16 overflow-hidden rounded border", active === idx && "ring-2 ring-black"), children: item.type === "image" || item.type === "360" ? (_jsx(Image, { src: item.thumbnail || item.src, alt: "thumbnail", fill: true, className: "object-cover" })) : item.type === "video" ? (_jsx("span", { className: "flex h-full w-full items-center justify-center text-xs", children: "Video" })) : (_jsx("span", { className: "flex h-full w-full items-center justify-center text-xs", children: "AR" })) }, idx))) }));
}
