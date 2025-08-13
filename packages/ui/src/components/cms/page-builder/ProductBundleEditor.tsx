import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductBundleEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);

  const handleNum = (value: string) => {
    const num = value ? Number(value) : undefined;
    onChange({ discountPercent: isNaN(num!) ? undefined : num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {arrayEditor("items", (component as any).items, ["sku", "quantity"])}
      <Input
        label="Discount %"
        type="number"
        value={(component as any).discountPercent ?? ""}
        onChange={(e) => handleNum(e.target.value)}
      />
    </div>
  );
}
