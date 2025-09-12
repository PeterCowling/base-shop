import { useState } from "react";

export interface MappingRow {
  key: string;
  value: string;
}

export function useMappingRows(initial: Record<string, unknown> = {}) {
  const [rows, setRows] = useState<MappingRow[]>(
    Object.entries(initial).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  );

  const add = () => setRows((prev) => [...prev, { key: "", value: "" }]);

  const update = (index: number, field: "key" | "value", value: string) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  const remove = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  return { rows, setRows, add, update, remove } as const;
}

export default useMappingRows;
