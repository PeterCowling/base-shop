import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/components/cms/blocks/FAQBlock.tsx
import { Accordion } from "../../molecules/Accordion";
export default function FAQBlock({ items = [], minItems, maxItems, }) {
    const list = items.slice(0, maxItems ?? items.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    const accItems = list.map(({ question, answer }) => ({
        title: question,
        content: answer,
    }));
    return _jsx(Accordion, { items: accItems });
}
