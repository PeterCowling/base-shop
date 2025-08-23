import { useArrayEditor } from "./useArrayEditor";
export default function TestimonialsEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("testimonials", component.testimonials, ["quote", "name"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
