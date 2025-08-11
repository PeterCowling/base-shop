import type { PageComponent } from "@types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function MapBlockEditor({ component, onChange }: Props) {
  const handleNumber = (field: string, value: string) => {
    const v = value.trim();
    onChange({ [field]: v === "" ? undefined : Number(v) } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        type="number"
        value={(component as any).latitude ?? ""}
        onChange={(e) => handleNumber("latitude", e.target.value)}
        placeholder="latitude"
      />
      <Input
        type="number"
        value={(component as any).longitude ?? ""}
        onChange={(e) => handleNumber("longitude", e.target.value)}
        placeholder="longitude"
      />
      <Input
        type="number"
        value={(component as any).zoom ?? ""}
        onChange={(e) => handleNumber("zoom", e.target.value)}
        placeholder="zoom"
      />
    </div>
  );
}
