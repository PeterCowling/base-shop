import type { PageComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

type ProductBundleComponent = PageComponent & {
  type: "ProductBundle";
  skus?: string[];
  discount?: number;
  quantity?: number;
};

interface Props {
  component: ProductBundleComponent;
  onChange: (patch: Partial<ProductBundleComponent>) => void;
}

export default function ProductBundleEditor({ component, onChange }: Props) {
  const handleSkus = (value: string) => {
    const items = value
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ skus: items });
  };

  return (
    <div className="space-y-2">
      <Textarea
        label="SKUs"
        placeholder="skus"
        value={(component.skus ?? []).join(",")}
        onChange={(e) => handleSkus(e.target.value)}
      />
      <Input
        label="Discount (%)"
        placeholder="discount"
        type="number"
        value={component.discount ?? ""}
        onChange={(e) => onChange({ discount: Number(e.target.value) })}
      />
      <Input
        label="Quantity"
        placeholder="quantity"
        type="number"
        value={component.quantity ?? ""}
        onChange={(e) => onChange({ quantity: Number(e.target.value) })}
      />
    </div>
  );
}

