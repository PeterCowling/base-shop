"use client";

import { type ReactElement } from "react";

import { cn } from "@acme/design-system/utils/style/cn";
import { useTranslations } from "@acme/i18n";
import { RangeInput } from "@acme/ui/components/cms/RangeInput";
import type { TokenInfo } from "@acme/ui/hooks/useTokenEditor";

interface RangeTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: TokenInfo["key"];
  setToken: (key: string, value: string) => void;
}

export function RangeToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  setToken,
}: RangeTokenProps): ReactElement {
  const t = useTranslations();
   
  const overrideClasses = cn(isOverridden && "border-s-2 border-s-info ps-2");
  return (
    <label
      data-token-key={tokenKey}
      className={cn("flex flex-wrap items-center gap-2 text-sm", overrideClasses)}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="basis-40 shrink-0">{tokenKey}</span>
      <RangeInput value={value} onChange={(val) => setToken(tokenKey, val)} />
      {isOverridden && (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs min-h-11 min-w-11"
          onClick={() => setToken(tokenKey, defaultValue ?? "")}
        >
          {t("common.reset") as string}
        </button>
      )}
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          {t("common.default") as string}: {defaultValue}
        </span>
      )}
    </label>
  );
}
