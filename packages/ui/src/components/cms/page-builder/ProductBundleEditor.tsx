import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductBundleEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return (
    <div className="space-y-2">
      {arrayEditor("products", (component as any).products, ["sku", "quantity"])}
      <Input
        label="Discount (%)"
        type="number"
        value={(component as any).discount ?? 0}
        onChange={(e) =>
          onChange({ discount: Number(e.target.value) } as Partial<PageComponent>)
        }
      />
    </div>
  );
}
