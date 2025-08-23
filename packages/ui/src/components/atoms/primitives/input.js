// packages/ui/components/atoms/primitives/input.tsx
"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../../utils/style";
/* ──────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
export const Input = React.forwardRef(({ className, label, error, floatingLabel, wrapperClassName, id, onFocus, onBlur, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [focused, setFocused] = React.useState(false);
    /* ------------------------------------------------------------------ *
     *  Dynamic classes
     * ------------------------------------------------------------------ */
    const baseClasses = cn(
    // base
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium", "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", "disabled:cursor-not-allowed disabled:opacity-50", 
    // floating-label tweak
    floatingLabel && "peer pt-5", 
    // error border
    error ? "border-red-500" : undefined, 
    // user-supplied
    className);
    /* ------------------------------------------------------------------ *
     *  Handlers
     * ------------------------------------------------------------------ */
    const handleFocus = (e) => {
        setFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e) => {
        setFocused(false);
        onBlur?.(e);
    };
    /* ------------------------------------------------------------------ *
     *  Determine if the control currently holds a value
     * ------------------------------------------------------------------ */
    const hasValue = props.value !== undefined
        ? String(props.value).length > 0
        : Boolean(props.defaultValue);
    /* ------------------------------------------------------------------ *
     *  Render
     * ------------------------------------------------------------------ */
    return (_jsxs("div", { className: cn("relative", wrapperClassName), children: [floatingLabel ? (_jsxs(_Fragment, { children: [_jsx("input", { id: inputId, ref: ref, "data-token": "--color-bg", className: baseClasses, "aria-invalid": error ? true : undefined, onFocus: handleFocus, onBlur: handleBlur, ...props }), label && (_jsx("label", { htmlFor: inputId, className: cn("text-muted-foreground pointer-events-none absolute top-2 left-3 transition-all", (focused || hasValue) && "-translate-y-3 text-xs"), children: label }))] })) : (_jsxs(_Fragment, { children: [label && (_jsx("label", { htmlFor: inputId, className: "mb-1 block text-sm font-medium", children: label })), _jsx("input", { id: inputId, ref: ref, "data-token": "--color-bg", className: baseClasses, "aria-invalid": error ? true : undefined, onFocus: handleFocus, onBlur: handleBlur, ...props })] })), error && (_jsx("p", { className: "mt-1 text-sm text-danger", "data-token": "--color-danger", children: error }))] }));
});
Input.displayName = "Input";
