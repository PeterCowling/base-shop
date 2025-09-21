import type { TestimonialsComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<TestimonialsComponent>;

export default function TestimonialsEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<TestimonialsComponent>(onChange);
  return arrayEditor("testimonials", component.testimonials, ["quote", "name"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
