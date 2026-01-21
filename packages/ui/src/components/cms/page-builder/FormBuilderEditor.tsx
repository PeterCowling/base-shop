"use client";
import { useTranslations } from "@acme/i18n";
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

import type { EditorProps } from "./EditorProps";

type FormBuilderComponent = {
  id: string;
  type: "FormBuilderBlock";
  fields?: FormField[];
} & Record<string, unknown>;

type Props = EditorProps<FormBuilderComponent>;

export default function FormBuilderEditor({ component, onChange }: Props) {
  const t = useTranslations();
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
    const next = fields.filter((_: unknown, i: number) => i !== idx);
    onChange({ fields: next });
  };

  return (
    <div className="space-y-2">
      {fields.map((field: FormField, idx: number) => (
        // eslint-disable-next-line react/no-array-index-key -- PB-2416: Form fields lack stable ids in schema
        <div key={idx} className="space-y-1 rounded border p-2">
          <Select
            value={field.type}
            onValueChange={(v) => updateField(idx, "type", v as FormField["type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">{t("text")}</SelectItem>
              <SelectItem value="email">{t("email")}</SelectItem>
              <SelectItem value="select">{t("select")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={field.name ?? ""}
            onChange={(e) => updateField(idx, "name", e.target.value)}
            placeholder={t("name") as string}
          />
          <Input
            value={field.label ?? ""}
            onChange={(e) => updateField(idx, "label", e.target.value)}
            placeholder={t("label") as string}
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
              placeholder={t("options (comma separated)") as string}
            />
          )}
          <Button
            variant="destructive"
            onClick={() => removeField(idx)}
          >
            {t("Remove")}
          </Button>
        </div>
      ))}
      <Button onClick={addField}>{t("Add field")}</Button>
    </div>
  );
}
