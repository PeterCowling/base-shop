"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, } from "../atoms/shadcn";
/**
 * Simple live chat widget with a toggle button and minimal conversation UI.
 */
export function LiveChatWidget({ className, width = "w-80", bottomOffset = "bottom-4", ...props }) {
    const [open, setOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState("");
    const send = () => {
        const text = input.trim();
        if (!text)
            return;
        setMessages((m) => [
            ...m,
            { sender: "user", text },
            { sender: "bot", text: "Thanks for your message!" },
        ]);
        setInput("");
    };
    const widthClass = typeof width === "number" ? `w-[${width}px]` : width;
    const widthStyle = typeof width === "number" ? { width } : undefined;
    const bottomClass = typeof bottomOffset === "string" && bottomOffset.startsWith("bottom-")
        ? bottomOffset
        : undefined;
    const bottomStyle = bottomClass ? undefined : { bottom: bottomOffset };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { className: cn("fixed right-4 z-50 rounded-full shadow-lg", bottomClass, className), style: bottomStyle, ...props, children: "Chat" }) }), _jsxs(DialogContent, { style: { ...widthStyle, ...bottomStyle }, className: cn("bg-background fixed right-4 flex flex-col gap-4 border p-6 shadow-lg", widthClass, bottomClass), "data-token": "--color-bg", children: [" ", _jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "How can we help?" }) }), _jsx("div", { className: "flex flex-col gap-2 overflow-y-auto py-2", children: messages.map((m, i) => (_jsx("div", { className: m.sender === "user" ? "self-end" : "self-start", children: _jsx("div", { className: cn("rounded px-3 py-1 text-sm", m.sender === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"), "data-token": m.sender === "user" ? "--color-primary" : "--color-muted", children: m.text }) }, i))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Type a message\u2026", className: "flex-1" }), _jsx(Button, { onClick: send, children: "Send" })] })] })] }));
}
