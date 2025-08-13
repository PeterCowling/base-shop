import type { PageComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function PopupModalEditor({ component, onChange }: Props) {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        type="number"
        value={(component as any).width ?? ""}
        onChange={(e) => handleChange("width", Number(e.target.value))}
        placeholder="width"
      />
      <Input
        type="number"
        value={(component as any).height ?? ""}
        onChange={(e) => handleChange("height", Number(e.target.value))}
        placeholder="height"
      />
      <Input
        value={(component as any).trigger ?? ""}
        onChange={(e) => handleChange("trigger", e.target.value)}
        placeholder="trigger (delay|exit-intent)"
      />
      <Textarea
        value={(component as any).content ?? ""}
        onChange={(e) => handleChange("content", e.target.value)}
        placeholder="content"
      />
    </div>
  );
}

