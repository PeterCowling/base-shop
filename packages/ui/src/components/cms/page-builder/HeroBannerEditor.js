import { useArrayEditor } from "./useArrayEditor";
export default function HeroBannerEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("slides", component.slides, ["src", "alt", "headlineKey", "ctaKey"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
