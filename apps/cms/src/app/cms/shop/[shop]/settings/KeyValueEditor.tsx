import { useEffect, useState } from "react";
import { Button, Input } from "@/components/atoms/shadcn";
import { localeSchema } from "@acme/types";
import type { ErrorSetter } from "../utils/formValidators";

interface Row {
  key: string;
  value: string;
}

interface Props {
  name: string;
  label: string;
  pairs: Record<string, unknown>;
  onChange: (pairs: Record<string, unknown>) => void;
  errors: Record<string, string[]>;
  setErrors: ErrorSetter;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  valueType?: "string" | "number" | "locale";
}

export default function KeyValueEditor({
  name,
  label,
  pairs,
  onChange,
  errors,
  setErrors,
  keyPlaceholder,
  valuePlaceholder,
  valueType = "string",
}: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    Object.entries(pairs ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  );

  useEffect(() => {
    const obj: Record<string, unknown> = {};
    let error: string | null = null;
    for (const { key, value } of rows) {
      const k = key.trim();
      const v = value.trim();
      if (!k || !v) {
        error = "All keys and values are required";
        break;
      }
      if (valueType === "number") {
        const num = Number(v);
        if (Number.isNaN(num) || num < 0) {
          error = "Values must be non-negative numbers";
          break;
        }
        obj[k] = num;
      } else if (valueType === "locale") {
        const parsed = localeSchema.safeParse(v);
        if (!parsed.success) {
          error = "Invalid locale";
          break;
        }
        obj[k] = v;
      } else {
        obj[k] = v;
      }
    }
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: [error] }));
    } else {
      setErrors((prev) => {
        const { [name]: _omit, ...rest } = prev;
        return rest;
      });
    }
    onChange(obj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const addRow = () => setRows((prev) => [...prev, { key: "", value: "" }]);
  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof Row, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium">{label}</span>
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            name={`${name}Key`}
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => updateRow(idx, "key", e.target.value)}
          />
          <Input
            name={`${name}Value`}
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => updateRow(idx, "value", e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => removeRow(idx)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addRow}>
        Add
      </Button>
      {errors[name] && (
        <span className="text-sm text-red-600">{errors[name].join("; ")}</span>
      )}
    </div>
  );
}
