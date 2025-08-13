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

const FIELD_TYPES = ["text", "email", "textarea", "select"] as const;

type Field = {
  type: string;
  name: string;
  label?: string;
  options?: { label: string; value: string }[];
};

export default function FormBuilderEditor({ component, onChange }: Props) {
  const fields = ((component as any).fields ?? []) as Field[];

  const updateField = (
    idx: number,
    patch: Partial<Field>
  ) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    onChange({ fields: next } as Partial<PageComponent>);
  };

  const removeField = (idx: number) => {
    const next = fields.filter((_, i) => i !== idx);
    onChange({ fields: next } as Partial<PageComponent>);
  };

  const addField = () => {
    onChange({
      fields: [...fields, { type: "text", name: "", label: "" }],
    } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={idx} className="space-y-2 rounded border p-2">
          <Select
            value={field.type}
            onValueChange={(value) => updateField(idx, { type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="type" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={field.name ?? ""}
            onChange={(e) => updateField(idx, { name: e.target.value })}
            placeholder="name"
          />
          <Input
            value={field.label ?? ""}
            onChange={(e) => updateField(idx, { label: e.target.value })}
            placeholder="label"
          />
          {field.type === "select" && (
            <Input
              value={(field.options ?? [])
                .map((o) => o.label)
                .join(",")}
              onChange={(e) =>
                updateField(idx, {
                  options: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => ({ label: s, value: s })),
                })
              }
              placeholder="options (comma separated)"
            />
          )}
          <Button variant="destructive" onClick={() => removeField(idx)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addField}>
        Add field
      </Button>
    </div>
  );
}

