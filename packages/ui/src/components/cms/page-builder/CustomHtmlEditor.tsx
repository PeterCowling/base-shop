import type { CustomHtmlComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

interface Props {
  component: CustomHtmlComponent;
  onChange: (patch: Partial<CustomHtmlComponent>) => void;
}

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
