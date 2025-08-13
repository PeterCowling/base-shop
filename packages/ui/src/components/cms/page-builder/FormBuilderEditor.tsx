import type { ChangeEvent } from "react";
import type { PageComponent } from "@acme/types";
import { Button, Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function FormBuilderEditor({ component, onChange }: Props) {
  const fields = ((component as any).fields ?? []) as any[];
  const min = (component as any).minItems ?? 0;
  const max = (component as any).maxItems ?? Infinity;

  const handleInput = (field: string, value: unknown) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  const update = (idx: number, field: string, value: unknown) => {
    const next = [...fields];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ fields: next } as Partial<PageComponent>);
  };

  const removeField = (idx: number) => {
    onChange({ fields: fields.filter((_, i) => i !== idx) } as Partial<PageComponent>);
  };

  const addField = () => {
    onChange({
      fields: [...fields, { type: "text", name: "", label: "" }],
    } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).action ?? ""}
        onChange={(e) => handleInput("action", e.target.value)}
        placeholder="action"
      />
      <Input
        value={(component as any).method ?? ""}
        onChange={(e) => handleInput("method", e.target.value)}
        placeholder="method"
      />
      {fields.map((field, i) => (
        <div key={i} className="space-y-1 rounded border p-2">
          <select
            value={field.type ?? "text"}
            onChange={(e) => update(i, "type", e.target.value)}
            className="w-full rounded border p-1"
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="select">Select</option>
          </select>
          <Input
            value={field.name ?? ""}
            onChange={(e) => update(i, "name", e.target.value)}
            placeholder="name"
            className="w-full"
          />
          <Input
            value={field.label ?? ""}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="label"
            className="w-full"
          />
          {field.type !== "select" ? (
            <Input
              value={field.placeholder ?? ""}
              onChange={(e) => update(i, "placeholder", e.target.value)}
              placeholder="placeholder"
              className="w-full"
            />
          ) : (
            <Textarea
              value={(field.options ?? []).join("\n")}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                update(
                  i,
                  "options",
                  e.target.value
                    .split(/\n+/)
                    .map((o) => o.trim())
                    .filter(Boolean)
                )
              }
              placeholder="one option per line"
              className="w-full"
            />
          )}
          <Button
            variant="destructive"
            onClick={() => removeField(i)}
            disabled={fields.length <= min}
          >
            Remove Field
          </Button>
        </div>
      ))}
      <Button onClick={addField} disabled={fields.length >= max}>
        Add Field
      </Button>
    </div>
  );
}
