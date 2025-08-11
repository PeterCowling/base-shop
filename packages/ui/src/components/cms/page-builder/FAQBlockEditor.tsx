import type { PageComponent } from "@types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function FAQBlockEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return arrayEditor(
    "items",
    (component as any).items,
    ["question", "answer"],
    {
      minItems: (component as any).minItems,
      maxItems: (component as any).maxItems,
    }
  );
}
