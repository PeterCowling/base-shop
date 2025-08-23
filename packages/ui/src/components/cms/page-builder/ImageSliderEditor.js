import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
export default function ImageSliderEditor({ component, onChange }) {
    const slides = component.slides ?? [];
    const min = component.minItems ?? 0;
    const max = component.maxItems ?? Infinity;
    const update = (idx, field, value) => {
        const next = [...slides];
        next[idx] = { ...next[idx], [field]: value };
        onChange({ slides: next });
    };
    const move = (from, to) => {
        const next = [...slides];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange({ slides: next });
    };
    const remove = (idx) => {
        const next = slides.filter((_, i) => i !== idx);
        onChange({ slides: next });
    };
    const add = () => {
        onChange({ slides: [...slides, { src: "", alt: "", caption: "" }] });
    };
    return (_jsxs("div", { className: "space-y-2", children: [slides.map((s, idx) => (_jsxs("div", { className: "space-y-1 rounded border p-2", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Input, { value: s.src ?? "", onChange: (e) => update(idx, "src", e.target.value), placeholder: "src", className: "flex-1" }), _jsx(ImagePicker, { onSelect: (url) => update(idx, "src", url), children: _jsx(Button, { type: "button", variant: "outline", children: "Pick" }) })] }), _jsx(Input, { value: s.alt ?? "", onChange: (e) => update(idx, "alt", e.target.value), placeholder: "alt" }), _jsx(Input, { value: s.caption ?? "", onChange: (e) => update(idx, "caption", e.target.value), placeholder: "caption" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", onClick: () => move(idx, idx - 1), disabled: idx === 0, children: "Up" }), _jsx(Button, { type: "button", onClick: () => move(idx, idx + 1), disabled: idx === slides.length - 1, children: "Down" }), _jsx(Button, { type: "button", variant: "destructive", onClick: () => remove(idx), disabled: slides.length <= min, children: "Remove" })] })] }, idx))), _jsx(Button, { onClick: add, disabled: slides.length >= max, children: "Add" })] }));
}
