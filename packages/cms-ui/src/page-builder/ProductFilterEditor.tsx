import { useId } from "react";

import type { ProductFilterComponent } from "@acme/types/page/organisms/ProductFilter";

import type { EditorProps } from "./EditorProps";
import useComponentInputs from "./useComponentInputs";

type Props = EditorProps<ProductFilterComponent>;

export default function ProductFilterEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<ProductFilterComponent>(onChange);
  const sizeId = useId();
  const colorId = useId();
  const priceId = useId();
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor={sizeId}>
          Show size
        </label>
        <input
          type="checkbox"
          id={sizeId}
          checked={component.showSize ?? true}
          onChange={(e) => handleInput("showSize", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor={colorId}>
          Show color
        </label>
        <input
          type="checkbox"
          id={colorId}
          checked={component.showColor ?? true}
          onChange={(e) => handleInput("showColor", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor={priceId}>
          Show price
        </label>
        <input
          type="checkbox"
          id={priceId}
          checked={component.showPrice ?? true}
          onChange={(e) => handleInput("showPrice", e.target.checked)}
        />
      </div>
    </>
  );
}
