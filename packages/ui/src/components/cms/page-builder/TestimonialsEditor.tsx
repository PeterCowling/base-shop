import type { PageComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function TestimonialsEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return arrayEditor(
    "testimonials",
    (component as any).testimonials,
    ["quote", "name"],
    {
      minItems: (component as any).minItems,
      maxItems: (component as any).maxItems,
    }
  );
}
