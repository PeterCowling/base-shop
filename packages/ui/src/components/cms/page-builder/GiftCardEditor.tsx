import type { GiftCardBlockComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: GiftCardBlockComponent;
  onChange: (patch: Partial<GiftCardBlockComponent>) => void;
}

export default function GiftCardEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Input
        value={component.denominations?.join(",") ?? ""}
        onChange={(e) =>
          onChange({
            denominations: e.target.value
              .split(/[\s,]+/)
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n)),
          } as Partial<GiftCardBlockComponent>)
        }
        placeholder="Amounts (comma separated)"
      />
      <Textarea
        value={component.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value } as Partial<GiftCardBlockComponent>)}
        placeholder="Description"
      />
    </div>
  );
}
