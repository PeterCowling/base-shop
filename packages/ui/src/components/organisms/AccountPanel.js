import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
export const AccountPanel = React.forwardRef(({ user, onLogout, className, ...props }, ref) => (_jsxs("div", { ref: ref, className: cn("flex items-center gap-4 rounded-md border p-4", className), ...props, children: [user.avatar ? (_jsx(Image, { src: user.avatar, alt: user.name, width: 48, height: 48, className: "rounded-full object-cover" })) : (_jsx("div", { className: "bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full", children: user.name.charAt(0).toUpperCase() })), _jsxs("div", { className: "flex-1 overflow-hidden", children: [_jsx("p", { className: "truncate font-medium", children: user.name }), _jsx("p", { className: "text-muted-foreground truncate text-sm", children: user.email })] }), onLogout && (_jsx(Button, { variant: "outline", onClick: onLogout, className: "shrink-0", children: "Log out" }))] })));
AccountPanel.displayName = "AccountPanel";
