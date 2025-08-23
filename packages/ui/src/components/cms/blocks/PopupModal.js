"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
export default function PopupModal({ width = "400px", height = "300px", trigger = "load", delay = 0, content = "", }) {
    const [open, setOpen] = useState(trigger === "load" && delay === 0);
    const sanitized = DOMPurify.sanitize(content);
    useEffect(() => {
        let timer;
        if (trigger === "delay") {
            timer = setTimeout(() => setOpen(true), delay);
        }
        else if (trigger === "exit") {
            const handleMouseLeave = (e) => {
                if (e.clientY <= 0) {
                    setOpen(true);
                    document.removeEventListener("mouseleave", handleMouseLeave);
                }
            };
            document.addEventListener("mouseleave", handleMouseLeave);
            return () => {
                document.removeEventListener("mouseleave", handleMouseLeave);
            };
        }
        else {
            setOpen(true);
        }
        return () => {
            if (timer)
                clearTimeout(timer);
        };
    }, [trigger, delay]);
    useEffect(() => {
        if (!open)
            return;
        const handleKey = (e) => {
            if (e.key === "Escape")
                setOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setOpen(false), children: _jsxs("div", { className: "relative bg-white p-4 shadow-lg", style: { width, height }, onClick: (e) => e.stopPropagation(), children: [content && (_jsx("div", { dangerouslySetInnerHTML: { __html: sanitized } })), _jsx("button", { type: "button", "aria-label": "Close", className: "absolute right-2 top-2 text-xl", onClick: () => setOpen(false), children: "\u00D7" })] }) }));
}
