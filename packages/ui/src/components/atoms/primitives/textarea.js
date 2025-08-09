// packages/ui/components/atoms/primitives/textarea.tsx
"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../../utils/cn";
export const Textarea = React.forwardRef(({ className, label, error, floatingLabel, wrapperClassName, id, onFocus, onBlur, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const [focused, setFocused] = React.useState(false);
    /* ------------------------------------------------------------------
     * Tailwind / shadcn class string
     * ------------------------------------------------------------------ */
    const hasError = Boolean(error); // avoids 0 | 0n union in type-inference
    const baseClasses = cn("min-h-[6rem] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900", floatingLabel && "peer pt-5", hasError && "border-red-500", className);
    /* ------------------------------------------------------------------
     * Focus helpers
     * ------------------------------------------------------------------ */
    const handleFocus = (e) => {
        setFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e) => {
        setFocused(false);
        onBlur?.(e);
    };
    const hasValue = props.value !== undefined
        ? String(props.value).length > 0
        : Boolean(props.defaultValue);
    /* ------------------------------------------------------------------
     * Render
     * ------------------------------------------------------------------ */
    return (_jsxs("div", { className: cn("relative", wrapperClassName), children: [floatingLabel ? (_jsxs(_Fragment, { children: [_jsx("textarea", { id: textareaId, ref: ref, className: baseClasses, "aria-invalid": hasError || undefined, onFocus: handleFocus, onBlur: handleBlur, ...props }), label && (_jsx("label", { htmlFor: textareaId, className: cn("text-muted-foreground pointer-events-none absolute top-2 left-3 transition-all", (focused || hasValue) && "-translate-y-3 text-xs"), children: label }))] })) : (_jsxs(_Fragment, { children: [label && (_jsx("label", { htmlFor: textareaId, className: "mb-1 block text-sm font-medium", children: label })), _jsx("textarea", { id: textareaId, ref: ref, className: baseClasses, "aria-invalid": hasError || undefined, onFocus: handleFocus, onBlur: handleBlur, ...props })] })), error && _jsx("p", { className: "mt-1 text-sm text-red-600", children: error })] }));
});
Textarea.displayName = "Textarea";
