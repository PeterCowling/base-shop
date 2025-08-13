import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function FeaturedProductEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Input
        label="SKU"
        placeholder="sku"
        value={(component as any).sku ?? ""}
        onChange={(e) => onChange({ sku: e.target.value } as Partial<PageComponent>)}
      />
      <Input
        label="Collection ID"
        placeholder="collectionId"
        value={(component as any).collectionId ?? ""}
        onChange={(e) =>
          onChange({ collectionId: e.target.value } as Partial<PageComponent>)
        }
      />
    </div>
  );
}
