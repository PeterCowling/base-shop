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
      className={`flex items-center gap-2 text-sm ${
        isOverridden ? "border-l-2 border-l-info pl-2" : ""
      }`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="w-40 flex-shrink-0">{tokenKey}</span>
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setToken(tokenKey, e.target.value)
        }
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
