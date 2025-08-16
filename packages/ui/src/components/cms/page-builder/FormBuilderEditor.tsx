import type { FormField, FormFieldOption } from "@acme/types";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

type FormBuilderComponent = {
  type: "FormBuilderBlock";
  fields?: FormField[];
};

interface Props {
  component: FormBuilderComponent;
  onChange: (patch: Partial<FormBuilderComponent>) => void;
}

export default function FormBuilderEditor({ component, onChange }: Props) {
  const fields = component.fields ?? [];

  const updateField = <K extends keyof FormField>(
    idx: number,
    key: K,
    value: FormField[K]
  ) => {
    const next = [...fields];
    next[idx] = { ...next[idx], [key]: value };
    onChange({ fields: next });
  };

  const addField = () => {
    onChange({
      fields: [...fields, { type: "text", name: "", label: "" }],
    });
  };

  const removeField = (idx: number) => {
    const next = fields.filter((_, i) => i !== idx);
    onChange({ fields: next });
  };

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={idx} className="space-y-1 rounded border p-2">
          <Select
            value={field.type}
            onValueChange={(v) => updateField(idx, "type", v as FormField["type"])}
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
              value={(field.options ?? [])
                .map((o: FormFieldOption) => o.label)
                .join(",")}
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
