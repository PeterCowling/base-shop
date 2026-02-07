"use client";

import { type ChangeEvent,type ReactElement } from "react";

import { useTranslations } from "@acme/i18n";

import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { Input } from "../../atoms/shadcn";

interface TextTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: TokenInfo["key"];
  setToken: (key: string, value: string) => void;
}

export function TextToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  setToken,
}: TextTokenProps): ReactElement {
  const t = useTranslations();
  const resetLabel = (() => {
    const v = t("common.reset");
    return v === "common.reset" ? "Reset" : (v as string);
  })();
  const defaultLabel = (() => {
    const v = t("common.default");
    return v === "common.default" ? "Default" : (v as string);
  })();
   
  const overrideClasses = isOverridden ? "border-s-2 border-s-info ps-2" : "";
   
  const WRAPPER_CLASS = "min-w-0 flex-1";
  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-wrap items-center gap-2 text-sm ${overrideClasses}`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="basis-40 shrink-0">{tokenKey}</span>
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setToken(tokenKey, e.target.value)
        }
        className="min-w-0 flex-1"
        wrapperClassName={WRAPPER_CLASS}
      />
      {isOverridden && (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
          onClick={() => setToken(tokenKey, defaultValue ?? "")}
        >
          {resetLabel}
        </button>
      )}
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          {defaultLabel}: {defaultValue}
        </span>
      )}
    </label>
  );
}
