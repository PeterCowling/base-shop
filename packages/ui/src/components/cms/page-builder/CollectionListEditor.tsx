import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function CollectionListEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  const handleNum = (field: string, value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ [field]: isNaN(num!) ? undefined : num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {arrayEditor(
        "collections",
        (component as any).collections,
        ["id", "title", "image"],
        {
          minItems: (component as any).minItems,
          maxItems: (component as any).maxItems,
        }
      )}
      <Input
        label="Desktop Items"
        type="number"
        value={(component as any).desktopItems ?? ""}
        onChange={(e) => handleNum("desktopItems", e.target.value)}
      />
      <Input
        label="Tablet Items"
        type="number"
        value={(component as any).tabletItems ?? ""}
        onChange={(e) => handleNum("tabletItems", e.target.value)}
      />
      <Input
        label="Mobile Items"
        type="number"
        value={(component as any).mobileItems ?? ""}
        onChange={(e) => handleNum("mobileItems", e.target.value)}
      />
    </div>
  );
}
