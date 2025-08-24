"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Checkbox, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import { useEffect, useState } from "react";
import useMediaLibrary from "./useMediaLibrary";
export default function VideoBlockEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    const [open, setOpen] = useState(false);
    const { media, loadMedia } = useMediaLibrary();
    useEffect(() => {
        if (open)
            void loadMedia();
    }, [open, loadMedia]);
    const videos = media.filter((m) => m.type === "video");
    const src = component.src;
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { type: "button", variant: "outline", children: src ? "Change video" : "Select video" }) }), _jsxs(DialogContent, { className: "max-w-xl space-y-4", children: [_jsx(DialogTitle, { children: "Select video" }), _jsxs("div", { className: "grid max-h-64 grid-cols-3 gap-2 overflow-auto", children: [videos.map((m) => (_jsx("button", { type: "button", onClick: () => {
                                            handleInput("src", m.url);
                                            setOpen(false);
                                        }, className: "relative aspect-square", children: _jsx("video", { src: m.url, className: "h-full w-full object-cover" }) }, m.url))), videos.length === 0 && (_jsx("p", { className: "text-muted-foreground col-span-3 text-sm", children: "No videos found." }))] })] })] }), src && (_jsx("video", { src: src, controls: true, className: "w-full max-h-64" })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { id: "autoplay", checked: component.autoplay ?? false, onCheckedChange: (checked) => handleInput("autoplay", Boolean(checked)) }), _jsx("label", { htmlFor: "autoplay", className: "text-sm", children: "Autoplay" })] })] }));
}
