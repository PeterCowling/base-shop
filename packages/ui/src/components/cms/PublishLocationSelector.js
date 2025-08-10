// packages/ui/components/cms/PublishLocationSelector.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, Input } from "@/components/atoms/shadcn";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { memo, useCallback } from "react";
import { toggleItem } from "@ui/utils/toggleItem";
const equal = (p, n) => p.selectedIds === n.selectedIds &&
    p.onChange === n.onChange &&
    p.showReload === n.showReload;
function PublishLocationSelectorInner({ selectedIds, onChange, showReload = false, }) {
    const { locations, reload } = usePublishLocations();
    const toggle = useCallback((id) => {
        const next = toggleItem(selectedIds, id);
        onChange(next);
    }, [selectedIds, onChange]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-col gap-2", children: locations.map(({ id, name, description, requiredOrientation }) => (_jsxs("label", { className: "flex cursor-pointer items-start gap-2 select-none", children: [_jsx(Input, { type: "checkbox", checked: selectedIds.includes(id), onChange: () => toggle(id), className: "mt-1 h-4 w-4" }), _jsxs("span", { children: [_jsx("span", { className: "font-medium", children: name }), _jsxs("span", { className: "text-muted-foreground ml-1 text-xs", children: ["(", requiredOrientation, ")"] }), description && (_jsxs(_Fragment, { children: [_jsx("br", {}), _jsx("span", { className: "text-muted-foreground text-sm", children: description })] }))] })] }, id))) }), showReload && (_jsx(Button, { type: "button", onClick: reload, variant: "outline", className: "mt-4 inline-flex items-center rounded-2xl p-2 text-sm shadow", children: "Refresh list" }))] }));
}
export default memo(PublishLocationSelectorInner, equal);
