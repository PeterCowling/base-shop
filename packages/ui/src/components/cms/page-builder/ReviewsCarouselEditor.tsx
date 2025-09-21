import type { ReviewsCarouselComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<ReviewsCarouselComponent>;

export default function ReviewsCarouselEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ReviewsCarouselComponent>(onChange);
  return arrayEditor("reviews", component.reviews, ["nameKey", "quoteKey"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
