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

export default function FormBuilderEditor({ component, onChange }: Props) {
  const fields = ((component as any).fields ?? []) as any[];

  const updateField = (idx: number, key: string, value: any) => {
    const next = [...fields];
    next[idx] = { ...next[idx], [key]: value };
    onChange({ fields: next } as Partial<PageComponent>);
  };

  const addField = () => {
    onChange({
      fields: [...fields, { type: "text", name: "", label: "" }],
    } as Partial<PageComponent>);
  };

  const removeField = (idx: number) => {
    const next = fields.filter((_, i) => i !== idx);
    onChange({ fields: next } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={idx} className="space-y-1 rounded border p-2">
          <Select
            value={field.type}
            onValueChange={(v) => updateField(idx, "type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">text</SelectItem>
              <SelectItem value="email">email</SelectItem>
              <SelectItem value="select">select</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={field.name ?? ""}
            onChange={(e) => updateField(idx, "name", e.target.value)}
            placeholder="name"
          />
          <Input
            value={field.label ?? ""}
            onChange={(e) => updateField(idx, "label", e.target.value)}
            placeholder="label"
          />
          {field.type === "select" && (
            <Input
              value={(field.options ?? []).map((o: any) => o.label).join(",")}
              onChange={(e) =>
                updateField(
                  idx,
                  "options",
                  e.target.value
                    .split(",")
                    .map((v: string) => v.trim())
                    .filter(Boolean)
                    .map((v: string) => ({ label: v, value: v }))
                )
              }
              placeholder="options (comma separated)"
            />
          )}
          <Button
            variant="destructive"
            onClick={() => removeField(idx)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={addField}>Add field</Button>
    </div>
  );
}
