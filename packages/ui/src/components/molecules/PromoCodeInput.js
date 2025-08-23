import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
export const PromoCodeInput = React.forwardRef(({ onApply, loading = false, className, ...props }, ref) => {
    const [code, setCode] = React.useState("");
    function handleSubmit(e) {
        e.preventDefault();
        if (onApply)
            onApply(code);
    }
    return (_jsxs("form", { ref: ref, onSubmit: handleSubmit, className: cn("flex items-center gap-2", className), ...props, children: [_jsx(Input, { value: code, onChange: (e) => setCode(e.target.value), placeholder: "Promo code", className: "flex-1" }), _jsx(Button, { type: "submit", disabled: !code || loading, children: loading ? "Applying..." : "Apply" })] }));
});
PromoCodeInput.displayName = "PromoCodeInput";
