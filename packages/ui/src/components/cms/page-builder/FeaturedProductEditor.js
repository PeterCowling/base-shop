import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function FeaturedProductEditor({ component, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "SKU", placeholder: "sku", value: component.sku ?? "", onChange: (e) => onChange({ sku: e.target.value }) }), _jsx(Input, { label: "Collection ID", placeholder: "collectionId", value: component.collectionId ?? "", onChange: (e) => onChange({ collectionId: e.target.value }) })] }));
}
