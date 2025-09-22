"use client";

import { ColorInput } from "../index";
import type { TokenInfo, TokenMap } from "../../../hooks/useTokenEditor";
import { useTokenColors } from "../../../hooks/useTokenColors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../atoms/shadcn";
import { hexToHsl, isHex } from "../../../utils/colorUtils";
import { ReactElement } from "react";

interface ColorTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: string;
  tokens: TokenMap;
  baseTokens: TokenMap;
  setToken: (key: string, value: string) => void;
  onRenameToken?: (oldKey: string, nextKey: string) => void;
  onReplaceColor?: (tokenKey: string, nextValue: string) => void;
}

export function ColorToken({
  tokenKey,
  value,
  defaultValue,
  isOverridden,
  tokens,
  baseTokens,
  setToken,
  onRenameToken,
  onReplaceColor,
}: ColorTokenProps): ReactElement {
  const warning = useTokenColors(tokenKey, value, tokens, baseTokens);
  const supportsEyeDropper =
    typeof window !== "undefined" && "EyeDropper" in window;

  const handleEyeDropper = async () => {
    try {
      const ctor = (window as typeof window & {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper;
      if (!ctor) return;
      const instance = new ctor();
      const result = await instance.open();
      if (result?.sRGBHex) {
        setToken(tokenKey, hexToHsl(result.sRGBHex));
      }
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      // Swallow other errors – eyedropper is a progressive enhancement
    }
  };

  const handleRename = () => {
    if (!onRenameToken) return;
    const next = typeof window !== "undefined"
      ? window.prompt("Rename color token", tokenKey)
      : null;
    const trimmed = next?.trim();
    if (!trimmed || trimmed === tokenKey) return;
    onRenameToken(tokenKey, trimmed);
  };

  const handleReplace = () => {
    if (!onReplaceColor) return;
    const next = typeof window !== "undefined"
      ? window.prompt(
          "Replace this color across tokens with (hex, HSL, or CSS value)",
          value,
        )
      : null;
    const trimmed = next?.trim();
    if (!trimmed) return;
    const normalized = isHex(trimmed) ? hexToHsl(trimmed) : trimmed;
    onReplaceColor(tokenKey, normalized);
  };

  const showAdvanced = Boolean(onRenameToken || onReplaceColor);

  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-col gap-1 text-sm ${
        isOverridden ? "border-l-2 border-l-info pl-2" : ""
      }`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="basis-40 shrink-0 break-all">{tokenKey}</span>
        <div className="flex items-center gap-2">
          <ColorInput value={value} onChange={(val) => setToken(tokenKey, val)} />
          {supportsEyeDropper && (
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => void handleEyeDropper()}
            >
              Eyedropper
            </button>
          )}
        </div>
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setToken(tokenKey, defaultValue ?? "")}
          >
            Reset
          </button>
        )}
        {showAdvanced && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                aria-label={`More actions for ${tokenKey}`}
              >
                ⋯
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              {onRenameToken && (
                <DropdownMenuItem onSelect={handleRename}>
                  Rename token…
                </DropdownMenuItem>
              )}
              {onReplaceColor && (
                <DropdownMenuItem onSelect={handleReplace}>
                  Replace across tokens…
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
