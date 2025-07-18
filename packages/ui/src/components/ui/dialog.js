import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/components/ui/dialog.tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../utils/cn";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Overlay, { ref: ref, className: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", className), ...props })));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
export const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(DialogPortal, { children: [_jsx(DialogOverlay, {}), _jsxs(DialogPrimitive.Content, { ref: ref, className: cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200", className), ...props, children: [children, _jsxs(DialogPrimitive.Close, { className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none", children: [_jsx(Cross2Icon, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] })));
DialogContent.displayName = DialogPrimitive.Content.displayName;
export const DialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props }));
export const DialogFooter = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className), ...props }));
export const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Title, { ref: ref, className: cn("text-lg font-semibold", className), ...props })));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
export const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Description, { ref: ref, className: cn("text-muted-foreground text-sm", className), ...props })));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
