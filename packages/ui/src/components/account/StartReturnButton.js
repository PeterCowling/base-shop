"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function StartReturnButton({ sessionId }) {
    const [loading, setLoading] = useState(false);
    const [tracking, setTracking] = useState(null);
    const [labelUrl, setLabelUrl] = useState(null);
    const [status, setStatus] = useState(null);
    const [dropOffProvider, setDropOffProvider] = useState(null);
    useEffect(() => {
        if (!tracking)
            return;
        let timer;
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/return?tracking=${tracking}`);
                const data = await res.json();
                if (data.status) {
                    setStatus(data.status);
                }
            }
            catch {
                // ignore errors
            }
        };
        fetchStatus();
        timer = setInterval(fetchStatus, 5000);
        return () => clearInterval(timer);
    }, [tracking]);
    const handleClick = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/return", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (data.tracking) {
                setTracking(data.tracking.number);
                setLabelUrl(data.tracking.labelUrl ?? null);
            }
            if (data.dropOffProvider) {
                setDropOffProvider(data.dropOffProvider);
            }
        }
        catch {
            // ignore errors
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "mt-2", children: [_jsx("button", { type: "button", onClick: handleClick, disabled: loading, className: "rounded bg-primary px-3 py-1", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-foreground", "data-token": "--color-primary-fg", children: loading ? "Processing…" : "Start return" }) }), labelUrl && (_jsx("p", { className: "mt-1 text-sm", children: _jsx("a", { href: labelUrl, target: "_blank", rel: "noopener noreferrer", className: "underline", children: "Download label" }) })), dropOffProvider && (_jsxs("p", { className: "mt-1 text-sm", children: ["Drop-off: ", dropOffProvider] })), tracking && (_jsxs("p", { className: "mt-1 text-sm", children: ["Tracking: ", tracking] })), status && _jsxs("p", { className: "mt-1 text-sm", children: ["Status: ", status] })] }));
}
