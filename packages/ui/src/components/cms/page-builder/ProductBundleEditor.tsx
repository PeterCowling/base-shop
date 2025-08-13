import type { PageComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductBundleEditor({ component, onChange }: Props) {
  const handleSkus = (value: string) => {
    const items = value
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ skus: items } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        label="SKUs"
        placeholder="skus"
        value={((component as any).skus ?? []).join(",")}
        onChange={(e) => handleSkus(e.target.value)}
      />
      <Input
        label="Discount (%)"
        placeholder="discount"
        type="number"
        value={(component as any).discount ?? ""}
        onChange={(e) =>
          onChange({ discount: Number(e.target.value) } as Partial<PageComponent>)
        }
      />
      <Input
        label="Quantity"
        placeholder="quantity"
        type="number"
        value={(component as any).quantity ?? ""}
        onChange={(e) =>
          onChange({ quantity: Number(e.target.value) } as Partial<PageComponent>)
        }
      />
    </div>
  );
}

