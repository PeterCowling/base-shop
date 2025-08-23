import { useArrayEditor } from "./useArrayEditor";
export default function FAQBlockEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("items", component.items, ["question", "answer"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
