"use client";

import { RangeInput } from "../index";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";

interface RangeTokenProps extends Omit<TokenInfo, "key"> {
<<<<<<< Updated upstream
  tokenKey: TokenInfo["key"];
=======
  tokenKey: string;
>>>>>>> Stashed changes
  setToken: (key: string, value: string) => void;
}

export function RangeToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  setToken,
}: RangeTokenProps): ReactElement {
  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-wrap items-center gap-2 text-sm ${
        isOverridden ? "border-l-2 border-l-info pl-2" : ""
      }`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="basis-40 shrink-0">{tokenKey}</span>
      <RangeInput value={value} onChange={(val) => setToken(tokenKey, val)} />
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
