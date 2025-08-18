import type { PageComponent } from "@acme/types";

type TestimonialsComponent = Extract<PageComponent, { type: "Testimonials" }>;
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
