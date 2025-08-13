import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function FeaturedProductEditor({ component, onChange }: Props) {
  const mode = (component as any).mode ?? "sku";
  return (
    <div className="space-y-2">
      <Select
        value={mode}
        onValueChange={(v) => onChange({ mode: v } as Partial<PageComponent>)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sku">SKU</SelectItem>
          <SelectItem value="collection">Collection</SelectItem>
        </SelectContent>
      </Select>
      {mode === "sku" ? (
        <Input
          label="SKU"
          value={(component as any).sku ?? ""}
          onChange={(e) => onChange({ sku: e.target.value } as Partial<PageComponent>)}
        />
      ) : (
        <Input
          label="Collection ID"
          value={(component as any).collectionId ?? ""}
          onChange={(e) =>
            onChange({ collectionId: e.target.value } as Partial<PageComponent>)
          }
        />
      )}
    </div>
  );
}
