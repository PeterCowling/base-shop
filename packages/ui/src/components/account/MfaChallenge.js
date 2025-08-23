"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
export default function MfaChallenge({ onSuccess, customerId }) {
    const [token, setToken] = useState("");
    const [error, setError] = useState(null);
    const submit = async (e) => {
        e.preventDefault();
        const csrfToken = getCsrfToken();
        const res = await fetch("/api/mfa/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken ?? "",
            },
            body: JSON.stringify(customerId ? { token, customerId } : { token }),
        });
        const data = await res.json();
        if (data.verified) {
            setError(null);
            onSuccess?.();
        }
        else {
            setError("Invalid code");
        }
    };
    return (_jsxs("form", { onSubmit: submit, className: "space-y-2", children: [_jsx("input", { value: token, onChange: (e) => setToken(e.target.value), className: "rounded border p-2", placeholder: "Enter MFA code" }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: "Verify" }) }), error && (_jsx("p", { className: "text-danger", "data-token": "--color-danger", children: error }))] }));
}
