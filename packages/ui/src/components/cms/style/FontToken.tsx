"use client";

import { FontSelect } from "../index";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import type { ChangeEvent, ReactElement } from "react";

interface FontTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: string;
  options: string[];
  type: "mono" | "sans";
  googleFonts: string[];
  setToken: (key: string, value: string) => void;
  handleUpload: (type: "sans" | "mono", e: ChangeEvent<HTMLInputElement>) => void;
  setGoogleFont: (type: "sans" | "mono", name: string) => void;
}

export function FontToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  options,
  type,
  googleFonts,
  setToken,
  handleUpload,
  setGoogleFont,
}: FontTokenProps): ReactElement {
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
        <FontSelect
          value={value}
          options={options}
          onChange={(val) => setToken(tokenKey, val)}
          onUpload={(e) => handleUpload(type, e)}
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
        <select
          className="rounded border p-1"
          onChange={(e) => {
            if (e.target.value) {
              setGoogleFont(type, e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="">Google Fonts</option>
          {googleFonts.map((f: string) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </span>
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          Default: {defaultValue}
        </span>
      )}
    </label>
  );
}
