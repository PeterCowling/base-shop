import { jsx as _jsx } from "react/jsx-runtime";
import DOMPurify from "dompurify";
import { memo } from "react";
import "./animations.css";
import { blockRegistry } from "../blocks";
function Block({ component, locale }) {
    if (component.type === "Text") {
        const { text } = component;
        const value = typeof text === "string" ? text : text?.[locale] ?? "";
        const sanitized = DOMPurify.sanitize(value);
        return _jsx("div", { dangerouslySetInnerHTML: { __html: sanitized } });
    }
    const entry = blockRegistry[component.type];
    if (!entry)
        return null;
    const Comp = entry.component;
    const { id, type, clickAction, href, animation, ...props } = component;
    const compProps = { ...props };
    if (clickAction === "navigate" && href)
        compProps.href = href;
    let rendered = _jsx(Comp, { ...compProps, locale: locale });
    if (clickAction === "navigate" && href && component.type !== "Button") {
        rendered = (_jsx("a", { href: href, onClick: (e) => e.preventDefault(), className: "cursor-pointer", children: rendered }));
    }
    const animationClass = animation === "fade"
        ? "pb-animate-fade"
        : animation === "slide"
            ? "pb-animate-slide"
            : undefined;
    return animationClass ? _jsx("div", { className: animationClass, children: rendered }) : rendered;
}
export default memo(Block);
