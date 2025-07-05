// apps/cms/src/app/cms/shop/[shop]/settings/seo/VersionTimeline.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, } from "@/components/atoms-shadcn";
import { revertSeo } from "@cms/actions/shops.server";
import { useEffect, useState } from "react";
import { diffHistory } from "../../../../../../../../../packages/platform-core/repositories/settings.server";
/**
 * Displays a drawer listing past settings changes.
 * TODO: render diff using diff2html and implement revert logic
 * once shops-repo-helpers package is available.
 */
export default function VersionTimeline({ shop, trigger, }) {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState([]);
    async function handleRevert(timestamp) {
        await revertSeo(shop, timestamp);
        const next = await diffHistory(shop);
        setHistory(next);
    }
    useEffect(() => {
        if (open) {
            diffHistory(shop)
                .then(setHistory)
                .catch(() => setHistory([]));
        }
    }, [open, shop]);
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: trigger }), _jsxs(DialogContent, { className: "bg-background fixed top-0 right-0 h-full w-96 max-w-full translate-x-full overflow-y-auto border-l p-6 shadow-lg transition-transform data-[state=open]:translate-x-0", children: [_jsx(DialogTitle, { className: "mb-4", children: "Revision History" }), _jsx("div", { className: "space-y-4 text-sm", children: history.length === 0 ? (_jsx("p", { className: "text-muted-foreground", children: "No history available." })) : (_jsx("ul", { className: "space-y-4", children: history.map((entry) => (_jsxs("li", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground font-mono text-xs", children: new Date(entry.timestamp).toLocaleString() }), _jsx(Button, { variant: "outline", className: "h-8 px-2", onClick: () => handleRevert(entry.timestamp), children: "Revert" })] }), _jsx("pre", { className: "bg-muted overflow-auto rounded p-2 text-xs", children: JSON.stringify(entry.diff, null, 2) })] }, entry.timestamp))) })) })] })] }));
}
