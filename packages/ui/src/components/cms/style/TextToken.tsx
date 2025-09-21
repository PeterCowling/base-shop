"use client";

import { Input } from "../../atoms/shadcn";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { ReactElement, ChangeEvent } from "react";

interface TextTokenProps extends TokenInfo {
  setToken: (key: string, value: string) => void;
}

export function TextToken({
  key: tokenKey,
  value,
  defaultValue,
  isOverridden,
  setToken,
}: TextTokenProps): ReactElement {
  return (
    <label
      key={tokenKey}
      data-token-key={tokenKey}
      className={`flex flex-wrap items-center gap-2 text-sm ${
        isOverridden ? "border-l-2 border-l-info pl-2" : ""
      }`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="basis-40 shrink-0">{tokenKey}</span>
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setToken(tokenKey, e.target.value)
        }
        className="min-w-0 flex-1"
        wrapperClassName="min-w-0 flex-1"
      />
      {isOverridden && (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => setToken(tokenKey, defaultValue ?? "")}
        >
          Reset
        </button>
      )}
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          Default: {defaultValue}
        </span>
      )}
    </label>
  );
}
