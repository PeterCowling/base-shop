import type { FAQBlockComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<FAQBlockComponent>;

export default function FAQBlockEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<FAQBlockComponent>(onChange);
  return arrayEditor("items", component.items, ["question", "answer"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
