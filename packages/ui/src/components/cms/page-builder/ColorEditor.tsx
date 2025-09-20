// packages/ui/src/components/cms/page-builder/ColorEditor.tsx
"use client";

import { Input } from "../../atoms/shadcn";

export interface ColorValues {
  fg?: string;
  bg?: string;
  border?: string;
}

export default function ColorEditor({
  values,
  labels,
  placeholder,
  onChange,
}: {
  values: ColorValues;
  labels: { fg: string; bg: string; border: string };
  placeholder: string;
  onChange: (key: keyof ColorValues, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        label={labels.fg}
        value={values.fg ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange("fg", e.target.value)}
      />
      <Input
        label={labels.bg}
        value={values.bg ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange("bg", e.target.value)}
      />
      <Input
        label={labels.border}
        value={values.border ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange("border", e.target.value)}
      />
    </div>
  );
}

