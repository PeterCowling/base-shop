import type { PageComponent } from "@types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function MapBlockEditor({ component, onChange }: Props) {
  const handleNumber = (field: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ [field]: num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Latitude"
        type="number"
        value={(component as any).lat ?? ""}
        onChange={(e) => handleNumber("lat", e.target.value)}
      />
      <Input
        label="Longitude"
        type="number"
        value={(component as any).lng ?? ""}
        onChange={(e) => handleNumber("lng", e.target.value)}
      />
      <Input
        label="Zoom"
        type="number"
        value={(component as any).zoom ?? ""}
        onChange={(e) => handleNumber("zoom", e.target.value)}
      />
    </div>
  );
}
