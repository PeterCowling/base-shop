// packages/ui/src/components/cms/page-builder/ComponentEditor.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from "react";
import { Accordion } from "../../atoms/shadcn";
import LayoutPanel from "./panels/LayoutPanel";
import ContentPanel from "./panels/ContentPanel";
import InteractionsPanel from "./panels/InteractionsPanel";
import useComponentInputs from "./useComponentInputs";
import useComponentResize from "./useComponentResize";
function ComponentEditor({ component, onChange, onResize }) {
    const { handleInput } = useComponentInputs(onChange);
    const { handleResize, handleFullSize } = useComponentResize(onResize);
    if (!component)
        return null;
    return (_jsx(Accordion, { items: [
            {
                title: "Layout",
                content: (_jsx(LayoutPanel, { component: component, handleInput: handleInput, handleResize: handleResize, handleFullSize: handleFullSize })),
            },
            {
                title: "Content",
                content: (_jsx(ContentPanel, { component: component, onChange: onChange, handleInput: handleInput })),
            },
            {
                title: "Interactions",
                content: (_jsx(InteractionsPanel, { component: component, handleInput: handleInput })),
            },
        ] }));
}
export default memo(ComponentEditor);
