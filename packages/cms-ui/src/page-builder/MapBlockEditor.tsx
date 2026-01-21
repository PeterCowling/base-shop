import type { MapBlockComponent } from "@acme/types";

import { Input } from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<MapBlockComponent>;

export default function MapBlockEditor({ component, onChange }: Props) {
  const handleNumber = (field: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ [field]: num } as Partial<MapBlockComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Latitude"
        type="number"
        value={component.lat ?? ""}
        onChange={(e) => handleNumber("lat", e.target.value)}
      />
      <Input
        label="Longitude"
        type="number"
        value={component.lng ?? ""}
        onChange={(e) => handleNumber("lng", e.target.value)}
      />
      <Input
        label="Zoom"
        type="number"
        value={component.zoom ?? ""}
        onChange={(e) => handleNumber("zoom", e.target.value)}
      />
    </div>
  );
}
