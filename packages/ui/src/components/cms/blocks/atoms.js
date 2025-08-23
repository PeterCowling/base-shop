import { jsx as _jsx } from "react/jsx-runtime";
import React, { createElement, memo, } from "react";
import Divider from "./Divider";
import Spacer from "./Spacer";
import CustomHtml from "./CustomHtml";
import ButtonBlock from "./Button";
export { Divider, Spacer, CustomHtml, ButtonBlock as Button };
const defaultPreview = "/window.svg";
export function Text({ text, tag = "p", locale = "en", ...rest }) {
    const value = typeof text === "string" ? text : (text?.[locale] ?? "");
    /* `tag as ValidComponent` erases any possible `undefined` and guarantees the
       argument fits the overload `(type: string | FunctionComponent | ComponentClass)` */
    return createElement(tag, rest, value);
}
export const Image = memo(function Image({ src, alt = "", width, height, ...rest }) {
    if (!src)
        return null;
    return _jsx("img", { src: src, alt: alt, width: width, height: height, ...rest });
});
/* ──────────────────────────────────────────────────────────────────────────
 * Atom registry
 * --------------------------------------------------------------------------*/
const atomEntries = {
    Text: { component: Text, previewImage: "/file.svg" },
    Image: { component: Image, previewImage: "/globe.svg" },
    Divider: { component: Divider },
    Spacer: { component: Spacer },
    CustomHtml: { component: CustomHtml },
    Button: { component: ButtonBlock },
};
export const atomRegistry = Object.entries(atomEntries).reduce((acc, [k, v]) => {
    acc[k] = {
        previewImage: defaultPreview,
        ...v,
    };
    return acc;
}, {});
