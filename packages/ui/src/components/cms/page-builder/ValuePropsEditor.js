import { useArrayEditor } from "./useArrayEditor";
export default function ValuePropsEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("items", component.items, ["icon", "title", "desc"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
