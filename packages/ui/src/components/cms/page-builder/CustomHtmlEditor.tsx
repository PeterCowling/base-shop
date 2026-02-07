import type { CustomHtmlComponent } from "@acme/types";

import { Textarea } from "../../atoms/shadcn";

import type { EditorProps } from "./EditorProps";
import useComponentInputs from "./useComponentInputs";

type Props = EditorProps<CustomHtmlComponent>;

export default function CustomHtmlEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<CustomHtmlComponent>(onChange);
  return (
    <Textarea
      label="HTML"
      value={component.html ?? ""}
      onChange={(e) => handleInput("html", e.target.value)}
    />
  );
}
