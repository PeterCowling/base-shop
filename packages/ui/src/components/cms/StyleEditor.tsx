// packages/ui/components/cms/StyleEditor.tsx
"use client";

import { Input } from "@ui/components/atoms/shadcn";
import {
  useTokenEditor,
  type TokenMap,
  type TokenInfo,
} from "@ui/hooks/useTokenEditor";
import {
  ColorInput,
  FontSelect,
  RangeInput,
  getContrast,
  suggestContrastColor,
} from "./index";

interface StyleEditorProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
}

export default function StyleEditor({
  tokens,
  baseTokens,
  onChange,
}: StyleEditorProps) {
  const {
    colors,
    fonts,
    others,
    sansFonts,
    monoFonts,
    googleFonts,
    newFont,
    setNewFont,
    setToken,
    handleUpload,
    addCustomFont,
    setGoogleFont,
  } = useTokenEditor(tokens, baseTokens, onChange);

  const renderInput = ({
    key: k,
    value: v,
    defaultValue,
    isOverridden,
  }: TokenInfo) => {
    if (k.startsWith("--color")) {
      let warning: JSX.Element | null = null;
      let pairKey = "";
      if (k.startsWith("--color-bg")) {
        pairKey = `--color-fg${k.slice("--color-bg".length)}`;
      } else if (k.startsWith("--color-fg")) {
        pairKey = `--color-bg${k.slice("--color-fg".length)}`;
      }
      const pairVal = pairKey
        ? tokens[pairKey as keyof TokenMap] ?? baseTokens[pairKey as keyof TokenMap]
        : undefined;
      if (pairVal) {
        const contrast = getContrast(v, pairVal);
        if (contrast < 4.5) {
          const suggestion = suggestContrastColor(v, pairVal);
          warning = (
            <span className="text-xs text-red-600">
              Low contrast ({contrast.toFixed(2)}:1)
              {suggestion ? ` – try ${suggestion}` : ""}
            </span>
          );
        }
      }
      return (
        <label
          key={k}
          className={`flex flex-col gap-1 text-sm ${
            isOverridden ? "border-l-2 border-l-blue-500 pl-2" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-40 flex-shrink-0">{k}</span>
            <ColorInput value={v} onChange={(val) => setToken(k, val)} />
            {isOverridden && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setToken(k, defaultValue ?? "")}
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
          {warning}
        </label>
      );
    }

    if (k.startsWith("--font")) {
      const options = k.includes("mono") ? monoFonts : sansFonts;
      const type: "mono" | "sans" = k.includes("mono") ? "mono" : "sans";
      return (
        <label
          key={k}
          className={`flex flex-col gap-1 text-sm ${
            isOverridden ? "border-l-2 border-l-blue-500 pl-2" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-40 flex-shrink-0">{k}</span>
            <FontSelect
              value={v}
              options={options}
              onChange={(val) => setToken(k, val)}
              onUpload={(e) => handleUpload(type, e)}
            />
            {isOverridden && (
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs"
                onClick={() => setToken(k, defaultValue ?? "")}
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
              {googleFonts.map((f) => (
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

    if (/px$/.test(v)) {
      return (
        <label
          key={k}
          className={`flex items-center gap-2 text-sm ${
            isOverridden ? "border-l-2 border-l-blue-500 pl-2" : ""
          }`}
        >
          <span className="w-40 flex-shrink-0">{k}</span>
          <RangeInput value={v} onChange={(val) => setToken(k, val)} />
          {isOverridden && (
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => setToken(k, defaultValue ?? "")}
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

    return (
      <label
        key={k}
        className={`flex items-center gap-2 text-sm ${
          isOverridden ? "border-l-2 border-l-blue-500 pl-2" : ""
        }`}
      >
        <span className="w-40 flex-shrink-0">{k}</span>
        <Input value={v} onChange={(e) => setToken(k, e.target.value)} />
        {isOverridden && (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setToken(k, defaultValue ?? "")}
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
  };

  return (
    <div className="max-h-64 space-y-4 overflow-y-auto rounded border p-2">
      {colors.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Colors</p>
          {colors.map((t) => renderInput(t))}
        </div>
      )}
      {fonts.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Fonts</p>
          {fonts.map((t) => renderInput(t))}
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add font stack"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
            />
            <button
              type="button"
              className="rounded border px-2 py-1"
              onClick={addCustomFont}
            >
              Add
            </button>
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Others</p>
          {others.map((t) => renderInput(t))}
        </div>
      )}
    </div>
  );
}
