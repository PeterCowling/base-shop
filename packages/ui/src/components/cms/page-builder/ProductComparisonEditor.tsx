import type { PageComponent } from "@acme/types";
import { Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductComparisonEditor({ component, onChange }: Props) {
  const handleList = (field: string, value: string) => {
    const items = value
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ [field]: items } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        label="SKUs (comma or newline separated)"
        value={((component as any).skus ?? []).join(",")}
        onChange={(e) => handleList("skus", e.target.value)}
      />
      <Textarea
        label="Attributes (comma separated)"
        value={((component as any).attributes ?? []).join(",")}
        onChange={(e) => handleList("attributes", e.target.value)}
      />
    </div>
  );
}

