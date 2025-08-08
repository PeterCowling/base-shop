import type { PageComponent } from "@types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ReviewsCarouselEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return arrayEditor("reviews", (component as any).reviews, [
    "nameKey",
    "quoteKey",
  ]);
}
