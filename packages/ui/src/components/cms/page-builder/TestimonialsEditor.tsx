import type { TestimonialsComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: TestimonialsComponent;
  onChange: (patch: Partial<TestimonialsComponent>) => void;
}

export default function TestimonialsEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<TestimonialsComponent>(onChange);
  return arrayEditor("testimonials", component.testimonials, ["quote", "name"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
