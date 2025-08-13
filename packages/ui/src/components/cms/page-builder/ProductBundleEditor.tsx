import type { PageComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductBundleEditor({ component, onChange }: Props) {
  const handleList = (value: string) => {
    const items = value
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ skus: items } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        label="Product SKUs (comma or newline separated)"
        placeholder="skus"
        value={((component as any).skus ?? []).join(",")}
        onChange={(e) => handleList(e.target.value)}
      />
      <Input
        label="Discount %"
        type="number"
        placeholder="discount"
        value={(component as any).discountPercent ?? 0}
        onChange={(e) =>
          onChange({ discountPercent: Number(e.target.value) } as Partial<PageComponent>)
        }
      />
      <Input
        label="Quantity"
        type="number"
        placeholder="quantity"
        value={(component as any).quantity ?? 1}
        onChange={(e) =>
          onChange({ quantity: Number(e.target.value) } as Partial<PageComponent>)
        }
      />
    </div>
  );
}
