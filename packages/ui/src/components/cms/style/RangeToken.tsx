"use client";

import { RangeInput } from "../index";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";

interface RangeTokenProps extends TokenInfo {
  setToken: (key: string, value: string) => void;
}

export function RangeToken({
  key: tokenKey,
  value,
  defaultValue,
  isOverridden,
  setToken,
}: RangeTokenProps): ReactElement {
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
