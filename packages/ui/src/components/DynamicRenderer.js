// packages/ui/src/components/DynamicRenderer.tsx
"use client";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { blockRegistry } from "./cms/blocks";
export default function DynamicRenderer({ components, locale, runtimeData, }) {
    const renderBlock = (block) => {
        const entry = blockRegistry[block.type];
        if (!entry) {
            console.warn(`Unknown component type: ${block.type}`);
            return null;
        }
        const { component: Comp, getRuntimeProps } = entry;
        const { id, type: _type, width, height, margin, padding, position, top, left, children: childBlocks, ...rest } = block;
        const style = {
            width,
            height,
            margin,
            padding,
            position,
            top,
            left,
        };
        let extraProps = {};
        if (getRuntimeProps) {
            const runtime = getRuntimeProps(block, locale);
            extraProps = { ...extraProps, ...runtime };
        }
        if (runtimeData && runtimeData[block.type]) {
            extraProps = {
                ...extraProps,
                ...runtimeData[block.type],
            };
        }
        return (_jsx("div", { style: style, children: _jsx(Comp, { ...rest, ...extraProps, id: id, type: _type, locale: locale, children: childBlocks?.map((child) => renderBlock(child)) }) }, id));
    };
    return _jsx(_Fragment, { children: components.map((c) => renderBlock(c)) });
}
