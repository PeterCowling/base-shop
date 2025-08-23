import { useArrayEditor } from "./useArrayEditor";
export default function GalleryEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("images", component.images, ["src", "alt"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
