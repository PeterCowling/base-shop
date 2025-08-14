import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

type FeaturedProductComponent = PageComponent & {
  type: "FeaturedProduct";
  sku?: string;
  collectionId?: string;
};

interface Props {
  component: FeaturedProductComponent;
  onChange: (patch: Partial<FeaturedProductComponent>) => void;
}

export default function FeaturedProductEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Input
        label="SKU"
        placeholder="sku"
        value={component.sku ?? ""}
        onChange={(e) => onChange({ sku: e.target.value })}
      />
      <Input
        label="Collection ID"
        placeholder="collectionId"
        value={component.collectionId ?? ""}
        onChange={(e) => onChange({ collectionId: e.target.value })}
      />
    </div>
  );
}
