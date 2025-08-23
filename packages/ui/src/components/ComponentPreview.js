"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
class PreviewErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error("Component preview failed", error);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "rounded border p-4 text-red-500", children: "Failed to render preview" }));
        }
        return this.props.children;
    }
}
export default function ComponentPreview({ component, componentProps = {} }) {
    const [NewComp, setNewComp] = useState(null);
    const [OldComp, setOldComp] = useState(null);
    const [showCompare, setShowCompare] = useState(false);
    const [compareMode, setCompareMode] = useState("side");
    const [showNew, setShowNew] = useState(true);
    useEffect(() => {
        const basePath = `@ui/components/${component.file.replace(/\.[jt]sx?$/, "")}`;
        const load = async (p) => {
            if (typeof globalThis !== "undefined" &&
                globalThis.__UPGRADE_MOCKS__?.[p]) {
                return globalThis.__UPGRADE_MOCKS__[p];
            }
            const m = await import(p);
            return m[component.componentName] ?? m.default;
        };
        load(basePath)
            .then((comp) => setNewComp(() => comp))
            .catch((err) => console.error("Failed to load component", component.componentName, err));
        load(`${basePath}.bak`)
            .then((comp) => setOldComp(() => comp))
            .catch(() => { });
    }, [component]);
    return (_jsxs("div", { className: "space-y-2 rounded border p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { children: component.componentName }), OldComp && (_jsx("button", { type: "button", className: "rounded border px-2 py-1", onClick: () => setShowCompare((s) => !s), children: showCompare ? "Hide comparison" : "Compare" }))] }), _jsx(PreviewErrorBoundary, { children: showCompare && OldComp ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setCompareMode("side"), className: `rounded border px-2 py-1 ${compareMode === "side" ? "bg-gray-100" : ""}`, children: "Side by side" }), _jsx("button", { type: "button", onClick: () => setCompareMode("toggle"), className: `rounded border px-2 py-1 ${compareMode === "toggle" ? "bg-gray-100" : ""}`, children: "Toggle" })] }), compareMode === "side" ? (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { children: NewComp ? _jsx(NewComp, { ...componentProps }) : null }), _jsx("div", { children: OldComp ? _jsx(OldComp, { ...componentProps }) : null })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("button", { type: "button", className: "rounded border px-2 py-1", onClick: () => setShowNew((s) => !s), children: showNew ? "Show old" : "Show new" }), _jsx("div", { children: showNew
                                        ? NewComp && _jsx(NewComp, { ...componentProps })
                                        : OldComp && _jsx(OldComp, { ...componentProps }) })] }))] })) : NewComp ? (_jsx(NewComp, { ...componentProps })) : null })] }));
}
