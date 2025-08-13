import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function StoreLocatorBlockEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  const handleNumber = (field: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ [field]: isNaN(num as number) ? undefined : num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {arrayEditor("locations", (component as any).locations, ["lat", "lng", "label"])}
      <Input
        label="Zoom"
        type="number"
        value={(component as any).zoom ?? ""}
        onChange={(e) => handleNumber("zoom", e.target.value)}
      />
    </div>
  );
}
