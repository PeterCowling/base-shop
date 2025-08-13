import type { PageComponent } from "@acme/types";
import { Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function GiftCardEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Input
        value={(component as any).denominations?.join(",") ?? ""}
        onChange={(e) =>
          onChange({
            denominations: e.target.value
              .split(/[\s,]+/)
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n)),
          })
        }
        placeholder="Amounts (comma separated)"
      />
      <Textarea
        value={(component as any).description ?? ""}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description"
      />
    </div>
  );
}
