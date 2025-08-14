import type { ValuePropsComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: ValuePropsComponent;
  onChange: (patch: Partial<ValuePropsComponent>) => void;
}

export default function ValuePropsEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ValuePropsComponent>(onChange);
  return arrayEditor("items", component.items, ["icon", "title", "desc"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
