import type { PageComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";

type ProductComparisonComponent = PageComponent & {
  type: "ProductComparison";
  skus?: string[];
  attributes?: string[];
};

interface Props {
  component: ProductComparisonComponent;
  onChange: (patch: Partial<ProductComparisonComponent>) => void;
}

export default function ProductComparisonEditor({ component, onChange }: Props) {
  const handleList = (
    field: keyof ProductComparisonComponent & string,
    value: string,
  ) => {
    const items = value
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ [field]: items } as Partial<ProductComparisonComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        label="SKUs (comma or newline separated)"
        value={(component.skus ?? []).join(",")}
        onChange={(e) => handleList("skus", e.target.value)}
      />
      <Textarea
        label="Attributes (comma separated)"
        value={(component.attributes ?? []).join(",")}
        onChange={(e) => handleList("attributes", e.target.value)}
      />
    </div>
  );
}

