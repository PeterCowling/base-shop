import { Textarea } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type ProductComparisonComponent = {
  id: string;
  type: "ProductComparison";
  skus?: string[];
  attributes?: string[];
} & Record<string, unknown>;

type Props = EditorProps<ProductComparisonComponent>;

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
