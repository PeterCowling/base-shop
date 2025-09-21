// apps/cms/src/app/cms/shop/[shop]/themes/TypographySettings.tsx
"use client";
import { Input } from "@/components/atoms/shadcn";
import type { MutableRefObject, ChangeEvent } from "react";

interface Props {
  tokens: Record<string, string>;
  overrides: Record<string, string>;
  handleOverrideChange: (
    key: string,
    defaultValue: string,
  ) => (value: string) => void;
  handleReset: (key: string) => () => void;
  overrideRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
}

export default function TypographySettings({
  tokens,
  overrides,
  handleOverrideChange,
  handleReset,
  overrideRefs,
}: Props) {
  const typographyTokens = Object.entries(tokens).filter(([k]) =>
    /font|typography|line|letter|tracking|leading/i.test(k),
  );
  if (typographyTokens.length === 0) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">Typography</legend>
      <div className="grid gap-2 md:grid-cols-2">
        {typographyTokens.map(([k, defaultValue]) => {
          const hasOverride = Object.prototype.hasOwnProperty.call(
            overrides,
            k,
          );
          const overrideValue = hasOverride ? overrides[k] : "";
          return (
            <div key={k} className="flex items-center gap-2">
              <Input
                name={k}
                placeholder={defaultValue}
                value={overrideValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleOverrideChange(k, defaultValue)(e.target.value)
                }
                ref={(el: HTMLInputElement | null) => {
                  overrideRefs.current[k] = el;
                }}
              />
              {hasOverride && (
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={handleReset(k)}
                >
                  Reset
                </button>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
