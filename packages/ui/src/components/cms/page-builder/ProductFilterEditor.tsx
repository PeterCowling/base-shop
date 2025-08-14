import type { PageComponent } from "@acme/types";
import useComponentInputs from "./useComponentInputs";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductFilterEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs(onChange);
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show size</label>
        <input
          type="checkbox"
          checked={(component as any).showSize ?? true}
          onChange={(e) => handleInput("showSize", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show color</label>
        <input
          type="checkbox"
          checked={(component as any).showColor ?? true}
          onChange={(e) => handleInput("showColor", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show price</label>
        <input
          type="checkbox"
          checked={(component as any).showPrice ?? true}
          onChange={(e) => handleInput("showPrice", e.target.checked)}
        />
      </div>
    </>
  );
}
