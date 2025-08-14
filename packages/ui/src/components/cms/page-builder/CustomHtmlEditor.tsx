import type { PageComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CustomHtmlEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs(onChange);
  return (
    <Textarea
      label="HTML"
      value={(component as any).html ?? ""}
      onChange={(e) => handleInput("html", e.target.value)}
    />
  );
}
