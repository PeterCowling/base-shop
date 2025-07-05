/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Card, CardContent, Input } from "@/components/atoms-shadcn";
import { useProductEditorFormState } from "@ui/hooks/useProductEditorFormState";
import MultilingualFields from "./MultilingualFields";
import PublishLocationSelector from "./PublishLocationSelector";
/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
export default function ProductEditorForm({ product: init, onSave, locales, }) {
    const { product, errors, saving, publishTargets, setPublishTargets, handleChange, handleSubmit, uploader, } = useProductEditorFormState(init, locales, onSave);
    /* ---------------- UI ---------------- */
    return (_jsx(Card, { className: "mx-auto max-w-3xl", children: _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "@container grid gap-6", children: [Object.keys(errors).length > 0 && (_jsx("div", { className: "text-sm text-red-600", children: Object.entries(errors).map(([k, v]) => (_jsx("p", { children: v.join("; ") }, k))) })), _jsx(Input, { type: "hidden", name: "id", value: product.id }), _jsxs("label", { className: "flex max-w-xs flex-col gap-1", children: [_jsx("span", { children: "Price\u00A0(cents)" }), _jsx(Input, { type: "number", name: "price", value: product.price, onChange: handleChange, required: true })] }), _jsx(PublishLocationSelector, { selectedIds: publishTargets, onChange: setPublishTargets, showReload: true }), uploader, _jsx(MultilingualFields, { locales: locales, product: product, onChange: handleChange }), _jsx(Button, { type: "submit", disabled: saving, className: "w-fit", children: saving ? "Saving…" : "Save" })] }) }) }));
}
