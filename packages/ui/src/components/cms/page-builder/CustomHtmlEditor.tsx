import type { PageComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CustomHtmlEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <Textarea
      label="HTML"
      value={(component as any).html ?? ""}
      onChange={(e) => handleInput("html", e.target.value)}
    />
  );
}
