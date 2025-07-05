// apps/cms/src/app/cms/shop/[shop]/settings/ShopEditor.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input, Textarea } from "@/components/atoms-shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { useState } from "react";
export default function ShopEditor({ shop, initial }) {
    const [info, setInfo] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        const { name, value } = e.target;
        setInfo((prev) => ({ ...prev, [name]: value }));
    };
    const handleFilters = (e) => {
        setInfo((prev) => ({
            ...prev,
            catalogFilters: e.target.value.split(/,\s*/),
        }));
    };
    const handleTokens = (e) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setInfo((prev) => ({ ...prev, themeTokens: parsed }));
        }
        catch {
            // ignore invalid JSON
        }
    };
    const handleMappings = (e) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setInfo((prev) => ({ ...prev, filterMappings: parsed }));
        }
        catch {
            // ignore invalid JSON
        }
    };
    const handlePriceOverrides = (e) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setInfo((prev) => ({ ...prev, priceOverrides: parsed }));
        }
        catch {
            // ignore invalid JSON
        }
    };
    const handleLocaleOverrides = (e) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setInfo((prev) => ({ ...prev, localeOverrides: parsed }));
        }
        catch {
            // ignore invalid JSON
        }
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const fd = new FormData();
        fd.append("id", info.id);
        fd.append("name", info.name);
        fd.append("themeId", info.themeId);
        fd.append("catalogFilters", info.catalogFilters.join(","));
        fd.append("themeTokens", JSON.stringify(info.themeTokens));
        fd.append("filterMappings", JSON.stringify(info.filterMappings));
        fd.append("priceOverrides", JSON.stringify(info.priceOverrides ?? {}));
        fd.append("localeOverrides", JSON.stringify(info.localeOverrides ?? {}));
        const result = await updateShop(shop, fd);
        if (result.errors) {
            setErrors(result.errors);
        }
        else if (result.shop) {
            setInfo(result.shop);
            setErrors({});
        }
        setSaving(false);
    };
    return (_jsxs("form", { onSubmit: onSubmit, className: "@container grid max-w-md gap-4 @sm:grid-cols-2", children: [Object.keys(errors).length > 0 && (_jsx("div", { className: "text-sm text-red-600", children: Object.entries(errors).map(([k, v]) => (_jsx("p", { children: v.join("; ") }, k))) })), _jsx(Input, { type: "hidden", name: "id", value: info.id }), _jsx(Input, { type: "hidden", name: "id", value: info.id }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Name" }), _jsx(Input, { className: "border p-2", name: "name", value: info.name, onChange: handleChange })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Theme" }), _jsx(Input, { className: "border p-2", name: "themeId", value: info.themeId, onChange: handleChange })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Catalog Filters (comma separated)" }), _jsx(Input, { className: "border p-2", name: "catalogFilters", value: info.catalogFilters.join(","), onChange: handleFilters })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Theme Tokens (JSON)" }), _jsx(Textarea, { name: "themeTokens", defaultValue: JSON.stringify(info.themeTokens, null, 2), onChange: handleTokens, rows: 4 })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Filter Mappings (JSON)" }), _jsx(Textarea, { name: "filterMappings", defaultValue: JSON.stringify(info.filterMappings, null, 2), onChange: handleMappings, rows: 4 })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Price Overrides (JSON)" }), _jsx(Textarea, { name: "priceOverrides", defaultValue: JSON.stringify(info.priceOverrides ?? {}, null, 2), onChange: handlePriceOverrides, rows: 4 })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Locale Overrides (JSON)" }), _jsx(Textarea, { name: "localeOverrides", defaultValue: JSON.stringify(info.localeOverrides ?? {}, null, 2), onChange: handleLocaleOverrides, rows: 4 })] }), _jsx(Button, { className: "bg-primary text-white", disabled: saving, type: "submit", children: saving ? "Saving…" : "Save" })] }));
}
