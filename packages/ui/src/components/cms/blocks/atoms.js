import { jsx as _jsx } from "react/jsx-runtime";
import { createElement, memo, } from "react";
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
export const atomRegistry = {
    Text,
    Image,
};
