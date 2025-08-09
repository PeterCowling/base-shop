// packages/ui/components/cms/MultilingualFields.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Textarea } from "@ui";
import { memo } from "react";
const label = {
    en: "English",
    de: "Deutsch",
    it: "Italiano",
};
function MultilingualFieldsInner({ locales, product, onChange }) {
    return (_jsx("div", { className: "grid gap-6 @md:grid-cols-3", children: locales.map((l) => (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("h3", { className: "text-sm font-medium", children: label[l] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Title" }), _jsx(Input, { name: `title_${l}`, value: product.title[l], onChange: onChange })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Description" }), _jsx(Textarea, { rows: 4, name: `desc_${l}`, value: product.description[l], onChange: onChange })] })] }, l))) }));
}
export default memo(MultilingualFieldsInner);
