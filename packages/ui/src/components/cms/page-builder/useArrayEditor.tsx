import type { ChangeEvent } from "react";
import { useCallback } from "react";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";

export function useArrayEditor<T>(
  onChange: (patch: Partial<T>) => void,
) {
  return useCallback(
    (
      prop: keyof T & string,
      items: unknown[] | undefined,
      fields: string[],
      limits?: { minItems?: number; maxItems?: number }
    ) => {
      const list = (items ?? []) as Record<string, unknown>[];
      const min = limits?.minItems ?? 0;
      const max = limits?.maxItems ?? Infinity;
      return (
        <div className="space-y-2">
          {list.map((item, idx) => (
            <div key={idx} className="space-y-1 rounded border p-2">
              {fields.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Input
                    value={(item[f] as string) ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const next = [...list];
                      next[idx] = { ...next[idx], [f]: e.target.value };
                      onChange({ [prop]: next } as Partial<T>);
                    }}
                    placeholder={f}
                    className="flex-1"
                  />
                  {f === "src" && (
                    <ImagePicker
                      onSelect={(url) => {
                        const next = [...list];
                        next[idx] = { ...next[idx], src: url };
                        onChange({ [prop]: next } as Partial<T>);
                      }}
                    >
                      <Button type="button" variant="outline">
                        Pick
                      </Button>
                    </ImagePicker>
                  )}
                </div>
              ))}
              <Button
                variant="destructive"
                onClick={() => {
                  const next = list.filter((_, i) => i !== idx);
                  onChange({ [prop]: next } as Partial<T>);
                }}
                disabled={list.length <= min}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            onClick={() => {
              const blank = Object.fromEntries(fields.map((f) => [f, ""]));
              onChange({ [prop]: [...list, blank] } as Partial<T>);
            }}
            disabled={list.length >= max}
          >
            Add
          </Button>
        </div>
      );
    },
    [onChange],
  );
}
