"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input, Textarea } from "@/components/atoms-shadcn";
import { setFreezeTranslations, updateSeo } from "@cms/actions/shops.server";
import { useState } from "react";
export default function SeoEditor({ shop, languages, initialSeo, initialFreeze = false, }) {
    const [locale, setLocale] = useState(languages[0]);
    const [title, setTitle] = useState(initialSeo[locale]?.title ?? "");
    const [description, setDescription] = useState(initialSeo[locale]?.description ?? "");
    const [image, setImage] = useState(initialSeo[locale]?.image ?? "");
    const [canonicalBase, setCanonicalBase] = useState(initialSeo[locale]?.canonicalBase ?? "");
    const [ogUrl, setOgUrl] = useState(initialSeo[locale]?.ogUrl ?? "");
    const [twitterCard, setTwitterCard] = useState(initialSeo[locale]?.twitterCard ?? "");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [warnings, setWarnings] = useState([]);
    const [freeze, setFreeze] = useState(initialFreeze);
    const handleLocaleChange = (e) => {
        const l = e.target.value;
        setLocale(l);
        if (!freeze) {
            setTitle(initialSeo[l]?.title ?? "");
            setDescription(initialSeo[l]?.description ?? "");
            setImage(initialSeo[l]?.image ?? "");
            setCanonicalBase(initialSeo[l]?.canonicalBase ?? "");
            setOgUrl(initialSeo[l]?.ogUrl ?? "");
            setTwitterCard(initialSeo[l]?.twitterCard ?? "");
        }
        setErrors({});
        setWarnings([]);
    };
    const handleFreezeChange = async (e) => {
        const checked = e.target.checked;
        setFreeze(checked);
        await setFreezeTranslations(shop, checked);
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const fd = new FormData();
        fd.append("locale", locale);
        fd.append("title", title);
        fd.append("description", description);
        fd.append("image", image);
        fd.append("canonicalBase", canonicalBase);
        fd.append("ogUrl", ogUrl);
        fd.append("twitterCard", twitterCard);
        const result = await updateSeo(shop, fd);
        if (result.errors) {
            setErrors(result.errors);
        }
        else {
            setErrors({});
            setWarnings(result.warnings ?? []);
        }
        setSaving(false);
    };
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Locale" }), _jsx("select", { value: locale, onChange: handleLocaleChange, className: "border p-2", children: languages.map((l) => (_jsx("option", { value: l, children: l.toUpperCase() }, l))) })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: freeze, onChange: handleFreezeChange }), _jsx("span", { children: "Freeze translations" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Title" }), _jsx(Input, { className: "border p-2", value: title, onChange: (e) => setTitle(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Description" }), _jsx(Textarea, { rows: 3, value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Image URL" }), _jsx(Input, { className: "border p-2", value: image, onChange: (e) => setImage(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Canonical Base" }), _jsx(Input, { className: "border p-2", value: canonicalBase, onChange: (e) => setCanonicalBase(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Open Graph URL" }), _jsx(Input, { className: "border p-2", value: ogUrl, onChange: (e) => setOgUrl(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "Twitter Card" }), _jsx(Input, { className: "border p-2", value: twitterCard, onChange: (e) => setTwitterCard(e.target.value) })] }), Object.keys(errors).length > 0 && (_jsx("div", { className: "text-sm text-red-600", children: Object.entries(errors).map(([k, v]) => (_jsx("p", { children: v.join("; ") }, k))) })), warnings.length > 0 && (_jsx("div", { className: "text-sm text-yellow-700", children: warnings.map((w) => (_jsx("p", { children: w }, w))) })), _jsx(Button, { className: "bg-primary text-white", type: "submit", disabled: saving, children: saving ? "Saving…" : "Save" })] }));
}
