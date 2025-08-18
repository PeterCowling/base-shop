import type { PageComponent } from "@acme/types";

type ReviewsCarouselComponent = Extract<PageComponent, { type: "ReviewsCarousel" }>;
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: ReviewsCarouselComponent;
  onChange: (patch: Partial<ReviewsCarouselComponent>) => void;
}

export default function ReviewsCarouselEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ReviewsCarouselComponent>(onChange);
  return arrayEditor("reviews", component.reviews, ["nameKey", "quoteKey"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
