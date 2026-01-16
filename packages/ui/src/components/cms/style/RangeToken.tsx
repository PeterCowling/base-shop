"use client";

import { RangeInput } from "../index";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";
import { useTranslations } from "@acme/i18n";

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
  const overrideClasses = isOverridden ? "border-s-2 border-s-info ps-2" : "";
  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-wrap items-center gap-2 text-sm ${overrideClasses}`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="basis-40 shrink-0">{tokenKey}</span>
      <RangeInput value={value} onChange={(val) => setToken(tokenKey, val)} />
      {isOverridden && (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
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
