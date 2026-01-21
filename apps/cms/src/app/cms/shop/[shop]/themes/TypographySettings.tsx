// apps/cms/src/app/cms/shop/[shop]/themes/TypographySettings.tsx
"use client";
import type { ChangeEvent,MutableRefObject } from "react";

import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives/Grid";
import { Inline } from "@acme/ui/components/atoms/primitives/Inline";

import { Input } from "@/components/atoms/shadcn";

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
      <DSGrid cols={1} gap={2} className="md:grid-cols-2">
        {typographyTokens.map(([k, defaultValue]) => {
          const hasOverride = Object.prototype.hasOwnProperty.call(
            overrides,
            k,
          );
          const overrideValue = hasOverride ? overrides[k] : "";
          return (
            <Inline key={k} alignY="center" gap={2}>
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
                  className="text-sm underline min-h-10 min-w-10 px-2"
                  onClick={handleReset(k)}
                >
                  Reset
                </button>
              )}
            </Inline>
          );
        })}
      </DSGrid>
    </fieldset>
  );
}
