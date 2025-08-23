"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/src/components/account/RevokeSessionButton.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revoke } from "./Sessions";
export default function RevokeSessionButton({ sessionId }) {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const handleClick = () => {
        setError(null);
        startTransition(async () => {
            const result = await revoke(sessionId);
            if (result.success) {
                router.refresh();
            }
            else {
                setError(result.error ?? "Failed to revoke session.");
            }
        });
    };
    return (_jsxs("div", { className: "flex flex-col items-end", children: [_jsx("button", { type: "button", onClick: handleClick, disabled: isPending, className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: isPending ? "Revoking..." : "Revoke" }) }), error && (_jsx("p", { className: "mt-2 text-sm text-danger", "data-token": "--color-danger", children: error }))] }));
}
