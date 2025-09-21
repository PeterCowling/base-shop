import type { ValuePropsComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<ValuePropsComponent>;

export default function ValuePropsEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ValuePropsComponent>(onChange);
  return arrayEditor("items", component.items, ["icon", "title", "desc"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
