import type { FAQBlockComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: FAQBlockComponent;
  onChange: (patch: Partial<FAQBlockComponent>) => void;
}

export default function FAQBlockEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<FAQBlockComponent>(onChange);
  return arrayEditor("items", component.items, ["question", "answer"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
