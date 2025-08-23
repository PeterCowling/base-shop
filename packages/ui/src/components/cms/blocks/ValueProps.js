import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/components/cms/blocks/ValueProps.tsx
import { ValueProps } from "../../home/ValueProps";
export default function CmsValueProps({ items = [], minItems, maxItems, }) {
    const list = items.slice(0, maxItems ?? items.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    return _jsx(ValueProps, { items: list });
}
