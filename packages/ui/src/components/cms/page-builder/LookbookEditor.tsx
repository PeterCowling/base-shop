import type { PageComponent } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
import Lookbook, { Hotspot } from "../blocks/Lookbook";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function LookbookEditor({ component, onChange }: Props) {
  const hotspots: Hotspot[] = (component as any).hotspots ?? [];

  const handleHotspotChange = (index: number, x: number, y: number) => {
    const next = [...hotspots];
    next[index] = { ...next[index], x, y };
    onChange({ hotspots: next } as Partial<PageComponent>);
  };

  const handleSkuChange = (index: number, sku: string) => {
    const next = [...hotspots];
    next[index] = { ...next[index], sku };
    onChange({ hotspots: next } as Partial<PageComponent>);
  };

  const handleAdd = () => {
    onChange({
      hotspots: [...hotspots, { x: 50, y: 50, sku: "" }],
    } as Partial<PageComponent>);
  };

  const handleRemove = (idx: number) => {
    const next = hotspots.filter((_, i) => i !== idx);
    onChange({ hotspots: next } as Partial<PageComponent>);
  };

  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={(component as any).src ?? ""}
          onChange={(e) => handleInput("src", e.target.value)}
          placeholder="src"
          className="flex-1"
        />
        <ImagePicker onSelect={(url) => handleInput("src", url)}>
          <Button type="button" variant="outline">
            Pick
          </Button>
        </ImagePicker>
      </div>
      <Input
        value={(component as any).alt ?? ""}
        onChange={(e) => handleInput("alt", e.target.value)}
        placeholder="alt"
      />
      { (component as any).src && (
        <div className="relative aspect-video w-full">
          <Lookbook
            src={(component as any).src}
            alt={(component as any).alt}
            hotspots={hotspots}
            onHotspotChange={handleHotspotChange}
          />
        </div>
      )}
      {hotspots.map((hs, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <Input
            placeholder="SKU"
            value={hs.sku ?? ""}
            onChange={(e) => handleSkuChange(idx, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="destructive"
            onClick={() => handleRemove(idx)}
            disabled={hotspots.length <= ((component as any).minItems ?? 0)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        onClick={handleAdd}
        disabled={hotspots.length >= ((component as any).maxItems ?? Infinity)}
      >
        Add hotspot
      </Button>
    </div>
  );
}

