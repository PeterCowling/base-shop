import { useArrayEditor } from "./useArrayEditor";
export default function ReviewsCarouselEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return arrayEditor("reviews", component.reviews, ["nameKey", "quoteKey"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
    });
}
