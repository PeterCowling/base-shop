import type { PageComponent } from "@acme/types";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductFilterEditor({ component, onChange }: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show size</label>
        <input
          type="checkbox"
          checked={(component as any).showSize ?? true}
          onChange={(e) => onChange({ showSize: e.target.checked } as any)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show color</label>
        <input
          type="checkbox"
          checked={(component as any).showColor ?? true}
          onChange={(e) => onChange({ showColor: e.target.checked } as any)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Show price</label>
        <input
          type="checkbox"
          checked={(component as any).showPrice ?? true}
          onChange={(e) => onChange({ showPrice: e.target.checked } as any)}
        />
      </div>
    </>
  );
}

