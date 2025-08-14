import type { PageComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CustomHtmlEditor({ component, onChange }: Props) {
  return (
    <Textarea
      label="HTML"
      value={(component as any).html ?? ""}
      onChange={(e) => onChange({ html: e.target.value } as any)}
    />
  );
}

