import useComponentInputs from "./useComponentInputs";
import type { EditorProps } from "./EditorProps";
import type { ProductFilterComponent } from "@acme/types/page/organisms/ProductFilter";

type Props = EditorProps<ProductFilterComponent>;

export default function ProductFilterEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<ProductFilterComponent>(onChange);
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show size</label>
        <input
          type="checkbox"
          checked={component.showSize ?? true}
          onChange={(e) => handleInput("showSize", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show color</label>
        <input
          type="checkbox"
          checked={component.showColor ?? true}
          onChange={(e) => handleInput("showColor", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show price</label>
        <input
          type="checkbox"
          checked={component.showPrice ?? true}
          onChange={(e) => handleInput("showPrice", e.target.checked)}
        />
      </div>
    </>
  );
}
