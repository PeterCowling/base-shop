"use client";

import { ColorInput } from "../index";
import type { TokenInfo, TokenMap } from "../../../hooks/useTokenEditor";
import { useTokenColors } from "../../../hooks/useTokenColors";
import { ReactElement } from "react";

interface ColorTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: string;
  tokens: TokenMap;
  baseTokens: TokenMap;
  setToken: (key: string, value: string) => void;
}

export function ColorToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  tokens,
  baseTokens,
  setToken,
}: ColorTokenProps): ReactElement {
  const warning = useTokenColors(tokenKey, value, tokens, baseTokens);

  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-col gap-1 text-sm ${
        isOverridden ? "border-l-2 border-l-info pl-2" : ""
      }`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="flex items-center gap-2">
        <span className="w-40 flex-shrink-0">{tokenKey}</span>
        <ColorInput value={value} onChange={(val) => setToken(tokenKey, val)} />
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setToken(tokenKey, defaultValue ?? "")}
          >
            Reset
          </button>
        )}
      </span>
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          Default: {defaultValue}
        </span>
      )}
      {warning && (
        <span className="text-xs text-danger" data-token="--color-danger">
          Low contrast ({warning.contrast.toFixed(2)}:1)
          {warning.suggestion ? ` – try ${warning.suggestion}` : ""}
        </span>
      )}
    </label>
  );
}
