"use client";
import type { TabsComponent } from "@acme/types";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<TabsComponent>;

export default function TabsEditor({ component, onChange }: Props) {
  const labels = component.labels ?? [];
  const active = component.active ?? 0;
  return (
    <>
      {labels.map((label: string, i: number) => (
        <div key={`${component.id}-${label}`} className="flex items-end gap-2">
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
              const patch: Partial<TabsComponent> = { labels: copy };
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
          {labels.map((label: string, i: number) => (
            <SelectItem key={`${component.id}-${label}`} value={String(i)}>
              {`Tab ${i + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
