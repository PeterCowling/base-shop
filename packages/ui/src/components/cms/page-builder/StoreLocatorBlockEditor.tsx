import type { StoreLocatorBlockComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<StoreLocatorBlockComponent>;

export default function StoreLocatorBlockEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<StoreLocatorBlockComponent>(onChange);
  const handleNumber = (field: keyof StoreLocatorBlockComponent & string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ [field]: isNaN(num as number) ? undefined : num } as Partial<StoreLocatorBlockComponent>);
  };

  return (
    <div className="space-y-2">
      {arrayEditor("locations", component.locations, ["lat", "lng", "label"])}
      <Input
        label="Zoom"
        type="number"
        value={component.zoom ?? ""}
        onChange={(e) => handleNumber("zoom", e.target.value)}
      />
    </div>
  );
}
