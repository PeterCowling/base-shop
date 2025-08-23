"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/src/components/account/MfaSetup.tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getCsrfToken } from "@acme/shared-utils";
export default function MfaSetup() {
    const [secret, setSecret] = useState(null);
    const [otpauth, setOtpauth] = useState(null);
    const [token, setToken] = useState("");
    const [status, setStatus] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const begin = async () => {
        const csrfToken = getCsrfToken();
        const res = await fetch("/api/mfa/enroll", {
            method: "POST",
            headers: { "x-csrf-token": csrfToken ?? "" },
        });
        if (res.ok) {
            const data = await res.json();
            setSecret(data.secret);
            setOtpauth(data.otpauth);
        }
    };
    const verify = async (e) => {
        e.preventDefault();
        const csrfToken = getCsrfToken();
        const res = await fetch("/api/mfa/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken ?? "",
            },
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setStatus(data.verified ? "MFA enabled" : "Invalid code");
    };
    useEffect(() => {
        if (!otpauth)
            return;
        QRCode.toDataURL(otpauth).then(setQrCode).catch(console.error);
    }, [otpauth]);
    return (_jsxs("div", { className: "space-y-4", children: [!secret && (_jsx("button", { type: "button", onClick: begin, className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: "Generate Secret" }) })), secret && (_jsxs("div", { children: [qrCode && (_jsx("img", { src: qrCode, alt: "MFA QR Code", className: "mb-2" })), _jsxs("p", { className: "mb-2", children: ["Secret: ", secret] }), _jsxs("form", { onSubmit: verify, className: "space-y-2", children: [_jsx("input", { value: token, onChange: (e) => setToken(e.target.value), className: "rounded border p-2", placeholder: "Enter code" }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: "Verify" }) })] })] })), status && _jsx("p", { children: status })] }));
}
