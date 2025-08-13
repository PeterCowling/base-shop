import type { PageComponent } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";
import { useCallback } from "react";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

interface FieldEditorProps {
  field: any;
  index: number;
  onUpdate: (idx: number, patch: any) => void;
  onRemove: (idx: number) => void;
}

function FieldEditor({ field, index, onUpdate, onRemove }: FieldEditorProps) {
  return (
    <div className="space-y-1 rounded border p-2">
      <div className="flex gap-2">
        <select
          value={field.type}
          onChange={(e) => onUpdate(index, { type: e.target.value })}
          className="rounded border p-1"
        >
          <option value="text">text</option>
          <option value="email">email</option>
          <option value="textarea">textarea</option>
          <option value="select">select</option>
        </select>
        <Input
          value={field.name ?? ""}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          placeholder="name"
          className="flex-1"
        />
      </div>
      <Input
        value={field.label ?? ""}
        onChange={(e) => onUpdate(index, { label: e.target.value })}
        placeholder="label"
      />
      {(field.type === "text" || field.type === "email" || field.type === "textarea") && (
        <Input
          value={field.placeholder ?? ""}
          onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
          placeholder="placeholder"
        />
      )}
      {field.type === "select" && (
        <Input
          value={(field.options ?? []).map((o: any) => o.label).join(",")}
          onChange={(e) =>
            onUpdate(
              index,
              {
                options: e.target.value
                  .split(",")
                  .map((s) => ({ label: s.trim(), value: s.trim() }))
                  .filter((o) => o.label),
              }
            )
          }
          placeholder="option1, option2"
        />
      )}
      <Button
        variant="destructive"
        onClick={() => onRemove(index)}
      >
        Remove
      </Button>
    </div>
  );
}

export default function FormBuilderEditor({ component, onChange }: Props) {
  const fields = (component as any).fields ?? [];

  const updateField = useCallback(
    (idx: number, patch: any) => {
      const next = fields.map((f: any, i: number) => (i === idx ? { ...f, ...patch } : f));
      onChange({ fields: next } as Partial<PageComponent>);
    },
    [fields, onChange]
  );

  const removeField = useCallback(
    (idx: number) => {
      const next = fields.filter((_f: any, i: number) => i !== idx);
      onChange({ fields: next } as Partial<PageComponent>);
    },
    [fields, onChange]
  );

  const addField = () => {
    onChange({
      fields: [...fields, { type: "text", name: "", label: "", placeholder: "" }],
    } as Partial<PageComponent>);
  };

  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
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
      <Input
        value={(component as any).submitLabel ?? ""}
        onChange={(e) => handleInput("submitLabel", e.target.value)}
        placeholder="submitLabel"
      />
      {fields.map((f: any, idx: number) => (
        <FieldEditor
          key={idx}
          field={f}
          index={idx}
          onUpdate={updateField}
          onRemove={removeField}
        />
      ))}
      <Button type="button" onClick={addField}>
        Add Field
      </Button>
    </div>
  );
}
