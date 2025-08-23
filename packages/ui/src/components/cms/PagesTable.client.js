// packages/ui/components/cms/PagesTable.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import DataTable, {} from "./DataTable";
export default function PagesTable({ shop, pages, canWrite = false }) {
    const columns = [
        {
            header: "Slug",
            render: (p) => p.slug,
        },
        {
            header: "Status",
            width: "8rem",
            render: (p) => p.status,
        },
    ];
    if (canWrite) {
        columns.push({
            header: "Actions",
            width: "6rem",
            render: (p) => (_jsx(Link, { href: `/cms/shop/${shop}/pages/${p.slug}/builder`, className: "bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-primary-fg", children: "Edit" })),
        });
    }
    return (_jsxs("div", { className: "space-y-4", children: [canWrite && (_jsx(Link, { href: `/cms/shop/${shop}/pages/new/builder`, className: "bg-primary hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-primary-fg", children: "New Page" })), _jsx(DataTable, { rows: pages, columns: columns })] }));
}
