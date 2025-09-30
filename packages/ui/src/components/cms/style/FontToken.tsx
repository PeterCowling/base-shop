// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import { FontSelect } from "../FontSelect";
import type { TokenInfo } from "../../../hooks/useTokenEditor";
import type { ChangeEvent, ReactElement } from "react";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  // eslint-disable-next-line ds/no-hardcoded-copy -- DX-0002: utility classes are not user copy
  const overrideClasses = isOverridden ? "border-s-2 border-s-info ps-2" : "";
  return (
    <label
      data-token-key={tokenKey}
      className={`flex flex-col gap-1 text-sm ${overrideClasses}`}
      data-token={isOverridden ? "--color-info" : undefined}
    >
      <span className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="basis-40 shrink-0">{tokenKey}</span>
        <FontSelect
          value={value}
          options={options}
          onChange={(val) => setToken(tokenKey, val)}
          onUpload={(e) => handleUpload(type, e)}
          className="min-w-0 flex-1"
        />
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs min-h-10 min-w-10" /* i18n-exempt -- DX-0002: utility classes are not user copy */
            onClick={() => setToken(tokenKey, defaultValue ?? "")}
          >
            {t("common.reset") as string}
          </button>
        )}
        <select
          className="min-w-0 flex-1 rounded border p-1 sm:flex-none sm:w-auto"
          onChange={(e) => {
            if (e.target.value) {
              setGoogleFont(type, e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="">{t("cms.style.googleFonts") as string}</option>
          {googleFonts.map((f: string) => (
            // eslint-disable-next-line react/forbid-dom-props -- DX-0003: Inline font preview on <option> requires style
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </span>
      {defaultValue && (
        <span className="text-xs text-muted-foreground">
          {t("common.default") as string}: {defaultValue}
        </span>
      )}
    </label>
  );
}
