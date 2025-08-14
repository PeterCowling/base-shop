import type { PageComponent } from "@acme/types";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function TabsEditor({ component, onChange }: Props) {
  const labels = (component as any).labels ?? [];
  const active = (component as any).active ?? 0;
  return (
    <>
      {labels.map((label: string, i: number) => (
        <div key={i} className="flex items-end gap-2">
          <Input
            label={`Tab ${i + 1} Label`}
            value={label}
            onChange={(e) => {
              const copy = [...labels];
              copy[i] = e.target.value;
              onChange({ labels: copy });
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const copy = labels.filter((_: string, idx: number) => idx !== i);
              const patch: Partial<PageComponent> = { labels: copy };
              if (active >= copy.length) patch.active = 0;
              onChange(patch);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange({ labels: [...labels, ""] })}
      >
        Add Tab
      </Button>
      <Select
        value={String(active)}
        onValueChange={(v) =>
          onChange({ active: v === undefined ? undefined : Number(v) })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Active Tab" />
        </SelectTrigger>
        <SelectContent>
          {labels.map((_, i) => (
            <SelectItem key={i} value={String(i)}>
              {`Tab ${i + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

