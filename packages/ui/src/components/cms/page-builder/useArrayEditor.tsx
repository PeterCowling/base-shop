import type { ChangeEvent } from "react";
import { useCallback } from "react";
import type { PageComponent } from "@types";
import { Button, Input } from "../../atoms-shadcn";
import ImagePicker from "./ImagePicker";

export function useArrayEditor(
  onChange: (patch: Partial<PageComponent>) => void,
) {
  return useCallback(
    (prop: string, items: unknown[] | undefined, fields: string[]) => {
      const list = (items ?? []) as Record<string, unknown>[];
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
                      onChange({ [prop]: next } as Partial<PageComponent>);
                    }}
                    placeholder={f}
                    className="flex-1"
                  />
                  {f === "src" && (
                    <ImagePicker
                      onSelect={(url) => {
                        const next = [...list];
                        next[idx] = { ...next[idx], src: url };
                        onChange({ [prop]: next } as Partial<PageComponent>);
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
                  onChange({ [prop]: next } as Partial<PageComponent>);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            onClick={() => {
              const blank = Object.fromEntries(fields.map((f) => [f, ""]));
              onChange({ [prop]: [...list, blank] } as Partial<PageComponent>);
            }}
          >
            Add
          </Button>
        </div>
      );
    },
    [onChange],
  );
}
