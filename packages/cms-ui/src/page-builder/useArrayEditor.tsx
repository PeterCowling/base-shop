"use client"; // i18n-exempt: Next.js directive
import type { ChangeEvent } from "react";
import { useCallback, useRef } from "react";

import { useTranslations } from "@acme/i18n";

import { Button, Input } from "@acme/design-system/shadcn";

import ImagePicker from "./ImagePicker";

export function useArrayEditor<T>(
  onChange: (patch: Partial<T>) => void,
) {
  const t = useTranslations();
  const keyMapRef = useRef<WeakMap<object, string>>(new WeakMap());
  const seqRef = useRef(0);
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
      const keyMap = keyMapRef.current;
      const getKey = (obj: object) => {
        const existing = keyMap.get(obj);
        if (existing) return existing;
        const k = `ae-${seqRef.current++}`;
        keyMap.set(obj, k);
        return k;
      };
      return (
        <div className="space-y-2">
          {list.map((item, idx) => (
            <div key={getKey(item)} className="space-y-1 rounded border p-2">
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
                      {/* Use asChild to avoid nested <button> inside DialogTrigger */}
                      <Button type="button" variant="outline" asChild>
                        <span>Pick</span>
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
                {t("actions.remove")}
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
            {t("actions.add")}
          </Button>
        </div>
      );
    },
    [onChange, t],
  );
}
