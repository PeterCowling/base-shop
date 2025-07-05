import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, } from "../atoms-shadcn";
import { LiveChatWidget } from "./LiveChatWidget";
function FakeLiveChatWidget(props) {
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
    React.useEffect(() => {
        if (!open)
            return;
        const id = setTimeout(() => {
            setMessages((m) => [...m, { sender: "bot", text: "Hello from support" }]);
        }, 1000);
        return () => clearTimeout(id);
    }, [open]);
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { className: cn("fixed right-4 bottom-4 z-50 rounded-full shadow-lg", props.className), ...props, children: "Chat" }) }), _jsxs(DialogContent, { className: "flex w-80 flex-col gap-4", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "How can we help?" }) }), _jsx("div", { className: "flex flex-col gap-2 overflow-y-auto py-2", children: messages.map((m, i) => (_jsx("div", { className: m.sender === "user" ? "self-end" : "self-start", children: _jsx("div", { className: cn("rounded px-3 py-1 text-sm", m.sender === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"), children: m.text }) }, i))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), placeholder: "Type a message\u2026", className: "flex-1" }), _jsx(Button, { onClick: send, children: "Send" })] })] })] }));
}
const meta = {
    component: LiveChatWidget,
    render: (args) => _jsx(FakeLiveChatWidget, { ...args }),
};
export default meta;
export const Default = {};
