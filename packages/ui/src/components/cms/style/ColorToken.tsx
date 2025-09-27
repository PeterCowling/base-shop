"use client";

import { ColorInput } from "../index";
import type { TokenInfo, TokenMap } from "../../../hooks/useTokenEditor";
import { useTokenColors } from "../../../hooks/useTokenColors";
import { hexToHsl, isHex } from "../../../utils/colorUtils";
import { ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";

interface ColorTokenProps extends Omit<TokenInfo, "key"> {
  tokenKey: string;
  tokens: TokenMap;
  baseTokens: TokenMap;
  setToken: (key: string, value: string) => void;
  onRenameToken?: (oldKey: string, nextKey: string) => void;
  onReplaceColor?: (tokenKey: string, nextValue: string) => void;
  /** Hide eyedropper and advanced actions when not needed */
  showExtras?: boolean;
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
  showExtras = true,
}: ColorTokenProps): ReactElement {
  const t = useTranslations();
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
      ? window.prompt(
          // i18n-exempt: developer tool prompt not user-facing
          "Rename color token",
          tokenKey,
        )
      : null;
    const trimmed = next?.trim();
    if (!trimmed || trimmed === tokenKey) return;
    onRenameToken(tokenKey, trimmed);
  };

  const handleReplace = () => {
    if (!onReplaceColor) return;
    const next = typeof window !== "undefined"
      ? window.prompt(
          // i18n-exempt: developer tool prompt not user-facing
          "Replace this color across tokens with (hex, HSL, or CSS value)",
          value,
        )
      : null;
    const trimmed = next?.trim();
    if (!trimmed) return;
    const normalized = isHex(trimmed) ? hexToHsl(trimmed) : trimmed;
    onReplaceColor(tokenKey, normalized);
  };

  // Advanced menu disabled on this screen to avoid ref thrash in nested menus

  // eslint-disable-next-line ds/no-hardcoded-copy -- DX-0002: utility classes are not user copy
  const overrideClasses = isOverridden ? "border-s-2 border-s-info ps-2" : "";
  // i18n-exempt: DS token reference, not user-facing copy
  const DANGER_TOKEN = "--color-danger";

  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-col gap-1 text-sm ${overrideClasses}`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="basis-40 shrink-0 break-all">{tokenKey}</span>
        <div className="flex items-center gap-2">
          <ColorInput value={value} onChange={(val) => setToken(tokenKey, val)} />
          {showExtras && supportsEyeDropper && (
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
              onClick={() => void handleEyeDropper()}
            >
              {t("cms.style.eyedropper") as string}
            </button>
          )}
          {showExtras && (onRenameToken || onReplaceColor) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${t("cms.style.moreActions") as string} ${tokenKey}`}
                  className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
                >
                  •••
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {onRenameToken && (
                  <DropdownMenuItem onSelect={() => handleRename()}>
                    {t("cms.style.renameToken") as string}
                  </DropdownMenuItem>
                )}
                {onReplaceColor && (
                  <DropdownMenuItem onSelect={() => handleReplace()}>
                    {t("cms.style.replaceAcrossTokens") as string}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10"
            onClick={() => setToken(tokenKey, defaultValue ?? "")}
          >
          Reset
          </button>
        )}
        {/* Advanced menu hidden for stability */}
      </span>
      {defaultValue && (
        <span className="text-xs text-muted-foreground">Default: {defaultValue}</span>
      )}
      {warning && (
        // i18n-exempt: utility classes and DS token attribute are not user copy
        <span className="text-xs text-danger" data-token={DANGER_TOKEN}>
          Low contrast ({warning.contrast.toFixed(2)}:1)
          {warning.suggestion ? ` – try ${warning.suggestion}` : ""}
        </span>
      )}
    </label>
  );
}
