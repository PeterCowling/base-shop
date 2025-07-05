import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/home/ValueProps.tsx
import { useTranslations } from "@/i18n/Translations";
import { memo } from "react";
function ValuePropsInner({ items = [] }) {
    const t = useTranslations();
    const defaultItems = [
        {
            icon: "🌱",
            title: t("value.eco.title"),
            desc: t("value.eco.desc"),
        },
        {
            icon: "🚚",
            title: t("value.ship.title"),
            desc: t("value.ship.desc"),
        },
        {
            icon: "↩️",
            title: t("value.return.title"),
            desc: t("value.return.desc"),
        },
    ];
    const data = items.length ? items : defaultItems;
    return (_jsxs("section", { className: "mx-auto grid max-w-6xl gap-2 px-4 py-4 sm:grid-cols-3", children: [" ", data.map(({ icon, title, desc }) => (_jsxs("article", { className: "text-center", children: [_jsx("div", { className: "mb-4 text-4xl", children: icon }), _jsx("h3", { className: "mb-2 text-xl font-semibold", children: title }), _jsx("p", { className: "text-gray-600", children: desc })] }, title)))] }));
}
export const ValueProps = memo(ValuePropsInner);
export default ValueProps;
