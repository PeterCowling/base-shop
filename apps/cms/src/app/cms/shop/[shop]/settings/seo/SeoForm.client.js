"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/atoms-shadcn";
import SeoLanguageTabs from "./SeoLanguageTabs";
import useSeoForm from "./useSeoForm";
const TITLE_LIMIT = 70;
const DESC_LIMIT = 160;
export default function SeoForm(props) {
    const { locale, setLocale, seo, baseLocale, handleChange, handleSubmit, saving, errors, warnings, } = useSeoForm(props);
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx(SeoLanguageTabs, { languages: props.languages, locale: locale, onLocaleChange: setLocale, seo: seo, onFieldChange: handleChange, titleLimit: TITLE_LIMIT, descLimit: DESC_LIMIT, baseLocale: baseLocale }), Object.keys(errors).length > 0 && (_jsx("div", { className: "text-sm text-red-600", children: Object.entries(errors).map(([k, v]) => (_jsx("p", { children: v.join("; ") }, k))) })), warnings.length > 0 && (_jsx("div", { className: "text-sm text-yellow-700", children: warnings.map((w) => (_jsx("p", { children: w }, w))) })), _jsx(Button, { type: "submit", disabled: saving, className: "w-fit", children: saving ? "Saving…" : "Save" })] }));
}
