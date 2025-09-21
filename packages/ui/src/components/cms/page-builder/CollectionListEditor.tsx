import type { CollectionListComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<CollectionListComponent>;

export default function CollectionListEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<CollectionListComponent>(onChange);
  const handleNum = (field: keyof CollectionListComponent & string, value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ [field]: isNaN(num!) ? undefined : num } as Partial<CollectionListComponent>);
  };

  return (
    <div className="space-y-2">
      {arrayEditor(
        "collections",
        component.collections,
        ["id", "title", "image"],
        {
          minItems: component.minItems,
          maxItems: component.maxItems,
        }
      )}
      <Input
        label="Desktop Items"
        type="number"
        value={component.desktopItems ?? ""}
        onChange={(e) => handleNum("desktopItems", e.target.value)}
      />
      <Input
        label="Tablet Items"
        type="number"
        value={component.tabletItems ?? ""}
        onChange={(e) => handleNum("tabletItems", e.target.value)}
      />
      <Input
        label="Mobile Items"
        type="number"
        value={component.mobileItems ?? ""}
        onChange={(e) => handleNum("mobileItems", e.target.value)}
      />
    </div>
  );
}
