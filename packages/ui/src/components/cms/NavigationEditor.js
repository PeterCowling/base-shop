// packages/ui/components/cms/NavigationEditor.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ulid } from "ulid";
import { Button, Input } from "../atoms/shadcn";
export default function NavigationEditor({ items, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(NavList, { items: items, onChange: onChange }), _jsx(Button, { onClick: () => onChange([...items, { id: ulid(), label: "", url: "", children: [] }]), children: "Add Item" })] }));
}
function NavList({ items, onChange, level = 0, }) {
    const move = (from, to) => {
        if (to < 0 || to >= items.length)
            return;
        const copy = [...items];
        copy.splice(to, 0, copy.splice(from, 1)[0]);
        onChange(copy);
    };
    const update = (idx, item) => {
        const copy = [...items];
        copy[idx] = item;
        onChange(copy);
    };
    const remove = (idx) => {
        const copy = items.filter((_, i) => i !== idx);
        onChange(copy);
    };
    const addChild = (idx) => {
        const item = items[idx];
        const children = item.children ? [...item.children] : [];
        children.push({ id: ulid(), label: "", url: "", children: [] });
        update(idx, { ...item, children });
    };
    return (_jsx("ul", { className: level ? "ml-4 space-y-2" : "space-y-2", children: items.map((item, i) => (_jsxs("li", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: item.label, onChange: (e) => update(i, { ...item, label: e.target.value }), placeholder: "Label" }), _jsx(Input, { value: item.url, onChange: (e) => update(i, { ...item, url: e.target.value }), placeholder: "/path" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: () => move(i, i - 1), children: "\u2191" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: () => move(i, i + 1), children: "\u2193" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: () => addChild(i), children: "+" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: () => remove(i), children: "\u2715" })] }), item.children && item.children.length > 0 && (_jsx(NavList, { items: item.children, onChange: (childs) => update(i, { ...item, children: childs }), level: level + 1 }))] }, item.id))) }));
}
