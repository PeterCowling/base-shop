"use client";

import { Input } from "../../atoms/shadcn";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { ReactElement, ChangeEvent } from "react";
import { useTranslations } from "@acme/i18n";

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
  // eslint-disable-next-line ds/no-hardcoded-copy -- DX-0002: utility classes are not user copy
  const overrideClasses = isOverridden ? "border-s-2 border-s-info ps-2" : "";
  // eslint-disable-next-line ds/no-hardcoded-copy -- DX-0002: utility classes are not user copy
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
